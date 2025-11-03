"use client";
import { useRef, useState, useEffect } from "react";

export default function HomePage() {
  const canvasRef = useRef(null);
  const [text, setText] = useState("Hello, world!");
  const [width, setWidth] = useState(1280);
  const [height, setHeight] = useState(720);
  const [duration, setDuration] = useState(5);
  const [bgColor, setBgColor] = useState("#111827");
  const [textColor, setTextColor] = useState("#ffffff");
  const [fontSize, setFontSize] = useState(96);
  const [videoUrl, setVideoUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width;
    canvas.height = height;
  }, [width, height]);

  async function generateVideo() {
    setError("");
    setVideoUrl("");
    setIsGenerating(true);
    setProgress(0);

    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not ready");
      const fps = 60;
      const stream = canvas.captureStream(fps);
      const mimeCandidates = [
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm",
      ];
      let mimeType = "";
      for (const m of mimeCandidates) {
        if (MediaRecorder.isTypeSupported(m)) { mimeType = m; break; }
      }
      if (!mimeType) throw new Error("This browser does not support WebM recording.");

      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks = [];
      recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };

      const ctx = canvas.getContext("2d");
      const totalMs = Math.max(0.5, Number(duration)) * 1000;
      const start = performance.now();

      let rafId = 0;
      const render = (now) => {
        const elapsed = now - start;
        const t = Math.min(1, elapsed / totalMs);
        setProgress(Math.round(t * 100));

        // Background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Simple animation: text scales and fades in
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // easeInOut
        const alpha = Math.min(1, t * 1.5);
        const scale = 0.9 + 0.1 * eased;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = textColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${fontSize * scale}px sans-serif`;

        // Auto line wrap
        const lines = wrapText(ctx, text, canvas.width * 0.8);
        const lineHeight = fontSize * 1.2 * scale;
        const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;
        lines.forEach((line, i) => {
          ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
        });
        ctx.restore();

        if (elapsed < totalMs) {
          rafId = requestAnimationFrame(render);
        } else {
          recorder.stop();
          cancelAnimationFrame(rafId);
        }
      };

      const stopped = new Promise((resolve) => {
        recorder.onstop = resolve;
      });

      recorder.start();
      requestAnimationFrame(render);
      await stopped;

      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
    } catch (e) {
      setError(e?.message || "Failed to generate video");
    } finally {
      setIsGenerating(false);
      setProgress(100);
    }
  }

  function wrapText(ctx, text, maxWidth) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let current = "";
    for (const word of words) {
      const test = current ? current + " " + word : word;
      if (ctx.measureText(test).width <= maxWidth) {
        current = test;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Make a Video</h1>
      <p style={{ opacity: 0.8, marginBottom: 24 }}>Generate a short WebM video directly in your browser.</p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        marginBottom: 24,
      }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span>Text</span>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #334155', background: '#0f1525', color: '#e5e7eb' }} />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span>Duration (s)</span>
            <input type="number" min={1} max={30} value={duration} onChange={(e) => setDuration(Number(e.target.value))}
              style={{ padding: 10, borderRadius: 8, border: '1px solid #334155', background: '#0f1525', color: '#e5e7eb' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span>Font size</span>
            <input type="number" min={12} max={200} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}
              style={{ padding: 10, borderRadius: 8, border: '1px solid #334155', background: '#0f1525', color: '#e5e7eb' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span>Width</span>
            <input type="number" min={256} max={4096} value={width} onChange={(e) => setWidth(Number(e.target.value))}
              style={{ padding: 10, borderRadius: 8, border: '1px solid #334155', background: '#0f1525', color: '#e5e7eb' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span>Height</span>
            <input type="number" min={256} max={4096} value={height} onChange={(e) => setHeight(Number(e.target.value))}
              style={{ padding: 10, borderRadius: 8, border: '1px solid #334155', background: '#0f1525', color: '#e5e7eb' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span>Background</span>
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
              style={{ height: 44, borderRadius: 8, border: '1px solid #334155', background: '#0f1525', color: '#e5e7eb' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span>Text color</span>
            <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)}
              style={{ height: 44, borderRadius: 8, border: '1px solid #334155', background: '#0f1525', color: '#e5e7eb' }} />
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <button onClick={generateVideo} disabled={isGenerating}
          style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #334155', background: isGenerating ? '#1f2937' : '#2563eb', color: 'white', cursor: isGenerating ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
          {isGenerating ? 'Generating?' : 'Generate video'}
        </button>
        <span style={{ opacity: 0.8 }}>Progress: {progress}%</span>
      </div>

      {error && (
        <div style={{ color: '#fca5a5', marginBottom: 12 }}>{error}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ border: '1px solid #334155', borderRadius: 12, overflow: 'hidden', background: '#0f1525' }}>
            <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: `${width}/${height}` }} />
          </div>
          <div style={{ opacity: 0.7, fontSize: 12, marginTop: 8 }}>Preview canvas ({width}?{height})</div>
        </div>
        <div>
          {videoUrl ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <video src={videoUrl} controls style={{ width: '100%', borderRadius: 12, border: '1px solid #334155', background: 'black' }} />
              <a href={videoUrl} download="video.webm" style={{ color: '#60a5fa' }}>Download video (WebM)</a>
            </div>
          ) : (
            <div style={{ opacity: 0.7 }}>Your generated video will appear here.</div>
          )}
        </div>
      </div>

      <div style={{ opacity: 0.6, fontSize: 12, marginTop: 24 }}>
        Note: Uses MediaRecorder to capture the canvas as WebM. Browser support may vary.
      </div>
    </div>
  );
}
