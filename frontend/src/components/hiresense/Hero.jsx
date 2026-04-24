import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Zap, FileCheck2 } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute top-40 -left-32 w-[420px] h-[420px] rounded-full bg-emerald-100/40 blur-3xl" />
      </div>
      <div className="relative max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Powered by Claude Sonnet 4.5 · ATS-grade analysis
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
            className="font-heading text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tighter leading-[1.02] text-zinc-900"
          >
            Beat the bots.<br />
            <span className="text-zinc-400">Land the </span>
            <span className="relative">
              <span className="relative z-10 text-blue-600">interview.</span>
              <span className="absolute inset-x-0 bottom-1 h-3 bg-blue-100 -z-0" />
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-6 text-lg text-zinc-600 max-w-xl leading-relaxed"
          >
            UttamCV reads your resume like an expert recruiter, scores it against any job
            description, and tells you exactly what's missing — with an actionable plan to fix it.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <a href="#analyzer" className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-blue-600 text-white px-6 py-3.5 rounded-lg font-medium transition-all hover:translate-y-[-1px] hover:shadow-lg">
              Analyze my resume <ArrowRight className="w-4 h-4" />
            </a>
            <span className="text-sm text-zinc-500">Free · No signup · Instant</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.35 }}
            className="mt-10 grid grid-cols-3 gap-5 max-w-xl"
          >
            {[
              { Icon: Zap, label: "~15s", sub: "avg. analysis" },
              { Icon: FileCheck2, label: "PDF/DOCX/TXT", sub: "supported" },
              { Icon: ShieldCheck, label: "Private", sub: "never shared" },
            ].map(({ Icon, label, sub }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white border border-zinc-200 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-heading text-sm font-semibold text-zinc-900">{label}</div>
                  <div className="text-xs text-zinc-500">{sub}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}
          className="lg:col-span-5 relative"
        >
          <div className="relative rounded-2xl overflow-hidden border border-zinc-200 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)] bg-white">
            <img
              src="https://images.unsplash.com/photo-1698047681432-006d2449c631?crop=entropy&cs=srgb&fm=jpg&w=940&q=85"
              alt="Candidate reviewing resume"
              className="w-full h-[440px] object-cover"
            />
            <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
              <div className="bg-white/95 backdrop-blur rounded-lg px-3 py-2 border border-zinc-200 flex items-center gap-2 shadow-sm">
                <div className="w-8 h-8 rounded-md bg-emerald-500 text-white flex items-center justify-center font-heading text-sm font-bold">87</div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Match score</div>
                  <div className="text-sm font-semibold text-zinc-900">Strong fit</div>
                </div>
              </div>
              <div className="bg-zinc-900 text-white rounded-lg px-3 py-2 text-xs font-medium">LIVE</div>
            </div>
            <div className="absolute bottom-5 left-5 right-5 flex flex-wrap gap-1.5">
              {["React", "TypeScript", "Tailwind", "Node.js", "AWS"].map((s) => (
                <span key={s} className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
                  ✓ {s}
                </span>
              ))}
              <span className="bg-red-50 text-red-700 border border-red-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
                — GraphQL
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}