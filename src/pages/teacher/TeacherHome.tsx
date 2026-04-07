import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, DollarSign, Users, BookOpen, Loader, CheckCircle, XCircle, PauseCircle, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useTeacherDashboard } from "./TeacherDashboard";
import { teacherAPI, classAPI, APIError } from "@/lib/api";
import { formatCurrency } from "@/lib/crmUtils";
import { Teacher, Class } from "@/types/types";

export function TeacherHome() {
  const { classes, courses, students, loading, error, refetch } = useTeacherDashboard();
  const [teacherProfile, setTeacherProfile] = useState<Teacher | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfileLoading(true);
        const resp = await teacherAPI.getMyProfile();
        setTeacherProfile(resp.data || null);
      } catch (e) {
        console.error("Failed to load teacher profile:", e);
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const todayClasses = useMemo(() => {
    return (classes || []).filter((c) => c.startDateTime?.startsWith(today));
  }, [classes, today]);

  const monthlySummary = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    let hours = 0;

    for (const cls of classes || []) {
      if (cls.status !== "Completed") continue;
      const d = new Date(cls.startDateTime);
      if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) continue;
      hours += (cls.durationMinutes || 0) / 60;
    }

    const rate = teacherProfile?.compensationPerHour || 0;
    const earnings = hours * rate;
    return { hours, rate, earnings };
  }, [classes, teacherProfile]);

  const activeCourses = useMemo(() => (courses || []).filter((c) => c.status === "Active").length, [courses]);

  // Check if status can still be edited by teacher (1 min window)
  const canTeacherEditStatus = (cls: Class) => {
    if (!cls.statusChangedAt || cls.statusChangedByRole !== 'Teacher') return true;
    const elapsed = Date.now() - new Date(cls.statusChangedAt).getTime();
    return elapsed <= 60000; // 1 minute
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

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Teacher Dashboard</h1>
        <p className="text-muted-foreground">Your classes, students, and earnings based on real recorded data.</p>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Today's Classes" value={todayClasses.length} icon={Calendar} />
        <StatCard title="My Students" value={students?.length || 0} subtitle="Active roster" icon={Users} />
        <StatCard title="Active Courses" value={activeCourses} icon={BookOpen} />
        <StatCard
          title="This Month"
          value={`${monthlySummary.hours.toFixed(1)} hrs`}
          subtitle={formatCurrency(monthlySummary.earnings)}
          icon={DollarSign}
        />
      </div>

      {/* Info banner */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
        <AlertTriangle className="inline h-4 w-4 mr-1.5 -mt-0.5" />
        <strong>Important:</strong> You have <strong>1 minute</strong> to change a class status after setting it. After that, contact admin for changes.
      </div>

      <div className="rounded-xl bg-card border border-border/50 shadow-soft">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-semibold text-card-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Today's Schedule
          </h2>
          <span className="text-sm text-muted-foreground">{today}</span>
        </div>
        <div className="divide-y divide-border">
          {todayClasses.length === 0 ? (
            <div className="px-6 py-8 text-center text-muted-foreground">No classes scheduled for today.</div>
          ) : (
            todayClasses.map((c) => {
              const course = courses.find((co) => co.courseId === c.courseId);
              const student = students.find((s) => s.studentId === c.studentId);
              const isUpdating = updatingStatus === c.classId;
              const canEdit = canTeacherEditStatus(c);
              const statusIsSet = c.status !== 'Scheduled'; // Status has been changed from default

              return (
                <div key={c.classId} className="px-6 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">
                          {c.courseName || course?.courseName || course?.subject || c.courseId}
                        </p>
                        <p className="text-sm text-muted-foreground">{student?.name || c.studentId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {new Date(c.startDateTime).toLocaleTimeString()} · {c.durationMinutes}m
                      </span>
                      <StatusBadge status={c.status} />
                    </div>
                  </div>

                  {/* Status update buttons */}
                  <div className="flex items-center gap-2 pl-14">
                    {isUpdating ? (
                      <Loader className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        {(c.status === 'Scheduled' || (statusIsSet && canEdit)) && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-xs h-7 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"
                              onClick={() => handleStatusUpdate(c.classId, "Completed")}
                              disabled={c.status === 'Completed' && !canEdit}
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Completed
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-xs h-7 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                              onClick={() => handleStatusUpdate(c.classId, "Postponed")}
                              disabled={c.status === 'Postponed' && !canEdit}
                            >
                              <PauseCircle className="h-3.5 w-3.5" />
                              Postponed
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-xs h-7 text-destructive hover:bg-destructive/10"
                              onClick={() => handleStatusUpdate(c.classId, "Cancelled")}
                              disabled={c.status === 'Cancelled' && !canEdit}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Cancelled
                            </Button>
                          </>
                        )}
                        {statusIsSet && !canEdit && (
                          <span className="text-xs text-muted-foreground italic">
                            Edit window expired — contact admin to change status
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border/50 shadow-soft">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-semibold text-card-foreground">Quick Summary</h2>
        </div>
        <div className="px-6 py-6 grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Rate / Hour</p>
            <p className="text-lg font-semibold">{formatCurrency(monthlySummary.rate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Completed (This Month)</p>
            <p className="text-lg font-semibold">{monthlySummary.hours.toFixed(1)} hours</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Estimated Earnings</p>
            <p className="text-lg font-semibold">{formatCurrency(monthlySummary.earnings)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
