
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Zap, ArrowRight, Fingerprint } from 'lucide-react';
import { Button, Card } from '../components';
import { useAuth } from '../contexts/AuthContext';

type AuthMode = 'login' | 'signup' | 'forgot-password';

const Login: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const { login, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'login') {
        const success = await login(formData.email, formData.password);
        if (success) {
          navigate('/');
        } else {
          setError('Login failed. Please check your email and password.');
        }
      } else if (mode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        const success = await signUp(formData.email, formData.password);
        if (success) {
          setMessage('Account created successfully. Please check your email.');
          setMode('login');
        } else {
          setError('Signup failed. Please try again.');
        }
      } else if (mode === 'forgot-password') {
        const success = await resetPassword(formData.email);
        if (success) {
          setMessage('Password reset link sent to your email.');
          setMode('login');
        } else {
          setError('Could not find an account with that email.');
        }
      }
    } catch {
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">

      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#1e1b4b_0%,#020617_100%)] opacity-80" />
        <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-indigo-600/10 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-[1000px] w-full flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10 animate-in fade-in zoom-in-95 duration-700">

        {/* Branding */}
        <div className="lg:w-1/2 text-left space-y-6 hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center shadow-xl">
              <Zap className="h-6 w-6 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">GYMPRO</h1>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Management Portal</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-5xl font-extrabold text-white tracking-tight leading-tight">
              Manage your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500">Gym with ease.</span>
            </h2>
            <p className="text-slate-400 text-base font-medium max-w-sm leading-relaxed">
              Track members, classes, and payments in one place. Simple, modern, and powerful tools for your fitness business.
            </p>
          </div>

          <div className="flex items-center gap-6 pt-6">
            <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 w-10 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center font-bold text-[9px] text-slate-400">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <div>
              <p className="text-white font-bold text-xs tracking-tight">TRUSTED BY 4k+ USERS</p>
            </div>
          </div>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-sm">
          <Card className="p-0 border-0 rounded-[40px] bg-slate-900/40 backdrop-blur-3xl shadow-2xl ring-1 ring-white/5 overflow-hidden relative">
            <div className="p-10 md:p-12 relative z-10">
              <div className="text-center mb-10">
                <div className="h-16 w-16 bg-slate-950 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl ring-1 ring-white/10">
                  <Fingerprint className="h-8 w-8 text-indigo-500" />
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  {mode === 'login' ? 'Login' : mode === 'signup' ? 'Sign Up' : 'Reset Password'}
                </h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">
                  {mode === 'login' ? 'Welcome back' : 'Create your account'}
                </p>
              </div>

              {/* Mode Toggle */}
              {mode !== 'forgot-password' && (
                <div className="flex gap-1.5 p-1 bg-black/40 rounded-2xl mb-8 border border-white/5">
                  <button onClick={() => setMode('login')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${mode === 'login' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>LOGIN</button>
                  <button onClick={() => setMode('signup')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${mode === 'signup' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>SIGNUP</button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <input
                      required
                      type="email"
                      placeholder="name@email.com"
                      className="w-full pl-12 pr-5 py-4 bg-black/20 border-0 ring-1 ring-white/5 rounded-2xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all font-bold placeholder:text-slate-700 text-base"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                </div>

                {mode !== 'forgot-password' && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                      <input
                        required
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-4 bg-black/20 border-0 ring-1 ring-white/5 rounded-2xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all font-bold placeholder:text-slate-700 text-base"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'signup' && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Confirm Password</label>
                    <input
                      required
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-6 py-4 bg-black/20 border-0 ring-1 ring-white/5 rounded-2xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all font-bold placeholder:text-slate-700 text-base"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    />
                  </div>
                )}

                {mode === 'login' && (
                  <div className="flex justify-end pr-1">
                    <button type="button" onClick={() => setMode('forgot-password')} className="text-[9px] font-bold text-slate-500 hover:text-indigo-400 uppercase tracking-widest transition-colors">Forgot Password?</button>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3">
                    <div className="h-1.5 w-1.5 bg-rose-500 rounded-full" />
                    <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">{error}</p>
                  </div>
                )}

                {message && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                    <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
                    <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">{message}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 border-0 rounded-2xl shadow-xl shadow-indigo-600/10 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 group"
                >
                  <span>{loading ? 'PLEASE WAIT...' : mode === 'login' ? 'LOGIN NOW' : mode === 'signup' ? 'SIGN UP NOW' : 'RESET PASSWORD'}</span>
                  {!loading && <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />}
                </Button>

                {mode === 'forgot-password' && (
                  <div className="text-center pt-2">
                    <button type="button" onClick={() => setMode('login')} className="text-[9px] font-bold text-slate-500 hover:text-white uppercase tracking-widest">BACK TO LOGIN</button>
                  </div>
                )}
              </form>
            </div>

            {/* Footer */}
            <div className="p-6 bg-black/40 border-t border-white/5 flex items-center justify-between">
              <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">GYMPRO v1.0</span>
              <div className="flex items-center gap-2">
                <div className="h-1 w-1 bg-emerald-500 rounded-full" />
                <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Secure Connection</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
      {/* Background Floaters */}
      <div className="absolute top-[20%] left-[10%] opacity-20 hidden xl:block animate-bounce" style={{ animationDuration: '6s' }}>
        <div className="h-px w-32 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
      </div>
      <div className="absolute bottom-[20%] right-[10%] opacity-20 hidden xl:block animate-bounce" style={{ animationDuration: '8s' }}>
        <div className="h-px w-32 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
      </div>
    </div>
  );
};

export default Login;
