import { Sparkles } from "lucide-react";

export default function Header() {
  return (
    <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-white/80 border-b border-zinc-200/70">
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
            <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-heading text-lg font-semibold tracking-tight">
            HireSense<span className="text-blue-600">.AI</span>
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-600">
          <a href="#how" className="hover:text-zinc-900 transition-colors">How it works</a>
          <a href="#analyzer" className="hover:text-zinc-900 transition-colors">Analyzer</a>
          <a href="#analyzer" className="bg-zinc-900 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Analyze resume
          </a>
        </nav>
      </div>
    </header>
  );
}