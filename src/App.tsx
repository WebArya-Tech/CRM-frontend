import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import LoginLanding from "./pages/LoginLanding";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import TeacherLogin from "./pages/TeacherLogin";
import StudentLogin from "./pages/StudentLogin";
import StudentRegister from "./pages/StudentRegister";

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ResetPasswordInPanel from "./pages/ResetPasswordInPanel";
import Payment from "./pages/Payment";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminApprovals from "./pages/admin/AdminApprovals";
import TeachersManagement from "./pages/admin/TeachersManagement";
import StudentsManagement from "./pages/admin/StudentsManagement";
import CoursesManagement from "./pages/admin/CoursesManagement";
import ClassesManagement from "./pages/admin/ClassesManagement";
import LogsViewer from "./pages/admin/LogsViewer";
import BillingCenter from "./pages/admin/BillingCenter";
import PublicServicesManagement from "./pages/admin/ServicesManagement";
import StudentDashboard from "./pages/student/StudentDashboard";
import { TeacherDashboard, MyStudents, ClassHistory, Earnings, TeacherHome } from "./pages/teacher";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="crm-ui-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
                <Route path="/contact" element={<Contact />} />
              </Route>
              <Route path="/login" element={<LoginLanding />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/teacher-login" element={<TeacherLogin />} />
              <Route path="/student-login" element={<StudentLogin />} />
              <Route path="/student-register" element={<StudentRegister />} />
              <Route path="/auth-login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Payment - Protected Route */}
              <Route path="/payment" element={
                <ProtectedRoute>
                  <Payment />
                </ProtectedRoute>
              } />

              {/* Admin */}
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <DashboardLayout role="admin" />
                </ProtectedRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="approvals" element={<AdminApprovals />} />
                <Route path="teachers" element={<TeachersManagement />} />
                <Route path="students" element={<StudentsManagement />} />
                <Route path="courses" element={<CoursesManagement />} />
                <Route path="classes" element={<ClassesManagement />} />
                <Route path="billing" element={<BillingCenter />} />
                <Route path="logs" element={<LogsViewer />} />
                <Route path="public-services" element={<PublicServicesManagement />} />
                <Route path="reset-password" element={<ResetPasswordInPanel />} />
              </Route>

              {/* Teacher */}
              {/* Teacher */}
              <Route
                path="/teacher"
                element={<ProtectedRoute requiredRole="teacher"><TeacherDashboard /></ProtectedRoute>}
              >
                <Route index element={<TeacherHome />} />
                <Route path="students" element={<MyStudents />} />
                <Route path="history" element={<ClassHistory />} />
                <Route path="earnings" element={<Earnings />} />
                <Route path="reset-password" element={<ResetPasswordInPanel />} />
              </Route>

              {/* Student */}
              <Route path="/student" element={
                <ProtectedRoute requiredRole="student">
                  <DashboardLayout role="student" />
                </ProtectedRoute>
              }>
                <Route index element={<StudentDashboard />} />
                <Route path="schedule" element={<StudentDashboard />} />
                <Route path="history" element={<StudentDashboard />} />
                <Route path="reset-password" element={<ResetPasswordInPanel />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
