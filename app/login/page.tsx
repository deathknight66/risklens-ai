'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Shield, Lock, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('admin@risklens.local')
  const [password, setPassword] = useState('password123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password
    })

    if (res?.error) {
      setError('Invalid credentials or unauthorized access.')
      setLoading(false)
    } else {
      // Middleware will handle smart routing based on role, 
      // but we initially push to /dashboard to trigger it.
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <Shield className="w-10 h-10 text-indigo-500" />
            <h1 className="text-3xl font-black text-white tracking-tight">RiskLens AI</h1>
          </div>
        </div>

        <div className="glass p-8 rounded-2xl border border-slate-700/50 shadow-2xl relative overflow-hidden">
          
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-1">Access Control Portal</h2>
            <p className="text-sm text-slate-400">Please authenticate to continue.</p>
          </div>

          {/* Banner */}
          <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg mb-6 flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200">
              <strong className="block mb-1 text-amber-400">Action Required</strong>
              You are using a default password. Please change it immediately after login.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs text-center font-bold">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none pr-10"
                  required
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>Authenticate <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#111827] px-2 text-slate-500">OR</span>
              </div>
            </div>
            
            <button 
              type="button"
              onClick={() => router.push('/sso')}
              className="w-full mt-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              Sign in with SSO
            </button>
          </div>

        </div>
        
        {/* Helper text for demo purposes */}
        <div className="mt-8 text-center text-xs text-slate-500 space-y-1">
          <p>Demo Accounts (pw: password123):</p>
          <p>admin@risklens.local | analyst@risklens.local | board@risklens.local</p>
        </div>

      </div>
    </div>
  )
}
