export interface Teacher {
  teacherId: string;
  name: string;
  email: string;
  mobile: string;
  subjects: string[];
  grades?: string[];
  compensationPerHour: number;
  compensationPerHourHigh?: number;
  dateOfJoining: string;
  status: "Active" | "Inactive";
  notes?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface Student {
  studentId: string;
  registrationNumber: string;
  name: string;
  dateOfEnrollment: string;
  mobile: string;
  email?: string;
  parentEmailId: string;
  fatherName: string;
  motherName: string;
  parentContact: string;
  grade: "6" | "7" | "8" | "9" | "10" | "11" | "12" | "12thPass" | "UG" | "FreshGrad" | "Professional";
  courseName?: string;
  preferredTeacherId?: string;
  address?: string;
  status: "Active" | "Paused" | "Completed" | "Inactive";
  notes?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface WeeklySlot {
  day: string;
  time: string;
}

export interface Course {
  courseId: string;
  courseName: string;
  classType: "one-on-one" | "group";
  studentId: string;
  subject?: string;
  teacherId: string;
  paymentType: "prepaid" | "postpaid";
  currency: string;
  billingDate?: string;
  timeSlot1?: string;
  timeSlot2?: string;
  timeSlot3?: string;
  weeklySlots?: WeeklySlot[];
  cycleType: "hourly" | "monthly" | "6hrs" | "8hrs" | "12hrs" | "16hrs";
  cycleTargetHours?: number;
  billingRatePerHour: number;
  billingRatePerHourHigh?: number;
  startDate: string;
  endDate?: string;
  status: "Active" | "Paused" | "Completed";
  feeStatus: "NotDue" | "Due" | "PartiallyPaid" | "Paid";
  completedHours: number;
  lastDueDate?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface Class {
  classId: string;
  studentId: string;
  studentName?: string; 
  courseId: string;
  courseName?: string;
  subject?: string;
  teacherId: string;
  startDateTime: string;
  durationMinutes: number;
  topicCovered?: string;
  activity?: string;
  comments?: string;
  createdByRole: "Admin" | "Teacher";
  status: "Scheduled" | "Completed" | "Cancelled" | "Postponed";
  statusChangedAt?: string;
  statusChangedBy?: string;
  statusChangedByRole?: "Admin" | "Teacher" | "Student";
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface LogData {
  [key: string]: any;
}

export type LoggableObject = Teacher | Student | Course | Class;

export interface LogEntry {
  logId: string;
  timestamp: string;
  actorUserId: string;
  actorRole: "Admin" | "Teacher" | "Student";
  actionType: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "NOTIFICATION" | "EXPORT";
  objectType: "Teacher" | "Student" | "Course" | "Class" | "Settings";
  objectId: string;
  before?: Partial<LoggableObject>;
  after?: Partial<LoggableObject>;
  ipAddress?: string;
  userAgent?: string;
  remarks?: string;
}

export interface InstituteSettings {
  instituteName: string;
  adminEmail: string;
  defaultClassDurationMinutes: number;
  timezone: string;
  reminderThreshold: number; // percentage (e.g., 90)
}

export interface Payment {
  _id: string;
  referenceNumber: string;
  amount: number;
  status: "completed" | "pending" | "failed";
  description: string;
  createdAt: string;
  updatedAt: string;
  studentId: string;
  courseId?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
  phone?: string;
  status: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  studentId?: string;
  teacherId?: string;
}

export interface RegistrationData {
  name: string;
  email: string;
  phone: string;
  mobile?: string;
  parentEmailId: string;
  fatherName: string;
  motherName: string;
  parentContact: string;
  grade: string;
  courseName: string;
  preferredTeacherId: string;
  address?: string;
  monthlyFeeAmount?: string | number;
}

export interface LoginData {
  password?: string;
  email?: string;
  phone?: string;
}

export interface UpdateData {
  [key: string]: string | number | boolean | string[];
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email?: string, password?: string, phone?: string) => Promise<void>;
  register: (formData: RegistrationData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  updateProfile: (data: UpdateData) => Promise<void>;
  changePassword: (passwords: ChangePasswordData) => Promise<void>;
}