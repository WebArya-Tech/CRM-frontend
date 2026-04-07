import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, BookOpen, TrendingUp, Loader, CheckCircle, XCircle, PauseCircle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { courseAPI, classAPI, invoiceAPI, APIError } from "@/lib/api";
import { calculateCycleProgress, formatCurrency, formatDateTime } from "@/lib/crmUtils";

import { Course, Class } from "@/types/types";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [myClasses, setMyClasses] = useState<Class[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user || user.role !== "student") return;
    setLoading(true);
    try {
      const [coursesResp, classesResp, invoicesResp] = await Promise.all([
        courseAPI.getCoursesForStudent(),
        classAPI.getClassesForStudent(),
        invoiceAPI.getMyInvoices()
      ]);
      setMyCourses(coursesResp.data || []);
      setMyClasses(classesResp.data || []);
      setInvoices(invoicesResp.data || []);
    } catch (err) {
      console.error("Failed to fetch student data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const today = new Date().toISOString().split("T")[0];
  const todayClasses = useMemo(
    () => myClasses.filter((c) => c.startDateTime?.startsWith(today)),
    [myClasses, today]
  );

  const monthlySummary = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let hours = 0;
    let fees = 0;

    for (const cls of myClasses) {
      if (cls.status !== "Completed") continue;
      const d = new Date(cls.startDateTime);
      if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) continue;

      const h = (cls.durationMinutes || 0) / 60;
      hours += h;

      const course = myCourses.find((c) => c.courseId === cls.courseId);
      const rate = course?.billingRatePerHour || 0;
      fees += h * rate;
    }

    return { hours, fees };
  }, [myClasses, myCourses]);

  const billingSummary = useMemo(() => {
    const open = invoices.filter((i) => i.status === "pending" || i.status === "overdue" || i.status === "partially-paid");
    const outstanding = open.reduce((sum: number, i: any) => sum + Number(i.remainingAmount || 0), 0);
    const lastInvoice = invoices[0] || null;
    return { outstanding, lastInvoice, openCount: open.length };
  }, [invoices]);

  const getCurrentStudentName = () => user?.name || "Student";

  const getCourseName = (cls: Class) => {
    if (cls.courseName) return cls.courseName;
    const course = myCourses.find((c) => c.courseId === cls.courseId);
    return course?.courseName || course?.subject || cls.courseId || "Class";
  };

  const handleStatusUpdate = async (classId: string, newStatus: string) => {
    setUpdatingStatus(classId);
    try {
      await classAPI.updateStatus(classId, newStatus);
      await fetchData();
    } catch (error) {
      console.error("Failed to update status:", error);
      if (error instanceof APIError) {
        alert(error.message);
      }
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (loading) {
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
        <h1 className="text-2xl font-bold text-foreground">Student Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {getCurrentStudentName()}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Classes"
          value={todayClasses.length}
          icon={Calendar}
        />
        <StatCard
          title="Total Classes"
          value={myClasses.length}
          subtitle="All courses"
          icon={BookOpen}
        />
        <StatCard
          title="Hours Studied (This Month)"
          value={monthlySummary.hours.toFixed(1)}
          subtitle={`Est. Fees: ${formatCurrency(monthlySummary.fees)} · Due: ${formatCurrency(billingSummary.outstanding)}`}
          icon={TrendingUp}
        />
        <StatCard
          title="Avg Progress"
          value={
            myCourses.length > 0
              ? `${Math.round(
                  myCourses.reduce((sum, c) => sum + calculateCycleProgress(c).progress, 0) /
                    myCourses.length
                )}%`
              : "—"
          }
          subtitle="Across courses"
          icon={Clock}
        />
      </div>

      {/* Course progress */}
      {myCourses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-card-foreground">My Courses</h2>
          {myCourses.map((course) => {
            const progress = calculateCycleProgress(course);
            return (
              <div
                key={course.courseId}
                className="rounded-xl bg-card border border-border/50 p-6 shadow-soft"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-card-foreground">
                      {course.courseName || course.subject}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Cycle: {course.cycleType}
                    </p>
                  </div>
                  <StatusBadge status={course.status} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-card-foreground">
                      {course.completedHours} hours completed
                    </span>
                  </div>
                  <Progress value={progress.progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Fee Status: {course.feeStatus}</span>
                    <span>
                      {progress.progress === 100
                        ? "Cycle Complete"
                        : `${100 - progress.progress}% remaining`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Billing */}
      <div className="rounded-xl bg-card border border-border/50 shadow-soft">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-semibold text-card-foreground">Billing</h2>
        </div>
        <div className="px-6 py-6">
          {billingSummary.lastInvoice ? (
            <div className="grid gap-2 md:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Latest Invoice</p>
                <p className="font-medium">{billingSummary.lastInvoice.invoiceNumber}</p>
                <p className="text-sm text-muted-foreground">{billingSummary.lastInvoice.billingMonth}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                <p className="font-medium capitalize">{billingSummary.lastInvoice.status}</p>
                <p className="text-sm text-muted-foreground">Due: {formatCurrency(billingSummary.outstanding)}</p>
              </div>
              <div className="md:text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Open Invoices</p>
                <p className="font-medium">{billingSummary.openCount}</p>
                <p className="text-sm text-muted-foreground">Pay from the Payments page</p>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">No invoices yet.</div>
          )}
        </div>
      </div>

      {/* Schedule — with status update */}
      <div className="rounded-xl bg-card border border-border/50 shadow-soft">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-semibold text-card-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> Today's Schedule
          </h2>
        </div>
        <div className="divide-y divide-border">
          {todayClasses.length > 0 ? (
            todayClasses.map((c) => {
              const isUpdating = updatingStatus === c.classId;
              return (
                <div
                  key={c.classId}
                  className="px-6 py-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">
                          {getCourseName(c)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {c.startDateTime ? new Date(c.startDateTime).toLocaleTimeString() : "—"} ·{" "}
                          {c.durationMinutes}m
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>

                  {/* Status update buttons for students */}
                  {c.status === 'Scheduled' && (
                    <div className="flex items-center gap-2 pl-14">
                      {isUpdating ? (
                        <Loader className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs h-7 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20"
                            onClick={() => handleStatusUpdate(c.classId, "Completed")}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Completed
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs h-7 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                            onClick={() => handleStatusUpdate(c.classId, "Postponed")}
                          >
                            <PauseCircle className="h-3.5 w-3.5" />
                            Postponed
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs h-7 text-destructive hover:bg-destructive/10"
                            onClick={() => handleStatusUpdate(c.classId, "Cancelled")}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Cancelled
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="px-6 py-8 text-center text-muted-foreground">
              No classes scheduled for today.
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="rounded-xl bg-card border border-border/50 shadow-soft overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-semibold text-card-foreground">Class Details</h2>
        </div>
        {myClasses.length === 0 ? (
          <div className="px-6 py-8 text-center text-muted-foreground">
            No classes yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Course Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {myClasses.map((c) => {
                  return (
                    <tr
                      key={c.classId}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-card-foreground">
                        {c.startDateTime ? formatDateTime(c.startDateTime) : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground font-medium">
                        {getCourseName(c)}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {c.durationMinutes}m
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={c.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
