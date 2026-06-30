import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Eye, EyeOff, ArrowLeft, Check, X, Mail, ShieldCheck, KeyRound, RefreshCw } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { NeeshLogo } from "@/components/NeeshLogo";
import { TermsAndConditions } from "@/components/TermsAndConditions";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8081";

// ─── Password validation ───
const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character (!@#$%...)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

type SignupStep = "email" | "otp" | "password";

const Signup = () => {
  const [step, setStep] = useState<SignupStep>("email");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { signUp, signInWithGoogle, signInWithGithub, user, loading } = useAuth();
  const navigate = useNavigate();

  const passwordChecks = useMemo(() => passwordRules.map(r => ({ ...r, passed: r.test(password) })), [password]);
  const allPasswordChecksPassed = passwordChecks.every(c => c.passed);
  const passedCount = passwordChecks.filter(c => c.passed).length;
  const strengthPercent = Math.round((passedCount / passwordRules.length) * 100);
  const strengthColor = strengthPercent <= 40 ? "bg-red-500" : strengthPercent <= 80 ? "bg-yellow-500" : "bg-green-500";

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // ─── OTP Send ───
  const handleSendOtp = useCallback(async () => {
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await fetch(`${BASE_URL}/api/public/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "SIGNUP" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "OTP sent! Check your inbox.");
        setStep("otp");
        setOtpValue("");
        setOtpVerified(false);
        setResendCooldown(60);
      } else {
        toast.error(data.message || "Failed to send OTP.");
      }
    } catch (err) {
      console.error("[Signup] OTP send error:", err);
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  }, [email]);

  // ─── OTP Verify ───
  const handleVerifyOtp = useCallback(async () => {
    if (otpValue.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP.");
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await fetch(`${BASE_URL}/api/public/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpValue, purpose: "SIGNUP" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Email verified successfully!");
        setOtpVerified(true);
        setStep("password");
      } else {
        toast.error(data.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      console.error("[Signup] OTP verify error:", err);
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  }, [email, otpValue]);

  // ─── Account Creation ───
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!otpVerified) {
      toast.error("Please verify your email first.");
      return;
    }

    if (!agreedToTerms) {
      toast.error("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    if (!allPasswordChecksPassed) {
      toast.error("Please meet all password requirements before signing up.");
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await signUp(email, password);

    if (error) {
      console.error("[Signup] Error:", error.message, error);

      if (error.message.includes("User already registered")) {
        toast.error("This email is already registered. Please sign in instead.");
      } else if (error.message.includes("Password")) {
        toast.error("Password is too weak. Please use a stronger password.");
      } else if (error.message.includes("rate limit") || error.message.includes("Too many")) {
        toast.error("Too many signup attempts. Please wait a few minutes and try again.");
      } else if (error.message.includes("Invalid email")) {
        toast.error("Please enter a valid email address.");
      } else {
        toast.error(error.message || "An error occurred during sign up");
      }
      setIsSubmitting(false);
    } else {
      if (data?.user?.identities?.length === 0) {
        toast.info("This email is already registered but not verified. Please check your inbox for the verification link.");
        setIsSubmitting(false);
      } else if (data?.user && !data?.session) {
        toast.success("Account created! Please check your email to verify your account before signing in.", {
          duration: 8000,
        });
        setIsSubmitting(false);
      } else {
        toast.success("Account created successfully!");
        navigate("/dashboard");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center hero-gradient">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ─── Step indicators ───
  const steps = [
    { key: "email", label: "Email", icon: Mail },
    { key: "otp", label: "Verify", icon: ShieldCheck },
    { key: "password", label: "Password", icon: KeyRound },
  ] as const;
  const currentStepIndex = steps.findIndex(s => s.key === step);

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
          <div className="flex justify-center mb-6">
            <NeeshLogo size="lg" />
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              Create Account
            </h1>
            <p className="text-muted-foreground text-sm">
              Start validating your ideas today
            </p>
          </div>

          {/* Step Progress */}
          <div className="flex items-center justify-center gap-1 mb-8">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === currentStepIndex;
              const isCompleted = i < currentStepIndex;
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
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Icon className="w-3.5 h-3.5" />
                    )}
                    {s.label}
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`w-6 h-0.5 mx-1 rounded-full transition-colors duration-300 ${
                        i < currentStepIndex ? "bg-green-500" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* ─── Step 1: Email & Name ─── */}
          {step === "email" && (
            <div className="space-y-5 animate-slide-up">
              {/* Name fields */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isSendingOtp}
                />
                <Input
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isSendingOtp}
                />
              </div>

              {/* Email */}
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSendingOtp}
              />

              {/* Verify Email button */}
              <Button
                type="button"
                className="w-full"
                size="lg"
                disabled={isSendingOtp || !email}
                onClick={handleSendOtp}
              >
                {isSendingOtp ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Verify Email
                  </>
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
                  disabled={isSendingOtp}
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
                  disabled={isSendingOtp}
                  onClick={() => signInWithGithub()}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  GitHub
                </Button>
              </div>
            </div>
          )}

          {/* ─── Step 2: OTP Verification ─── */}
          {step === "otp" && (
            <div className="space-y-5 animate-slide-up">
              <div className="text-center space-y-2">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                  <Mail className="w-7 h-7 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  We've sent a 6-digit code to
                </p>
                <p className="text-sm font-semibold text-foreground">{email}</p>
              </div>

              {/* OTP Input */}
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpValue}
                  onChange={(value) => setOtpValue(value)}
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

              {/* Verify button */}
              <Button
                type="button"
                className="w-full"
                size="lg"
                disabled={isVerifyingOtp || otpValue.length !== 6}
                onClick={handleVerifyOtp}
              >
                {isVerifyingOtp ? (
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

              {/* Resend + Change Email */}
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="text-primary hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  disabled={resendCooldown > 0 || isSendingOtp}
                  onClick={handleSendOtp}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
                </button>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground hover:underline font-medium transition-colors"
                  onClick={() => {
                    setStep("email");
                    setOtpValue("");
                    setOtpVerified(false);
                  }}
                >
                  Change Email
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 3: Password & Terms ─── */}
          {step === "password" && (
            <form onSubmit={handleSubmit} className="space-y-5 animate-slide-up">
              {/* Verified email indicator */}
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                <Check className="w-4 h-4 text-green-600 shrink-0" />
                <span className="text-sm text-green-700 dark:text-green-400 font-medium truncate">
                  {email} — verified
                </span>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
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

                {/* Strength bar + requirements */}
                {password.length > 0 && (
                  <div className="space-y-2 p-3 bg-muted/40 rounded-xl">
                    {/* Strength bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
                          style={{ width: `${strengthPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        {strengthPercent <= 40 ? "Weak" : strengthPercent <= 80 ? "Fair" : "Strong"}
                      </span>
                    </div>
                    {/* Rules checklist */}
                    <div className="grid grid-cols-1 gap-1">
                      {passwordChecks.map((rule, i) => (
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
              </div>

              {/* Terms checkbox */}
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  disabled={isSubmitting}
                  className="mt-0.5"
                />
                <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                  I agree to the{" "}
                  <TermsAndConditions
                    type="terms"
                    trigger={
                      <span className="text-primary hover:underline font-medium cursor-pointer">
                        Terms of Service
                      </span>
                    }
                  />
                  {" "}and{" "}
                  <TermsAndConditions
                    type="privacy"
                    trigger={
                      <span className="text-primary hover:underline font-medium cursor-pointer">
                        Privacy Policy
                      </span>
                    }
                  />
                </Label>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting || !allPasswordChecksPassed || !agreedToTerms}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          )}

          {/* Login link */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;