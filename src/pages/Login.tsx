import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, Mail, Lock } from 'lucide-react';
import { Button, Card, Form, FormField } from '../components';
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
          setError('Invalid email or password');
        }
      } else if (mode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        const success = await signUp(formData.email, formData.password);
        if (success) {
          setMessage('Check your email to confirm your account!');
          setMode('login');
        } else {
          setError('Failed to create account. Try again.');
        }
      } else if (mode === 'forgot-password') {
        const success = await resetPassword(formData.email);
        if (success) {
          setMessage('Check your email for password reset instructions.');
          setMode('login');
        } else {
          setError('Failed to send reset email.');
        }
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };



  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-md w-full space-y-8 z-10">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 transform hover:scale-105 transition-all duration-300">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-4xl font-extrabold text-white tracking-tight">
            GymPro
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {mode === 'login' && 'Management System Login'}
            {mode === 'signup' && 'Create New Account'}
            {mode === 'forgot-password' && 'Reset Your Password'}
          </p>
        </div>

        {/* Login Form */}
        <Card className="p-8 bg-slate-800 border-slate-700 shadow-xl backdrop-blur-sm">
          {/* Tabs */}
          {mode !== 'forgot-password' && (
            <div className="flex mb-6 bg-slate-900/50 p-1 rounded-lg">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'login'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'signup'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-white'
                  }`}
              >
                Sign Up
              </button>
            </div>
          )}

          <Form onSubmit={handleSubmit}>
            <div className="mb-4 relative">
              <div className="absolute inset-y-0 left-0 pl-0 pt-9 flex items-center pointer-events-none z-10">
                {/* Icon removed from FormField prop, implementing simpler structure or verify FormField usage */}
              </div>
              <FormField
                label="Email"
                name="email"
                value={formData.email}
                onChange={(value) => handleInputChange('email', value as string)}
                placeholder="admin@example.com"
                required
                className="text-white placeholder-slate-500 bg-slate-900 border-slate-700 focus:border-blue-500 pl-3"
              // Removed invalid 'icon' prop
              />
              <div className="absolute top-9 right-3 pointer-events-none">
                <Mail className="h-5 w-5 text-slate-500" />
              </div>
            </div>


            {mode !== 'forgot-password' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500 transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-500 hover:text-slate-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-500 hover:text-slate-300" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-500 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex justify-end mb-6">
                <button
                  type="button"
                  onClick={() => setMode('forgot-password')}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center">
                <div className="h-2 w-2 bg-red-500 rounded-full mr-2"></div>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {message && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                <p className="text-sm text-green-400">{message}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 shadow-lg shadow-blue-600/20"
            >
              {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
            </Button>

            {mode === 'forgot-password' && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Back to Login
                </button>
              </div>
            )}
          </Form>


        </Card>


      </div>
    </div>
  );
};

export default Login;
