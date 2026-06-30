"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Shield, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function InvitePage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  
  const [password, setPassword] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/invitations/verify?token=${token}`);
        const data = await res.json();
        if (res.ok) {
          setEmail(data.email);
          setOrgName(data.orgName);
        } else {
          setError(data.error || "Invalid invitation");
        }
      } catch (err) {
        setError("Failed to verify invitation");
      }
      setLoading(false);
    };
    verifyToken();
  }, [token]);

  const handleAccept = async (e: any) => {
    e.preventDefault();
    setAccepting(true);
    setError("");

    try {
      const res = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Failed to accept invitation");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    }
    setAccepting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0a0e1a] border border-slate-800 rounded-2xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to {orgName}</h2>
            <p className="text-slate-400">Your account is ready. You can now log in to the workspace.</p>
          </div>
          <Link href="/login" className="block w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl px-4 py-3 transition-all duration-200">
            Proceed to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050816] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0a0e1a] border border-slate-800 rounded-2xl p-8 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-indigo-500/10 blur-[50px] pointer-events-none" />

        <div className="relative z-10 space-y-8">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
              <Shield className="w-6 h-6 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Join Workspace</h1>
            {error ? (
              <p className="text-rose-400 text-sm font-medium flex items-center justify-center gap-1">
                <AlertCircle className="w-4 h-4" /> {error}
              </p>
            ) : (
              <p className="text-slate-400 text-sm">
                You have been invited to join <span className="text-indigo-400 font-medium">{orgName}</span>
              </p>
            )}
          </div>

          {!error && (
            <form onSubmit={handleAccept} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  readOnly
                  value={email}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Set Password (or enter existing)</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={accepting || password.length < 6}
                className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium rounded-xl px-4 py-3 transition-all duration-200 mt-2"
              >
                {accepting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Accept Invitation
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {error && (
            <div className="pt-4 text-center">
              <Link href="/login" className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
                Return to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
