import { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTime, validateClass } from "@/lib/crmUtils";
import { Loader, Calendar, CheckCircle, XCircle, PauseCircle, AlertTriangle, Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTeacherDashboard } from "./TeacherDashboard";
import { classAPI, APIError } from "@/lib/api";
import { Class } from "@/types/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function ClassHistory() {
  const { classes, courses, students, loading, refetch, user } = useTeacherDashboard();
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  
  // Add Class State
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Class>>({});
  const [errors, setErrors] = useState<string[]>([]);

  const filteredClasses = useMemo(() => {
    return (classes || []).filter(c => 
      statusFilter === "all" || c.status === statusFilter
    );
  }, [classes, statusFilter]);

  const getCourseName = (cls: Class) => {
    if (cls.courseName) return cls.courseName;
    const course = courses.find(c => c.courseId === cls.courseId);
    return course?.courseName || course?.subject || "N/A";
  };
  const getStudentName = (id: string) => students.find(s => s.studentId === id)?.name || "N/A";

  // Check if status can still be edited by teacher (1 min window)
  const canTeacherEditStatus = (cls: Class) => {
    if (!cls.statusChangedAt || cls.statusChangedByRole !== 'Teacher') return true;
    const elapsed = Date.now() - new Date(cls.statusChangedAt).getTime();
    return elapsed <= 60000;
  };

  const handleStatusUpdate = async (classId: string, newStatus: string) => {
    setUpdatingStatus(classId);
    try {
      await classAPI.updateStatus(classId, newStatus);
      if (refetch) refetch();
    } catch (error) {
      console.error("Failed to update status:", error);
      if (error instanceof APIError) {
        alert(error.message);
      }
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleAddClick = () => {
    setFormData({
      status: "Scheduled",
      durationMinutes: 60,
      teacherId: user?.teacherId, // Use current teacher's custom ID
    });
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
      await classAPI.create({ 
        ...formData, 
        createdBy: user?._id || "teacher", 
        createdByRole: "Teacher",
        teacherId: user?.teacherId // Ensure teacherId is set
      });
      if (refetch) refetch();
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

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Calendar /> Class Details</h1>
          <p className="text-muted-foreground">View your past and upcoming classes. Update status directly.</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={handleAddClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Class
          </Button>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Scheduled">Scheduled</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Postponed">Postponed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Info banner */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
        <AlertTriangle className="inline h-4 w-4 mr-1.5 -mt-0.5" />
        You have <strong>1 minute</strong> to change status after setting it. After that, contact admin.
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="p-4 font-semibold">Course Name</th>
              <th className="p-4 font-semibold">Student</th>
              <th className="p-4 font-semibold">Date & Time</th>
              <th className="p-4 font-semibold">Duration</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClasses.map(c => {
              const isUpdating = updatingStatus === c.classId;
              const canEdit = canTeacherEditStatus(c);
              const statusIsSet = c.status !== 'Scheduled';

              return (
                <tr key={c.classId} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">{getCourseName(c)}</td>
                  <td className="p-4">{getStudentName(c.studentId)}</td>
                  <td className="p-4">{formatDateTime(c.startDateTime)}</td>
                  <td className="p-4">{c.durationMinutes} mins</td>
                  <td className="p-4"><StatusBadge status={c.status} /></td>
                  <td className="p-4">
                    {isUpdating ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : c.status === 'Scheduled' || (statusIsSet && canEdit) ? (
                      <div className="flex gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"
                          onClick={() => handleStatusUpdate(c.classId, "Completed")}
                          title="Mark Completed"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                          onClick={() => handleStatusUpdate(c.classId, "Postponed")}
                          title="Mark Postponed"
                        >
                          <PauseCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => handleStatusUpdate(c.classId, "Cancelled")}
                          title="Mark Cancelled"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : statusIsSet ? (
                      <span className="text-xs text-muted-foreground italic">Locked</span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && filteredClasses.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No classes found for the selected filter.
          </div>
        )}
      </div>

      {/* Add Class Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
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

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Course *</Label>
              <Select
                value={formData.courseId || ""}
                onValueChange={(value) => {
                  const course = courses.find(c => c.courseId === value);
                  setFormData({ 
                    ...formData, 
                    courseId: value, 
                    studentId: course?.studentId,
                  });
                }}
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

            <div className="space-y-2">
              <Label>Student</Label>
              <Input value={getStudentName(formData.studentId || "")} disabled className="bg-muted" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={formData.startDateTime || ""}
                  onChange={(e) => setFormData({ ...formData, startDateTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (min) *</Label>
                <Input
                  type="number"
                  value={formData.durationMinutes || ""}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader className="h-4 w-4 animate-spin mr-2" />}
              Add Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}