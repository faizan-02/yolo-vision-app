"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Image as ImageIcon, Video, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ui/curtain-theme-toggle";
import { GlowingEffect } from "@/components/ui/grid-glow-effect-purple-blue";
import { HeaderFloatingPaths } from "@/components/ui/background-paths";

const API = process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : '';

export default function Home() {
  const [activeTab, setActiveTab] = useState<"image" | "video">("image");
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Sync with localStorage on mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setIsDark(true);
    } else if (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setIsDark(true);
    }
  }, []);

  const handleThemeChange = (nextDark: boolean) => {
    setIsDark(nextDark);
    localStorage.setItem("theme", nextDark ? "dark" : "light");
  };

  return (
    <div className={`min-h-screen font-sans selection:bg-rose-500/30 relative transition-colors duration-300 ${isDark ? "bg-[#0b0f19] text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      {/* Background Image Layer */}
      <div 
        className={`fixed inset-0 z-0 bg-cover bg-center pointer-events-none filter grayscale-[10%] contrast-[105%] transition-opacity duration-500 ${isDark ? "opacity-[0.24]" : "opacity-[0.22]"}`} 
        style={{ backgroundImage: "url('/bg.jpg')" }}
      />

      {/* Main Content Wrapper */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className={`sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b transition-colors duration-300 ${isDark ? "bg-[#131b2e]/75 border-slate-800/60" : "bg-white/70 border-slate-200/60"} backdrop-blur-xl overflow-hidden`}>
          {/* Header Background Floating Paths Animation */}
          <div className="absolute inset-0 z-0">
            <HeaderFloatingPaths />
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-600 to-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/25">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3.5" fill="currentColor" className="text-rose-200 animate-pulse" />
              </svg>
            </div>
            <div>
              <h1 className={`font-extrabold text-xl leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>YOLO Vision</h1>
              <p className={`text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Traffic & Vehicle Detection</p>
            </div>
          </div>
          
          {mounted && (
            <div className="relative z-10">
              <ThemeToggle variant="icon" defaultTheme={isDark ? "dark" : "light"} onThemeChange={(nextTheme) => handleThemeChange(nextTheme === "dark")} />
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-6 py-12 flex flex-col gap-8 w-full">
          
          {/* Tabs */}
          <div className={`flex gap-2 p-1.5 rounded-2xl shadow-sm border max-w-fit mx-auto relative transition-colors duration-300 ${isDark ? "bg-[#131b2e]/90 border-slate-800/80" : "bg-white border-slate-200/60"}`}>
            {["image", "video"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as "image" | "video")}
                className={`relative px-6 py-2.5 text-sm font-semibold rounded-xl transition-colors z-10 ${activeTab === tab ? "text-white" : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-900"}`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-rose-600 rounded-xl shadow-md shadow-rose-500/20"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    style={{ zIndex: -1 }}
                  />
                )}
                <span className="flex items-center gap-2 capitalize">
                  {tab === "image" ? <ImageIcon size={16} /> : <Video size={16} />}
                  {tab}
                </span>
              </button>
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === "image" ? <ImageTab isDark={isDark} /> : <VideoTab isDark={isDark} />}
            </motion.div>
          </AnimatePresence>
          
        </main>
      </div>
    </div>
  );
}

