import { useState, useRef } from "react";
import "./index.css";

const BACKEND_URL = "http://localhost:5000";

const STEPS = [
  { id: 1, label: "Parsing File",       icon: "📄" },
  { id: 2, label: "Generating Script",  icon: "🧠" },
  { id: 3, label: "Creating Audio",     icon: "🔊" },
  { id: 4, label: "Building Video",     icon: "🎬" },
];

export default function App() {
  const [file,       setFile]       = useState(null);
  const [dragging,   setDragging]   = useState(false);
  const [status,     setStatus]     = useState("idle");   // idle | processing | done | error
  const [step,       setStep]       = useState(0);
  const [jobId,      setJobId]      = useState(null);
  const [errorMsg,   setErrorMsg]   = useState("");
  const [sections,   setSections]   = useState([]);
  const [activeTab,  setActiveTab]  = useState("video"); // video | slides | audio
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const fileInputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  const simulateSteps = () => {
    let s = 1;
    const interval = setInterval(() => {
      setStep(s);
      s++;
      if (s > 4) clearInterval(interval);
    }, 2500);
  };

  const handleGenerate = async () => {
    if (!file) return;
    setStatus("processing");
    setStep(1);
    setErrorMsg("");
    simulateSteps();

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res  = await fetch(`${BACKEND_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setJobId(data.job_id);
        setSections(data.sections || []);
        setStatus("done");
        setStep(4);
      } else {
        setErrorMsg(data.error || "Something went wrong.");
        setStatus("error");
      }
    } catch (err) {
      setErrorMsg("Cannot connect to backend. Make sure Flask is running on port 5000.");
      setStatus("error");
    }
  };

  const handleDownload = () => {
    window.open(`${BACKEND_URL}/download/${jobId}`, "_blank");
  };

  const handleReset = () => {
    setFile(null);
    setStatus("idle");
    setStep(0);
    setJobId(null);
    setErrorMsg("");
    setSections([]);
    setActiveTab("video");
    setCurrentSlideIndex(0);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <span className="logo-icon">🎬</span>
          <div>
            <h1 className="logo-title">AI Video Generator</h1>
            <p className="logo-sub">Upload a document → Get an explainer video</p>
          </div>
        </div>
        <div className="badge">AI Powered</div>
      </header>

      <main className="main">

        {/* ── IDLE STATE ── */}
        {status === "idle" && (
          <div className="card upload-card">
            <h2 className="card-title">Upload Your Document</h2>
            <p className="card-sub">Supports PDF, DOCX, PPTX, TXT</p>

            <div
              className={`drop-zone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.pptx,.txt"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              {file ? (
                <div className="file-preview">
                  <span className="file-icon">
                    {file.name.endsWith(".pdf")  ? "📕" :
                     file.name.endsWith(".docx") ? "📘" :
                     file.name.endsWith(".pptx") ? "📙" : "📄"}
                  </span>
                  <div>
                    <p className="file-name">{file.name}</p>
                    <p className="file-size">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              ) : (
                <div className="drop-placeholder">
                  <span className="drop-icon">⬆️</span>
                  <p className="drop-text">Drag & drop your file here</p>
                  <p className="drop-hint">or click to browse</p>
                </div>
              )}
            </div>

            {file && (
              <button className="btn-generate" onClick={handleGenerate}>
                <span>🚀</span> Generate Video
              </button>
            )}

            {/* How it works */}
            <div className="how-it-works">
              <p className="how-title">How It Works</p>
              <div className="how-steps">
                {["📄 Upload File", "🧠 AI Reads It", "🔊 Adds Narration", "🎬 Creates Video"].map((s, i) => (
                  <div key={i} className="how-step">
                    <span>{s}</span>
                    {i < 3 && <span className="arrow">→</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PROCESSING STATE ── */}
        {status === "processing" && (
          <div className="card processing-card">
            <div className="spinner" />
            <h2 className="processing-title">Generating Your Video...</h2>
            <p className="processing-sub">This may take a minute. Please wait.</p>

            <div className="steps-list">
              {STEPS.map((s) => (
                <div key={s.id} className={`step-item ${step >= s.id ? "active" : ""} ${step > s.id ? "done" : ""}`}>
                  <div className="step-icon-wrap">
                    {step > s.id ? "✅" : s.icon}
                  </div>
                  <span className="step-label">{s.label}</span>
                  {step === s.id && <span className="step-dot-anim" />}
                </div>
              ))}
            </div>

            <div className="progress-bar-wrap">
              <div className="progress-bar" style={{ width: `${(step / 4) * 100}%` }} />
            </div>
            <p className="progress-percent">{Math.round((step / 4) * 100)}% Complete</p>
          </div>
        )}

        {/* ── DONE STATE ── */}
        {status === "done" && (
          <div className="card done-card preview-wide-card">
            <div className="success-icon">🎉</div>
            <h2 className="done-title">Your Video is Ready!</h2>
            <p className="done-sub">Your explainer video has been generated successfully.</p>

            {/* Tabs Navigation */}
            <div className="tabs-header">
              <button
                className={`tab-btn ${activeTab === "video" ? "active" : ""}`}
                onClick={() => setActiveTab("video")}
              >
                🎬 Video Explainer
              </button>
              <button
                className={`tab-btn ${activeTab === "slides" ? "active" : ""}`}
                onClick={() => setActiveTab("slides")}
              >
                🖼️ Slides Preview ({sections.length})
              </button>
              <button
                className={`tab-btn ${activeTab === "audio" ? "active" : ""}`}
                onClick={() => setActiveTab("audio")}
              >
                🔊 Audio & Narration
              </button>
            </div>

            {/* Tab Contents */}
            <div className="tab-body">
              {activeTab === "video" && (
                <div className="tab-content video-tab">
                  <div className="video-wrap">
                    <video
                      controls
                      className="video-player"
                      src={`${BACKEND_URL}/preview/${jobId}`}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              )}

              {activeTab === "slides" && (
                <div className="tab-content slides-tab">
                  <div className="slideshow-container">
                    {sections.length > 0 ? (
                      <>
                        <div className="slide-image-wrapper">
                          <img
                            className="slide-preview-img"
                            src={`${BACKEND_URL}/preview/${jobId}/slide/${currentSlideIndex}`}
                            alt={`Slide ${currentSlideIndex + 1}`}
                          />
                        </div>
                        <div className="slideshow-controls">
                          <button
                            className="btn-control"
                            disabled={currentSlideIndex === 0}
                            onClick={() => setCurrentSlideIndex(prev => prev - 1)}
                          >
                            ◀ Prev
                          </button>
                          <span className="slide-counter">
                            Slide {currentSlideIndex + 1} of {sections.length}
                          </span>
                          <button
                            className="btn-control"
                            disabled={currentSlideIndex === sections.length - 1}
                            onClick={() => setCurrentSlideIndex(prev => prev + 1)}
                          >
                            Next ▶
                          </button>
                        </div>
                        <div className="slide-info-card">
                          <h4 className="slide-info-title">{sections[currentSlideIndex].title}</h4>
                          <ul className="slide-info-bullets">
                            {sections[currentSlideIndex].bullets.map((bullet, idx) => (
                              <li key={idx}>{bullet}</li>
                            ))}
                          </ul>
                        </div>
                      </>
                    ) : (
                      <p className="no-data">No slide content available.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "audio" && (
                <div className="tab-content audio-tab">
                  <div className="audio-sections-list">
                    {sections.map((sec, idx) => (
                      <div key={idx} className="audio-section-card">
                        <div className="audio-section-header">
                          <span className="audio-section-num">Slide {idx + 1}</span>
                          <h3 className="audio-section-title">{sec.title}</h3>
                        </div>
                        <div className="audio-section-body">
                          <div className="audio-narration-box">
                            <p className="audio-narration-text">"{sec.narration}"</p>
                          </div>
                          <div className="audio-player-wrapper">
                            <audio
                              controls
                              className="slide-audio-player"
                              src={`${BACKEND_URL}/preview/${jobId}/audio/${idx}`}
                            >
                              Your browser does not support the audio element.
                            </audio>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="action-btns">
              <button className="btn-download" onClick={handleDownload}>
                ⬇️ Download Video
              </button>
              <button className="btn-reset" onClick={handleReset}>
                🔄 Generate Another
              </button>
            </div>
          </div>
        )}

        {/* ── ERROR STATE ── */}
        {status === "error" && (
          <div className="card error-card">
            <div className="error-icon">❌</div>
            <h2 className="error-title">Something Went Wrong</h2>
            <p className="error-msg">{errorMsg}</p>
            <button className="btn-reset" onClick={handleReset}>
              🔄 Try Again
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
