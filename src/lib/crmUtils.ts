import { Class, Course, Teacher, Student, LogEntry } from "@/types/types";

// ============= ID GENERATION =============
export function generateTeacherId(): string {
  return `TCH-${String(Math.floor(Math.random() * 1000000)).padStart(6, "0")}`;
}

export function generateStudentId(): string {
  return `STD-${String(Math.floor(Math.random() * 1000000)).padStart(6, "0")}`;
}

export function generateRegistrationNumber(): string {
  const year = new Date().getFullYear();
  const randomNum = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return `STU-${year}-${randomNum}`;
}

export function generateCourseId(): string {
  return `CRS-${String(Math.floor(Math.random() * 1000000)).padStart(6, "0")}`;
}

export function generateClassId(): string {
  return `CLS-${String(Math.floor(Math.random() * 1000000)).padStart(6, "0")}`;
}

export function generateLogId(): string {
  return `LOG-${String(Math.floor(Math.random() * 1000000)).padStart(6, "0")}`;
}

// ============= DUPLICATE CLASS DETECTION =============
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  conflictingClassId?: string;
  message?: string;
}

export function detectDuplicateClass(
  newClass: Partial<Class>,
  existingClasses: Class[]
): DuplicateCheckResult {
  const { studentId, teacherId, startDateTime, durationMinutes } = newClass;

  if (!studentId || !teacherId || !startDateTime || !durationMinutes) {
    return { isDuplicate: false };
  }

  const newStart = new Date(startDateTime).getTime();
  const newEnd = newStart + durationMinutes * 60 * 1000;

  for (const existing of existingClasses) {
    if (existing.status === "Cancelled") continue;

    // Check if same student + teacher + overlapping time
    if (
      existing.studentId === studentId &&
      existing.teacherId === teacherId
    ) {
      const existingStart = new Date(existing.startDateTime).getTime();
      const existingEnd = existingStart + existing.durationMinutes * 60 * 1000;

      // Check for time overlap
      if (newStart < existingEnd && newEnd > existingStart) {
        return {
          isDuplicate: true,
          conflictingClassId: existing.classId,
          message: `Duplicate/overlapping class detected with ${existing.classId} (${existing.startDateTime})`,
        };
      }
    }
  }

  return { isDuplicate: false };
}

// ============= FEE CYCLE CALCULATIONS =============
export function getCycleTargetHours(cycleType: string): number {
  const cycleMap: Record<string, number> = {
    "6hrs": 6,
    "8hrs": 8,
    "12hrs": 12,
    "16hrs": 16,
    monthly: 0, // No fixed target for monthly
  };
  return cycleMap[cycleType] || 0;
}

export function calculateCycleProgress(
  course: Course
): { progress: number; isCompleted: boolean } {
  if (course.cycleType === "monthly") {
    // Assume monthly cycles are tracked differently
    return { progress: 0, isCompleted: false };
  }

  const targetHours = getCycleTargetHours(course.cycleType);
  if (targetHours === 0) return { progress: 0, isCompleted: false };

  const progress = Math.min(
    100,
    Math.round((course.completedHours / targetHours) * 100)
  );
  const isCompleted = course.completedHours >= targetHours;

  return { progress, isCompleted };
}

export function checkCycleDue(course: Course): boolean {
  if (course.status !== "Active") return false;

  if (course.cycleType === "monthly") {
    const startDate = new Date(course.startDate);
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + 1);
    return new Date() >= dueDate;
  } else {
    const { isCompleted } = calculateCycleProgress(course);
    return isCompleted;
  }
}

// ============= TEACHER PAYOUT CALCULATIONS =============
export interface TeacherPayoutSummary {
  teacherId: string;
  teacherName: string;
  monthName: string;
  totalHours: number;
  totalAmount: number;
  breakdown: Array<{
    studentName: string;
    subject: string;
    hours: number;
    rate: number;
    amount: number;
  }>;
}

