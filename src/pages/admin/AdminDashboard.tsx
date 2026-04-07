import { useEffect, useMemo, useState } from "react";
import { Calendar, DollarSign, AlertCircle, Users, Clock, BookOpen, UserPlus, ArrowRight } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { classAPI, courseAPI, studentAPI, teacherAPI } from "@/lib/api";
import {
  formatCurrency,
  calculateCycleProgress,
} from "@/lib/crmUtils";
import { Class, Course, Student, Teacher } from "@/types/types";

export default function AdminDashboard() {
  // Calculate today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [activeView, setActiveView] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);

        const [clsRes, stuRes, crsRes, tchRes] = await Promise.all([
          classAPI.getAll(1, 500),
          studentAPI.getAll(1, 500),
          courseAPI.getAll(1, 500),
          teacherAPI.getAll(1, 500),
        ]);

        setClasses(clsRes.data || []);
        setStudents(stuRes.data || []);
        setCourses(crsRes.data || []);
        setTeachers(tchRes.data || []);
      } catch (e) {
        console.error("Failed to load admin dashboard data:", e);
        setError("Failed to load dashboard data. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const completedHoursByCourseId = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of classes) {
      if (c.status !== "Completed") continue;
      const hours = (c.durationMinutes || 0) / 60;
      map.set(c.courseId, (map.get(c.courseId) || 0) + hours);
    }
    return map;
  }, [classes]);

  const coursesWithComputedHours = useMemo(() => {
    return courses.map((c) => ({
      ...c,
      completedHours: completedHoursByCourseId.get(c.courseId) ?? c.completedHours ?? 0,
    }));
  }, [courses, completedHoursByCourseId]);

  const todayClasses = useMemo(
    () =>
      classes.filter((c) =>
        c.startDateTime.startsWith(today)
      ),
    [classes, today]
  );

  const dueFeesCourses = useMemo(
    () =>
      coursesWithComputedHours.filter(
        (c) =>
          c.feeStatus === "Due" || c.feeStatus === "PartiallyPaid"
      ),
    [coursesWithComputedHours]
  );

  const totalFeesAmount = useMemo(
    () =>
      dueFeesCourses.reduce((sum, c) => {
        const rate = c.billingRatePerHour || 0;
        const hours = c.completedHours || 0;
        return sum + rate * hours;
      }, 0),
    [dueFeesCourses]
  );

  const pendingCycles = useMemo(
    () =>
      coursesWithComputedHours.filter((c) => {
        const progress = calculateCycleProgress(c);
        return progress.progress >= 80 && progress.progress < 100;
      }),
    [coursesWithComputedHours]
  );

  const monthlyPayout = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return classes.reduce((sum, cls) => {
      if (cls.status !== "Completed") return sum;
      const d = new Date(cls.startDateTime);
      if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) return sum;
      const teacher = teachers.find((t) => t.teacherId === cls.teacherId);
      const rate = teacher?.compensationPerHour || 0;
      const hours = (cls.durationMinutes || 0) / 60;
      return sum + rate * hours;
    }, 0);
  }, [classes, teachers]);

  const recentStudents = useMemo(
    () =>
      [...students]
        .sort(
          (a, b) =>
            new Date(b.dateOfEnrollment).getTime() -
            new Date(a.dateOfEnrollment).getTime()
        )
        .slice(0, 5),
    [students]
  );

  const getStudentName = (id: string) =>
    students.find((s) => s.studentId === id)?.name || "—";
  const getTeacherName = (id: string) =>
    teachers.find((t) => t.teacherId === id)?.name || "—";
  const getCourseName = (id: string) =>
    courses.find((c) => c.courseId === id)?.subject || "—";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your institute today. {today}
        </p>
        {error && (
          <p className="mt-2 text-sm text-destructive">{error}</p>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Classes"
          value={loading ? "—" : todayClasses.length}
          subtitle={`${todayClasses.filter((c) => c.status === "Completed").length} completed`}
          icon={Calendar}
          onClick={() => setActiveView(activeView === "today" ? null : "today")}
          isActive={activeView === "today"}
        />
        <StatCard
          title="Due Fees"
          value={loading ? "—" : dueFeesCourses.length}
          subtitle={formatCurrency(totalFeesAmount)}
          icon={DollarSign}
          trend={{
            value: `${dueFeesCourses.filter((c) => c.feeStatus === "Due").length} overdue`,
            positive: false,
          }}
          onClick={() => setActiveView(activeView === "due" ? null : "due")}
          isActive={activeView === "due"}
        />
        <StatCard
          title="Pending Cycles"
          value={loading ? "—" : pendingCycles.length}
          subtitle="Nearing completion"
          icon={AlertCircle}
          onClick={() => setActiveView(activeView === "pending" ? null : "pending")}
          isActive={activeView === "pending"}
        />
        <StatCard
          title="Monthly Payout"
          value={formatCurrency(monthlyPayout)}
          subtitle={`${teachers.length} teachers`}
          icon={Users}
          onClick={() => setActiveView(activeView === "payout" ? null : "payout")}
          isActive={activeView === "payout"}
        />
      </div>

      {/* Detailed View Section */}
      {activeView && (
        <div className="rounded-xl bg-card border border-primary/20 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-primary/5">
            <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
              {activeView === "today" && <><Calendar className="h-5 w-5 text-primary" /> Today's Classes Breakdown</>}
              {activeView === "due" && <><DollarSign className="h-5 w-5 text-amber-600" /> Due Fees - Completed Cycles</>}
              {activeView === "pending" && <><AlertCircle className="h-5 w-5 text-blue-600" /> Cycles Nearing Completion</>}
              {activeView === "payout" && <><Users className="h-5 w-5 text-green-600" /> Teacher Payout Breakdown</>}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setActiveView(null)}>Close Details</Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  {activeView === "today" && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Student Name</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Course Name</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Teacher</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                    </>
                  )}
                  {(activeView === "due" || activeView === "pending") && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Student Name</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Course Name</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Pre/Post paid</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Start Date</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">End Date</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Amount Due</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                    </>
                  )}
                  {activeView === "payout" && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Teacher Name</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Classes (this month)</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Hours</th>
                      <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">Payout Amount</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeView === "today" && todayClasses.map(c => (
                  <tr key={c.classId} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">{new Date(c.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-6 py-4 text-sm">{getStudentName(c.studentId)}</td>
                    <td className="px-6 py-4 text-sm">{getCourseName(c.courseId)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-primary/80">{getTeacherName(c.teacherId)}</td>
                    <td className="px-6 py-4"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
                {(activeView === "due" || activeView === "pending") && (activeView === "due" ? dueFeesCourses : pendingCycles).map(c => (
                  <tr key={c.courseId} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">{getStudentName(c.studentId)}</td>
                    <td className="px-6 py-4 text-sm">{c.subject || c.courseName}</td>
                    <td className="px-6 py-4 text-sm capitalize">{c.paymentType}</td>
                    <td className="px-6 py-4 text-sm">{new Date(c.startDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">{c.endDate ? new Date(c.endDate).toLocaleDateString() : "—"}</td>
                    <td className="px-6 py-4 text-sm font-bold text-amber-600">{formatCurrency((c.billingRatePerHour || 0) * (c.completedHours || 0))}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                        c.feeStatus === "Paid" ? "bg-green-100 text-green-800 border-green-200" :
                        c.feeStatus === "Due" ? "bg-red-100 text-red-800 border-red-200" :
                        "bg-amber-100 text-amber-800 border-amber-200"
                      )}>
                        {c.feeStatus === "Paid" ? "Paid" : c.feeStatus === "Due" ? "Unpaid" : "Partially Paid"}
                      </span>
                    </td>
                  </tr>
                ))}
                {activeView === "payout" && teachers.map(t => {
                  const now = new Date();
                  const currentMonth = now.getMonth();
                  const currentYear = now.getFullYear();
                  const teacherClasses = classes.filter(cls => 
                    cls.teacherId === t.teacherId && 
                    cls.status === "Completed" &&
                    new Date(cls.startDateTime).getMonth() === currentMonth &&
                    new Date(cls.startDateTime).getFullYear() === currentYear
                  );
                  const hours = teacherClasses.reduce((sum, cls) => sum + (cls.durationMinutes || 0) / 60, 0);
                  const amount = hours * (t.compensationPerHour || 0);

                  if (hours === 0) return null;

                  return (
                    <tr key={t.teacherId} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium">{t.name}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{t.email}</td>
                      <td className="px-6 py-4 text-sm text-center">{teacherClasses.length}</td>
                      <td className="px-6 py-4 text-sm">{hours.toFixed(1)} hrs</td>
                      <td className="px-6 py-4 text-sm font-bold text-emerald-600">{formatCurrency(amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white shadow-lg shadow-emerald-200">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-1 rounded">New</span>
          </div>
          <h3 className="text-xl font-bold mb-2 text-white">Add Student</h3>
          <p className="text-emerald-50 mb-6 text-sm">Quickly add a new student to the system from the management panel.</p>
          <Link to="/admin/students">
            <Button variant="secondary" className="w-full bg-white text-emerald-600 hover:bg-emerald-50 font-bold">
              Open Student Management <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white shadow-lg shadow-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-1 rounded">Action</span>
          </div>
          <h3 className="text-xl font-bold mb-2 text-white">Manage Approvals</h3>
          <p className="text-blue-50 mb-6 text-sm">Review and approve pending registrations from students and teachers.</p>
          <Link to="/admin/approvals">
            <Button variant="secondary" className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold">
              View Pending Approvals <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Only show Today's Classes quick list if not in active breakdown view */}
      {(!activeView || activeView !== "today") && (
        <div className="rounded-xl bg-card border border-border/50 shadow-soft">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-semibold text-card-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Today's Scheduled Classes
            </h2>
            <span className="text-sm text-muted-foreground">{today}</span>
          </div>
          <div className="divide-y divide-border">
            {todayClasses.length === 0 ? (
              <div className="px-6 py-8 text-center text-muted-foreground">
                No classes scheduled for today
              </div>
            ) : (
              todayClasses.map((c) => (
                <div
                  key={c.classId}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-card-foreground">
                        {getCourseName(c.courseId)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getTeacherName(c.teacherId)} → {getStudentName(c.studentId)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {new Date(c.startDateTime).toLocaleTimeString()} ·{" "}
                      {c.durationMinutes}m
                    </span>
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Recent students */}
      <div className="rounded-xl bg-card border border-border/50 shadow-soft">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-semibold text-card-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Recent Students
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Reg. No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentStudents.map((s) => (
                <tr key={s.studentId} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-card-foreground">
                    {s.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {s.registrationNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {s.grade}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
