import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, CalendarCheck2, Users2, Wallet  , Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../lib/api";
import { Button, Card } from "../../components/ui";
const HIGHLIGHTS = [
  { icon: Users2, title: "Members & memberships", body: "One record per member with plan, expiry and renewal history." },
  { icon: CalendarCheck2, title: "Classes and check-ins", body: "Book sessions against real capacity, then track attendance." },
  { icon: Wallet, title: "Billing you can reconcile", body: "Payments, plans and exports that line up with your ledger." },
  { icon: ShieldCheck, title: "Role-based staff access", body: "Owner, manager and staff each see only what they should." }
];
const GoogleMark = () => <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 13 4.5 4.5 13 4.5 24S13 43.5 24 43.5 43.5 35 43.5 24c0-1.3-.1-2.7-.4-3.9z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 6.6C14.7 17.6 19 14.5 24 14.5c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 15.9 4.5 8.9 9.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 43.5c5.3 0 10.1-2 13.7-5.3l-6.5-6.5C29.4 33.3 26.8 34.5 24 34.5c-5.2 0-9.6-3.4-11.1-8.1l-6.6 6.6C8.9 38.6 15.9 43.5 24 43.5z" />
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.5 6.5C37 46.4 43.5 38.9 43.5 24c0-1.3-.1-2.7-.4-3.9z" />
  </svg>;