export function calculateMonthlyTeacherPayout(
  teacherId: string,
  classes: Class[],
  courses: Course[],
  teachers: Teacher[],
  month: Date
): TeacherPayoutSummary {
  const teacher = teachers.find((t) => t.teacherId === teacherId);
  if (!teacher) {
    return {
      teacherId,
      teacherName: "Unknown",
      monthName: month.toLocaleString("default", { month: "long", year: "numeric" }),
      totalHours: 0,
      totalAmount: 0,
      breakdown: [],
    };
  }

  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const relevantClasses = classes.filter((cls) => {
    const classDate = new Date(cls.startDateTime);
    return (
      cls.teacherId === teacherId &&
      cls.status === "Completed" &&
      classDate >= monthStart &&
      classDate <= monthEnd
    );
  });

  const breakdown: TeacherPayoutSummary["breakdown"] = [];
  let totalHours = 0;
  let totalAmount = 0;

  for (const cls of relevantClasses) {
    const course = courses.find((c) => c.courseId === cls.courseId);
    const student = relevantClasses
      .map((c) => ({ id: c.studentId }))
      .find((s) => s.id === cls.studentId);

    const hours = cls.durationMinutes / 60;
    const rate = course?.billingRatePerHour || teacher.compensationPerHour;
    const amount = hours * rate;

    breakdown.push({
      studentName: cls.studentId, // This would be populated from student lookup in real app
      subject: course?.subject || "Unknown",
      hours,
      rate,
      amount,
    });

    totalHours += hours;
    totalAmount += amount;
  }

  return {
    teacherId,
    teacherName: teacher.name,
    monthName: month.toLocaleString("default", { month: "long", year: "numeric" }),
    totalHours: Math.round(totalHours * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    breakdown,
  };
}

// ============= SUGGESTED CLASSES =============
export interface SuggestedClass {
  suggestedId: string;
  courseId: string;
  studentId: string;
  teacherId: string;
  suggestedDateTime: string;
  duration: number;
  day: string;
  time: string;
}

export function generateSuggestedClasses(
  courses: Course[],
  existingClasses: Class[],
  daysAhead: number = 7
): SuggestedClass[] {
  const suggested: SuggestedClass[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const course of courses) {
    if (course.status !== "Active") continue;

    const timeSlots = [course.timeSlot1, course.timeSlot2, course.timeSlot3].filter(
      Boolean
    );
    if (timeSlots.length === 0) continue;

    for (let daysOffset = 0; daysOffset < daysAhead; daysOffset++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() + daysOffset);
      const dayName = checkDate.toLocaleString("default", { weekday: "long" });

      for (const slot of timeSlots) {
        // Parse slot (e.g., "Mon 6:00-7:00 PM" or "Mon 6:00 PM")
        const slotDayMatch = slot?.match(/^(\w+)/);
        const slotDay = slotDayMatch ? slotDayMatch[1] : null;

        if (slotDay?.toLowerCase() === dayName.toLowerCase()) {
          const timeMatch = slot?.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
          if (timeMatch) {
            let hour = parseInt(timeMatch[1]);
            const minute = parseInt(timeMatch[2]);
            const ampm = timeMatch[3]?.toUpperCase() || "PM";

            if (ampm === "PM" && hour !== 12) hour += 12;
            if (ampm === "AM" && hour === 12) hour = 0;

            const suggestedDateTime = new Date(checkDate);
            suggestedDateTime.setHours(hour, minute, 0, 0);

            // Check if this class already exists
            const exists = existingClasses.some(
              (cls) =>
                cls.courseId === course.courseId &&
                cls.studentId === course.studentId &&
                cls.status !== "Cancelled" &&
                new Date(cls.startDateTime).getTime() === suggestedDateTime.getTime()
            );

            if (!exists) {
              suggested.push({
                suggestedId: `SUG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                courseId: course.courseId,
                studentId: course.studentId,
                teacherId: course.teacherId,
                suggestedDateTime: suggestedDateTime.toISOString(),
                duration: 60,
                day: dayName,
                time: `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`,
              });
            }
          }
        }
      }
    }
  }

  return suggested;
}

// ============= FORMATTING & DISPLAY =============
export function formatDateTime(dateTime: string): string {
  try {
    const date = new Date(dateTime);
    return date.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateTime;
  }
}

export function formatDate(date: string): string {
  try {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return date;
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getDayName(date: string): string {
  try {
    return new Date(date).toLocaleString("en-IN", { weekday: "long" });
  } catch {
    return "";
  }
}

// ============= VALIDATION =============
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateMobile(mobile: string): boolean {
  // Strict 10-digit mobile validation (Indian format)
  // Accepts 9876543210 or +919876543210
  const cleaned = mobile.replace(/[\s-()+]/g, "");
  // If it starts with 91 and has 12 digits, or just 10 digits
  return /^[6-9]\d{9}$/.test(cleaned) || /^91[6-9]\d{9}$/.test(cleaned);
}

export function validateTeacher(teacher: Partial<Teacher>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!teacher.name?.trim()) errors.push("Name is required");
  if (!teacher.mobile?.trim()) errors.push("Mobile number is required");
  if (!validateMobile(teacher.mobile || "")) errors.push("Invalid mobile format (must be 10 digits)");
  if (!teacher.email?.trim()) errors.push("Email is required");
  if (!validateEmail(teacher.email || "")) errors.push("Invalid email format");
  if (!teacher.subjects || teacher.subjects.length === 0) errors.push("At least one subject is required");
  if (!teacher.compensationPerHour || teacher.compensationPerHour < 0) errors.push("Compensation must be positive");
  if (!teacher.dateOfJoining) errors.push("Date of joining is required");

  return { valid: errors.length === 0, errors };
}

export function validateStudent(student: Partial<Student>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!student.name?.trim()) errors.push("Name is required");
  if (!student.email?.trim()) errors.push("Email is required");
  if (!validateEmail(student.email || "")) errors.push("Invalid email format");
  if (!student.mobile?.trim()) errors.push("Mobile number is required");
  if (!validateMobile(student.mobile || "")) errors.push("Invalid mobile format (must be 10 digits)");
  if (!student.grade) errors.push("Grade is required");

  // Optional field validations (only validate format if provided)
  if (student.parentEmailId?.trim() && !validateEmail(student.parentEmailId)) {
    errors.push("Invalid parent email format");
  }
  if (student.parentContact?.trim() && !validateMobile(student.parentContact)) {
    errors.push("Invalid parent contact format (must be 10 digits)");
  }

  return { valid: errors.length === 0, errors };
}

export function validateCourse(course: Partial<Course>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!course.courseName?.trim()) errors.push("Course name is required");
  if (!course.classType) errors.push("Class type is required");
  if (!course.studentId) errors.push("Student is required");
  if (!course.teacherId) errors.push("Teacher is required");
  if (!course.paymentType) errors.push("Payment type is required");
  if (!course.cycleType) errors.push("Cycle type is required");
  if (!course.billingRatePerHour || course.billingRatePerHour < 0) errors.push("Billing rate must be positive");
  if (!course.startDate) errors.push("Start date is required");

  return { valid: errors.length === 0, errors };
}

export function validateClass(cls: Partial<Class>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!cls.studentId) errors.push("Student is required");
  if (!cls.courseId) errors.push("Course is required");
  if (!cls.teacherId) errors.push("Teacher is required");
  if (!cls.startDateTime) errors.push("Start date/time is required");
  if (!cls.durationMinutes || cls.durationMinutes <= 0) errors.push("Duration must be positive");

  return { valid: errors.length === 0, errors };
}
