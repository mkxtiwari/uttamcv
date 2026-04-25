import { Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white py-10">
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-zinc-900 flex items-center justify-center">
            <img src="/logo.png" className="w-8 h-8" />
          </div>
          <span className="font-heading font-medium text-zinc-700">UttamCV</span>
          <span className="text-zinc-400">· ATS-grade analysis in seconds</span>
        </div>
        <div className="text-xs">© {new Date().getFullYear()} UttamCV All rights reserved.</div>
      </div>
    </footer>
  );
}