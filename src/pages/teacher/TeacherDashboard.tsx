import { createContext, useCallback, useContext, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { classAPI, courseAPI, studentAPI } from "@/lib/api";
import { Class, Course, Student, User } from "@/types/types";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

interface TeacherDashboardContextType {
  user: User | null;
  classes: Class[];
  courses: Course[];
  students: Student[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const TeacherDashboardContext = createContext<TeacherDashboardContextType | undefined>(undefined);

export function TeacherDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user || user.role !== 'teacher') return;

    try {
      setLoading(true);
      const [classesResp, coursesResp, studentsResp] = await Promise.all([
        classAPI.getClassesForTeacher(),
        courseAPI.getCoursesForTeacher(),
        studentAPI.getStudentsForTeacher(),
      ]);

      setClasses(classesResp.data || []);
      setCourses(coursesResp.data || []);
      setStudents(studentsResp.data || []);
      
    } catch (err) {
      console.error("Failed to fetch teacher data:", err);
      setError("Could not load dashboard data. Please try refreshing the page.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const value = { user, classes, courses, students, loading, error, refetch: fetchData };

  return (
    <TeacherDashboardContext.Provider value={value}>
      <DashboardLayout role="teacher" />
    </TeacherDashboardContext.Provider>
  );
}

export const useTeacherDashboard = () => {
  const context = useContext(TeacherDashboardContext);
  if (!context) {
    throw new Error("useTeacherDashboard must be used within a TeacherDashboard provider");
  }
  return context;
};