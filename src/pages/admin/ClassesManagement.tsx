import { useState, useMemo, useEffect } from "react";
import { Plus, Edit, Trash2, Loader, BookOpen } from "lucide-react";
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
import { Class, Course, Student, Teacher } from "@/types/types";
import { formatDateTime, validateClass } from "@/lib/crmUtils";
import { classAPI, courseAPI, studentAPI, teacherAPI, APIError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function ClassesManagement() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
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
  const [formData, setFormData] = useState<Partial<Class>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const adminId = user?._id || "system";

  useEffect(() => {
    fetchClasses();
    fetchRefs();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await classAPI.getAll(1, 100);
      setClasses(response.data || []);
    } catch (error) {
      console.error("Failed to fetch classes:", error);
      setErrors(["Failed to load classes. Please try again."]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRefs = async () => {
    try {
      setLoadingRefs(true);
      const [courseRes, studentRes, teacherRes] = await Promise.all([
        courseAPI.getAll(1, 200),
        studentAPI.getAll(1, 200, { status: "Active" }),
        teacherAPI.getAll(1, 100, { status: "Active" }),
      ]);
      setCourses(courseRes.data || []);
      setStudents(studentRes.data || []);
      setTeachers(teacherRes.data || []);
    } catch (error) {
      console.error("Failed to fetch references:", error);
    } finally {
      setLoadingRefs(false);
    }
  };

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const course = courses.find(co => co.courseId === c.courseId);
      const student = students.find(s => s.studentId === c.studentId);
      const teacher = teachers.find(t => t.teacherId === c.teacherId);
      
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        (c.courseName || course?.courseName || course?.subject || "").toLowerCase().includes(searchLower) ||
        student?.name.toLowerCase().includes(searchLower) ||
        teacher?.name.toLowerCase().includes(searchLower) ||
        c.classId.toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [classes, courses, students, teachers, searchTerm, statusFilter]);

  const handleAddClick = () => {
    setEditingId(null);
    setFormData({
      status: "Scheduled",
      durationMinutes: 60,
    });
    setErrors([]);
    setOpen(true);
  };

  const handleEditClick = (cls: Class) => {
    setEditingId(cls.classId);
    setFormData({ ...cls });
    setErrors([]);
    setOpen(true);
  };

  const handleSave = async () => {
    const { valid, errors: validationErrors } = validateClass(formData);
    if (!valid) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    setErrors([]);

    try {
      if (editingId) {
        await classAPI.update(editingId, { ...formData, updatedBy: adminId });
      } else {
        await classAPI.create({ ...formData, createdBy: adminId, createdByRole: "Admin" });
      }
      await fetchClasses();
      setOpen(false);
    } catch (error) {
      console.error("Error saving class:", error);
      if (error instanceof APIError) {
        setErrors([error.message || "Failed to save class."]);
      } else {
        setErrors(["An unexpected error occurred."]);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(`Are you sure you want to delete class ${id}?`)) {
      setDeleting(id);
      try {
        await classAPI.delete(id, { deletedBy: adminId });
        await fetchClasses();
      } catch (error) {
        console.error("Failed to delete class:", error);
        setErrors(["Failed to delete class."]);
      } finally {
        setDeleting(null);
      }
    }
  };

  const handleQuickStatusChange = async (classId: string, newStatus: string) => {
    setUpdatingStatus(classId);
    try {
      await classAPI.updateStatus(classId, newStatus);
      await fetchClasses();
    } catch (error) {
      console.error("Failed to update status:", error);
      if (error instanceof APIError) {
        alert(error.message);
      }
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getCourseName = (cls: Class) => {
    if (cls.courseName) return cls.courseName;
    const course = courses.find(c => c.courseId === cls.courseId);
    return course?.courseName || course?.subject || cls.courseId;
  };
  const getStudentName = (id: string) => students.find(s => s.studentId === id)?.name || id;
  const getTeacherName = (id: string) => teachers.find(t => t.teacherId === id)?.name || id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Classes Management</h1>
          <p className="text-muted-foreground">
            Scheduled classes appear automatically. Students and teachers can update status directly.
          </p>
        </div>
        <Button onClick={handleAddClick} className="gap-2" disabled={loading || loadingRefs}>
          <Plus className="h-4 w-4" />
          Add Class
        </Button>
      </div>

      {/* Info banner */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
        <strong>Note:</strong> If a teacher marks a class status by mistake, they have <strong>1 minute</strong> to change it. After that, only the admin can modify the status.
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
            <SelectItem value="Scheduled">Scheduled</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Postponed">Postponed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-card border border-border/50 shadow-soft overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center text-muted-foreground">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
            Loading classes...
          </div>
        ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Course Name</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date & Time</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Teacher</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duration</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredClasses.map((cls) => (
              <tr key={cls.classId} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-card-foreground">{getCourseName(cls)}</span>
                      <span className="text-xs text-muted-foreground">{cls.classId}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{formatDateTime(cls.startDateTime)}</td>
                <td className="px-6 py-4 text-sm text-card-foreground">{getStudentName(cls.studentId)}</td>
                <td className="px-6 py-4 text-sm text-card-foreground">{getTeacherName(cls.teacherId)}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{cls.durationMinutes} min</td>
                <td className="px-6 py-4">
                  {updatingStatus === cls.classId ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Select
                      value={cls.status}
                      onValueChange={(value) => handleQuickStatusChange(cls.classId, value)}
                    >
                      <SelectTrigger className="w-32 h-7 text-xs">
                        <StatusBadge status={cls.status} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Scheduled">Scheduled</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Postponed">Postponed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(cls)}
                      className="gap-1"
                      disabled={deleting === cls.classId}
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(cls.classId)}
                      className="gap-1 text-destructive"
                      disabled={deleting === cls.classId}
                    >
                      {deleting === cls.classId ? (
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

        {!loading && filteredClasses.length === 0 && (
          <div className="px-6 py-12 text-center text-muted-foreground">
            No classes found
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Class" : "Add New Class"}
            </DialogTitle>
          </DialogHeader>

          {errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/50 rounded p-3 text-sm text-destructive">
              <ul className="list-disc pl-5">
                {errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Course *</Label>
                <Select
                  value={formData.courseId || ""}
                  onValueChange={(value) => {
                    const course = courses.find(c => c.courseId === value);
                    setFormData({ 
                      ...formData, 
                      courseId: value, 
                      studentId: course?.studentId, 
                      teacherId: course?.teacherId 
                    });
                  }}
                  disabled={loadingRefs}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.courseId} value={c.courseId}>
                        {c.courseName || c.subject} ({getStudentName(c.studentId)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Student</Label>
                <Input value={getStudentName(formData.studentId || "")} disabled />
              </div>
              <div>
                <Label>Teacher</Label>
                <Input value={getTeacherName(formData.teacherId || "")} disabled />
              </div>
              <div>
                <Label>Start Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={formData.startDateTime || ""}
                  onChange={(e) => setFormData({ ...formData, startDateTime: e.target.value })}
                />
              </div>
              <div>
                <Label>Duration (minutes) *</Label>
                <Input
                  type="number"
                  value={formData.durationMinutes || ""}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })}
                  placeholder="e.g., 60"
                />
              </div>
              <div>
                <Label>Status *</Label>
                <Select
                  value={formData.status || "Scheduled"}
                  onValueChange={(value) => setFormData({ ...formData, status: value as Class['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Postponed">Postponed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? "Update" : "Add"} Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}