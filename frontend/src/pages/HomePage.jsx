import { useState, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";

import Header from "../components/hiresense/Header";
import Hero from "../components/hiresense/Hero";
import AnalyzerForm from "../components/hiresense/AnalyzerForm";
import ResultsPanel from "../components/hiresense/ResultsPanel";
import Footer from "../components/hiresense/Footer";

const API = process.env.REACT_APP_BACKEND_URL
  ? `${process.env.REACT_APP_BACKEND_URL}/api`
  : "http://localhost:8000/api";

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const resultsRef = useRef(null);

  const handleAnalyze = async ({ file, jobDescription, resumeText }) => {
    if (!jobDescription || jobDescription.trim().length < 20) {
      toast.error("Please paste a job description (min 20 characters).");
      return;
    }

    if (!file && !resumeText?.trim()) {
      toast.error("Please upload a resume or paste resume text.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const form = new FormData();
      form.append("job_description", jobDescription);

      if (file) {
        form.append("resume_file", file);
      } else {
        form.append("resume_text", resumeText);
      }

      const { data } = await axios.post(`${API}/analyze`, form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });

      setResult(data);
      toast.success("Analysis complete!");

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err.message ||
        "Something went wrong";
      toast.error(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4">
        <section className="py-16">
          <Hero />
        </section>
        <section className="py-12">
          <AnalyzerForm onAnalyze={handleAnalyze} loading={loading} />
        </section>
        <section ref={resultsRef} className="py-12">
          {result && <ResultsPanel result={result} apiBase={API} />}
        </section>
      </main>
      <Footer />
    </div>
  );
}