const passwordStrength = (value) => {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[^A-Za-z]/.test(value) && /[A-Za-z]/.test(value)) score += 1;
  if (/[^\w\s]/.test(value)) score += 1;
  const labels = ["Too short", "Weak", "Fair", "Strong", "Very strong"];
  return { score, label: value ? labels[score] : "" };
};
const Login = () => {
  const [mode, setMode] = useState("login");
  const [ownerStep, setOwnerStep] = useState("key");
  const [ownerForm, setOwnerForm] = useState({ key: "", org_name: "", branch_name: "", gym_name: "", address: "", phone: "" });
  const [ownerError, setOwnerError] = useState("");
  const [ownerDone, setOwnerDone] = useState(false);
  const [memberToken, setMemberToken] = useState("");
  const [memberBusy, setMemberBusy] = useState(false);
  const [memberError, setMemberError] = useState("");
  const [memberDone, setMemberDone] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, signUp, signInWithGoogle, resetPassword, isAuthenticated, refreshVerification, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/";
  const switchMode = (next) => {
    setMode(next);
    setFieldErrors({});
    setFormError("");
    setNotice("");
    setShowPassword(false);
    setFormData((prev) => ({ ...prev, confirmPassword: "" }));
  };
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => prev[field] ? { ...prev, [field]: void 0 } : prev);
  };
  const validate = () => {
    const next = {};
    if (!formData.email.trim()) next.email = "Enter your email address.";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) next.email = "That email address does not look right.";
    if (mode !== "forgot-password") {
      if (!formData.password) next.password = "Enter your password.";
      else if (mode === "signup" && formData.password.length < 6) next.password = "Use at least 6 characters.";
    }
    if (mode === "signup" && formData.confirmPassword !== formData.password) {
      next.confirmPassword = "Passwords do not match.";
    }
    setFieldErrors(next);
    return Object.values(next).every((message) => !message);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setNotice("");
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === "login") {
        const result = await login(formData.email.trim(), formData.password);
        if (result.ok) navigate(redirectTo, { replace: true });
        else setFormError(result.error || "Unable to sign in.");
      } else if (mode === "signup") {
        const result = await signUp(formData.email.trim(), formData.password);
        if (result.ok) navigate(redirectTo, { replace: true });
        else setFormError(result.error || "Unable to create the account.");
      } else {
        const result = await resetPassword(formData.email.trim());
        if (result.ok) {
          setNotice("If an account uses that address, a reset link is on its way.");
          switchMode("login");
        } else {
          setFormError(result.error || "Unable to send the reset link.");
        }
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const handleGoogle = async () => {
    setFormError("");
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.ok) navigate(redirectTo, { replace: true });
      else setFormError(result.error || "Unable to sign in with Google.");
    } finally {
      setGoogleLoading(false);
    }
  };
  const busy = loading || googleLoading;
  const strength = passwordStrength(formData.password);
  const inputBase = "w-full rounded-xl border bg-slate-950/60 py-3 pr-12 pl-11 text-[15px] text-white transition-colors placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40";
  const inputTone = (invalid) => invalid ? "border-rose-500/60 focus:border-rose-500" : "border-white/10 focus:border-brand-500/70";
  return <div className="relative flex min-h-screen flex-col bg-slate-950 font-sans lg:flex-row">
      {
    /* Brand panel */
  }
      <aside className="relative hidden overflow-hidden border-white/5 bg-slate-950 lg:flex lg:w-[46%] lg:border-r xl:w-[50%]">
        <div className="absolute inset-0 bg-grid-faint bg-grid opacity-70" />
        <div className="absolute -top-32 -left-24 h-[26rem] w-[26rem] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute -bottom-40 right-[-6rem] h-[24rem] w-[24rem] rounded-full bg-fuchsia-600/10 blur-[120px]" />
        <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 font-display text-sm font-bold text-white shadow-glow-brand">
              GP
            </div>
            <div>
              <p className="font-display text-[15px] font-bold tracking-tight text-white">GymPro</p>
              <p className="text-[11px] font-medium tracking-wide text-slate-500">Management Portal</p>
            </div>
          </div>

          <div className="max-w-md">
            <h1 className="font-display text-4xl font-bold leading-[1.1] text-white xl:text-[2.75rem]">
              Run the whole floor
              <span className="block text-brand-500">from one login.</span>
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-400">
              Members, classes, attendance and billing share one workspace, so the numbers on your dashboard match what
              actually happened today.
            </p>

            <ul className="mt-10 space-y-5">
              {HIGHLIGHTS.map(({ icon: Icon, title, body }) => <li key={title} className="flex gap-4">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                    <Icon className="h-4 w-4 text-brand-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500">{body}</p>
                  </div>
                </li>)}
            </ul>
          </div>

          <p className="text-[11px] font-medium text-slate-600">
            Authorized staff only. Activity on this workspace is stored in your own Firebase project.
          </p>
        </div>
      </aside>

      {
    /* Auth panel */
  }
      <main className="relative flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[430px] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 font-display text-sm font-bold text-white">
              GP
            </div>
            <div>
              <p className="font-display text-[15px] font-bold tracking-tight text-white">GymPro</p>
              <p className="text-[11px] font-medium tracking-wide text-slate-500">Management Portal</p>
            </div>
          </div>

          <Card
    padding="none"
    border={false}
    shadow="none"
    className="overflow-hidden rounded-3xl bg-slate-900/70 shadow-3xl ring-1 ring-white/10 backdrop-blur-xl"
  >
            <div className="p-6 sm:p-8">
              <header className="mb-6">
                <h2 className="font-display text-[22px] font-bold tracking-tight text-white">
                  {mode === "login" ? "Sign in to your workspace" : mode === "signup" ? "Create your account" : "Reset your password"}
                </h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">
                  {mode === "login" ? "Use the address your gym administrator assigned to you." : mode === "signup" ? "New accounts start with member-level access; roles are set by an admin." : "We will email you a secure link to set a new password."}
                </p>
              </header>

              {mode === "member" && <MemberRedeem
                  token={memberToken} setToken={setMemberToken}
                  busy={memberBusy} setBusy={setMemberBusy}
                  error={memberError} setError={setMemberError}
                  done={memberDone} setDone={setMemberDone}
                  authenticated={isAuthenticated}
                  onExit={() => switchMode("login")}
              />}

              {mode === "owner" && <OwnerRegister
                  step={ownerStep}
                  setStep={setOwnerStep}
                  form={ownerForm}
                  setForm={setOwnerForm}
                  error={ownerError}
                  setError={setOwnerError}
                  done={ownerDone}
                  setDone={setOwnerDone}
                  authenticated={isAuthenticated}
                  onExit={() => switchMode("login")}
              />}

              {mode !== "forgot-password" && mode !== "owner" && mode !== "member" && <div className="mb-6 flex gap-1 rounded-xl bg-slate-950/60 p-1 ring-1 ring-white/5">
                  {["login", "signup", "owner", "member"].map((option) => <button
    key={option}
    type="button"
    onClick={() => switchMode(option)}
    aria-pressed={mode === option}
    className={`flex-1 rounded-lg py-2 text-[13px] font-semibold transition-colors ${mode === option ? "bg-brand-700 text-white" : "text-slate-400 hover:text-slate-200"}`}
  >
                      {option === "login" ? "Sign in" : option === "signup" ? "Sign up" : option === "owner" ? "Create a Gym" : "Join a Gym"}
                    </button>)}
                </div>}

              {mode !== "owner" && mode !== "member" && (<form onSubmit={handleSubmit} noValidate aria-busy={busy} className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="auth-email" className="label-caps">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
    id="auth-email"
    name="email"
    type="email"
    inputMode="email"
    autoComplete="email"
    required
    placeholder="you@gym.com"
    aria-invalid={Boolean(fieldErrors.email)}
    aria-describedby={fieldErrors.email ? "auth-email-error" : void 0}
    disabled={busy}
    value={formData.email}
    onChange={(e) => handleChange("email", e.target.value)}
    className={`${inputBase} ${inputTone(fieldErrors.email)}`}
  />
                  </div>
                  {fieldErrors.email && <p id="auth-email-error" className="text-[12px] font-medium text-rose-400">
                      {fieldErrors.email}
                    </p>}
                </div>

                {mode !== "forgot-password" && <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <label htmlFor="auth-password" className="label-caps">
                        Password
                      </label>
                      {mode === "login" && <button
    type="button"
    onClick={() => switchMode("forgot-password")}
    className="text-[12px] font-medium text-slate-400 underline-offset-2 hover:text-brand-400 hover:underline"
  >
                          Forgot password?
                        </button>}
                    </div>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
    id="auth-password"
    name="password"
    type={showPassword ? "text" : "password"}
    autoComplete={mode === "signup" ? "new-password" : "current-password"}
    required
    minLength={mode === "signup" ? 6 : void 0}
    placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
    aria-invalid={Boolean(fieldErrors.password)}
    aria-describedby={[fieldErrors.password ? "auth-password-error" : null, mode === "signup" ? "auth-password-strength" : null].filter(Boolean).join(" ") || void 0}
    disabled={busy}
    value={formData.password}
    onChange={(e) => handleChange("password", e.target.value)}
    className={`${inputBase} ${inputTone(fieldErrors.password)}`}
  />
                      <button
    type="button"
    onClick={() => setShowPassword((prev) => !prev)}
    aria-label={showPassword ? "Hide password" : "Show password"}
    aria-pressed={showPassword}
    className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200"
  >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {fieldErrors.password && <p id="auth-password-error" className="text-[12px] font-medium text-rose-400">
                        {fieldErrors.password}
                      </p>}
                    {mode === "signup" && !fieldErrors.password && strength.label && <div id="auth-password-strength" className="flex items-center gap-2 pt-1">
                        <div className="flex flex-1 gap-1" aria-hidden="true">
                          {[0, 1, 2, 3].map((i) => <span
    key={i}
    className={`h-1 flex-1 rounded-full ${i < strength.score ? strength.score >= 3 ? "bg-emerald-500" : strength.score === 2 ? "bg-amber-500" : "bg-rose-500" : "bg-white/10"}`}
  />)}
                        </div>
                        <span className="text-[11px] font-medium text-slate-400">{strength.label}</span>
                      </div>}
                  </div>}

                {mode === "signup" && <div className="space-y-1.5">
                    <label htmlFor="auth-confirm" className="label-caps">
                      Confirm password
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
    id="auth-confirm"
    name="confirmPassword"
    type={showPassword ? "text" : "password"}
    autoComplete="new-password"
    required
    placeholder="Re-enter your password"
    aria-invalid={Boolean(fieldErrors.confirmPassword)}
    aria-describedby={fieldErrors.confirmPassword ? "auth-confirm-error" : void 0}
    disabled={busy}
    value={formData.confirmPassword}
    onChange={(e) => handleChange("confirmPassword", e.target.value)}
    className={`${inputBase} ${inputTone(fieldErrors.confirmPassword)}`}
  />
                    </div>
                    {fieldErrors.confirmPassword && <p id="auth-confirm-error" className="text-[12px] font-medium text-rose-400">
                        {fieldErrors.confirmPassword}
                      </p>}
                  </div>}

                {formError && <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3.5 py-3">
                    <p className="text-[13px] font-medium leading-relaxed text-rose-200">{formError}</p>
                  </div>}
                {formError && formError.toLowerCase().includes("verify your email") && <div className="flex gap-2">
                    <button type="button" onClick={async () => {
                        setLoading(true);
                        const r = await refreshVerification();
                        setLoading(false);
                        if (r?.ok) navigate(redirectTo, { replace: true });
                        else setFormError("Still unverified — check your inbox and try again.");
                      }} className="flex-1 rounded-lg bg-brand-700 px-3 py-2 text-[13px] font-semibold text-white hover:bg-brand-600">
                      I've verified — refresh status
                    </button>
                    <button type="button" onClick={async () => {
                        const r = await resendVerification();
                        setFormError(r?.ok ? "Verification email resent — check your inbox." : (r?.error || "Could not resend."));
                      }} className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-[13px] font-semibold text-slate-300 hover:bg-white/5">
                      Resend email
                    </button>
                  </div>}

                {notice && <div role="status" className="flex items-start gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <p className="text-[13px] font-medium leading-relaxed text-emerald-200">{notice}</p>
                  </div>}

                <Button
    type="submit"
    variant="primary"
    size="lg"
    loading={loading}
    disabled={busy}
    className="w-full rounded-xl text-[15px] font-semibold shadow-glow-brand"
  >
                  {loading ? "Please wait\u2026" : mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
                  {!loading && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                </Button>

                {mode === "forgot-password" && <button
    type="button"
    onClick={() => switchMode("login")}
    className="w-full text-center text-[13px] font-semibold text-slate-400 hover:text-white"
  >
                    Back to sign in
                  </button>}
              </form>)}

              {mode !== "forgot-password" && mode !== "owner" && mode !== "member" && <>
                  <div className="my-6 flex items-center gap-3">
                    <span className="h-px flex-1 bg-white/10" />
                    <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">or</span>
                    <span className="h-px flex-1 bg-white/10" />
                  </div>

                  <Button
    type="button"
    variant="outline"
    size="lg"
    disabled={busy}
    onClick={handleGoogle}
    className="w-full rounded-xl border-white/10 bg-white/5 text-[15px] font-semibold text-white hover:bg-white/10"
  >
                    {googleLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" aria-hidden="true" /> : <GoogleMark />}
                    Continue with Google
                  </Button>
                </>}
            </div>

            <div className="border-t border-white/5 bg-slate-950/50 px-6 py-4 sm:px-8">
              <p className="text-[11px] leading-relaxed text-slate-500">
                {mode === "signup" ? "By creating an account you agree to use this portal only for the gym that granted you access." : "Trouble signing in? Ask your gym administrator to confirm your account is active."}
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>;
};
const OwnerRegister = ({ step, setStep, form, setForm, error, setError, done, setDone, authenticated, onExit }) => {
  const { signUp, login } = useAuth();
  const [busy, setBusy] = useState(false);
  const [account, setAccount] = useState({ email: "", password: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const validateKey = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await api("/api/owner/validate-key", { method: "POST", body: { key: form.key.trim() } });
      setStep(authenticated ? "details" : "account");
    } catch (err) {
      setError(err.message || "Invalid activation key.");
    } finally { setBusy(false); }
  };
  const createAccount = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const created = await signUp(account.email.trim(), account.password);
      if (!created.ok) {
        const existing = await login(account.email.trim(), account.password);
        if (!existing.ok) {
          setError(created.error || existing.error || "Could not create or sign in to that account.");
          return;
        }
      }
      setStep("details");
    } catch (err) {
      setError(err.message || "Could not create the owner account.");
    } finally { setBusy(false); }
  };
  const register = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await api("/api/owner/register", {
        method: "POST",
        body: {
          key: form.key.trim(),
          org_name: form.org_name.trim(),
          branch_name: form.branch_name.trim() || form.gym_name.trim(),
          gym_name: form.gym_name.trim(),
          address: form.address.trim(),
          phone: form.phone.trim()
        }
      });
      setDone(true);
      setTimeout(() => window.location.assign("/#/"), 1200);
    } catch (err) {
      setError(err.message || "Registration failed.");
    } finally { setBusy(false); }
  };
  if (done) {
    return <div className="rounded-xl bg-emerald-500/10 p-4 text-center text-emerald-300 ring-1 ring-emerald-500/30">
      Gym created — taking you to your dashboard…
    </div>;
  }
  if (step === "key") {
    return <form onSubmit={validateKey} className="space-y-4">
      <div className="space-y-1.5">
        <label className="label-caps">Owner activation key</label>
        <input value={form.key} onChange={(e) => set("key", e.target.value)} required
          placeholder="gympro_own_…" className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white" />
      </div>
      {error && <p className="text-[12px] font-medium text-rose-400">{error}</p>}
      <Button type="submit" disabled={busy || !form.key.trim()} className="w-full">{busy ? "Validating…" : "Continue"}</Button>
      <button type="button" onClick={onExit} className="w-full text-center text-[12px] text-slate-400 hover:text-slate-200">Back to sign in</button>
    </form>;
  }
  if (step === "account") {
    return <form onSubmit={createAccount} className="space-y-4">
      <p className="text-[13px] text-slate-400">Create the owner account that will run this gym. Use an email you can verify.</p>
      <div className="space-y-1.5">
        <label className="label-caps">Owner email</label>
        <input type="email" required value={account.email} onChange={(e) => setAccount((a) => ({ ...a, email: e.target.value }))}
          className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white" />
      </div>
      <div className="space-y-1.5">
        <label className="label-caps">Password</label>
        <input type="password" required minLength={6} value={account.password} onChange={(e) => setAccount((a) => ({ ...a, password: e.target.value }))}
          className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white" />
      </div>
      {error && <p className="text-[12px] font-medium text-rose-400">{error}</p>}
      <Button type="submit" disabled={busy} className="w-full">{busy ? "Creating account…" : "Continue"}</Button>
      <button type="button" onClick={onExit} className="w-full text-center text-[12px] text-slate-400 hover:text-slate-200">Cancel</button>
    </form>;
  }
  return <form onSubmit={register} className="space-y-4">
    <p className="text-[12px] text-emerald-300">✓ Activation key accepted</p>
    {[["org_name", "Gym / organization name"], ["branch_name", "First branch name"], ["gym_name", "Display name (optional)"], ["address", "Address (optional)"], ["phone", "Phone (optional)"]].map(([k, label]) => (
      <div key={k} className="space-y-1.5">
        <label className="label-caps">{label}</label>
        <input value={form[k]} onChange={(e) => set(k, e.target.value)} required={k === "org_name" || k === "branch_name"}
          className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white" />
      </div>
    ))}
    {error && <p className="text-[12px] font-medium text-rose-400">{error}</p>}
    <Button type="submit" disabled={busy} className="w-full">{busy ? "Creating…" : "Create gym"}</Button>
    <button type="button" onClick={onExit} className="w-full text-center text-[12px] text-slate-400 hover:text-slate-200">Cancel</button>
  </form>;
};