function ImageTab({ isDark }: { isDark: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ url: string; count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
        setError("Please upload an image file.");
        return;
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null);
    setError(null);
  };

  const onSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API}/api/detect/image`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Detection failed");
      setResult({ url: `${API}${data.annotated_image}`, count: data.detections });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative p-8 md:p-12 rounded-[1.8rem] shadow-xl border transition-all duration-300 ${isDark ? "bg-[#131b2e]/85 shadow-black/30 border-slate-800/80" : "bg-white shadow-slate-200/50 border-slate-200/60"}`}>
      {/* Dynamic Glow Border Effect */}
      <GlowingEffect
        spread={55}
        glow={true}
        disabled={false}
        proximity={80}
        inactiveZone={0.01}
        borderWidth={2.5}
        variant="blue-purple"
        blur={0}
        movementDuration={1.2}
      />
      
      {/* Content wrapper with z-index to sit on top of glowing effect */}
      <div className="relative z-10">
        <div className="mb-8 text-center">
          <h2 className={`text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>Detect Vehicles & Pedestrians</h2>
          <p className={`${isDark ? "text-slate-400" : "text-slate-500"}`}>Upload a traffic photo to run custom AI flow detection.</p>
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
          className={`relative overflow-hidden group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 ${isDragging ? isDark ? "border-rose-500 bg-rose-950/20" : "border-rose-500 bg-rose-50" : isDark ? "border-slate-700 bg-slate-900/50 hover:border-rose-500 hover:bg-rose-950/10" : "border-slate-300 bg-slate-50 hover:border-rose-500 hover:bg-rose-50/50"} ${preview ? 'p-2' : 'p-12'}`}
        >
          <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-64 object-contain rounded-xl bg-slate-900/5" />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 pointer-events-none">
              <div className={`w-16 h-16 rounded-full shadow-sm flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform duration-300 ${isDark ? "bg-[#1a2333]" : "bg-white"}`}>
                <UploadCloud size={32} />
              </div>
              <p className={`font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}>Click or drag image to upload</p>
            </div>
          )}
        </div>

        <button
          onClick={onSubmit}
          disabled={!file || loading}
          className="w-full mt-6 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-rose-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
        >
          {loading ? <><Loader2 className="animate-spin" size={20} /> Processing...</> : "Run Detection"}
        </button>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={`mt-6 p-4 rounded-xl flex gap-3 items-center border overflow-hidden ${isDark ? "bg-red-950/30 text-red-400 border-red-900/50" : "bg-red-50 text-red-600 border-red-100"}`}>
              <AlertCircle size={20} /> {error}
            </motion.div>
          )}
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
              <div className={`p-4 mb-6 rounded-xl flex gap-3 items-center border ${isDark ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/50" : "bg-emerald-50 text-emerald-700 border-emerald-100"}`}>
                <CheckCircle size={20} /> 
                <span className="font-medium">Detection complete! Tracked <strong>{result.count}</strong> traffic element(s).</span>
              </div>
              <div className={`rounded-2xl overflow-hidden border shadow-xl ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                  <img src={result.url} className={`w-full ${isDark ? "bg-slate-900" : "bg-slate-100"}`} alt="Annotated Result" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function VideoTab({ isDark }: { isDark: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("video/")) {
        setError("Please upload a video file.");
        return;
    }
    setFile(selectedFile);
    setResult(null);
    setError(null);
  };

  const onSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setProgress(0);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API}/api/detect/video`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to start");
      pollStatus(data.job_id);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const pollStatus = async (jobId: string) => {
    try {
      const res = await fetch(`${API}/api/detect/video/${jobId}`);
      const data = await res.json();
      
      if (data.status === "processing") {
        setProgress((p) => Math.min(p + 5, 95));
        setTimeout(() => pollStatus(jobId), 2000);
      } else if (data.status === "done") {
        setProgress(100);
        setTimeout(() => {
            setResult(`${API}${data.output}`);
            setLoading(false);
        }, 500);
      } else {
        throw new Error(data.error || "Processing failed");
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className={`relative p-8 md:p-12 rounded-[1.8rem] shadow-xl border transition-all duration-300 ${isDark ? "bg-[#131b2e]/85 shadow-black/30 border-slate-800/80" : "bg-white shadow-slate-200/50 border-slate-200/60"}`}>
      {/* Dynamic Glow Border Effect */}
      <GlowingEffect
        spread={55}
        glow={true}
        disabled={false}
        proximity={80}
        inactiveZone={0.01}
        borderWidth={2.5}
        variant="blue-purple"
        blur={0}
        movementDuration={1.2}
      />
      
      {/* Content wrapper with z-index to sit on top of glowing effect */}
      <div className="relative z-10">
        <div className="mb-8 text-center">
          <h2 className={`text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>Traffic Flow Analytics</h2>
          <p className={`${isDark ? "text-slate-400" : "text-slate-500"}`}>Upload a dashcam or road video to track vehicles frame-by-frame.</p>
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
          className={`relative overflow-hidden group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 p-12 ${isDragging ? isDark ? "border-rose-500 bg-rose-950/20" : "border-rose-500 bg-rose-50" : isDark ? "border-slate-700 bg-slate-900/50 hover:border-rose-500 hover:bg-rose-950/10" : "border-slate-300 bg-slate-50 hover:border-rose-500 hover:bg-rose-50/50"}`}
        >
          <input type="file" hidden ref={fileInputRef} accept="video/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <div className="flex flex-col items-center justify-center gap-4 pointer-events-none">
            <div className={`w-16 h-16 rounded-full shadow-sm flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform duration-300 ${isDark ? "bg-[#1a2333]" : "bg-white"}`}>
              <Video size={32} />
            </div>
            <p className={`font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              {file ? <span className="text-rose-600 font-bold">{file.name}</span> : "Click or drag video to upload"}
            </p>
          </div>
        </div>

        <button
          onClick={onSubmit}
          disabled={!file || loading}
          className="w-full mt-6 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-rose-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
        >
          {loading ? "Processing Video..." : "Run Detection"}
        </button>

        <AnimatePresence>
          {loading && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-6 overflow-hidden">
                  <div className={`h-3 rounded-full overflow-hidden shadow-inner ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                      <motion.div className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full" animate={{ width: `${progress}%` }} transition={{ ease: "easeInOut" }} />
                  </div>
                  <p className={`text-center text-sm font-medium mt-2 flex items-center justify-center gap-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      <Loader2 className="animate-spin" size={14} /> Analyzing frames...
                  </p>
              </motion.div>
          )}
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={`mt-6 p-4 rounded-xl flex gap-3 items-center border overflow-hidden ${isDark ? "bg-red-950/30 text-red-400 border-red-900/50" : "bg-red-50 text-red-600 border-red-100"}`}>
              <AlertCircle size={20} /> {error}
            </motion.div>
          )}
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
              <div className={`p-4 mb-6 rounded-xl flex gap-3 items-center border ${isDark ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/50" : "bg-emerald-50 text-emerald-700 border-emerald-100"}`}>
                <CheckCircle size={20} /> <span className="font-medium">Video processed successfully!</span>
              </div>
              <div className={`rounded-2xl overflow-hidden border shadow-xl bg-black ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                  <video src={result} controls className="w-full" autoPlay />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
