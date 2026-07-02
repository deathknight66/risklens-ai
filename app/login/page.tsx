'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Shield, Lock, AlertTriangle, ArrowRight, Loader2, User, Key, Users } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('admin@risklens.local')
  const [password, setPassword] = useState('password123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e?: React.FormEvent, directEmail?: string, directPassword?: string) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError('')

    const res = await signIn('credentials', {
      redirect: false,
      email: directEmail || email,
      password: directPassword || password
    })

    if (res?.error) {
      setError('Invalid credentials or unauthorized access.')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  const handleQuickLogin = (roleEmail: string) => {
    setEmail(roleEmail)
    setPassword('password123')
    handleLogin(undefined, roleEmail, 'password123')
  }

  return (
    <div className="min-h-screen bg-[#191a1f] flex flex-col items-center justify-center p-4 selection:bg-indigo-500/30">
      
      <div className="w-full max-w-md">
        
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <Shield className="w-8 h-8 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">RiskLens AI</h1>
          </div>
        </div>

        <div className="bg-[#202127] p-8 rounded-[28px] border border-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.2)] relative overflow-hidden">
          
          {/* Header */}
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-white mb-1">Welcome Back</h2>
            <p className="text-sm text-slate-400">Authenticate to access the command center.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs text-center font-bold">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#191a1f] border border-slate-800 text-white rounded-xl p-3 text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-1">Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[#191a1f] border border-slate-800 text-white rounded-xl p-3 text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none pr-10 transition-all"
                  required
                />
                <Lock className="w-4 h-4 text-slate-600 absolute right-4 top-3.5" />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all mt-6 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#202127] px-3 text-slate-500 uppercase tracking-wider font-semibold">Or fast login</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <button 
                type="button"
                onClick={() => handleQuickLogin('admin@risklens.local')}
                className="flex flex-col items-center justify-center gap-2 bg-[#191a1f] hover:bg-indigo-500/10 border border-slate-800 hover:border-indigo-500/30 p-3 rounded-xl transition-all group"
              >
                <Key className="w-4 h-4 text-slate-400 group-hover:text-indigo-400" />
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-300 uppercase tracking-wider">Admin</span>
              </button>

              <button 
                type="button"
                onClick={() => handleQuickLogin('analyst@risklens.local')}
                className="flex flex-col items-center justify-center gap-2 bg-[#191a1f] hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/30 p-3 rounded-xl transition-all group"
              >
                <User className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-300 uppercase tracking-wider">Analyst</span>
              </button>

              <button 
                type="button"
                onClick={() => handleQuickLogin('board@risklens.local')}
                className="flex flex-col items-center justify-center gap-2 bg-[#191a1f] hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/30 p-3 rounded-xl transition-all group"
              >
                <Users className="w-4 h-4 text-slate-400 group-hover:text-amber-400" />
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-amber-300 uppercase tracking-wider">Board</span>
              </button>
            </div>

            <button 
              type="button"
              onClick={() => router.push('/sso')}
              className="w-full mt-4 bg-[#191a1f] hover:bg-slate-800 border border-slate-800 text-slate-300 text-sm font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              Sign in with Enterprise SSO
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}