const MemberRedeem = ({ token, setToken, busy, setBusy, error, setError, done, setDone, authenticated, onExit }) => {
  const redeem = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await api("/api/member-invitations/redeem", { method: "POST", body: { token: token.trim() } });
      setDone(true);
      setTimeout(() => window.location.assign("/#/"), 1200);
    } catch (err) {
      setError(err.message || "Could not redeem invitation.");
    } finally { setBusy(false); }
  };
  if (done) {
    return <div className="rounded-xl bg-emerald-500/10 p-4 text-center text-emerald-300 ring-1 ring-emerald-500/30">
      Joined — taking you to your member portal…
    </div>;
  }
  return <form onSubmit={redeem} className="space-y-4">
    {!authenticated && <p className="rounded-lg bg-amber-500/10 p-3 text-[12px] text-amber-300 ring-1 ring-amber-500/30">
      Sign in or create an account first, then return here with your invitation token.
    </p>}
    <div className="space-y-1.5">
      <label className="label-caps">Gym invitation token</label>
      <input value={token} onChange={(e) => setToken(e.target.value)} required
        placeholder="gympro_mem_…" disabled={!authenticated}
        className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white disabled:opacity-50" />
    </div>
    {error && <p className="text-[12px] font-medium text-rose-400">{error}</p>}
    <Button type="submit" disabled={busy || !authenticated || !token.trim()} className="w-full">
      {busy ? "Joining…" : "Join gym"}
    </Button>
    <button type="button" onClick={onExit} className="w-full text-center text-[12px] text-slate-400 hover:text-slate-200">Back to sign in</button>
  </form>;
};

var Login_default = Login;
export {
  Login_default as default
};
