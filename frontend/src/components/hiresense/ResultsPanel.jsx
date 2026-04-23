import { motion } from "framer-motion";
import { Download, Check, X, Lightbulb, Award } from "lucide-react";
import ScoreRing from "./ScoreRing";

const chipAnim = {
  hidden: { opacity: 0, y: 6 },
  show: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.03 } }),
};

function Section({ title, icon: Icon, accent, children }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6">
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="font-heading text-lg font-semibold text-zinc-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function ResultsPanel({ result, apiBase }) {
  const { id, match_score, summary, matched_skills, missing_skills, suggestions, strengths } = result;

  const tier =
    match_score >= 75 ? { label: "Strong fit", color: "text-emerald-600", band: "bg-emerald-50 border-emerald-200" }
    : match_score >= 50 ? { label: "Moderate fit", color: "text-amber-600", band: "bg-amber-50 border-amber-200" }
    : { label: "Low fit", color: "text-red-600", band: "bg-red-50 border-red-200" };

  return (
    <section className="py-16 md:py-24 bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 mb-3">02 · Results</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900">Your analysis is ready.</h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white rounded-xl border border-zinc-200 p-8 flex flex-col items-center text-center">
            <ScoreRing score={match_score} />
            <div className={`mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${tier.band} ${tier.color}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />{tier.label}
            </div>
            <p className="mt-6 text-zinc-600 leading-relaxed max-w-md">{summary}</p>
            
             <a href={`${apiBase}/report/${id}`} target="_blank" rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2 bg-zinc-900 hover:bg-blue-600 text-white px-5 py-3 rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" /> Download PDF report
            </a>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Section title="Matched skills" icon={Check} accent="bg-emerald-50 text-emerald-600">
              <div className="flex flex-wrap gap-2">
                {matched_skills?.map((s, i) => (
                  <motion.span key={i} custom={i} initial="hidden" animate="show" variants={chipAnim}
                    className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1 text-sm font-medium">{s}</motion.span>
                ))}
              </div>
            </Section>

            <Section title="Missing skills" icon={X} accent="bg-red-50 text-red-600">
              <div className="flex flex-wrap gap-2">
                {missing_skills?.map((s, i) => (
                  <motion.span key={i} custom={i} initial="hidden" animate="show" variants={chipAnim}
                    className="bg-red-50 text-red-700 border border-red-200 rounded-full px-3 py-1 text-sm font-medium">{s}</motion.span>
                ))}
              </div>
            </Section>

            <Section title="Your strengths" icon={Award} accent="bg-blue-50 text-blue-600">
              <ul className="space-y-2.5">
                {(strengths || []).map((s, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-zinc-700 leading-relaxed">
                    <span className="text-blue-600 mt-1">●</span><span>{s}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Suggestions" icon={Lightbulb} accent="bg-amber-50 text-amber-600">
              <ul className="space-y-2.5">
                {(suggestions || []).map((s, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-zinc-700 leading-relaxed">
                    <span className="text-amber-600 mt-1">●</span><span>{s}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        </div>
      </div>
    </section>
  );
}