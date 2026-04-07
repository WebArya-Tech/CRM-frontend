import { useState, useMemo, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Loader } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Teacher } from "@/types/types";
import { formatDate, validateTeacher } from "@/lib/crmUtils";
import { teacherAPI, APIError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function TeachersManagement() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Teacher>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [isOthersChecked, setIsOthersChecked] = useState(false);
  const [othersSubject, setOthersSubject] = useState("");

  const adminId = user?._id || "system";

  // Fetch teachers from API
  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await teacherAPI.getAll(1, 100);
      setTeachers(response.data || []);
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
      setErrors(["Failed to load teachers. Please try again."]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.mobile.includes(searchTerm);
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [teachers, searchTerm, statusFilter]);

  const handleAddClick = () => {
    setEditingId(null);
    setFormData({
      status: "Active",
      subjects: [],
      grades: [],
      compensationPerHour: 0,
    });
    setErrors([]);
    setIsOthersChecked(false);
    setOthersSubject("");
    setOpen(true);
  };

  const handleEditClick = (teacher: Teacher) => {
    setEditingId(teacher.teacherId);
    setFormData({
      ...teacher,
      grades: teacher.grades || [],
      subjects: teacher.subjects || [],
    });
    setErrors([]);

    const predefinedSubjects = [
      "Math", "Physics", "Chemistry", "Biology", "Comp. Sc.",
      "Statistics", "Economic", "Accounting", "Finance",
      "English", "Spanish", "French", "German"
    ];
    const customs = teacher.subjects.filter(s => !predefinedSubjects.includes(s));
    if (customs.length > 0) {
      setIsOthersChecked(true);
      setOthersSubject(customs[0]);
    } else {
      setIsOthersChecked(false);
      setOthersSubject("");
    }

    setOpen(true);
  };

  const handleSave = async () => {
    const validation = validateTeacher(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        // Update existing
        const updateData = {
          ...formData,
          updatedBy: adminId,
        };
        await teacherAPI.update(editingId, updateData);

        // Refresh the list
        await fetchTeachers();
      } else {
        // Create new
        const createData = {
          ...formData,
          password: formData.mobile, // Initial password is the 10-digit mobile number
          createdBy: adminId,
        };
        const response = await teacherAPI.create(createData);

        // Refresh the list
        await fetchTeachers();
      }

      setOpen(false);
      setFormData({});
    } catch (error) {
      console.error("Error saving teacher:", error);
      if (error instanceof APIError) {
        setErrors(error.message ? [error.message] : ["Failed to save teacher. Please try again."]);
      } else {
        setErrors(["Failed to save teacher. Please try again."]);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const teacher = teachers.find((t) => t.teacherId === id);
    if (teacher && window.confirm(`Delete ${teacher.name}?`)) {
      setDeleting(id);
      try {
        await teacherAPI.delete(id, { deletedBy: adminId });

        // Refresh the list
        await fetchTeachers();
      } catch (error) {
        console.error("Failed to delete teacher:", error);
        setErrors(["Failed to delete teacher. Please try again."]);
      } finally {
        setDeleting(null);
      }
    }
  };

  const addSubject = (subject: string) => {
    setFormData((prev) => {
      const trimmed = subject.trim();
      if (!trimmed) return prev;

      const norm = (s: string) => {
        let clean = s.trim().toLowerCase();
        if (clean === 'mathematics' || clean === 'maths' || clean === 'math') return 'Mathematics';
        if (clean === 'comp. sc.' || clean === 'computer science' || clean === 'cs') return 'Computer Science';
        if (clean === 'economics' || clean === 'economic') return 'Economic';
        if (clean === 'accounts' || clean === 'accounting' || clean === 'account') return 'Accounting';
        if (clean === 'statistics' || clean === 'stats' || clean === 'stat') return 'Statistics';
        if (clean === 'physic' || clean === 'physics') return 'Physics';
        return clean.replace(/s$/, ''); // fallback string comparison
      };

      const normalizedSubject = norm(subject);
      let newSubjects = [...(prev.subjects || [])];

      const duplicateIndex = newSubjects.findIndex(s => norm(s) === normalizedSubject);

      if (duplicateIndex !== -1) {
        const existing = newSubjects[duplicateIndex];
        if (existing === subject) return prev;

        const PREDEFINED = [
          "Math", "Physics", "Chemistry", "Biology", "Computer Science",
          "Statistics", "Economic", "Accounting", "Finance",
          "English", "Spanish", "French", "German"
        ];
        if (PREDEFINED.includes(subject)) {
          newSubjects[duplicateIndex] = subject;
          return { ...prev, subjects: newSubjects };
        }
        return prev;
      }

      newSubjects.push(subject);
      return { ...prev, subjects: newSubjects };
    });
  };

  const removeSubject = (subject: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects?.filter((s) => s !== subject) || [],
    }));
  };

  const addGrade = (grade: string) => {
    setFormData((prev) => {
      if (grade && !prev.grades?.includes(grade)) {
        return {
          ...prev,
          grades: [...(prev.grades || []), grade],
        };
      }
      return prev;
    });
  };

  const removeGrade = (grade: string) => {
    setFormData((prev) => ({
      ...prev,
      grades: prev.grades?.filter((g) => g !== grade) || [],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Teachers Management</h1>
          <p className="text-muted-foreground">Manage teachers and their details</p>
        </div>
        <Button onClick={handleAddClick} className="gap-2" disabled={loading}>
          <Plus className="h-4 w-4" />
          Add Teacher
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-card border border-border/50 shadow-soft overflow-x-auto">
        {loading ? (
          <div className="px-6 py-12 text-center flex items-center justify-center gap-2 text-muted-foreground">
            <Loader className="h-4 w-4 animate-spin" />
            Loading teachers...
          </div>
        ) : (
          <table className="w-full min-w-[900px] table-fixed">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground w-[160px]">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground w-[190px]">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground w-[160px]">Subjects</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground w-[140px]">Grades</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground w-[90px]">Rate/Hr</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground w-[90px]">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground w-[80px]">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-muted-foreground w-[130px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTeachers.map((teacher) => {
                const subjects = teacher.subjects || [];
                const grades = teacher.grades || [];
                const visibleSubjects = subjects.slice(0, 3);
                const extraSubjects = subjects.length - 3;
                const visibleGrades = grades.slice(0, 4);
                const extraGrades = grades.length - 4;
                return (
                  <tr key={teacher.teacherId} className="hover:bg-muted/50 transition-colors align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium text-card-foreground text-sm truncate">{teacher.name}</p>
                      <p className="text-xs text-muted-foreground">{teacher.teacherId}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-card-foreground truncate max-w-0">
                      <span className="block truncate">{teacher.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {visibleSubjects.map((s) => (
                          <span key={s} className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded whitespace-nowrap">
                            {s}
                          </span>
                        ))}
                        {extraSubjects > 0 && (
                          <span className="px-1.5 py-0.5 bg-muted text-muted-foreground text-xs rounded">
                            +{extraSubjects}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {visibleGrades.map((g) => (
                          <span key={g} className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs rounded whitespace-nowrap">
                            {g}
                          </span>
                        ))}
                        {extraGrades > 0 && (
                          <span className="px-1.5 py-0.5 bg-muted text-muted-foreground text-xs rounded">
                            +{extraGrades}
                          </span>
                        )}
                        {grades.length === 0 && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-card-foreground">₹{teacher.compensationPerHour}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(teacher.dateOfJoining)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={teacher.status === "Active" ? "Active" : "Inactive"} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(teacher)}
                          className="gap-1 h-7 px-2 text-xs"
                          disabled={deleting === teacher.teacherId}
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(teacher.teacherId)}
                          className="gap-1 h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                          disabled={deleting === teacher.teacherId}
                        >
                          {deleting === teacher.teacherId ? (
                            <Loader className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

          </table>
        )}

        {!loading && filteredTeachers.length === 0 && (
          <div className="px-6 py-12 text-center text-muted-foreground">
            No teachers found
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Teacher" : "Add New Teacher"}
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
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="teacher@example.com"
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
                <Label>Date of Joining *</Label>
                <Input
                  type="date"
                  value={formData.dateOfJoining || ""}
                  onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
                />
              </div>
              <div>
                <Label>Compensation/Hour *</Label>
                <Input
                  type="number"
                  value={formData.compensationPerHour || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      compensationPerHour: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="800"
                />
              </div>
              <div>
                <Label>Compensation/Hour (High)</Label>
                <Input
                  type="number"
                  value={formData.compensationPerHourHigh || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      compensationPerHourHigh: parseFloat(e.target.value) || undefined,
                    })
                  }
                  placeholder="1000"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Subjects</Label>
              <div className="space-y-3 p-3 bg-muted/30 rounded-md border border-border/50">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-3 gap-x-4">
                  {["Math", "Physics", "Chemistry", "Biology", "Computer Science"].map((subj) => (
                    <div key={subj} className="flex items-center space-x-2">
                      <Checkbox
                        id={`subj-${subj}`}
                        checked={(formData.subjects || []).includes(subj)}
                        onCheckedChange={(checked) => {
                          if (checked) addSubject(subj);
                          else removeSubject(subj);
                        }}
                      />
                      <label
                        htmlFor={`subj-${subj}`}
                        className="text-sm font-medium leading-none cursor-pointer text-nowrap"
                      >
                        {subj}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-3 gap-x-4">
                  {["Statistics", "Economic", "Accounting", "Finance"].map((subj) => (
                    <div key={subj} className="flex items-center space-x-2">
                      <Checkbox
                        id={`subj-${subj}`}
                        checked={(formData.subjects || []).includes(subj)}
                        onCheckedChange={(checked) => {
                          if (checked) addSubject(subj);
                          else removeSubject(subj);
                        }}
                      />
                      <label
                        htmlFor={`subj-${subj}`}
                        className="text-sm font-medium leading-none cursor-pointer text-nowrap"
                      >
                        {subj}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-3 gap-x-4">
                  {["English", "Spanish", "French", "German"].map((subj) => (
                    <div key={subj} className="flex items-center space-x-2">
                      <Checkbox
                        id={`subj-${subj}`}
                        checked={(formData.subjects || []).includes(subj)}
                        onCheckedChange={(checked) => {
                          if (checked) addSubject(subj);
                          else removeSubject(subj);
                        }}
                      />
                      <label
                        htmlFor={`subj-${subj}`}
                        className="text-sm font-medium leading-none cursor-pointer text-nowrap"
                      >
                        {subj}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-3 gap-x-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="subj-others"
                      checked={isOthersChecked}
                      onCheckedChange={(checked) => setIsOthersChecked(!!checked)}
                    />
                    <label
                      htmlFor="subj-others"
                      className="text-sm font-medium leading-none cursor-pointer text-nowrap"
                    >
                      Others
                    </label>
                  </div>
                  {isOthersChecked && (
                    <div className="flex items-center gap-2 col-span-1 sm:col-span-2 lg:col-span-4">
                      <Input
                        autoFocus
                        className="h-8 w-full max-w-xs text-sm"
                        placeholder="Type and press Enter"
                        value={othersSubject}
                        onChange={(e) => setOthersSubject(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (othersSubject.trim()) {
                              addSubject(othersSubject.trim());
                              setOthersSubject("");
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 px-3"
                        onClick={() => {
                          if (othersSubject.trim()) {
                            addSubject(othersSubject.trim());
                            setOthersSubject("");
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  )}
                </div>

                {((formData.subjects || []).filter(s => ![
                  "Math", "Physics", "Chemistry", "Biology", "Computer Science",
                  "Statistics", "Economic", "Accounting", "Finance",
                  "English", "Spanish", "French", "German"
                ].includes(s))).length > 0 && (
                    <div className="pt-3 mt-3 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mb-2">Custom Subjects:</p>
                      <div className="flex flex-wrap gap-2">
                        {((formData.subjects || []).filter(s => ![
                          "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
                          "Statistics", "Economic", "Accounting", "Finance",
                          "English", "Spanish", "French", "German"
                        ].includes(s))).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => removeSubject(s)}
                            className="px-2 py-1 bg-primary/10 text-primary text-xs rounded hover:bg-primary/20 flex items-center gap-1"
                          >
                            {s} <span className="text-[10px]">✕</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Grades</Label>
              <div className="space-y-3 p-3 bg-muted/30 rounded-md border border-border/50">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-3 gap-x-4">
                  {["UG", "12th", "11th", "10th", "9th"].map((grade) => (
                    <div key={grade} className="flex items-center space-x-2">
                      <Checkbox
                        id={`grade-${grade}`}
                        checked={(formData.grades || []).includes(grade)}
                        onCheckedChange={(checked) => {
                          if (checked) addGrade(grade);
                          else removeGrade(grade);
                        }}
                      />
                      <label
                        htmlFor={`grade-${grade}`}
                        className="text-sm font-medium leading-none cursor-pointer text-nowrap"
                      >
                        {grade}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-3 gap-x-4">
                  {["8th", "7th", "6th", "5th", "4th", "3rd", "2nd", "1st"].map((grade) => (
                    <div key={grade} className="flex items-center space-x-2">
                      <Checkbox
                        id={`grade-${grade}`}
                        checked={(formData.grades || []).includes(grade)}
                        onCheckedChange={(checked) => {
                          if (checked) addGrade(grade);
                          else removeGrade(grade);
                        }}
                      />
                      <label
                        htmlFor={`grade-${grade}`}
                        className="text-sm font-medium leading-none cursor-pointer text-nowrap"
                      >
                        {grade}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label>Status *</Label>
              <Select
                value={formData.status || "Active"}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as "Active" | "Inactive" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
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
              {editingId ? "Update" : "Add"} Teacher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
