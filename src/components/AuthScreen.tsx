import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Building,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { AuthUser, UserRole } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (user: AuthUser) => void;
  defaultEmail?: string;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  defaultEmail = '',
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sign In Form State - Clean blank defaults (no demo prefills)
  const [signInEmail, setSignInEmail] = useState(defaultEmail || '');
  const [signInPassword, setSignInPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regOrganization, setRegOrganization] = useState('');
  const [regRole, setRegRole] = useState<'frc' | 'analyst'>('frc');

  // Handle Sign In submission
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!signInEmail.trim()) {
      setError('Please enter your corporate email address.');
      return;
    }
    if (!signInPassword) {
      setError('Please enter your account password.');
      return;
    }

    // Determine persona from email or assign standard role
    const isAnalyst =
      signInEmail.toLowerCase().includes('alex') ||
      signInEmail.toLowerCase().includes('analyst') ||
      signInEmail.toLowerCase().includes('data') ||
      signInEmail.toLowerCase().includes('morgan');

    const detectedPersona: UserRole = isAnalyst ? 'analyst' : 'frc';
    const emailPrefix = signInEmail.split('@')[0] || 'User';
    const formattedName = emailPrefix
      .split(/[._-]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    const user: AuthUser = {
      id: `usr-${Date.now()}`,
      email: signInEmail.trim(),
      name: formattedName || (isAnalyst ? 'Development Lead' : 'Requirements Lead'),
      role: detectedPersona === 'frc' ? 'FRC Owner' : 'Analyst',
      persona: detectedPersona,
      organization: 'Enterprise Regulatory Banking Group',
      lastLogin: new Date().toISOString(),
    };

    onLoginSuccess(user);
  };

  // Handle Register submission with strict password confirmation
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!regName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setError('Please enter a valid corporate email address.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!regConfirmPassword) {
      setError('Please confirm your password.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please verify both passwords match.');
      return;
    }

    const user: AuthUser = {
      id: `usr-${Date.now()}`,
      email: regEmail.trim(),
      name: regName.trim(),
      role: regRole === 'frc' ? 'FRC Owner' : 'Analyst',
      persona: regRole,
      organization: regOrganization.trim() || 'Enterprise Financial Institution',
      lastLogin: new Date().toISOString(),
    };

    onLoginSuccess(user);
  };

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col justify-between text-stone-100 relative overflow-hidden font-sans">
      {/* Background Accent Gradients */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Brand */}
      <header className="border-b border-stone-800 bg-stone-950/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-stone-950 font-black flex items-center justify-center text-xs tracking-wider shadow-sm">
            GOV
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">
              Traceable Waterfall Scoping &amp; Governance
            </h1>
            <p className="text-[11px] text-stone-400">
              Enterprise Regulatory Remediation &amp; Population Retention Platform
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-xs text-stone-400">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-800/80 border border-stone-700 text-[11px] text-stone-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            SOC2 Type II • Audit Vault Active
          </span>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 z-10">
        <div className="max-w-md w-full bg-stone-950/90 border border-stone-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
          
          {/* Top Title & Subtitle */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 border border-stone-700 text-emerald-400 mb-2">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {activeTab === 'signin' ? 'Sign In to Portal' : 'Create Governance Account'}
            </h2>
            <p className="text-xs text-stone-400">
              {activeTab === 'signin'
                ? 'Enter your credentials to access traceable waterfalls & regulatory projects.'
                : 'Register your corporate profile for dual-persona scoping & execution.'}
            </p>
          </div>

          {/* Tab Switcher: Sign In vs Register */}
          <div className="grid grid-cols-2 p-1 bg-stone-900 rounded-xl border border-stone-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setError(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                activeTab === 'signin'
                  ? 'bg-stone-800 text-white shadow-xs font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setError(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                activeTab === 'register'
                  ? 'bg-stone-800 text-white shadow-xs font-bold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Register
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1.5">
                  Corporate Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="name@enterprise.bank"
                    className="w-full bg-stone-900/90 border border-stone-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-stone-300">
                    Password
                  </label>
                  <span className="text-[11px] text-stone-500">Enterprise SSO Ready</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showSignInPassword ? 'text' : 'password'}
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full bg-stone-900/90 border border-stone-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                    title={showSignInPassword ? 'Hide password' : 'Show password'}
                  >
                    {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-stone-700 bg-stone-900 text-emerald-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <span>Remember session</span>
                </label>
                <span className="text-[11px] text-stone-500">Audit-Token: Active</span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-stone-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
              >
                <span>Sign In to Governance Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1.5">
                  Full Name <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full bg-stone-900/90 border border-stone-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1.5">
                  Corporate Email <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@enterprise.bank"
                    className="w-full bg-stone-900/90 border border-stone-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1.5">
                  Password <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full bg-stone-900/90 border border-stone-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                    title={showRegPassword ? 'Hide password' : 'Show password'}
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1.5">
                  Confirm Password <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className={`w-full bg-stone-900/90 border rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-hidden transition-colors ${
                      regConfirmPassword && regPassword !== regConfirmPassword
                        ? 'border-rose-500/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : regConfirmPassword && regPassword === regConfirmPassword
                        ? 'border-emerald-500/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                        : 'border-stone-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {regConfirmPassword && regPassword !== regConfirmPassword && (
                  <p className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Passwords do not match</span>
                  </p>
                )}
                {regConfirmPassword && regPassword === regConfirmPassword && (
                  <p className="text-[11px] text-emerald-400 mt-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Passwords match</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1.5">
                  Primary Operating Persona <span className="text-emerald-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setRegRole('frc')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      regRole === 'frc'
                        ? 'border-emerald-500 bg-emerald-950/30 text-emerald-300 font-bold'
                        : 'border-stone-800 bg-stone-900 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <span className="block font-semibold">Requirements</span>
                    <span className="text-[10px] text-stone-400 font-normal">FRC Policy Owner</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('analyst')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      regRole === 'analyst'
                        ? 'border-blue-500 bg-blue-950/30 text-blue-300 font-bold'
                        : 'border-stone-800 bg-stone-900 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <span className="block font-semibold">Development</span>
                    <span className="text-[10px] text-stone-400 font-normal">Data Analytics Lead</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1.5">
                  Department / Organization
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regOrganization}
                    onChange={(e) => setRegOrganization(e.target.value)}
                    placeholder="e.g. Credit Card Regulatory Remediation"
                    className="w-full bg-stone-900/90 border border-stone-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-stone-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
              >
                <span>Create Account &amp; Access Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>
      </div>

      {/* Footer System Compliance Notice */}
      <footer className="border-t border-stone-800 bg-stone-950/40 px-6 py-3 text-center text-[11px] text-stone-400">
        Traceable Waterfall Scoping &amp; Governance Platform • Meets Federal Reserve &amp; CFPB Audit Lineage Mandates
      </footer>
    </div>
  );
};
