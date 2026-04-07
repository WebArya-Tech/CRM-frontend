import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GraduationCap, Loader, AlertCircle, CheckCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { authAPI, teacherAPI, APIError } from "@/lib/api";
import { Teacher } from "@/types/types";

const gradeOptions = [
  "6", "7", "8", "9", "10", "11", "12", "12thPass", "UG", "FreshGrad", "Professional"
];

export default function StudentRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    mobile: "",
    grade: "",
    fatherName: "",
    motherName: "",
    parentEmailId: "",
    parentContact: "",
    preferredTeacherId: "",
    courseName: "",
    address: "",
    role: "student"
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoadingTeachers(true);
      const response = await teacherAPI.getAll(1, 100, { status: "Active" });
      setTeachers(response.data || []);
    } catch (err) {
      console.error("Failed to fetch teachers:", err);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      await authAPI.register(formData);
      setSuccess(true);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.data?.message || "Registration failed. Please try again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <Card className="w-full max-w-md border-border/50 shadow-lg text-center animate-in fade-in zoom-in duration-500">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                <CheckCircle className="h-10 w-10" />
              </div>
            </div>
            <CardTitle className="text-2xl">Registration Successful!</CardTitle>
            <CardDescription className="text-base">
              Your profile has been created and is now **pending admin approval**. 
              You will receive an email once your account is activated.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Button onClick={() => navigate("/student-login")} className="w-full">
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link to="/student-login" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group">
          <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </Link>
        
        <Card className="border-border/50 shadow-xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10 pb-8 pt-10">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl text-center font-bold tracking-tight">Student Registration</CardTitle>
            <CardDescription className="text-center text-base mt-2">
              Create your profile to join our learning community
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive animate-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold border-l-4 border-primary pl-3 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input id="name" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input id="email" name="email" type="email" placeholder="john@example.com" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile">Mobile Number * (10 digits)</Label>
                      <Input id="mobile" name="mobile" placeholder="9876543210" value={formData.mobile} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="grade">Grade *</Label>
                      <Select value={formData.grade} onValueChange={(v) => handleSelectChange("grade", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {gradeOptions.map((g) => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold border-l-4 border-amber-500 pl-3 mb-4">Security</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 relative">
                      <Label htmlFor="password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={handleChange}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold border-l-4 border-blue-500 pl-3 mb-4">Parent Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fatherName">Father's Name *</Label>
                      <Input id="fatherName" name="fatherName" placeholder="Father's full name" value={formData.fatherName} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="motherName">Mother's Name *</Label>
                      <Input id="motherName" name="motherName" placeholder="Mother's full name" value={formData.motherName} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parentEmailId">Parent Email</Label>
                      <Input id="parentEmailId" name="parentEmailId" type="email" placeholder="parent@example.com" value={formData.parentEmailId} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parentContact">Parent Contact * (10 digits)</Label>
                      <Input id="parentContact" name="parentContact" placeholder="9876543210" value={formData.parentContact} onChange={handleChange} required />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold border-l-4 border-green-500 pl-3 mb-4">Course Preference</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="preferredTeacherId">Preferred Teacher</Label>
                      <Select value={formData.preferredTeacherId} onValueChange={(v) => handleSelectChange("preferredTeacherId", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingTeachers ? "Loading..." : "Select teacher (optional)"} />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((t) => (
                            <SelectItem key={t.teacherId} value={t.teacherId}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="courseName">Course Name</Label>
                      <Input id="courseName" name="courseName" placeholder="e.g., Mathematics" value={formData.courseName} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Full Address</Label>
                  <Input id="address" name="address" placeholder="123 Street Name, City, PIN" value={formData.address} onChange={handleChange} />
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <Button type="submit" className="w-full h-12 text-base font-semibold transition-all hover:scale-[1.01] active:scale-[0.99]" disabled={loading}>
                  {loading && <Loader className="mr-2 h-5 w-5 animate-spin" />}
                  {loading ? "Creating Profile..." : "Submit Registration Profile"}
                </Button>
                <p className="text-center text-sm text-muted-foreground mt-4 italic">
                  Note: Your profile will be reviewed and approved by an administrator before you can log in.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
