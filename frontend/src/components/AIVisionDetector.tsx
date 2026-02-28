import { useEffect, useRef } from "react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;700;800&display=swap');

  .aiv-wrap { 
    position:fixed; 
    bottom:24px; 
    right:24px; 
    z-index:50; 
    width:320px; 
    font-family:'Syne',sans-serif;
  }
  .aiv-vwrap {
    position:relative; 
    border-radius:14px; 
    overflow:hidden;
    border:1px solid #1e1e3a; 
    background:#080810;
    box-shadow:0 10px 30px rgba(0,0,0,0.5), 0 0 50px rgba(0,240,255,0.05); 
    min-height:180px;
  }
  .aiv-vwrap video {
    display:block; width:100%; height:auto; transform:scaleX(-1);
    max-height:240px; object-fit:cover;
  }
  .aiv-vwrap canvas {
    position:absolute; top:0; left:0; width:100%; height:100%;
    transform:scaleX(-1); pointer-events:none;
  }
  .aiv-corner {
    position:absolute; width:18px; height:18px;
    border-color:#00f0ff; border-style:solid; opacity:0.4; z-index:5; pointer-events:none;
  }
  .aiv-corner.tl { top:9px; left:9px;   border-width:2px 0 0 2px; }
  .aiv-corner.tr { top:9px; right:9px;  border-width:2px 2px 0 0; }
  .aiv-corner.bl { bottom:9px; left:9px;  border-width:0 0 2px 2px; }
  .aiv-corner.br { bottom:9px; right:9px; border-width:0 2px 2px 0; }

  .aiv-livebadge {
    position:absolute; top:12px; left:50%; transform:translateX(-50%);
    background:rgba(8,8,16,0.8); border:1px solid rgba(0,240,255,0.22);
    backdrop-filter:blur(8px); font-family:'Space Mono',monospace;
    font-size:0.5rem; letter-spacing:1px; padding:3px 8px; border-radius:20px;
    color:#00f0ff; z-index:6; display:flex; align-items:center; gap:4px;
    pointer-events:none; white-space:nowrap;
  }
  .aiv-ldot {
    width:4px; height:4px; border-radius:50%; background:#ff3cac;
    animation:aiv-blink 1.1s ease-in-out infinite; flex-shrink:0;
  }
  @keyframes aiv-blink { 0%,100%{opacity:1} 50%{opacity:0.15} }

  .aiv-fpsbadge {
    position:absolute; top:12px; right:12px; background:rgba(8,8,16,0.8);
    border:1px solid rgba(255,255,255,0.08); backdrop-filter:blur(8px);
    font-family:'Space Mono',monospace; font-size:0.5rem; padding:3px 6px;
    border-radius:6px; color:#ffb830; z-index:6; pointer-events:none;
  }
  .aiv-loadov {
    position:absolute; inset:0; background:rgba(8,8,16,0.95);
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    z-index:20; gap:10px; border-radius:14px;
  }
  .aiv-ltitle { font-size:0.75rem; color:#e0e0ff; font-family:'Space Mono',monospace; letter-spacing:1px; }
  .aiv-pbwrap { width:180px; height:3px; background:#1e1e3a; border-radius:3px; overflow:hidden; }
  .aiv-pb {
    height:100%; background:linear-gradient(90deg,#00f0ff,#bf5af2);
    border-radius:3px; width:0%; transition:width 0.4s ease;
  }
  .aiv-lstep {
    font-size:0.55rem; color:#555570; font-family:'Space Mono',monospace;
    text-align:center; max-width:240px; line-height:1.4;
  }
  .aiv-errov {
    position:absolute; inset:0; background:rgba(8,8,16,0.97); display:none;
    flex-direction:column; align-items:center; justify-content:center;
    z-index:20; gap:10px; border-radius:14px; padding:20px; text-align:center;
  }
  .aiv-etitle { color:#ff3cac; font-size:0.9rem; font-weight:700; }
  .aiv-emsg { color:#555570; font-size:0.65rem; font-family:'Space Mono',monospace; max-width:280px; line-height:1.6; }

  /* ── Alert system ── */
  @keyframes aiv-alertBorderPulse {
    0%,100% { box-shadow:0 0 0 0 rgba(255,30,30,0),0 0 40px rgba(255,30,30,0); border-color:rgba(255,30,30,0.3); }
    50%     { box-shadow:0 0 20px 4px rgba(255,30,30,0.55),0 0 60px rgba(255,30,30,0.2); border-color:rgba(255,30,30,0.9); }
  }
  @keyframes aiv-alertScanline {
    0%   { top:-8%;  opacity:0.7; }
    100% { top:108%; opacity:0; }
  }
  @keyframes aiv-alertTextBlink {
    0%,100% { opacity:1; }
    40%     { opacity:0.15; }
  }
  @keyframes aiv-alertCornerPulse {
    0%,100% { opacity:0.3; transform:scale(1); }
    50%     { opacity:1;   transform:scale(1.18); }
  }
  @keyframes aiv-shakeX {
    0%,100% { transform:translateX(0); }
    20%     { transform:translateX(-3px); }
    40%     { transform:translateX(3px); }
    60%     { transform:translateX(-2px); }
    80%     { transform:translateX(2px); }
  }

  .aiv-vwrap.alert-active {
    animation: aiv-alertBorderPulse 1.1s ease-in-out infinite, aiv-shakeX 0.45s ease 0s 1;
    border-color: rgba(255,30,30,0.9) !important;
  }
  .aiv-alert-scanline {
    display:none; position:absolute; left:0; right:0; height:3px;
    background:linear-gradient(90deg,transparent,rgba(255,30,30,0.8),transparent);
    z-index:9; pointer-events:none; filter:blur(1px);
  }
  .aiv-vwrap.alert-active .aiv-alert-scanline {
    display:block;
    animation: aiv-alertScanline 1.4s linear infinite;
  }
  .aiv-alert-vignette {
    display:none; position:absolute; inset:0; z-index:8; pointer-events:none; border-radius:14px;
    background: radial-gradient(ellipse at center, transparent 45%, rgba(200,0,0,0.22) 100%);
  }
  .aiv-vwrap.alert-active .aiv-alert-vignette { display:block; }
  .aiv-alert-banner {
    display:none; position:absolute; bottom:14px; left:50%; transform:translateX(-50%);
    background:rgba(180,0,0,0.88); border:1px solid rgba(255,60,60,0.9);
    backdrop-filter:blur(10px); padding:6px 16px; border-radius:20px;
    font-family:'Space Mono',monospace; font-size:0.6rem; letter-spacing:1px;
    color:#fff; z-index:10; white-space:nowrap;
    text-shadow:0 0 8px rgba(255,100,100,0.9);
    box-shadow:0 0 16px rgba(255,0,0,0.4);
    animation: aiv-alertTextBlink 1.1s ease-in-out infinite;
  }
  .aiv-vwrap.alert-active .aiv-alert-banner { display:flex; align-items:center; gap:6px; }
  .aiv-vwrap.alert-active .aiv-corner {
    border-color:#ff1e1e !important;
    animation: aiv-alertCornerPulse 1.1s ease-in-out infinite;
  }
`;

interface Props {
  onWarning?: (count: number) => void;
  onCheatingMaxReached?: () => void;
  onReady?: () => void;
}

export default function AIVisionDetector({ onWarning, onCheatingMaxReached, onReady }: Props) {
  const onWarningRef = useRef(onWarning);
  const onCheatingMaxReachedRef = useRef(onCheatingMaxReached);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onWarningRef.current = onWarning;
    onCheatingMaxReachedRef.current = onCheatingMaxReached;
    onReadyRef.current = onReady;
  }, [onWarning, onCheatingMaxReached, onReady]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vwrapRef = useRef<HTMLDivElement>(null);
  const loadOvRef = useRef<HTMLDivElement>(null);
  const errOvRef = useRef<HTMLDivElement>(null);
  const pbRef = useRef<HTMLDivElement>(null);
  const lstepRef = useRef<HTMLDivElement>(null);
  const fpsBadgeRef = useRef<HTMLDivElement>(null);
  const fpsElRef = useRef<HTMLSpanElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const logdotRef = useRef<HTMLDivElement>(null);
  const logtextRef = useRef<HTMLSpanElement>(null);
  const fValRef = useRef<HTMLDivElement>(null);
  const fSubRef = useRef<HTMLDivElement>(null);
  const fStatRef = useRef<HTMLDivElement>(null);
  const hValRef = useRef<HTMLDivElement>(null);
  const hSubRef = useRef<HTMLDivElement>(null);
  const hStatRef = useRef<HTMLDivElement>(null);
  const pValRef = useRef<HTMLDivElement>(null);
  const pSubRef = useRef<HTMLDivElement>(null);
  const pStatRef = useRef<HTMLDivElement>(null);
  const aValRef = useRef<HTMLDivElement>(null);
  const aSubRef = useRef<HTMLDivElement>(null);
  const aStatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Inject CSS
    const styleEl = document.createElement("style");
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);

    let isMounted = true;
    let rafId: number;
    let beepInterval: ReturnType<typeof setInterval> | null = null;
    let alertActive = false;
    let absentFrames = 0;
    const ABSENT_GRACE = 0;
    const VIS = 0.25;

    let warningCount = 0;
    let hasAlertRunning = false;
    let lastWarningTime = 0;
    const WARNING_COOLDOWN_MS = 12000; // 12 seconds delay between warnings

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

    const setP = (p: number, m: string) => {
      if (pbRef.current) pbRef.current.style.width = p + "%";
      if (lstepRef.current) lstepRef.current.textContent = m;
    };
    const showErr = (m: string) => {
      if (loadOvRef.current) loadOvRef.current.style.display = "none";
      if (errOvRef.current) {
        errOvRef.current.style.display = "flex";
        const msg = errOvRef.current.querySelector(".aiv-emsg");
        if (msg) msg.textContent = m;
      }
    };
    const setLog = (m: string, active: boolean) => {
      if (logtextRef.current) logtextRef.current.textContent = m;
      if (logdotRef.current)
        logdotRef.current.className = "aiv-logdot" + (active ? "" : " idle");
    };

    // ── Alert / beep ──
    function playBeep() {
      if (audioCtx.state === "suspended") audioCtx.resume();
      const t = audioCtx.currentTime;
      [{ freq: 1080, start: t, dur: 0.12 }, { freq: 820, start: t + 0.14, dur: 0.12 }]
        .forEach(({ freq, start, dur }) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain); gain.connect(audioCtx.destination);
          osc.type = "square";
          osc.frequency.setValueAtTime(freq, start);
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.18, start + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
          osc.start(start); osc.stop(start + dur + 0.02);
        });
    }

    const UPPER_BODY_PARTS = [
      { label: "HEAD", check: (fc: number, poses: any[][]) => fc > 0 },
      {
        label: "NECK", check: (_fc: number, poses: any[][]) => poses.some(lm =>
          lm[0] && (lm[0].visibility || 1) >= VIS &&
          ((lm[11] && (lm[11].visibility || 1) >= VIS) || (lm[12] && (lm[12].visibility || 1) >= VIS))
        )
      },
      { label: "L.SHOULDER", check: (_fc: number, poses: any[][]) => poses.some(lm => lm[11] && (lm[11].visibility || 1) >= VIS) },
      { label: "R.SHOULDER", check: (_fc: number, poses: any[][]) => poses.some(lm => lm[12] && (lm[12].visibility || 1) >= VIS) },
      {
        label: "CHEST", check: (_fc: number, poses: any[][]) => poses.some(lm =>
          lm[11] && (lm[11].visibility || 1) >= VIS && lm[12] && (lm[12].visibility || 1) >= VIS
        )
      },
      { label: "L.ARM", check: (_fc: number, poses: any[][]) => poses.some(lm => lm[13] && (lm[13].visibility || 1) >= VIS) },
      { label: "R.ARM", check: (_fc: number, poses: any[][]) => poses.some(lm => lm[14] && (lm[14].visibility || 1) >= VIS) },
    ];

    function getMissing(fc: number, poses: any[][]): string[] {
      return UPPER_BODY_PARTS.filter(p => !p.check(fc, poses)).map(p => p.label);
    }

    function startAlert(missing: string[]) {
      const now = performance.now();

      if (!alertActive) {
        alertActive = true;
        vwrapRef.current?.classList.add("alert-active");
        playBeep();
        beepInterval = setInterval(playBeep, 900);
        if (logdotRef.current) logdotRef.current.style.background = "#ff1e1e";
      }

      if (!hasAlertRunning) {
        if (now - lastWarningTime >= WARNING_COOLDOWN_MS) {
          hasAlertRunning = true;
          warningCount++;
          lastWarningTime = now;
          if (onWarningRef.current) onWarningRef.current(warningCount);
          if (warningCount >= 3) {
            if (onCheatingMaxReachedRef.current) onCheatingMaxReachedRef.current();
          }
        }
      }

      const label = missing.length ? "⚠ MISSING: " + missing.join(" · ") : "⚠ UPPER BODY INCOMPLETE";
      if (bannerRef.current) bannerRef.current.textContent = label;
      setLog("⚠ " + label, false);
    }

    function stopAlert() {
      if (!alertActive) return;
      alertActive = false;
      hasAlertRunning = false;
      vwrapRef.current?.classList.remove("alert-active");
      if (beepInterval) { clearInterval(beepInterval); beepInterval = null; }
      if (logdotRef.current) logdotRef.current.style.background = "";
    }

    function updateAlert(fc: number, poses: any[][]) {
      const missing = getMissing(fc, poses);
      if (missing.length > 0) {
        absentFrames++;
        if (absentFrames >= ABSENT_GRACE) startAlert(missing);
      } else {
        absentFrames = 0;
        stopAlert();
      }
    }

    // ── Drawing ──
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const KP_STYLE = [
      { color: "#00f0ff", r: 5.5 },
      { color: "#00f0ff", r: 5.5 },
      { color: "#ffffff", r: 4 },
      { color: "#ff9500", r: 3.5 },
      { color: "#bf5af2", r: 3 },
      { color: "#bf5af2", r: 3 },
    ];

    function drawFace(detection: any, W: number, H: number) {
      const bb = detection.boundingBox;
      const kps = detection.keypoints || [];
      const toX = (v: number) => v <= 1.5 ? v * W : v;
      const toY = (v: number) => v <= 1.5 ? v * H : v;
      const x = toX(bb.originX), y = toY(bb.originY);
      const bw = toX(bb.width), bh = toY(bb.height);
      ctx.save();
      kps.forEach((kp: any, idx: number) => {
        if (idx >= KP_STYLE.length) return;
        const { color, r } = KP_STYLE[idx];
        const px = toX(kp.x), py = toY(kp.y);
        ctx.beginPath(); ctx.arc(px, py, r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = color + "44"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 14; ctx.fill();
        ctx.shadowBlur = 0;
      });
      ctx.fillStyle = "#00f0ff";
      ctx.font = "bold 11px Space Mono,monospace";
      const conf = detection.categories?.[0]?.score;
      const label = conf ? `FACE ${Math.round(conf * 100)}%` : "FACE";
      ctx.fillText(label, x + 4, y > 16 ? y - 5 : y + bh + 14);
      ctx.restore();
    }

    const HAND_CONN: [number, number][] = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20],
      [5, 9], [9, 13], [13, 17],
    ];
    const FCOL = ["#ff3cac", "#ff9500", "#ffdd00", "#39ff14", "#00f0ff"];
    const fingerCol = (i: number) => {
      if (i === 0) return "#fff";
      if (i <= 4) return FCOL[0];
      if (i <= 8) return FCOL[1];
      if (i <= 12) return FCOL[2];
      if (i <= 16) return FCOL[3];
      return FCOL[4];
    };

    function drawHand(landmarks: any[], handedness: string, idx: number, W: number, H: number) {
      const pts = landmarks.map(l => ({ x: l.x * W, y: l.y * H }));
      ctx.save();
      HAND_CONN.forEach(([a, b]) => {
        const g = ctx.createLinearGradient(pts[a].x, pts[a].y, pts[b].x, pts[b].y);
        g.addColorStop(0, fingerCol(a)); g.addColorStop(1, fingerCol(b));
        ctx.strokeStyle = g; ctx.lineWidth = 2.5; ctx.lineCap = "round";
        ctx.shadowColor = fingerCol(b); ctx.shadowBlur = 5;
        ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y); ctx.stroke();
      });
      pts.forEach((p, i) => {
        const c = fingerCol(i);
        ctx.beginPath(); ctx.arc(p.x, p.y, i === 0 ? 7 : 4.5, 0, Math.PI * 2);
        ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 8; ctx.fill();
        if (i === 0) { ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 1.5; ctx.stroke(); }
      });
      ctx.shadowBlur = 0; ctx.fillStyle = "#39ff14"; ctx.font = "bold 10px Space Mono,monospace";
      ctx.fillText(`${(handedness || "").toUpperCase()} #${idx + 1}`, pts[0].x + 10, pts[0].y - 10);
      ctx.restore();
    }

    function drawPose(landmarks: any[], W: number, H: number) {
      const pts = landmarks.map(l => ({ x: l.x * W, y: l.y * H, v: l.visibility || 1 }));
      const vis = (i: number) => !!pts[i] && pts[i].v >= 0.15;
      const midPt = (a: number, b: number) => ({ x: (pts[a].x + pts[b].x) / 2, y: (pts[a].y + pts[b].y) / 2 });
      ctx.save();
      ctx.lineCap = "round"; ctx.lineJoin = "round";

      const line = (ax: number, ay: number, bx: number, by: number, color: string, lw = 3.5) => {
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
        ctx.strokeStyle = color; ctx.lineWidth = lw;
        ctx.shadowColor = color; ctx.shadowBlur = 9; ctx.stroke(); ctx.shadowBlur = 0;
      };

      if (vis(0)) {
        let headR = 28;
        if (vis(7) && vis(8)) headR = Math.hypot(pts[7].x - pts[8].x, pts[7].y - pts[8].y) * 0.62;
        headR = Math.max(headR, 18);
        ctx.beginPath(); ctx.arc(pts[0].x, pts[0].y - headR * 0.25, headR, 0, Math.PI * 2);
        ctx.strokeStyle = "#00f0ff"; ctx.lineWidth = 3;
        ctx.shadowColor = "#00f0ff"; ctx.shadowBlur = 12; ctx.stroke(); ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(pts[0].x, pts[0].y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff"; ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 8; ctx.fill(); ctx.shadowBlur = 0;
      }
      if (vis(0) && vis(11) && vis(12)) { const sh = midPt(11, 12); line(pts[0].x, pts[0].y, sh.x, sh.y, "#ffdd00", 3); }
      if (vis(11) && vis(12) && vis(23) && vis(24)) { const sh = midPt(11, 12), hp = midPt(23, 24); line(sh.x, sh.y, hp.x, hp.y, "#ff9500", 4); }
      if (vis(11) && vis(12)) line(pts[11].x, pts[11].y, pts[12].x, pts[12].y, "#ff9500", 3.5);
      if (vis(23) && vis(24)) line(pts[23].x, pts[23].y, pts[24].x, pts[24].y, "#ff9500", 3.5);
      ([[11, 13], [13, 15], [12, 14], [14, 16]] as [number, number][]).forEach(([a, b]) => { if (vis(a) && vis(b)) line(pts[a].x, pts[a].y, pts[b].x, pts[b].y, "#ff3cac", 3.5); });
      ([[23, 25], [25, 27], [24, 26], [26, 28]] as [number, number][]).forEach(([a, b]) => { if (vis(a) && vis(b)) line(pts[a].x, pts[a].y, pts[b].x, pts[b].y, "#bf5af2", 3.5); });

      const JOINTS = [
        { i: 11, c: "#ff9500" }, { i: 12, c: "#ff9500" },
        { i: 13, c: "#ff3cac" }, { i: 14, c: "#ff3cac" },
        { i: 15, c: "#ff3cac" }, { i: 16, c: "#ff3cac" },
        { i: 23, c: "#ff9500" }, { i: 24, c: "#ff9500" },
        { i: 25, c: "#bf5af2" }, { i: 26, c: "#bf5af2" },
        { i: 27, c: "#bf5af2" }, { i: 28, c: "#bf5af2" },
      ];
      JOINTS.forEach(({ i, c }) => {
        if (!vis(i)) return;
        ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, 6, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = 1.8; ctx.shadowBlur = 0; ctx.stroke();
        ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, 4, 0, Math.PI * 2);
        ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0;
      });
      ctx.restore();
    }

    function countArms(posesArr: any[][]): number {
      let total = 0;
      posesArr.forEach(lm => {
        [11, 12, 13, 14, 15, 16].forEach(i => { if (lm[i] && (lm[i].visibility || 1) >= 0.3) total++; });
      });
      return total > 0 ? Math.ceil(total / 3) : 0;
    }

    // ── Main init ──
    (async () => {
      // @ts-ignore
      const { FaceDetector, HandLandmarker, PoseLandmarker, FilesetResolver } = await import(/* @vite-ignore */"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm");

      const WASM_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
      const MODEL_BASE = "https://storage.googleapis.com/mediapipe-models";

      let faceDetector: any = null;
      let handLandmarker: any = null;
      let poseLandmarker: any = null;

      setP(3, "Requesting camera access…");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: false,
        });
        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await new Promise<void>(r => {
            if (!videoRef.current || videoRef.current.readyState >= 1) {
              r();
            } else {
              videoRef.current.onloadedmetadata = () => r();
            }
          });
          await videoRef.current.play().catch(e => console.warn("Play interrupted", e));
        }
      } catch (e: any) {
        showErr("Camera access denied or unavailable.\n" + e.message); return;
      }

      setP(8, "Loading WASM runtime…");
      const vision = await FilesetResolver.forVisionTasks(WASM_PATH);

      setP(40, "Loading AI models in parallel…");
      try {
        const [fd, hl, pl] = await Promise.all([
          FaceDetector.createFromOptions(vision, {
            baseOptions: { modelAssetPath: `${MODEL_BASE}/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`, delegate: "CPU" },
            runningMode: "VIDEO", minDetectionConfidence: 0.3, minSuppressionThreshold: 0.2,
          }).catch((e: any) => { console.warn("Face detector failed:", e); return null; }),
          HandLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: `${MODEL_BASE}/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`, delegate: "CPU" },
            runningMode: "VIDEO", numHands: 2,
            minHandDetectionConfidence: 0.3, minHandPresenceConfidence: 0.3, minTrackingConfidence: 0.3,
          }).catch((e: any) => { console.warn("Hand landmarker failed:", e); return null; }),
          PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: `${MODEL_BASE}/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`, delegate: "CPU" },
            runningMode: "VIDEO", numPoses: 2,
            minPoseDetectionConfidence: 0.3, minPosePresenceConfidence: 0.3, minTrackingConfidence: 0.3,
          }).catch((e: any) => { console.warn("Pose landmarker failed:", e); return null; })
        ]);
        faceDetector = fd;
        handLandmarker = hl;
        poseLandmarker = pl;
      } catch (e) { console.warn("Models failed:", e); }

      if (!isMounted) return;

      setP(100, "All models ready!");
      await new Promise(r => setTimeout(r, 280));
      if (!isMounted) return;

      if (loadOvRef.current) loadOvRef.current.style.display = "none";
      setLog("Detection active…", true);
      if (onReadyRef.current) onReadyRef.current();

      let lastMs = performance.now(), fpsCount = 0, displayFps = 0;

      function renderLoop() {
        rafId = requestAnimationFrame(renderLoop);
        const video = videoRef.current!;
        if (!video || video.readyState < 2) return;

        const ts = performance.now();
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        let faces: any[] = [], hands: any[] = [], handedness: any[] = [], poses: any[][] = [];

        if (faceDetector) try { faces = faceDetector.detectForVideo(video, ts).detections || []; } catch { }
        if (handLandmarker) try { const r = handLandmarker.detectForVideo(video, ts); hands = r.landmarks || []; handedness = r.handedness || []; } catch { }
        if (poseLandmarker) try { poses = poseLandmarker.detectForVideo(video, ts).landmarks || []; } catch { }

        poses.forEach(lm => drawPose(lm, W, H));
        faces.forEach(det => drawFace(det, W, H));
        hands.forEach((lm, i) => drawHand(lm, handedness[i]?.[0]?.categoryName, i, W, H));

        const fc = faces.length, hc = hands.length, pc = poses.length, ac = countArms(poses);
        updateAlert(fc, poses);

        if (fValRef.current) fValRef.current.textContent = String(fc);
        if (fSubRef.current) fSubRef.current.textContent = fc ? `${fc} face${fc > 1 ? "s" : ""}` : "not detected";
        if (fStatRef.current) fStatRef.current.className = "aiv-stat" + (fc ? " af" : "");
        if (hValRef.current) hValRef.current.textContent = String(hc);
        if (hSubRef.current) hSubRef.current.textContent = hc ? `${hc} hand${hc > 1 ? "s" : ""}` : "not detected";
        if (hStatRef.current) hStatRef.current.className = "aiv-stat" + (hc ? " ah" : "");
        if (pValRef.current) pValRef.current.textContent = pc ? String(pc) : "—";
        if (pSubRef.current) pSubRef.current.textContent = pc ? `${pc} body` : "not detected";
        if (pStatRef.current) pStatRef.current.className = "aiv-stat" + (pc ? " ap" : "");
        if (aValRef.current) aValRef.current.textContent = ac ? String(ac) : "—";
        if (aSubRef.current) aSubRef.current.textContent = ac ? `${ac} arm${ac > 1 ? "s" : ""} detected` : "not detected";
        if (aStatRef.current) aStatRef.current.className = "aiv-stat" + (ac ? " aa" : "");

        fpsCount++;
        if (ts - lastMs >= 1000) {
          displayFps = fpsCount; fpsCount = 0; lastMs = ts;
          if (fpsElRef.current) fpsElRef.current.textContent = String(displayFps);
          if (fpsBadgeRef.current) fpsBadgeRef.current.textContent = displayFps + " FPS";
        }

        if (!alertActive) {
          const parts: string[] = [];
          if (fc) parts.push(`${fc} face${fc > 1 ? "s" : ""}`);
          if (hc) parts.push(`${hc} hand${hc > 1 ? "s" : ""}`);
          if (ac) parts.push(`${ac} arm${ac > 1 ? "s" : ""}`);
          if (pc) parts.push(`${pc} body`);
          setLog(parts.length ? "Detected: " + parts.join(" · ") : "Scanning…", !!parts.length);
        }
      }

      renderLoop();
    })();

    const unlockAudio = () => { if (audioCtx.state === "suspended") audioCtx.resume(); };
    document.addEventListener("click", unlockAudio, { once: true });

    return () => {
      isMounted = false;
      cancelAnimationFrame(rafId);
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      if (beepInterval) clearInterval(beepInterval);
      document.removeEventListener("click", unlockAudio);
      styleEl.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="aiv-wrap">
      <div className="aiv-vwrap" ref={vwrapRef}>
        <div className="aiv-corner tl" />
        <div className="aiv-corner tr" />
        <div className="aiv-corner bl" />
        <div className="aiv-corner br" />
        <div className="aiv-livebadge">
          <div className="aiv-ldot" />
          LIVE FEED
        </div>
        <div className="aiv-fpsbadge" ref={fpsBadgeRef}>— FPS</div>
        <video ref={videoRef} autoPlay muted playsInline />
        <canvas ref={canvasRef} />

        {/* Alert overlays */}
        <div className="aiv-alert-scanline" />
        <div className="aiv-alert-vignette" />
        <div className="aiv-alert-banner" ref={bannerRef}>⚠ SUBJECT OUT OF FRAME</div>

        {/* Loading overlay */}
        <div className="aiv-loadov" ref={loadOvRef}>
          <div className="aiv-ltitle">INITIALIZING</div>
          <div className="aiv-pbwrap"><div className="aiv-pb" ref={pbRef} /></div>
          <div className="aiv-lstep" ref={lstepRef}>Starting…</div>
        </div>

        {/* Error overlay */}
        <div className="aiv-errov" ref={errOvRef}>
          <div className="aiv-etitle">⚠ Could Not Start</div>
          <div className="aiv-emsg" />
        </div>
      </div>

      {/* Hidden stat elements (logic still runs) */}
      <div style={{ display: "none" }}>
        <div ref={fStatRef}><div ref={fValRef} /><div ref={fSubRef} /></div>
        <div ref={hStatRef}><div ref={hValRef} /><div ref={hSubRef} /></div>
        <div ref={pStatRef}><div ref={pValRef} /><div ref={pSubRef} /></div>
        <div ref={aStatRef}><div ref={aValRef} /><div ref={aSubRef} /></div>
        <span ref={fpsElRef} />
        <div ref={logdotRef} /><span ref={logtextRef} />
      </div>
    </div>
  );
}
