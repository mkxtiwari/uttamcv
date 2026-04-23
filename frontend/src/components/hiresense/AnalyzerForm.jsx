import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText, X, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const ACCEPTED = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
};

export default function AnalyzerForm({ onAnalyze, loading }) {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles?.length) {
      toast.error("Only PDF, DOCX, or TXT files under 10 MB are supported.");
      return;
    }
    if (acceptedFiles?.[0]) setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: ACCEPTED, maxFiles: 1,
    maxSize: 10 * 1024 * 1024, multiple: false,
  });

  const submit = (e) => {
    e.preventDefault();
    onAnalyze({ file, jobDescription });
  };

  return (
    <section id="analyzer" className="relative py-16 md:py-24 border-t border-zinc-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 mb-3">01 · Analyze</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900">
            Upload. Paste. Get a recruiter-grade verdict.
          </h2>
          <p className="mt-3 text-zinc-600">
            Drop in your resume and the job description — we'll handle the rest in seconds.
          </p>
        </div>

        <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-3 block">
              Your resume
            </label>
            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[260px] ${
                isDragActive ? "border-blue-500 bg-blue-50/60" : "border-zinc-300 bg-zinc-50 hover:border-blue-400 hover:bg-blue-50/30"
              }`}
            >
              <input {...getInputProps()} />
              {!file ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-white border border-zinc-200 flex items-center justify-center mb-4">
                    <UploadCloud className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="font-heading text-lg font-medium text-zinc-900">
                    {isDragActive ? "Drop your resume here" : "Drag & drop your resume"}
                  </p>
                  <p className="text-sm text-zinc-500 mt-1">or click to browse</p>
                  <p className="text-xs text-zinc-400 mt-4">PDF, DOCX, TXT · max 10 MB</p>
                </>
              ) : (
                <div className="w-full flex items-center gap-3 bg-white border border-zinc-200 rounded-lg p-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-sm text-zinc-900 truncate">{file.name}</p>
                    <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-3 block">
              Job description
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here…"
              className="w-full min-h-[260px] resize-none font-mono text-sm border border-zinc-300 rounded-xl p-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-2 text-xs text-zinc-500">{jobDescription.length} characters · min 20</p>
          </div>

          <div className="lg:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <p className="text-sm text-zinc-500">
              We never store your documents. Analysis happens securely in-session.
            </p>
            <button
              type="submit" disabled={loading}
              className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-blue-600 text-white rounded-lg px-8 py-4 text-base font-medium transition-all disabled:opacity-60"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Analyzing…</>
              ) : (
                <><Sparkles className="w-4 h-4" />Run analysis</>
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}