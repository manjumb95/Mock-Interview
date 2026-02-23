import Link from 'next/link';
import { ArrowRight, FileText, CheckCircle, Video, CreditCard } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-6 h-16 flex items-center border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex flex-1 items-center justify-between max-w-7xl mx-auto w-full">
          <Link href="/" className="flex items-center gap-2">
            <Video className="w-6 h-6 text-primary" />
            <span className="font-bold text-xl tracking-tight">AI Interview Pro</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Features</Link>
            <Link href="#pricing" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Pricing</Link>
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Sign In</Link>
            <Link href="/register" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
              Get Started Free
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full py-24 md:py-32 lg:py-40 flex justify-center bg-[url('/grid-bg.svg')] bg-center relative overflow-hidden">
          <div className="absolute inset-0 bg-slate-950/80 pointer-events-none" />
          <div className="container px-4 md:px-6 relative z-10 flex flex-col items-center text-center max-w-4xl">
            <div className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1 text-sm mb-6 text-slate-300 shadow-sm backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              Powered by Gemini 2.0
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
              Master your next tech interview with AI.
            </h1>
            <p className="max-w-[42rem] leading-normal text-slate-400 sm:text-xl sm:leading-8 mb-8">
              Upload your resume and a target job description. Our advanced AI conducts a highly realistic mock interview, analyzes your skill gaps, and gives you actionable feedback to land the offer.
            </p>
            <div className="flex gap-4">
              <Link href="/register" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-12 px-8 py-2">
                Start 2 Free Interviews
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-24 bg-slate-900 flex justify-center border-y border-slate-800">
          <div className="container px-4 md:px-6 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-lg">A complete end-to-end pipeline tailored for your dream job.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-6">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">1. Upload Context</h3>
                <p className="text-slate-400">Upload your PDF resume and paste the target job description. We extract the structured requirements and identify your skill gaps instantly.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors relative md:-top-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                  <Video className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">2. Mock Interview</h3>
                <p className="text-slate-400">Engage in a multi-turn, adaptive conversation. The AI asks one question at a time, probing deeper based on your exact responses.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">3. Detailed Evaluation</h3>
                <p className="text-slate-400">Receive a comprehensive report with technical scores, hiring probability, strengths, weaknesses, and a 30-day improvement plan.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-8 px-6 bg-slate-950 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <Video className="w-5 h-5 text-slate-500" />
          <span className="font-semibold text-slate-400">AI Interview Pro</span>
        </div>
        <p className="text-sm text-slate-500">© 2026 AI Interview Pro. All rights reserved.</p>
      </footer>
    </div>
  );
}
