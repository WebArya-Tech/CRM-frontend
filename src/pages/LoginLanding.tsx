import { Link } from 'react-router-dom';
import { Shield, BookOpen, GraduationCap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginLanding() {
  const roles = [
    {
      name: 'Admin',
      description: 'Manage teachers, students, courses and system settings',
      icon: Shield,
      href: '/admin-login',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-600 dark:text-red-400',
    },
    {
      name: 'Teacher',
      description: 'Access your dashboard, manage courses and students',
      icon: BookOpen,
      href: '/teacher-login',
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'border-amber-200 dark:border-amber-800',
      textColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      name: 'Student',
      description: 'Browse courses, access learning materials and payment',
      icon: GraduationCap,
      href: '/student-login',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-600 dark:text-green-400',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12 space-y-2">
          <h1 className="text-4xl font-bold text-gradient">Welcome to Assured Experts</h1>
          <p className="text-lg text-muted-foreground">
            Select your role to login to your dashboard
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Link key={role.name} to={role.href}>
                <Card className={`h-full border-2 ${role.borderColor} ${role.bgColor} hover:shadow-lg transition-all duration-300 cursor-pointer`}>
                  <CardHeader>
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${role.color} mb-3`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl">{role.name}</CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full group">
                      Login as {role.name}
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="text-center space-y-4">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-3">
                New to the system? Teachers and Students are added by the Admin.
              </p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>📧 <strong>Login Method:</strong> Use your assigned email + Teacher/Student ID (TCH-XXXXXX or STD-XXXXXX)</p>
                <p>🔑 <strong>Forgot Password?</strong> Use the "Forgot" link on any login page to reset</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
