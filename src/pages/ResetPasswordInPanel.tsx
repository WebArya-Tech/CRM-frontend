import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { authAPI, APIError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader, AlertCircle, CheckCircle, ArrowRight, KeyRound } from "lucide-react";

export default function ResetPasswordInPanel() {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Reset Password
  const [email, setEmail] = useState(user?.email || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSendOTP = async () => {
    setLoading(true);
    setError("");
    try {
      await authAPI.forgotPassword(email);
      setStep(2);
      setSuccess("OTP has been sent to your registered email.");
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.data?.message || "Failed to send OTP. Please check your email.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await authAPI.resetPassword({ email, otp, newPassword, confirmPassword });
      setSuccess("Password reset successfully!");
      setStep(3); // Complete
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.data?.message || "Invalid OTP or request failed.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pt-8">
      <Card className="border-border shadow-soft">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            {step === 1 && "Confirm your email to receive an OTP code."}
            {step === 2 && "Enter the 6-digit OTP and your new password."}
            {step === 3 && "Your password has been updated."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && step !== 3 && (
            <Alert className="bg-success/10 text-success border-success/20">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={!!user?.email} // Pre-set for existing user
                />
              </div>
              <Button onClick={handleSendOTP} className="w-full h-11" disabled={loading}>
                {loading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                Send OTP
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">OTP Code</label>
                <Input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm Password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button onClick={handleResetPassword} className="w-full h-11" disabled={loading}>
                {loading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
              <Button variant="link" onClick={() => setStep(1)} className="w-full text-xs" disabled={loading}>
                Didn't receive code? Resend
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-4 py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mx-auto text-success">
                <CheckCircle className="h-8 w-8" />
              </div>
              <p className="text-muted-foreground">Your password has been changed successfully. You can continue using the portal.</p>
              <Button onClick={() => setStep(1)} variant="outline" className="w-full">
                Back
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
