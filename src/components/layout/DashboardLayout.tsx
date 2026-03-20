import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  GraduationCap, LayoutDashboard, Users, BookOpen, Calendar, FileText,
  ChevronLeft, LogOut, Menu, UserCircle, DollarSign, Bell, Moon, Sun, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "../ThemeToggle";
const logo = "/image1.jpeg";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Approvals", href: "/admin/approvals", icon: CheckCircle },
  { label: "Teachers", href: "/admin/teachers", icon: Users },
  { label: "Students", href: "/admin/students", icon: UserCircle },
  { label: "Courses", href: "/admin/courses", icon: BookOpen },
  { label: "Classes", href: "/admin/classes", icon: Calendar },
  { label: "Billing Center", href: "/admin/billing", icon: DollarSign },
  { label: "Logs", href: "/admin/logs", icon: FileText },
];

const teacherNav: NavItem[] = [
  { label: "Dashboard", href: "/teacher", icon: LayoutDashboard },
  { label: "My Students", href: "/teacher/students", icon: Users },
  { label: "Class History", href: "/teacher/history", icon: Calendar },
  { label: "Earnings", href: "/teacher/earnings", icon: DollarSign },
];

const studentNav: NavItem[] = [
  { label: "Dashboard", href: "/student", icon: LayoutDashboard },
  { label: "My Schedule", href: "/student/schedule", icon: Calendar },
  { label: "Class History", href: "/student/history", icon: FileText },
];

const roleConfig = {
  admin: { nav: adminNav, label: "Admin", color: "gradient-primary" },
  teacher: { nav: teacherNav, label: "Teacher", color: "gradient-accent" },
  student: { nav: studentNav, label: "Student", color: "gradient-primary" },
};

export function DashboardLayout({ role }: { role: "admin" | "teacher" | "student" }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const config = roleConfig[role];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-4">
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm bg-white", config.color)}>
            <img src={logo} alt="Assured Experts" className="h-6 w-6" />
          </div>
          {!collapsed && <span className="font-bold text-foreground">Assured Experts</span>}
        </div>

        {/* Role label */}
        {!collapsed && (
          <div className="px-4 py-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              {config.label} Panel
            </span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
          {config.nav.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200",
                  active
                    ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <div className="flex items-center gap-3">
            <button className="md:hidden" onClick={() => setCollapsed(!collapsed)}>
              <Menu className="h-5 w-5 text-muted-foreground" />
            </button>
            <h2 className="text-sm font-medium text-muted-foreground">
              Welcome back, <span className="text-foreground font-semibold">{user?.name || config.label}</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4.5 w-4.5 text-muted-foreground" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground">
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="hidden sm:inline">Logout</span>}
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
