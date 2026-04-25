import { Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white py-10">
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
        
        <div className="flex items-center gap-3">
          
          <img
            src="/logo.png"
            alt="logo"
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover"
          />

          <div className="flex flex-col leading-tight">
            <span className="font-heading font-semibold text-zinc-800">
              Uttam<span className="text-blue-600">CV</span>
            </span>
            <span className="text-xs sm:text-sm text-zinc-500">
              ATS-grade analysis in seconds
            </span>
          </div>

        </div>

        <div className="text-xs">
          © {new Date().getFullYear()} UttamCV All rights reserved.
        </div>

      </div>
    </footer>
  );
}