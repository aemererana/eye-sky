import { useCallback, useEffect, useRef, useState } from 'react';
import CoordinateModal from './components/CoordinateModal.jsx';
import CooldownIndicator from './components/CooldownIndicator.jsx';
import FlightCard from './components/FlightCard.jsx';
import StatusHud from './components/StatusHud.jsx';
import { fetchNearbyAircraft } from './utils/adsb.js';
import { getCameraErrorMessage, requestBackCamera, stopStream } from './utils/camera.js';
import { requestCompassPermission, startHeadingTracking } from './utils/compass.js';
import { detectMotion, scaleBbox } from './utils/motion.js';
import './App.css';

const MOTION_INTERVAL_MS = 500;
const COOLDOWN_MS = 10_000;
const NO_MOTION_HIDE_MS = 5_000;
const ANALYSIS_WIDTH = 160;
const ANALYSIS_HEIGHT = 120;

export default function App() {
  const [started, setStarted] = useState(false);
  const [coordinates, setCoordinates] = useState(null);
  const [aircraft, setAircraft] = useState(null);
  const [motionRegion, setMotionRegion] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [cameraError, setCameraError] = useState(null);
  const [cameraHeading, setCameraHeading] = useState(null);
  const [apiStatus, setApiStatus] = useState({ state: 'idle', message: 'Ready' });

  const videoRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const analysisCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const streamRef = useRef(null);

  const previousFrameRef = useRef(null);
  const lastFetchTimeRef = useRef(0);
  const lastMotionTimeRef = useRef(0);
  const fetchingRef = useRef(false);
  const coordinatesRef = useRef(null);
  const aircraftRef = useRef(null);
  const motionRegionRef = useRef(null);
  const showOverlayRef = useRef(false);
  const cameraHeadingRef = useRef(null);

  const handleStart = useCallback(async (lat, lon) => {
    setCameraError(null);
    setCoordinates({ lat, lon });
    coordinatesRef.current = { lat, lon };

    // iOS requires permission prompts to start in the same user-gesture turn.
    // Kick off compass + camera together before the first await.
    const compassPromise = requestCompassPermission();
    const cameraPromise = requestBackCamera();

    let stream = null;

    try {
      const [, cameraStream] = await Promise.all([compassPromise, cameraPromise]);
      stream = cameraStream;
      streamRef.current = stream;
      setStarted(true);
    } catch (err) {
      stopStream(stream);
      streamRef.current = null;
      setCameraError(getCameraErrorMessage(err));
      console.error(err);
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!started || !video || !stream) return;

    video.srcObject = stream;
    video.play().catch(console.error);

    return () => {
      video.srcObject = null;
    };
  }, [started]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!started) return;

    return startHeadingTracking((heading) => {
      cameraHeadingRef.current = heading;
      const rounded = Math.round(heading);
      setCameraHeading((prev) => (prev === rounded ? prev : rounded));
    });
  }, [started]);

  useEffect(() => {
    aircraftRef.current = aircraft;
  }, [aircraft]);

  useEffect(() => {
    motionRegionRef.current = motionRegion;
  }, [motionRegion]);

  useEffect(() => {
    showOverlayRef.current = showOverlay;
  }, [showOverlay]);

  useEffect(() => {
    if (!started || cameraError) return;

    const analysisCanvas = analysisCanvasRef.current;
    const analysisCtx = analysisCanvas?.getContext('2d', { willReadFrequently: true });
    const overlayCanvas = overlayCanvasRef.current;
    const overlayCtx = overlayCanvas?.getContext('2d');

    if (!analysisCtx || !overlayCtx) return;

    analysisCanvas.width = ANALYSIS_WIDTH;
    analysisCanvas.height = ANALYSIS_HEIGHT;

    async function fetchAircraft() {
      const coords = coordinatesRef.current;
      if (!coords || fetchingRef.current) return;

      fetchingRef.current = true;
      lastFetchTimeRef.current = Date.now();
      setCooldownRemaining(Math.ceil(COOLDOWN_MS / 1000));
      setApiStatus({ state: 'fetching', message: 'Scanning…' });

      try {
        const closest = await fetchNearbyAircraft(
          coords.lat,
          coords.lon,
          cameraHeadingRef.current,
        );
        if (closest) {
          const callsign = (closest.flight ?? closest.r ?? 'aircraft').trim();
          setAircraft(closest);
          setApiStatus({ state: 'success', message: `OK — ${callsign}` });
          if (Date.now() - lastMotionTimeRef.current < NO_MOTION_HIDE_MS) {
            showOverlayRef.current = true;
            setShowOverlay(true);
          }
        } else {
          setAircraft(null);
          showOverlayRef.current = false;
          setShowOverlay(false);
          setApiStatus({ state: 'success', message: 'OK — no match in view' });
        }
      } catch (err) {
        console.error('ADS-B fetch failed:', err);
        setApiStatus({
          state: 'error',
          message: err?.message ? `Error — ${err.message}` : 'Error — request failed',
        });
      } finally {
        fetchingRef.current = false;
      }
    }

    function drawCrosshair(ctx, x, y) {
      const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 300);

      ctx.save();
      ctx.strokeStyle = `rgba(100, 220, 255, ${pulse})`;
      ctx.fillStyle = `rgba(100, 220, 255, ${pulse})`;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();

      const arm = 16;
      ctx.beginPath();
      ctx.moveTo(x - arm, y);
      ctx.lineTo(x - 6, y);
      ctx.moveTo(x + 6, y);
      ctx.lineTo(x + arm, y);
      ctx.moveTo(x, y - arm);
      ctx.lineTo(x, y - 6);
      ctx.moveTo(x, y + 6);
      ctx.lineTo(x, y + arm);
      ctx.stroke();

      ctx.restore();
    }

    function updateOverlayCanvas(region) {
      const container = containerRef.current;
      const overlay = overlayCanvasRef.current;
      if (!container || !overlay) return;

      const { clientWidth, clientHeight } = container;
      overlay.width = clientWidth;
      overlay.height = clientHeight;

      overlayCtx.clearRect(0, 0, clientWidth, clientHeight);

      if (region && showOverlayRef.current) {
        drawCrosshair(overlayCtx, region.x, region.y);
      }
    }

    function runMotionDetection() {
      const video = videoRef.current;
      const container = containerRef.current;
      if (!video || video.readyState < 2 || !container) return;

      analysisCtx.drawImage(video, 0, 0, ANALYSIS_WIDTH, ANALYSIS_HEIGHT);
      const currentFrame = analysisCtx.getImageData(0, 0, ANALYSIS_WIDTH, ANALYSIS_HEIGHT);
      const result = detectMotion(currentFrame, previousFrameRef.current);
      previousFrameRef.current = currentFrame;

      const { clientWidth, clientHeight } = container;
      const now = Date.now();
      const cooldownElapsed = now - lastFetchTimeRef.current >= COOLDOWN_MS;

      if (result.motionDetected && result.bbox) {
        lastMotionTimeRef.current = now;

        const scaled = scaleBbox(
          result.bbox,
          ANALYSIS_WIDTH,
          ANALYSIS_HEIGHT,
          clientWidth,
          clientHeight,
        );

        motionRegionRef.current = scaled;
        setMotionRegion(scaled);

        if (!showOverlayRef.current && aircraftRef.current) {
          showOverlayRef.current = true;
          setShowOverlay(true);
        }

        if (cooldownElapsed && !fetchingRef.current) {
          fetchAircraft();
        }
      } else if (
        showOverlayRef.current &&
        now - lastMotionTimeRef.current >= NO_MOTION_HIDE_MS
      ) {
        showOverlayRef.current = false;
        setShowOverlay(false);
        motionRegionRef.current = null;
        setMotionRegion(null);
      }

      updateOverlayCanvas(motionRegionRef.current);
    }

    const motionInterval = setInterval(runMotionDetection, MOTION_INTERVAL_MS);

    const cooldownInterval = setInterval(() => {
      const elapsed = Date.now() - lastFetchTimeRef.current;
      const remaining = Math.max(0, Math.ceil((COOLDOWN_MS - elapsed) / 1000));
      setCooldownRemaining(remaining);
    }, 250);

    function handleResize() {
      updateOverlayCanvas(motionRegionRef.current);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(motionInterval);
      clearInterval(cooldownInterval);
      window.removeEventListener('resize', handleResize);
      previousFrameRef.current = null;
    };
  }, [started, cameraError]);

  const cardPosition =
    showOverlay && motionRegion
      ? {
          x: Math.min(
            Math.max(motionRegion.x + 24, 8),
            (containerRef.current?.clientWidth ?? window.innerWidth) - 220,
          ),
          y: Math.min(
            Math.max(motionRegion.y - 20, 8),
            (containerRef.current?.clientHeight ?? window.innerHeight) - 160,
          ),
        }
      : null;

  if (!started) {
    return <CoordinateModal onStart={handleStart} cameraError={cameraError} />;
  }

  return (
    <div className="app" ref={containerRef}>
      <video
        ref={videoRef}
        className="camera-feed"
        playsInline
        muted
        autoPlay
      />

      <canvas ref={overlayCanvasRef} className="overlay-canvas" />

      {showOverlay && aircraft && (
        <FlightCard aircraft={aircraft} position={cardPosition} />
      )}

      <CooldownIndicator secondsRemaining={cooldownRemaining} />

      <StatusHud cameraHeading={cameraHeading} apiStatus={apiStatus} />

      {cameraError && <div className="camera-error">{cameraError}</div>}

      <canvas ref={analysisCanvasRef} className="analysis-canvas" hidden />
    </div>
  );
}
