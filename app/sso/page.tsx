"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Key } from "lucide-react";
import Link from "next/link";

export default function SSOPage() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSSO = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Typically, you would call a backend endpoint to resolve the IdP from the email domain or slug
      // e.g. GET /api/sso/discover?identifier=...
      const res = await fetch(`/api/sso/discover?identifier=${encodeURIComponent(identifier)}`);
      
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to locate IdP for this identifier.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      // Redirect to the simulated IdP login
      window.location.href = data.redirectUrl;
      
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-500/10 rounded-2xl mb-6 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
            <Shield className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Single Sign-On</h1>
          <p className="text-slate-400">Sign in with your enterprise identity provider</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
          <form onSubmit={handleSSO} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Work Email or Organization Slug</label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                placeholder="you@company.com"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg px-4 py-3 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  Continue with SSO
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">
              Return to standard login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
