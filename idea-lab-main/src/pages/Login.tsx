import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff, ArrowLeft, Check, X, Mail, ShieldCheck, KeyRound, RefreshCw } from "lucide-react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { NeeshLogo } from "@/components/NeeshLogo";
import { adminLogin } from "@/lib/adminApi";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8081";

// ─── Password validation ───
const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character (!@#$%...)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

// ─── Rate limiting ───
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 60;
const loginAttempts = new Map<string, { count: number; blockedUntil: number }>();

type ForgotStep = "email" | "otp" | "password";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const lockoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { signIn, signInWithGoogle, signInWithGithub, user, loading } = useAuth();
  const { adminLogin: setAdminSession } = useAdminAuth();
  const navigate = useNavigate();

  // ─── Forgot Password State ───
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotResendCooldown, setForgotResendCooldown] = useState(0);

  // Password checks for forgot password
  const forgotPasswordChecks = useMemo(
    () => passwordRules.map(r => ({ ...r, passed: r.test(forgotNewPassword) })),
    [forgotNewPassword]
  );
  const allForgotPasswordChecksPassed = forgotPasswordChecks.every(c => c.passed);
  const forgotPassedCount = forgotPasswordChecks.filter(c => c.passed).length;
  const forgotStrengthPercent = Math.round((forgotPassedCount / passwordRules.length) * 100);
  const forgotStrengthColor =
    forgotStrengthPercent <= 40 ? "bg-red-500" : forgotStrengthPercent <= 80 ? "bg-yellow-500" : "bg-green-500";
  const passwordsMatch = forgotNewPassword === forgotConfirmPassword && forgotConfirmPassword.length > 0;

  // Cleanup lockout timer
  useEffect(() => {
    return () => {
      if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
    };
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (forgotResendCooldown <= 0) return;
    const timer = setInterval(() => {
      setForgotResendCooldown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [forgotResendCooldown]);

  const startLockoutTimer = (until: number) => {
    if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
    const update = () => {
      const remaining = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      setLockoutRemaining(remaining);
      if (remaining <= 0 && lockoutTimerRef.current) {
        clearInterval(lockoutTimerRef.current);
        lockoutTimerRef.current = null;
      }
    };
    update();
    lockoutTimerRef.current = setInterval(update, 1000);
  };

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  // ─── Login Handler ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    // Rate limit check
    const emailLower = email.toLowerCase();
    const attempt = loginAttempts.get(emailLower);
    if (attempt && attempt.blockedUntil > Date.now()) {
      const secs = Math.ceil((attempt.blockedUntil - Date.now()) / 1000);
      toast.error(`Too many failed attempts. Try again in ${secs} seconds.`);
      startLockoutTimer(attempt.blockedUntil);
      return;
    }

    setIsSubmitting(true);

    // Check for admin login
    try {
      const adminResult = await adminLogin(email, password);
      if (adminResult && adminResult.token) {
        setAdminSession(adminResult.token, adminResult.displayName);
        toast.success("Admin login successful!");
        navigate("/admin");
        return;
      }
    } catch {
      // Not admin credentials — fall through to normal Supabase auth
    }

    const { error } = await signIn(email, password);

    if (error) {
      console.error("[Login] Error:", error.message, error);

      // Track failed attempts for rate limiting
      const prev = loginAttempts.get(emailLower) || { count: 0, blockedUntil: 0 };
      prev.count++;
      if (prev.count >= MAX_ATTEMPTS) {
        prev.blockedUntil = Date.now() + LOCKOUT_SECONDS * 1000;
        prev.count = 0;
        startLockoutTimer(prev.blockedUntil);
        toast.error(`Too many failed login attempts. Please wait ${LOCKOUT_SECONDS} seconds.`);
      } else if (error.message.includes("Invalid login credentials")) {
        toast.error(`Invalid email or password. (${MAX_ATTEMPTS - prev.count} attempts remaining)`);
      } else if (error.message.includes("Email not confirmed")) {
        toast.error("Please verify your email before signing in.");
      } else if (error.message.includes("User not found")) {
        toast.error("No account found with this email. Please sign up first.");
      } else if (error.message.includes("Too many requests")) {
        toast.error("Too many login attempts. Please wait a few minutes.");
      } else {
        toast.error(error.message || "An error occurred during sign in");
      }
      loginAttempts.set(emailLower, prev);
      setIsSubmitting(false);
    } else {
      loginAttempts.delete(emailLower);
      setLockoutRemaining(0);
      toast.success("Signed in successfully!");
      navigate("/dashboard");
    }
  };

  // ─── Forgot Password: Send OTP ───
  const handleForgotSendOtp = useCallback(async () => {
    if (!forgotEmail) {
      toast.error("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsForgotLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/public/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, purpose: "FORGOT_PASSWORD" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "OTP sent! Check your inbox.");
        setForgotStep("otp");
        setForgotOtp("");
        setForgotResendCooldown(60);
      } else {
        toast.error(data.message || "Failed to send OTP.");
      }
    } catch (err) {
      console.error("[ForgotPassword] OTP send error:", err);
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setIsForgotLoading(false);
    }
  }, [forgotEmail]);

  // ─── Forgot Password: Verify OTP ───
  const handleForgotVerifyOtp = useCallback(async () => {
    if (forgotOtp.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP.");
      return;
    }

    setIsForgotLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/public/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp, purpose: "FORGOT_PASSWORD" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("OTP verified! Set your new password.");
        setForgotStep("password");
      } else {
        toast.error(data.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      console.error("[ForgotPassword] OTP verify error:", err);
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsForgotLoading(false);
    }
  }, [forgotEmail, forgotOtp]);

  // ─── Forgot Password: Change Password ───
  const handleForgotChangePassword = useCallback(async () => {
    if (!allForgotPasswordChecksPassed) {
      toast.error("Please meet all password requirements.");
      return;
    }
    if (!passwordsMatch) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsForgotLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/public/otp/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail,
          otp: forgotOtp,
          newPassword: forgotNewPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Password changed successfully! You can now sign in.");
        setForgotOpen(false);
        resetForgotState();
      } else {
        toast.error(data.message || "Failed to change password.");
      }
    } catch (err) {
      console.error("[ForgotPassword] Change password error:", err);
      toast.error("Failed to change password. Please try again.");
    } finally {
      setIsForgotLoading(false);
    }
  }, [forgotEmail, forgotOtp, forgotNewPassword, forgotConfirmPassword, allForgotPasswordChecksPassed, passwordsMatch]);

  const resetForgotState = () => {
    setForgotStep("email");
    setForgotEmail("");
    setForgotOtp("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setForgotResendCooldown(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center hero-gradient">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      {/* Back button */}
      <Link
        to="/"
        className="absolute top-6 left-6 w-11 h-11 rounded-full bg-card shadow-card flex items-center justify-center hover:shadow-md transition-all duration-200"
      >
        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
      </Link>

      <div className="w-full max-w-md animate-slide-up">
        <div className="bg-card rounded-3xl shadow-lg p-8 border border-border/30">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <NeeshLogo size="lg" />
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              Welcome Back
            </h1>
            <p className="text-muted-foreground text-sm">
              Sign in to continue to your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-12"
                disabled={isSubmitting}
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Forgot password */}
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-primary hover:underline font-medium"
                onClick={() => {
                  resetForgotState();
                  setForgotOpen(true);
                }}
              >
                Forgot password?
              </button>
            </div>

            {/* Lockout warning */}
            {lockoutRemaining > 0 && (
              <div className="text-sm text-destructive text-center p-3 bg-destructive/10 rounded-xl">
                Account temporarily locked. Try again in <strong>{lockoutRemaining}s</strong>
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting || lockoutRemaining > 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : lockoutRemaining > 0 ? (
                `Locked (${lockoutRemaining}s)`
              ) : (
                "Sign In"
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-4 text-muted-foreground">or continue with</span>
              </div>
            </div>

            {/* Social Sign Ins */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-12"
                disabled={isSubmitting}
                onClick={() => signInWithGoogle()}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-12"
                disabled={isSubmitting}
                onClick={() => signInWithGithub()}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                GitHub
              </Button>
            </div>
          </form>

          {/* Signup link */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline font-semibold">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* ─── Forgot Password Dialog ─── */}
      <Dialog
        open={forgotOpen}
        onOpenChange={(open) => {
          setForgotOpen(open);
          if (!open) resetForgotState();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              {forgotStep === "email" && "Reset Password"}
              {forgotStep === "otp" && "Verify OTP"}
              {forgotStep === "password" && "New Password"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Step progress */}
            <div className="flex items-center justify-center gap-1">
              {([
                { key: "email", label: "Email", icon: Mail },
                { key: "otp", label: "Verify", icon: ShieldCheck },
                { key: "password", label: "Reset", icon: KeyRound },
              ] as const).map((s, i) => {
                const Icon = s.icon;
                const stepOrder = ["email", "otp", "password"] as const;
                const currentIdx = stepOrder.indexOf(forgotStep);
                const isActive = i === currentIdx;
                const isCompleted = i < currentIdx;
                return (
                  <div key={s.key} className="flex items-center">
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                        isActive
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : isCompleted
                          ? "bg-green-500/10 text-green-600 border border-green-500/30"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                      {s.label}
                    </div>
                    {i < 2 && (
                      <div
                        className={`w-6 h-0.5 mx-1 rounded-full transition-colors duration-300 ${
                          i < currentIdx ? "bg-green-500" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step 1: Email */}
            {forgotStep === "email" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Enter your email address and we'll send you a verification code.
                </p>
                <Input
                  type="email"
                  placeholder="Email address"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  disabled={isForgotLoading}
                />
                <Button
                  type="button"
                  className="w-full"
                  size="lg"
                  disabled={isForgotLoading || !forgotEmail}
                  onClick={handleForgotSendOtp}
                >
                  {isForgotLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      Send OTP
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Step 2: OTP */}
            {forgotStep === "otp" && (
              <div className="space-y-4">
                <div className="text-center space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code sent to
                  </p>
                  <p className="text-sm font-semibold text-foreground">{forgotEmail}</p>
                </div>

                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(value) => setForgotOtp(value)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <span className="text-muted-foreground mx-1">-</span>
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  type="button"
                  className="w-full"
                  size="lg"
                  disabled={isForgotLoading || forgotOtp.length !== 6}
                  onClick={handleForgotVerifyOtp}
                >
                  {isForgotLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      Verify OTP
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    className="text-primary hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    disabled={forgotResendCooldown > 0 || isForgotLoading}
                    onClick={handleForgotSendOtp}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {forgotResendCooldown > 0 ? `Resend in ${forgotResendCooldown}s` : "Resend OTP"}
                  </button>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground hover:underline font-medium transition-colors"
                    onClick={() => {
                      setForgotStep("email");
                      setForgotOtp("");
                    }}
                  >
                    Change Email
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: New Password */}
            {forgotStep === "password" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Create a new password for your account.
                </p>

                {/* New Password */}
                <div className="relative">
                  <Input
                    type={showForgotPassword ? "text" : "password"}
                    placeholder="New password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    disabled={isForgotLoading}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowForgotPassword(!showForgotPassword)}
                  >
                    {showForgotPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <Input
                    type={showForgotConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    disabled={isForgotLoading}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                  >
                    {showForgotConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password match indicator */}
                {forgotConfirmPassword.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs">
                    {passwordsMatch ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-green-600">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-red-500">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}

                {/* Password strength */}
                {forgotNewPassword.length > 0 && (
                  <div className="space-y-2 p-3 bg-muted/40 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${forgotStrengthColor}`}
                          style={{ width: `${forgotStrengthPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        {forgotStrengthPercent <= 40 ? "Weak" : forgotStrengthPercent <= 80 ? "Fair" : "Strong"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      {forgotPasswordChecks.map((rule, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs">
                          {rule.passed ? (
                            <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                          )}
                          <span className={rule.passed ? "text-green-600" : "text-muted-foreground"}>
                            {rule.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  type="button"
                  className="w-full"
                  size="lg"
                  disabled={isForgotLoading || !allForgotPasswordChecksPassed || !passwordsMatch}
                  onClick={handleForgotChangePassword}
                >
                  {isForgotLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-5 h-5" />
                      Change Password
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;