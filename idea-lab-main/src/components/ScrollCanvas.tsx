import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "../lib/gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const TOTAL_FRAMES = 267; // Will be set after compression
const FRAME_PATH_PREFIX = "/bg-frames/frame-";
const FRAME_EXT = ".webp";
const EAGER_LOAD_COUNT = 20; // Load first N frames immediately
const BATCH_SIZE = 30; // Load rest in batches of this size

function getFramePath(index: number): string {
  const num = String(index + 1).padStart(4, "0");
  return `${FRAME_PATH_PREFIX}${num}${FRAME_EXT}`;
}

export default function ScrollCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(
    new Array(TOTAL_FRAMES).fill(null)
  );
  const currentFrameRef = useRef<number>(0);
  const [isFirstFrameLoaded, setIsFirstFrameLoaded] = useState(false);
  const loadedCountRef = useRef(0);

  // Draw a specific frame to the canvas
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imagesRef.current[frameIndex];
    if (!img || !img.complete || !img.naturalWidth) {
      // Try to find nearest loaded frame
      let nearest = frameIndex;
      for (let offset = 1; offset < 10; offset++) {
        const before = frameIndex - offset;
        const after = frameIndex + offset;
        if (before >= 0 && imagesRef.current[before]?.complete && imagesRef.current[before]?.naturalWidth) {
          nearest = before;
          break;
        }
        if (after < TOTAL_FRAMES && imagesRef.current[after]?.complete && imagesRef.current[after]?.naturalWidth) {
          nearest = after;
          break;
        }
      }
      const fallback = imagesRef.current[nearest];
      if (!fallback || !fallback.complete || !fallback.naturalWidth) return;
      renderImage(ctx, canvas, fallback);
      return;
    }

    renderImage(ctx, canvas, img);
  }, []);

  // Render an image to canvas with cover behavior
  const renderImage = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      img: HTMLImageElement
    ) => {
      const canvasW = canvas.width;
      const canvasH = canvas.height;
      const imgW = img.naturalWidth;
      const imgH = img.naturalHeight;

      // object-fit: cover calculation
      const scale = Math.max(canvasW / imgW, canvasH / imgH);
      const scaledW = imgW * scale;
      const scaledH = imgH * scale;
      const x = (canvasW - scaledW) / 2;
      const y = (canvasH - scaledH) / 2;

      ctx.clearRect(0, 0, canvasW, canvasH);
      ctx.drawImage(img, x, y, scaledW, scaledH);
    },
    []
  );

  // Load a single frame
  const loadFrame = useCallback(
    (index: number): Promise<void> => {
      return new Promise((resolve) => {
        if (imagesRef.current[index]) {
          resolve();
          return;
        }
        const img = new Image();
        img.onload = () => {
          imagesRef.current[index] = img;
          loadedCountRef.current++;
          if (index === 0) {
            setIsFirstFrameLoaded(true);
            drawFrame(0);
          }
          resolve();
        };
        img.onerror = () => {
          resolve(); // Don't block on errors
        };
        img.src = getFramePath(index);
      });
    },
    [drawFrame]
  );

  // Progressive batch loading
  const loadAllFrames = useCallback(async () => {
    // Phase 1: Load first N frames eagerly (in parallel)
    const eagerPromises: Promise<void>[] = [];
    for (let i = 0; i < Math.min(EAGER_LOAD_COUNT, TOTAL_FRAMES); i++) {
      eagerPromises.push(loadFrame(i));
    }
    await Promise.all(eagerPromises);

    // Phase 2: Load remaining frames in batches
    for (
      let batch = EAGER_LOAD_COUNT;
      batch < TOTAL_FRAMES;
      batch += BATCH_SIZE
    ) {
      const batchPromises: Promise<void>[] = [];
      for (
        let i = batch;
        i < Math.min(batch + BATCH_SIZE, TOTAL_FRAMES);
        i++
      ) {
        batchPromises.push(loadFrame(i));
      }
      await Promise.all(batchPromises);
    }
  }, [loadFrame]);

  // Resize canvas to match viewport
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    // Redraw current frame
    drawFrame(currentFrameRef.current);
  }, [drawFrame]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  // Start loading frames
  useEffect(() => {
    loadAllFrames();
  }, [loadAllFrames]);

  // GSAP ScrollTrigger setup
  useEffect(() => {
    const ctx = gsap.context(() => {
      const obj = { frame: 0 };

      gsap.to(obj, {
        frame: TOTAL_FRAMES - 1,
        ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5, // Slight smoothing for buttery feel
        },
        onUpdate: () => {
          const frameIndex = Math.round(obj.frame);
          if (frameIndex !== currentFrameRef.current) {
            currentFrameRef.current = frameIndex;
            drawFrame(frameIndex);
          }
        },
      });
    });

    return () => ctx.revert();
  }, [drawFrame]);

  return (
    <>
      {/* Loading shimmer - shows until first frame loads */}
      {!isFirstFrameLoaded && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            background:
              "linear-gradient(135deg, #f8fafd 0%, #f0fdfe 50%, #f8fafd 100%)",
            backgroundSize: "400% 400%",
            animation: "bgShimmer 2s ease infinite",
          }}
        />
      )}

      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          pointerEvents: "none",
          opacity: isFirstFrameLoaded ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      />

      {/* 10% lighter overlay on background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background: "rgba(255, 255, 255, 0.10)",
        }}
      />
    </>
  );
}
