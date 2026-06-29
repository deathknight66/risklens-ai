'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Shield,
  Brain,
  Search,
  BarChart3,
  FileText,
  ArrowRight,
  Check,
  Zap,
  Lock,
  Globe,
  Server,
  Cloud,
  Database,
  Bell,
  TrendingDown,
  ChevronRight,
  Menu,
  X,
  Cpu,
  AlertTriangle,
  Activity,
  Users,
  Phone,
  Mail,
  MapPin,
  Play,
  Star,
} from 'lucide-react';

/* ─── Intersection Observer Hook ─── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          obs.unobserve(el);
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

/* ─── Section Wrapper ─── */
function Section({
  id,
  children,
  className = '',
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, isVisible } = useInView(0.1);
  return (
    <section
      id={id}
      ref={ref}
      className={`transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </section>
  );
}

/* ═══════════════════════════════════════════════
   1. NAVBAR
   ═══════════════════════════════════════════════ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Roadmap', href: '#roadmap' },
  ];

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0a0e1a]/90 backdrop-blur-xl border-b border-slate-700/50 shadow-lg shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Shield className="w-8 h-8 text-cyan-400 transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute inset-0 bg-cyan-400/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Risk<span className="gradient-text">Lens</span>{' '}
              <span className="text-slate-400 font-light">AI</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-slate-300 hover:text-cyan-400 transition-colors duration-200 relative group"
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          {/* Desktop Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm text-slate-300 hover:text-white border border-slate-600 hover:border-cyan-500/50 rounded-lg transition-all duration-200"
            >
              Login
            </Link>
            <Link
              href="/dashboard"
              className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-200 hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            className="lg:hidden p-2 text-slate-300 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden glass-strong animate-slide-down">
          <div className="px-4 py-4 space-y-3">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-slate-300 hover:text-cyan-400 transition-colors"
              >
                {l.label}
              </a>
            ))}
            <div className="pt-3 border-t border-slate-700 flex gap-3">
              <Link
                href="/dashboard"
                className="flex-1 text-center py-2 text-sm border border-slate-600 rounded-lg text-slate-300"
              >
                Login
              </Link>
              <Link
                href="/dashboard"
                className="flex-1 text-center py-2 text-sm bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ═══════════════════════════════════════════════
   2. HERO SECTION
   ═══════════════════════════════════════════════ */
function HeroSection() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated grid background */}
      <div className="absolute inset-0 grid-bg" />
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(6,182,212,0.12),transparent)]" />
      {/* Bottom fade */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#050816] to-transparent" />
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium text-cyan-400 mb-8 transition-all duration-700 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          AI-Powered Cybersecurity Platform
          <ChevronRight className="w-3.5 h-3.5" />
        </div>

        {/* Main Heading */}
        <h1
          className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight mb-6 transition-all duration-700 delay-100 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          From Cyber Threats to
          <br />
          <span className="gradient-text">Business Impact</span>
        </h1>

        {/* Subtitle */}
        <p
          className={`max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed mb-10 transition-all duration-700 delay-200 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          AI-powered platform that helps companies detect cyber threats, analyze business
          impact, and generate mitigation recommendations automatically.
        </p>

        {/* CTA Buttons */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 transition-all duration-700 delay-300 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <Link
            href="/dashboard"
            className="group px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-cyan-500/25 transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2"
          >
            Start Free Trial
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <button className="group px-8 py-3.5 border border-slate-600 hover:border-cyan-500/50 text-slate-300 hover:text-white font-semibold rounded-xl transition-all duration-300 flex items-center gap-2">
            <Play className="w-4 h-4" />
            Watch Demo
          </button>
        </div>

        {/* Mock Dashboard Preview */}
        <div
          className={`max-w-4xl mx-auto transition-all duration-1000 delay-500 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <div className="glass rounded-2xl p-1 glow-cyan">
            <div className="bg-[#0a0e1a] rounded-xl p-4 sm:p-6">
              {/* Dashboard Top Bar */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="text-xs text-slate-500 font-mono">RiskLens AI Dashboard</div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] text-green-400 font-mono">LIVE</span>
                </div>
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Threats Blocked', value: '1,247', color: 'text-cyan-400', change: '+12%' },
                  { label: 'Risk Score', value: '23/100', color: 'text-green-400', change: 'Low' },
                  { label: 'Active Alerts', value: '7', color: 'text-amber-400', change: '-3' },
                  { label: 'Uptime', value: '99.97%', color: 'text-teal-400', change: 'Stable' },
                ].map((m) => (
                  <div key={m.label} className="bg-navy-800/50 rounded-lg p-3 border border-slate-700/30">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">{m.label}</div>
                    <div className={`text-lg sm:text-xl font-bold ${m.color} font-mono`}>{m.value}</div>
                    <div className="text-[10px] text-slate-500">{m.change}</div>
                  </div>
                ))}
              </div>

              {/* Fake Chart */}
              <div className="bg-navy-800/30 rounded-lg p-4 border border-slate-700/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-400">Threat Activity — Last 24h</span>
                  <span className="text-[10px] text-cyan-400 font-mono">REAL-TIME</span>
                </div>
                <div className="flex items-end gap-1 h-20">
                  {[35, 28, 45, 62, 38, 55, 72, 48, 60, 42, 50, 65, 58, 40, 52, 70, 45, 55, 38, 62, 48, 35, 55, 42].map(
                    (h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t transition-all duration-500"
                        style={{
                          height: `${h}%`,
                          background: `linear-gradient(to top, rgba(6,182,212,0.6), rgba(20,184,166,0.3))`,
                          animationDelay: `${i * 50}ms`,
                        }}
                      />
                    )
                  )}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[9px] text-slate-600">00:00</span>
                  <span className="text-[9px] text-slate-600">06:00</span>
                  <span className="text-[9px] text-slate-600">12:00</span>
                  <span className="text-[9px] text-slate-600">18:00</span>
                  <span className="text-[9px] text-slate-600">Now</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mt-16 transition-all duration-700 delay-700 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          {[
            { value: '1,200+', label: 'Threats Blocked' },
            { value: '99.9%', label: 'Uptime' },
            { value: '< 5 min', label: 'Response Time' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold gradient-text">{s.value}</div>
              <div className="text-sm text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   3. PROBLEM SECTION
   ═══════════════════════════════════════════════ */
function ProblemSection() {
  const challenges = [
    {
      icon: Shield,
      title: 'Increasing Cyber Threats',
      stat: '+300%',
      statLabel: 'attack increase yearly',
      description:
        'Cyber attacks are growing exponentially, with new threat vectors emerging daily that traditional tools cannot keep up with.',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
    },
    {
      icon: Bell,
      title: 'Alert Overload',
      stat: '10,000+',
      statLabel: 'alerts daily',
      description:
        'Security teams are drowning in alerts, with the vast majority being false positives that waste critical time and resources.',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    {
      icon: TrendingDown,
      title: 'Business Impact Gap',
      stat: '67%',
      statLabel: "of executives can't quantify risk",
      description:
        'Security teams struggle to translate technical threats into business language that executives and boards can understand and act upon.',
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
    },
  ];

  const consequences = [
    'Delayed incident response due to alert fatigue',
    'Inability to prioritize threats based on business impact',
    'Communication gap between security teams and executives',
    'Wasted resources on low-priority threats',
    'Compliance failures from missed critical alerts',
  ];

  return (
    <Section id="problem" className="py-24 lg:py-32 bg-[#0a0e1a]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 rounded-full text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 mb-4">
            The Problem
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            The <span className="gradient-text-warm">Challenge</span>
          </h2>
          <p className="max-w-2xl mx-auto text-slate-400">
            Modern enterprises face unprecedented cybersecurity challenges that traditional approaches can&apos;t solve.
          </p>
        </div>

        {/* Challenge Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {challenges.map((c, i) => (
            <div
              key={c.title}
              className={`card-hover glass rounded-2xl p-6 lg:p-8 border ${c.border}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`inline-flex p-3 rounded-xl ${c.bg} mb-4`}>
                <c.icon className={`w-6 h-6 ${c.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{c.title}</h3>
              <div className="mb-3">
                <span className={`text-3xl font-bold ${c.color}`}>{c.stat}</span>
                <span className="text-sm text-slate-400 ml-2">{c.statLabel}</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{c.description}</p>
            </div>
          ))}
        </div>

        {/* Consequences */}
        <div className="glass rounded-2xl p-6 lg:p-8 max-w-3xl mx-auto">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            The Consequences
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {consequences.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <span className="text-sm text-slate-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════
   4. SOLUTION SECTION
   ═══════════════════════════════════════════════ */
function SolutionSection() {
  const features = [
    'Analyzes security logs automatically',
    'Identifies threats and attack patterns',
    'Measures business and financial impact',
    'Provides AI-based mitigation recommendations',
    'Generates instant incident reports',
  ];

  return (
    <Section id="solution" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 rounded-full text-xs font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 mb-4">
            The Solution
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Our <span className="gradient-text">Solution</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Description */}
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6 leading-tight">
              AI that bridges the gap between{' '}
              <span className="gradient-text">security data</span> and{' '}
              <span className="gradient-text">business decisions</span>
            </h3>
            <p className="text-slate-400 leading-relaxed mb-6">
              RiskLens AI uses advanced artificial intelligence to automatically analyze your
              security logs, detect threats in real-time, and translate technical findings
              into clear business impact assessments. No more manual log reviews, no more
              guessing about risk — just actionable intelligence delivered instantly.
            </p>
            <p className="text-slate-400 leading-relaxed">
              Our platform understands context. It knows the difference between a routine
              scan and a coordinated attack, and it quantifies the potential business impact
              so you can make informed decisions fast.
            </p>
          </div>

          {/* Right: Features */}
          <div className="space-y-4">
            {features.map((feat, i) => (
              <div
                key={feat}
                className="card-hover glass rounded-xl p-4 flex items-center gap-4 group"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm sm:text-base text-slate-200 font-medium">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════
   5. FEATURES GRID
   ═══════════════════════════════════════════════ */
function FeaturesSection() {
  const features = [
    {
      icon: Shield,
      title: 'AI Threat Detection',
      accent: 'cyan',
      accentColor: 'text-cyan-400',
      accentBg: 'bg-cyan-500/10',
      accentBorder: 'hover:border-cyan-500/30',
      description:
        'Real-time threat detection powered by machine learning that identifies and classifies attacks automatically.',
      bullets: ['Brute Force Detection', 'DDoS Attack Recognition', 'SQL Injection Analysis', 'Malware Pattern Detection'],
    },
    {
      icon: Search,
      title: 'AI Investigation',
      accent: 'teal',
      accentColor: 'text-teal-400',
      accentBg: 'bg-teal-500/10',
      accentBorder: 'hover:border-teal-500/30',
      description:
        'Automated investigation engine that traces attack origins, timelines, and assigns risk scores.',
      bullets: ['Root Cause Analysis', 'Attack Timeline Reconstruction', 'Risk Scoring & Prioritization'],
    },
    {
      icon: BarChart3,
      title: 'Business Impact Analysis',
      accent: 'orange',
      accentColor: 'text-orange-400',
      accentBg: 'bg-orange-500/10',
      accentBorder: 'hover:border-orange-500/30',
      description:
        'Translates technical threats into business metrics — financial loss estimation, operational impact, and priority rankings.',
      bullets: ['Financial Loss Estimation', 'Operational Impact Assessment', 'Mitigation Priority Ranking'],
    },
    {
      icon: FileText,
      title: 'Executive Reporting',
      accent: 'purple',
      accentColor: 'text-purple-400',
      accentBg: 'bg-purple-500/10',
      accentBorder: 'hover:border-purple-500/30',
      description:
        'Auto-generated reports in executive-friendly language with compliance mapping and actionable recommendations.',
      bullets: ['Incident Report Generation', 'Compliance Report Mapping', 'Executive Dashboard Views'],
    },
  ];

  return (
    <Section id="features" className="py-24 lg:py-32 bg-[#0a0e1a]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 rounded-full text-xs font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 mb-4">
            Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Powerful <span className="gradient-text">Features</span>
          </h2>
          <p className="max-w-2xl mx-auto text-slate-400">
            Four integrated AI modules working together to protect your business from every angle.
          </p>
        </div>

        {/* 2×2 Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`card-hover glass rounded-2xl p-6 lg:p-8 border border-slate-700/30 ${f.accentBorder} transition-all duration-300`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`shrink-0 p-3 rounded-xl ${f.accentBg}`}>
                  <f.icon className={`w-6 h-6 ${f.accentColor}`} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{f.title}</h3>
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">{f.description}</p>
                </div>
              </div>
              <div className="ml-0 mt-4 space-y-2">
                {f.bullets.map((b) => (
                  <div key={b} className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${f.accentColor.replace('text-', 'bg-')}`} />
                    <span className="text-sm text-slate-300">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════
   6. HOW IT WORKS
   ═══════════════════════════════════════════════ */
function HowItWorksSection() {
  return (
    <Section id="how-it-works" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 rounded-full text-xs font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 mb-4">
            Process
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="max-w-2xl mx-auto text-slate-400">
            From raw security data to executive-ready insights in three seamless steps.
          </p>
        </div>

        {/* Pipeline */}
        <div className="grid lg:grid-cols-[1fr,auto,1fr,auto,1fr] gap-6 lg:gap-4 items-stretch">
          {/* Step 1: Data Sources */}
          <div className="glass rounded-2xl p-6 lg:p-8 border border-slate-700/30 card-hover">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 font-bold text-sm mb-3">
                01
              </div>
              <h3 className="text-lg font-semibold text-white">Data Sources</h3>
              <p className="text-sm text-slate-400 mt-1">Connect your security infrastructure</p>
            </div>
            <div className="space-y-3">
              {[
                { icon: Server, label: 'Servers & Endpoints', desc: 'System logs, auth events' },
                { icon: Shield, label: 'Firewalls & IDS', desc: 'Network traffic, rules' },
                { icon: Cloud, label: 'Cloud Services', desc: 'AWS, Azure, GCP logs' },
                { icon: Database, label: 'Databases', desc: 'Access logs, queries' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-navy-800/30 border border-slate-700/20">
                  <item.icon className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-sm text-white font-medium">{item.label}</div>
                    <div className="text-[11px] text-slate-500">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Arrow 1 */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-0.5 bg-gradient-to-r from-cyan-500/60 to-teal-500/60 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[6px] border-l-teal-500/60 border-y-[4px] border-y-transparent" />
              </div>
              <span className="text-[10px] text-slate-500 font-mono">INGEST</span>
            </div>
          </div>
          {/* Mobile Arrow */}
          <div className="lg:hidden flex justify-center">
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-8 bg-gradient-to-b from-cyan-500/60 to-teal-500/60" />
              <div className="w-0 h-0 border-t-[6px] border-t-teal-500/60 border-x-[4px] border-x-transparent" />
            </div>
          </div>

          {/* Step 2: AI Engine */}
          <div className="glass rounded-2xl p-6 lg:p-8 border border-cyan-500/20 glow-cyan card-hover relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-teal-500/5" />
            <div className="relative">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-white font-bold text-sm mb-3">
                  02
                </div>
                <h3 className="text-lg font-semibold text-white flex items-center justify-center gap-2">
                  <Brain className="w-5 h-5 text-cyan-400" />
                  RiskLens AI Engine
                </h3>
                <p className="text-sm text-slate-400 mt-1">Intelligent processing & analysis</p>
              </div>
              <div className="space-y-3">
                {[
                  { icon: Shield, label: 'Threat Detection', desc: 'ML-powered pattern recognition' },
                  { icon: Search, label: 'AI Investigation', desc: 'Automated root cause analysis' },
                  { icon: BarChart3, label: 'Impact Modeling', desc: 'Business risk quantification' },
                  { icon: Cpu, label: 'Recommendation Engine', desc: 'AI-generated mitigations' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-navy-800/40 border border-cyan-500/10">
                    <item.icon className="w-5 h-5 text-cyan-400 shrink-0" />
                    <div>
                      <div className="text-sm text-white font-medium">{item.label}</div>
                      <div className="text-[11px] text-slate-500">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Arrow 2 */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-0.5 bg-gradient-to-r from-teal-500/60 to-cyan-500/60 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[6px] border-l-cyan-500/60 border-y-[4px] border-y-transparent" />
              </div>
              <span className="text-[10px] text-slate-500 font-mono">OUTPUT</span>
            </div>
          </div>
          {/* Mobile Arrow */}
          <div className="lg:hidden flex justify-center">
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-8 bg-gradient-to-b from-teal-500/60 to-cyan-500/60" />
              <div className="w-0 h-0 border-t-[6px] border-t-cyan-500/60 border-x-[4px] border-x-transparent" />
            </div>
          </div>

          {/* Step 3: Output */}
          <div className="glass rounded-2xl p-6 lg:p-8 border border-slate-700/30 card-hover">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-teal-500/10 text-teal-400 font-bold text-sm mb-3">
                03
              </div>
              <h3 className="text-lg font-semibold text-white">Actionable Output</h3>
              <p className="text-sm text-slate-400 mt-1">Clear results for every stakeholder</p>
            </div>
            <div className="space-y-3">
              {[
                { icon: AlertTriangle, label: 'Threat Alerts', desc: 'Prioritized, contextual alerts', color: 'text-red-400' },
                { icon: FileText, label: 'Incident Reports', desc: 'Auto-generated documentation', color: 'text-blue-400' },
                { icon: Activity, label: 'Risk Scores', desc: 'Quantified business risk', color: 'text-amber-400' },
                { icon: Check, label: 'Mitigations', desc: 'Step-by-step action plans', color: 'text-green-400' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-navy-800/30 border border-slate-700/20">
                  <item.icon className={`w-5 h-5 ${item.color} shrink-0`} />
                  <div>
                    <div className="text-sm text-white font-medium">{item.label}</div>
                    <div className="text-[11px] text-slate-500">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════
   7. PRICING SECTION
   ═══════════════════════════════════════════════ */
function PricingSection() {
  const plans = [
    {
      name: 'Freemium',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started with basic threat monitoring.',
      features: [
        '1 system integration',
        'Limited alert monitoring',
        'Basic threat reporting',
        'Community support',
        '7-day log retention',
      ],
      cta: 'Get Started Free',
      ctaStyle: 'border border-slate-600 hover:border-cyan-500/50 text-slate-300 hover:text-white',
      popular: false,
    },
    {
      name: 'Professional',
      price: '$99',
      period: '/month',
      description: 'For growing teams that need AI-powered threat analysis.',
      features: [
        'Up to 5 system integrations',
        'AI threat analysis & detection',
        'Full dashboard access',
        'Business impact reports',
        '30-day log retention',
        'Email & chat support',
      ],
      cta: 'Start Trial',
      ctaStyle: 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:shadow-lg hover:shadow-cyan-500/25',
      popular: true,
    },
    {
      name: 'Business',
      price: '$499',
      period: '/month',
      description: 'For enterprises requiring comprehensive security intelligence.',
      features: [
        'Unlimited integrations',
        'Advanced AI investigation',
        'Executive reporting suite',
        'Team collaboration tools',
        '90-day log retention',
        'Priority support & SLA',
      ],
      cta: 'Contact Sales',
      ctaStyle: 'border border-slate-600 hover:border-teal-500/50 text-slate-300 hover:text-white',
      popular: false,
    },
  ];

  return (
    <Section id="pricing" className="py-24 lg:py-32 bg-[#0a0e1a]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 rounded-full text-xs font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 mb-4">
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Simple <span className="gradient-text">Pricing</span>
          </h2>
          <p className="max-w-2xl mx-auto text-slate-400">
            Start free and scale as your security needs grow. No hidden fees.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              className={`relative glass rounded-2xl p-6 lg:p-8 card-hover ${
                plan.popular
                  ? 'border-2 border-cyan-500/40 glow-cyan'
                  : 'border border-slate-700/30'
              }`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" /> Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-slate-400 mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-sm text-slate-400">{plan.period}</span>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {plan.features.map((feat) => (
                  <div key={feat} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-sm text-slate-300">{feat}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/dashboard"
                className={`block w-full text-center py-3 rounded-xl font-medium text-sm transition-all duration-300 hover:-translate-y-0.5 ${plan.ctaStyle}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Enterprise Card */}
        <div className="glass rounded-2xl p-6 lg:p-8 border border-slate-700/30 card-hover">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 p-3 rounded-xl bg-purple-500/10">
                <Globe className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">Enterprise</h3>
                <p className="text-sm text-slate-400 max-w-xl">
                  Custom pricing for large organizations requiring on-premise deployment, private AI models,
                  and dedicated support. Designed for maximum security and compliance.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 lg:gap-6">
              {['On-Premise Deploy', 'Private AI Model', 'Dedicated Support', 'Custom SLA'].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-slate-300 whitespace-nowrap">{f}</span>
                </div>
              ))}
            </div>
            <button className="shrink-0 px-6 py-3 border border-purple-500/30 hover:border-purple-500/60 text-purple-300 hover:text-white rounded-xl font-medium text-sm transition-all duration-300 hover:-translate-y-0.5 whitespace-nowrap">
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════
   8. ROADMAP SECTION
   ═══════════════════════════════════════════════ */
function RoadmapSection() {
  const milestones = [
    {
      year: '2026',
      title: 'MVP Launch',
      status: 'In Progress',
      statusColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      dotColor: 'bg-cyan-400',
      items: [
        { label: 'Log Analysis Engine', done: true },
        { label: 'AI Threat Detection', done: true },
        { label: 'Basic AI Reporting', done: false },
        { label: 'Dashboard v1', done: false },
      ],
    },
    {
      year: '2027',
      title: 'Growth Phase',
      status: 'Planned',
      statusColor: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
      dotColor: 'bg-teal-400',
      items: [
        { label: 'Multi-Cloud Integration', done: false },
        { label: 'Compliance Module', done: false },
        { label: 'Predictive Analysis', done: false },
        { label: 'API Marketplace', done: false },
      ],
    },
    {
      year: '2028',
      title: 'Enterprise Expansion',
      status: 'Vision',
      statusColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      dotColor: 'bg-purple-400',
      items: [
        { label: 'Digital Twin Security', done: false },
        { label: 'Attack Simulation', done: false },
        { label: 'International Expansion', done: false },
        { label: 'Industry-Specific Models', done: false },
      ],
    },
  ];

  return (
    <Section id="roadmap" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 rounded-full text-xs font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 mb-4">
            Vision
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Our <span className="gradient-text">Roadmap</span>
          </h2>
          <p className="max-w-2xl mx-auto text-slate-400">
            Our journey from MVP to enterprise-grade cybersecurity platform.
          </p>
        </div>

        {/* Vertical Timeline */}
        <div className="relative max-w-3xl mx-auto">
          {/* Vertical line */}
          <div className="absolute left-4 lg:left-1/2 lg:-translate-x-px top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500/40 via-teal-500/40 to-purple-500/40" />

          <div className="space-y-12">
            {milestones.map((m, idx) => (
              <div key={m.year} className={`relative flex items-start gap-8 ${idx % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                {/* Timeline dot */}
                <div className="absolute left-4 lg:left-1/2 -translate-x-1/2 z-10">
                  <div className={`w-4 h-4 rounded-full ${m.dotColor} ring-4 ring-[#050816]`} />
                </div>

                {/* Spacer on desktop */}
                <div className="hidden lg:block lg:w-1/2" />

                {/* Card */}
                <div className="ml-12 lg:ml-0 lg:w-1/2 glass rounded-2xl p-6 border border-slate-700/30 card-hover">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl font-bold gradient-text">{m.year}</span>
                    <span className={`px-3 py-0.5 rounded-full text-[11px] font-medium border ${m.statusColor}`}>
                      {m.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-4">{m.title}</h3>
                  <div className="space-y-2.5">
                    {m.items.map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        {item.done ? (
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-600 shrink-0" />
                        )}
                        <span className={`text-sm ${item.done ? 'text-slate-200' : 'text-slate-400'}`}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════
   9. CTA SECTION
   ═══════════════════════════════════════════════ */
function CtaSection() {
  return (
    <Section className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 via-teal-600/10 to-blue-600/20" />
          <div className="absolute inset-0 grid-bg opacity-50" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.15),transparent_70%)]" />

          <div className="relative z-10 py-16 lg:py-24 px-6 lg:px-12 text-center">
            <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 mb-6">
              <Lock className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Ready to Protect Your{' '}
              <span className="gradient-text">Business</span>?
            </h2>
            <p className="max-w-xl mx-auto text-slate-400 mb-8">
              Join forward-thinking companies using AI to bridge the gap between cybersecurity and business impact.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-cyan-500/25 transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <button className="px-8 py-4 border border-slate-500 hover:border-cyan-500/50 text-slate-300 hover:text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════
   10. FOOTER
   ═══════════════════════════════════════════════ */
function Footer() {
  const columns = [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Pricing', href: '#pricing' },
        { label: 'Roadmap', href: '#roadmap' },
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'API Docs', href: '#' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Press Kit', href: '#' },
        { label: 'Contact', href: '#' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Documentation', href: '#' },
        { label: 'Community', href: '#' },
        { label: 'Security', href: '#' },
        { label: 'Privacy Policy', href: '#' },
        { label: 'Terms of Service', href: '#' },
      ],
    },
  ];

  return (
    <footer className="border-t border-slate-800 bg-[#050816]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Shield className="w-7 h-7 text-cyan-400" />
              <span className="text-lg font-bold">
                Risk<span className="gradient-text">Lens</span>{' '}
                <span className="text-slate-400 font-light">AI</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-sm">
              AI-powered cybersecurity platform that transforms threat data into business
              intelligence. Protecting enterprises with intelligent risk analysis.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                <MapPin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-cyan-400 transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} RiskLens AI. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
              Privacy
            </a>
            <a href="#" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
              Terms
            </a>
            <a href="#" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════ */
export default function LandingPage() {
  // Smooth scroll behavior
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  return (
    <main className="relative overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <RoadmapSection />
      <CtaSection />
      <Footer />
    </main>
  );
}
