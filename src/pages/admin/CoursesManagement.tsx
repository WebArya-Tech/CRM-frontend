import { useState, useMemo, useEffect } from "react";
import { Plus, Edit, Trash2, Loader, Users, User, X, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Course, Student, Teacher, WeeklySlot } from "@/types/types";
import { formatDate } from "@/lib/crmUtils";
import { courseAPI, studentAPI, teacherAPI, APIError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const CURRENCY_OPTIONS = ["INR", "USD", "EUR", "GBP"];
const TIME_SLOTS = [
  "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM",
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
  "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM",
  "9:00 PM", "9:30 PM", "10:00 PM",
];

interface StudentRow {
  id: string; // temporary client-side ID for list keys
  studentId: string;
  paymentType: "prepaid" | "postpaid";
  currency: string;
  billingDate: string;
  billingRatePerHour: number;
  weeklySlots: WeeklySlot[];
}

function createEmptyStudentRow(): StudentRow {
  return {
    id: crypto.randomUUID(),
    studentId: "",
    paymentType: "prepaid",
    currency: "INR",
    billingDate: "",
    billingRatePerHour: 500,
    weeklySlots: [{ day: "", time: "" }],
  };
}

export default function CoursesManagement() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  // Form state
  const [courseName, setCourseName] = useState("");
  const [classType, setClassType] = useState<"one-on-one" | "group">("one-on-one");
  const [teacherId, setTeacherId] = useState("");
  const [cycleType, setCycleType] = useState<"hourly" | "monthly">("hourly");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [courseStatus, setCourseStatus] = useState<"Active" | "Paused" | "Completed">("Active");
  const [studentRows, setStudentRows] = useState<StudentRow[]>([createEmptyStudentRow()]);

  // Edit mode form data (for existing courses)
  const [editFormData, setEditFormData] = useState<Partial<Course>>({});

  const adminId = user?._id || "system";

  useEffect(() => {
    fetchCourses();
    fetchStudentsAndTeachers();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await courseAPI.getAll(1, 100);
      setCourses(response.data || []);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
      setErrors(["Failed to load courses. Please try again."]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsAndTeachers = async () => {
    try {
      setLoadingRefs(true);
      const [studentRes, teacherRes] = await Promise.all([
        studentAPI.getAll(1, 200, { status: "Active" }),
        teacherAPI.getAll(1, 100, { status: "Active" }),
      ]);
      setStudents(studentRes.data || []);
      setTeachers(teacherRes.data || []);
    } catch (error) {
      console.error("Failed to fetch students/teachers:", error);
    } finally {
      setLoadingRefs(false);
    }
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const student = students.find(s => s.studentId === c.studentId);
      const teacher = teachers.find(t => t.teacherId === c.teacherId);

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        (c.courseName || c.subject || "").toLowerCase().includes(searchLower) ||
        c.courseId.toLowerCase().includes(searchLower) ||
        student?.name.toLowerCase().includes(searchLower) ||
        teacher?.name.toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === "all" || c.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [courses, students, teachers, searchTerm, statusFilter]);

  const resetForm = () => {
    setCourseName("");
    setClassType("one-on-one");
    setTeacherId("");
    setCycleType("hourly");
    setStartDate(new Date().toISOString().split("T")[0]);
    setCourseStatus("Active");
    setStudentRows([createEmptyStudentRow()]);
    setEditFormData({});
    setErrors([]);
  };

  const handleAddClick = () => {
    setEditingId(null);
    resetForm();
    setOpen(true);
  };

  const handleEditClick = (course: Course) => {
    setEditingId(course.courseId);
    setCourseName(course.courseName || course.subject || "");
    setClassType(course.classType || "one-on-one");
    setTeacherId(course.teacherId);
    setCycleType(course.cycleType === "monthly" ? "monthly" : "hourly");
    setStartDate(course.startDate?.split("T")[0] || "");
    setCourseStatus(course.status);
    setStudentRows([{
      id: crypto.randomUUID(),
      studentId: course.studentId,
      paymentType: course.paymentType || "prepaid",
      currency: course.currency || "INR",
      billingDate: course.billingDate?.split("T")[0] || "",
      billingRatePerHour: course.billingRatePerHour || 500,
      weeklySlots: course.weeklySlots?.length ? course.weeklySlots : [{ day: "", time: "" }],
    }]);
    setEditFormData(course);
    setErrors([]);
    setOpen(true);
  };

  // Validate form
  const validateForm = (): string[] => {
    const errs: string[] = [];
    if (!courseName.trim()) errs.push("Course name is required");
    if (!teacherId) errs.push("Teacher is required");
    if (!startDate) errs.push("Start date is required");

    for (let i = 0; i < studentRows.length; i++) {
      const row = studentRows[i];
      const label = studentRows.length > 1 ? ` (Student ${i + 1})` : "";
      if (!row.studentId) errs.push(`Student is required${label}`);
      if (!row.paymentType) errs.push(`Payment type is required${label}`);
      if (!row.billingRatePerHour || row.billingRatePerHour <= 0) errs.push(`Billing rate must be positive${label}`);
    }

    return errs;
  };

  const handleSave = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    setErrors([]);

    try {
      if (editingId) {
        // Update existing course
        const row = studentRows[0];
        await courseAPI.update(editingId, {
          courseName,
          classType,
          teacherId,
          cycleType,
          startDate,
          status: courseStatus,
          studentId: row.studentId,
          paymentType: row.paymentType,
          currency: row.currency,
          billingDate: row.billingDate || undefined,
          billingRatePerHour: row.billingRatePerHour,
          weeklySlots: row.weeklySlots.filter(s => s.day && s.time),
          subject: courseName,
          updatedBy: adminId,
        });
      } else if (classType === "one-on-one") {
        // Create single course
        const row = studentRows[0];
        await courseAPI.create({
          courseName,
          classType,
          studentId: row.studentId,
          teacherId,
          paymentType: row.paymentType,
          currency: row.currency,
          billingDate: row.billingDate || undefined,
          billingRatePerHour: row.billingRatePerHour,
          weeklySlots: row.weeklySlots.filter(s => s.day && s.time),
          cycleType,
          startDate,
          status: courseStatus,
          subject: courseName,
          createdBy: adminId,
        });
      } else {
        // Group class — batch create
        await courseAPI.createBatch({
          courseName,
          classType: "group",
          teacherId,
          cycleType,
          startDate,
          createdBy: adminId,
          students: studentRows.map(row => ({
            studentId: row.studentId,
            paymentType: row.paymentType,
            currency: row.currency,
            billingDate: row.billingDate || undefined,
            billingRatePerHour: row.billingRatePerHour,
            weeklySlots: row.weeklySlots.filter(s => s.day && s.time),
          })),
        });
      }
      await fetchCourses();
      setOpen(false);
    } catch (error) {
      console.error("Error saving course:", error);
      if (error instanceof APIError) {
        setErrors([error.message || "Failed to save course."]);
      } else {
        setErrors(["An unexpected error occurred."]);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(`Are you sure you want to delete course ${id}?`)) {
      setDeleting(id);
      try {
        await courseAPI.delete(id, { deletedBy: adminId });
        await fetchCourses();
      } catch (error) {
        console.error("Failed to delete course:", error);
        setErrors(["Failed to delete course."]);
      } finally {
        setDeleting(null);
      }
    }
  };

  // Student row handlers
  const addStudentRow = () => {
    setStudentRows([...studentRows, createEmptyStudentRow()]);
  };

  const removeStudentRow = (id: string) => {
    if (studentRows.length > 1) {
      setStudentRows(studentRows.filter(r => r.id !== id));
    }
  };

  const updateStudentRow = (id: string, field: keyof StudentRow, value: any) => {
    setStudentRows(studentRows.map(r =>
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  // Weekly slot handlers
  const addWeeklySlot = (rowId: string) => {
    setStudentRows(studentRows.map(r =>
      r.id === rowId
        ? { ...r, weeklySlots: [...r.weeklySlots, { day: "", time: "" }] }
        : r
    ));
  };

  const removeWeeklySlot = (rowId: string, slotIndex: number) => {
    setStudentRows(studentRows.map(r =>
      r.id === rowId
        ? { ...r, weeklySlots: r.weeklySlots.filter((_, i) => i !== slotIndex) }
        : r
    ));
  };

  const updateWeeklySlot = (rowId: string, slotIndex: number, field: keyof WeeklySlot, value: string) => {
    setStudentRows(studentRows.map(r =>
      r.id === rowId
        ? {
          ...r,
          weeklySlots: r.weeklySlots.map((slot, i) =>
            i === slotIndex ? { ...slot, [field]: value } : slot
          ),
        }
        : r
    ));
  };

  const getStudentName = (id: string) => students.find(s => s.studentId === id)?.name || id;
  const getTeacherName = (id: string) => teachers.find(t => t.teacherId === id)?.name || id;

  // Get already-selected student IDs to prevent duplicates in group
  const getSelectedStudentIds = (currentRowId: string) => {
    return studentRows.filter(r => r.id !== currentRowId).map(r => r.studentId).filter(Boolean);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Courses Management</h1>
          <p className="text-muted-foreground">Manage student course enrollments</p>
        </div>
        <Button onClick={handleAddClick} className="gap-2" disabled={loading || loadingRefs}>
          <Plus className="h-4 w-4" />
          Add Course
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by course name, student, or teacher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Paused">Paused</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-card border border-border/50 shadow-soft overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center text-muted-foreground">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
            Loading courses...
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Course</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Teacher</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cycle</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCourses.map((course) => (
                <tr key={course.courseId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-card-foreground">{course.courseName || course.subject}</span>
                      <span className="text-xs text-muted-foreground">{course.courseId}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={course.classType === "group" ? "default" : "secondary"} className="gap-1">
                      {course.classType === "group" ? <Users className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      {course.classType === "group" ? "Group" : "1-on-1"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-card-foreground">{getStudentName(course.studentId)}</td>
                  <td className="px-6 py-4 text-sm text-card-foreground">{getTeacherName(course.teacherId)}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground capitalize">{course.cycleType}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(course.startDate)}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={course.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(course)}
                        className="gap-1"
                        disabled={deleting === course.courseId}
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(course.courseId)}
                        className="gap-1 text-destructive"
                        disabled={deleting === course.courseId}
                      >
                        {deleting === course.courseId ? (
                          <Loader className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && filteredCourses.length === 0 && (
          <div className="px-6 py-12 text-center text-muted-foreground">
            No courses found
          </div>
        )}
      </div>

      {/* ===== ADD / EDIT DIALOG ===== */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingId ? "Edit Course" : "Add New Course"}
            </DialogTitle>
          </DialogHeader>

          {errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-3 text-sm text-destructive">
              <ul className="list-disc pl-5 space-y-1">
                {errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-6">
            {/* ── Section 1: Course Info ── */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Course Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="course-name">Course Name *</Label>
                  <Input
                    id="course-name"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="e.g., Advanced Mathematics, English Literature"
                  />
                </div>

                <div>
                  <Label>Class Type *</Label>
                  <RadioGroup
                    value={classType}
                    onValueChange={(value) => {
                      setClassType(value as "one-on-one" | "group");
                      if (value === "one-on-one") {
                        setStudentRows([studentRows[0] || createEmptyStudentRow()]);
                      }
                    }}
                    className="flex gap-4 mt-2"
                    disabled={!!editingId}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="one-on-one" id="type-one-on-one" />
                      <Label htmlFor="type-one-on-one" className="flex items-center gap-1.5 cursor-pointer">
                        <User className="h-4 w-4" /> One-on-One
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="group" id="type-group" />
                      <Label htmlFor="type-group" className="flex items-center gap-1.5 cursor-pointer">
                        <Users className="h-4 w-4" /> Group Class
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Cycle Type *</Label>
                  <RadioGroup
                    value={cycleType}
                    onValueChange={(value) => setCycleType(value as "hourly" | "monthly")}
                    className="flex gap-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hourly" id="cycle-hourly" />
                      <Label htmlFor="cycle-hourly" className="flex items-center gap-1.5 cursor-pointer">
                        <Clock className="h-4 w-4" /> Hourly
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="monthly" id="cycle-monthly" />
                      <Label htmlFor="cycle-monthly" className="flex items-center gap-1.5 cursor-pointer">
                        <Calendar className="h-4 w-4" /> Monthly
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Teacher *</Label>
                  <Select
                    value={teacherId}
                    onValueChange={setTeacherId}
                    disabled={loadingRefs}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((t) => (
                        <SelectItem key={t.teacherId} value={t.teacherId}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                {editingId && (
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={courseStatus}
                      onValueChange={(value) => setCourseStatus(value as Course['status'])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Paused">Paused</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* ── Section 2: Student Details ── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Student Details
                  {classType === "group" && (
                    <Badge variant="outline" className="ml-2">{studentRows.length} student(s)</Badge>
                  )}
                </h3>
                {classType === "group" && !editingId && (
                  <Button type="button" variant="outline" size="sm" onClick={addStudentRow} className="gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    Add Student
                  </Button>
                )}
              </div>

              {studentRows.map((row, rowIndex) => {
                const selectedIds = getSelectedStudentIds(row.id);
                return (
                  <div
                    key={row.id}
                    className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-4 relative"
                  >
                    {/* Remove button for group rows */}
                    {classType === "group" && studentRows.length > 1 && !editingId && (
                      <button
                        type="button"
                        onClick={() => removeStudentRow(row.id)}
                        className="absolute top-2 right-2 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Remove student"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}

                    {classType === "group" && (
                      <p className="text-xs font-semibold text-muted-foreground uppercase">
                        Student {rowIndex + 1}
                      </p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {/* Student */}
                      <div>
                        <Label className="text-xs">Student *</Label>
                        <Select
                          value={row.studentId}
                          onValueChange={(value) => updateStudentRow(row.id, "studentId", value)}
                          disabled={loadingRefs || !!editingId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select student" />
                          </SelectTrigger>
                          <SelectContent>
                            {students
                              .filter(s => !selectedIds.includes(s.studentId))
                              .map((s) => (
                                <SelectItem key={s.studentId} value={s.studentId}>
                                  {s.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Payment Type */}
                      <div>
                        <Label className="text-xs">Payment Type *</Label>
                        <Select
                          value={row.paymentType}
                          onValueChange={(value) => updateStudentRow(row.id, "paymentType", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="prepaid">Prepaid</SelectItem>
                            <SelectItem value="postpaid">Postpaid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Currency */}
                      <div>
                        <Label className="text-xs">Currency</Label>
                        <Select
                          value={row.currency}
                          onValueChange={(value) => updateStudentRow(row.id, "currency", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCY_OPTIONS.map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Billing Date */}
                      <div>
                        <Label className="text-xs">Billing Date</Label>
                        <Input
                          type="date"
                          value={row.billingDate}
                          onChange={(e) => updateStudentRow(row.id, "billingDate", e.target.value)}
                        />
                      </div>

                      {/* Billing Rate */}
                      <div>
                        <Label className="text-xs">Rate / Hour ({row.currency}) *</Label>
                        <Input
                          type="number"
                          value={row.billingRatePerHour || ""}
                          onChange={(e) => updateStudentRow(row.id, "billingRatePerHour", parseFloat(e.target.value) || 0)}
                          placeholder="e.g., 800"
                        />
                      </div>
                    </div>

                    {/* Weekly Schedule */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold">Weekly Schedule</Label>
                        {row.weeklySlots.length < 3 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addWeeklySlot(row.id)}
                            className="h-7 text-xs gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            Add Slot
                          </Button>
                        )}
                      </div>

                      {row.weeklySlots.map((slot, slotIdx) => (
                        <div key={slotIdx} className="flex items-center gap-2">
                          <Badge variant="outline" className="shrink-0 w-16 justify-center text-xs">
                            Slot {slotIdx + 1}
                          </Badge>
                          <Select
                            value={slot.day}
                            onValueChange={(value) => updateWeeklySlot(row.id, slotIdx, "day", value)}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue placeholder="Day" />
                            </SelectTrigger>
                            <SelectContent>
                              {DAYS_OF_WEEK.map(d => (
                                <SelectItem key={d} value={d}>{d}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={slot.time}
                            onValueChange={(value) => updateWeeklySlot(row.id, slotIdx, "time", value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Time" />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_SLOTS.map(t => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {row.weeklySlots.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeWeeklySlot(row.id, slotIdx)}
                              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? "Update" : "Create"} Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}