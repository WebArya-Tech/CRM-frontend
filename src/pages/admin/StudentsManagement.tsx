import { useState, useMemo, useEffect } from "react";
import { Plus, Edit, Trash2, Loader } from "lucide-react";
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
import { Student, Teacher } from "@/types/types";
import {
  formatDate,
  validateStudent,
} from "@/lib/crmUtils";
import { studentAPI, teacherAPI, APIError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const gradeOptions = [
  "6", "7", "8", "9", "10", "11", "12", "12thPass", "UG", "FreshGrad", "Professional"
];

export default function StudentsManagement() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Student>>({});
  const [errors, setErrors] = useState<string[]>([]);

  const adminId = user?._id || "system";

  useEffect(() => {
    fetchStudents();
    fetchTeachers();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getAll(1, 100);
      setStudents(response.data || []);
    } catch (error) {
      console.error("Failed to fetch students:", error);
      setErrors(["Failed to load students. Please try again."]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const response = await teacherAPI.getAll(1, 100, { status: "Active" });
      setTeachers(response.data || []);
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.mobile.includes(searchTerm);
      
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [students, searchTerm, statusFilter]);

  const handleAddClick = () => {
    setEditingId(null);
    setFormData({
      status: "Active",
      dateOfEnrollment: new Date().toISOString().split("T")[0],
    });
    setErrors([]);
    setOpen(true);
  };

  const handleEditClick = (student: Student) => {
    setEditingId(student.studentId);
    setFormData({ ...student });
    setErrors([]);
    setOpen(true);
  };

  const handleSave = async () => {
    const { valid, errors: validationErrors } = validateStudent(formData);
    if (!valid) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    setErrors([]);

    try {
      if (editingId) {
        await studentAPI.update(editingId, { ...formData, updatedBy: adminId });
        await fetchStudents();
      } else {
        const response = await studentAPI.create({ 
          ...formData, 
          password: formData.mobile, // Initial password is the 10-digit mobile number
          createdBy: adminId 
        });
        await fetchStudents();
      }
      setOpen(false);
    } catch (error) {
      console.error("Error saving student:", error);
      if (error instanceof APIError) {
        setErrors([error.message || "Failed to save student."]);
      } else {
        setErrors(["An unexpected error occurred."]);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const student = students.find((s) => s.studentId === id);
    if (student && window.confirm(`Are you sure you want to delete ${student.name}?`)) {
      setDeleting(id);
      try {
        await studentAPI.delete(id, { deletedBy: adminId });
        await fetchStudents();
      } catch (error) {
        console.error("Failed to delete student:", error);
        setErrors(["Failed to delete student."]);
      } finally {
        setDeleting(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Students Management</h1>
          <p className="text-muted-foreground">Manage student enrollments and details</p>
        </div>
        <Button onClick={handleAddClick} className="gap-2" disabled={loading}>
          <Plus className="h-4 w-4" />
          Add Student
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name, ID, email, or phone..."
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
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-card border border-border/50 shadow-soft overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center text-muted-foreground">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
            Loading students...
          </div>
        ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Grade</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Enrollment</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredStudents.map((student) => (
              <tr key={student.studentId} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-card-foreground">{student.name}</span>
                    <span className="text-xs text-muted-foreground">{student.studentId}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-card-foreground">{student.grade}</td>
                <td className="px-6 py-4 text-sm text-card-foreground">
                  {student.mobile}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {formatDate(student.dateOfEnrollment)}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={student.status} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(student)}
                      className="gap-1"
                      disabled={deleting === student.studentId}
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(student.studentId)}
                      className="gap-1 text-destructive"
                      disabled={deleting === student.studentId}
                    >
                      {deleting === student.studentId ? (
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

        {!loading && filteredStudents.length === 0 && (
          <div className="px-6 py-12 text-center text-muted-foreground">
            No students found
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Student" : "Add New Student"}
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
                <Label>Name *</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div>
                <Label>Registration Number</Label>
                <Input
                  value={formData.registrationNumber || ""}
                  disabled
                  placeholder="Auto-generated"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@example.com"
                />
              </div>
              <div>
                <Label>Mobile * (10 digits)</Label>
                <Input
                  value={formData.mobile || ""}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="9876543210"
                />
              </div>
              <div>
                <Label>Grade *</Label>
                <Select
                  value={formData.grade || ""}
                  onValueChange={(value) => setFormData({ ...formData, grade: value as Student['grade'] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeOptions.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date of Enrollment</Label>
                <Input
                  type="date"
                  value={formData.dateOfEnrollment || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfEnrollment: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Father's Name</Label>
                <Input
                  value={formData.fatherName || ""}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                  placeholder="Father's full name (optional)"
                />
              </div>
              <div>
                <Label>Mother's Name</Label>
                <Input
                  value={formData.motherName || ""}
                  onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                  placeholder="Mother's full name (optional)"
                />
              </div>
              <div>
                <Label>Parent Email</Label>
                <Input
                  type="email"
                  value={formData.parentEmailId || ""}
                  onChange={(e) => setFormData({ ...formData, parentEmailId: e.target.value })}
                  placeholder="parent@example.com (optional)"
                />
              </div>
              <div>
                <Label>Parent Contact (10 digits)</Label>
                <Input
                  value={formData.parentContact || ""}
                  onChange={(e) => setFormData({ ...formData, parentContact: e.target.value })}
                  placeholder="9876543210 (optional)"
                />
              </div>
              <div>
                <Label>Assign Teacher</Label>
                <Select
                  value={formData.preferredTeacherId || ""}
                  onValueChange={(value) => setFormData({ ...formData, preferredTeacherId: value })}
                  disabled={loadingTeachers}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingTeachers ? "Loading..." : "Select teacher (optional)"} />
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
                <Label>Course Name</Label>
                <Input
                  value={formData.courseName || ""}
                  onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                  placeholder="e.g., Mathematics (optional)"
                />
              </div>
              <div className="col-span-2">
                <Label>Address</Label>
                <Input
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address (optional)"
                />
              </div>
            </div>

            <div>
              <Label>Status *</Label>
              <Select
                value={formData.status || "Active"}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as Student['status'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Paused">Paused</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notes</Label>
              <Input
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? "Update" : "Add"} Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}