import { useEffect, useRef, useState } from 'react';

type ParticleImageRevealProps = {
  imageUrl: string;
  alt?: string;
  onComplete?: () => void;
};

type Viewport = {
  width: number;
  height: number;
};

type Particle = {
  targetX: number;
  targetY: number;
  startX: number;
  startY: number;
  color: string;
  size: number;
  delay: number;
  drift: number;
  phase: number;
};

const DURATION = 7400;

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

const lerp = (from: number, to: number, progress: number) =>
  from + (to - from) * progress;

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const progress = clamp((value - edge0) / (edge1 - edge0));
  return progress * progress * (3 - 2 * progress);
};

const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

const hash = (x: number, y = 0) => {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return value - Math.floor(value);
};

const colorAt = (
  imageData: ImageData,
  width: number,
  x: number,
  y: number,
) => {
  const safeX = Math.floor(clamp(x, 0, width - 1));
  const safeY = Math.floor(clamp(y, 0, imageData.height - 1));
  const index = (safeY * width + safeX) * 4;

  return {
    r: imageData.data[index],
    g: imageData.data[index + 1],
    b: imageData.data[index + 2],
    a: imageData.data[index + 3],
  };
};

const drawContainedImage = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) => {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const canvasRatio = width / height;
  const targetWidth =
    imageRatio > canvasRatio
      ? width
      : height * imageRatio;
  const targetHeight =
    imageRatio > canvasRatio
      ? width / imageRatio
      : height;
  const targetX = (width - targetWidth) / 2;
  const targetY = (height - targetHeight) / 2;

  context.drawImage(
    image,
    targetX,
    targetY,
    targetWidth,
    targetHeight,
  );
};

const createParticles = (imageData: ImageData, width: number, height: number) => {
  const spacing = Math.max(7, Math.round(Math.min(width, height) / 62));
  const particles: Particle[] = [];
  const centerX = width * 0.5;
  const centerY = height * 0.52;
  const outerRadius = Math.max(width, height) * 0.9;

  for (let y = spacing / 2; y < height; y += spacing) {
    for (let x = spacing / 2; x < width; x += spacing) {
      const color = colorAt(imageData, width, x, y);

      if (color.a < 10) {
        continue;
      }

      const seed = hash(x, y);
      const secondarySeed = hash(y, x);
      const angle = seed * Math.PI * 2;
      const radius = outerRadius * (0.18 + secondarySeed * 0.88);

      particles.push({
        targetX: x,
        targetY: y,
        startX:
          centerX +
          Math.cos(angle) * radius +
          (hash(x * 1.7, y * 0.7) - 0.5) * width * 0.38,
        startY:
          centerY +
          Math.sin(angle) * radius +
          (hash(x * 0.3, y * 1.9) - 0.5) * height * 0.45,
        color: `rgb(${color.r} ${color.g} ${color.b})`,
        size: spacing * (0.72 + hash(x * 0.9, y * 1.3) * 0.75),
        delay: hash(x * 0.23, y * 0.19) * 0.46,
        drift: spacing * (1.8 + hash(x * 0.41, y * 0.73) * 4.2),
        phase: hash(x * 0.13, y * 0.31) * Math.PI * 2,
      });
    }
  }

  return particles;
};

const prepareCanvas = (
  canvas: HTMLCanvasElement,
  viewport: Viewport,
  dpr: number,
) => {
  canvas.width = Math.floor(viewport.width * dpr);
  canvas.height = Math.floor(viewport.height * dpr);

  const context = canvas.getContext('2d');

  if (!context) {
    return null;
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  return context;
};

const drawMosaic = (
  context: CanvasRenderingContext2D,
  imageData: ImageData,
  viewport: Viewport,
  progress: number,
) => {
  const { width, height } = viewport;
  const eased = easeOutCubic(progress);
  const tileSize = Math.max(5, Math.round(lerp(46, 8, eased)));

  context.clearRect(0, 0, width, height);
  context.save();

  for (let y = 0; y < height; y += tileSize) {
    for (let x = 0; x < width; x += tileSize) {
      const localNoise = hash(Math.floor(x / tileSize), Math.floor(y / tileSize));
      const localProgress = smoothstep(
        0.1 + localNoise * 0.52,
        0.72 + localNoise * 0.22,
        progress,
      );
      const alpha = (1 - localProgress) * (0.86 - progress * 0.32);

      if (alpha < 0.025) {
        continue;
      }

      const blockSize = tileSize * (1 + localNoise * 0.7);
      const color = colorAt(imageData, width, x + blockSize * 0.5, y + blockSize * 0.5);

      if (color.a < 10) {
        continue;
      }

      context.globalAlpha = alpha;
      context.fillStyle = `rgb(${color.r} ${color.g} ${color.b})`;
      context.fillRect(x, y, blockSize, blockSize);
    }
  }

  context.restore();
};

const drawParticles = (
  context: CanvasRenderingContext2D,
  particles: Particle[],
  viewport: Viewport,
  progress: number,
  now: number,
) => {
  context.clearRect(0, 0, viewport.width, viewport.height);
  context.save();
  context.globalCompositeOperation = 'screen';

  for (const particle of particles) {
    const appear = smoothstep(particle.delay, particle.delay + 0.32, progress);
    const settle = easeOutCubic(
      smoothstep(particle.delay + 0.08, particle.delay + 0.7, progress),
    );
    const fadeOut = smoothstep(0.62 + particle.delay * 0.12, 0.96, progress);
    const instability = 1 - settle;
    const wobbleX =
      Math.sin(now * 0.0013 + particle.phase) * particle.drift * instability;
    const wobbleY =
      Math.cos(now * 0.0011 + particle.phase * 1.31) *
      particle.drift *
      instability;
    const x = lerp(particle.startX, particle.targetX, settle) + wobbleX;
    const y = lerp(particle.startY, particle.targetY, settle) + wobbleY;
    const size = lerp(particle.size * 1.85, Math.max(1.1, particle.size * 0.34), settle);
    const alpha = appear * (1 - fadeOut) * 0.78;

    if (alpha < 0.015) {
      continue;
    }

    context.globalAlpha = alpha;
    context.fillStyle = particle.color;
    context.fillRect(x - size * 0.5, y - size * 0.5, size, size);
  }

  context.restore();
};

export function ParticleImageReveal({
  imageUrl,
  alt = '',
  onComplete,
}: ParticleImageRevealProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const mosaicCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewport, setViewport] = useState<Viewport | null>(null);

  useEffect(() => {
    const frame = frameRef.current;

    if (!frame) {
      return;
    }

    const updateViewport = () => {
      const rect = frame.getBoundingClientRect();
      const nextViewport = {
        width: Math.max(1, Math.round(rect.width)),
        height: Math.max(1, Math.round(rect.height)),
      };

      setViewport((currentViewport) => {
        if (
          currentViewport?.width === nextViewport.width &&
          currentViewport.height === nextViewport.height
        ) {
          return currentViewport;
        }

        return nextViewport;
      });
    };

    updateViewport();

    const observer = new ResizeObserver(updateViewport);
    observer.observe(frame);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const mosaicCanvas = mosaicCanvasRef.current;
    const particleCanvas = particleCanvasRef.current;

    if (!viewport || !mosaicCanvas || !particleCanvas) {
      return;
    }

    let animationFrame = 0;
    let isActive = true;
    let hasStarted = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const image = new Image();

    image.decoding = 'async';
    image.src = imageUrl;

    const startAnimation = () => {
      if (!isActive || hasStarted) {
        return;
      }

      hasStarted = true;

      const mosaicContext = prepareCanvas(mosaicCanvas, viewport, dpr);
      const particleContext = prepareCanvas(particleCanvas, viewport, dpr);

      if (!mosaicContext || !particleContext) {
        return;
      }

      const sourceCanvas = document.createElement('canvas');
      sourceCanvas.width = viewport.width;
      sourceCanvas.height = viewport.height;

      const sourceContext = sourceCanvas.getContext('2d', {
        willReadFrequently: true,
      });

      if (!sourceContext) {
        return;
      }

      sourceContext.clearRect(0, 0, viewport.width, viewport.height);
      drawContainedImage(sourceContext, image, viewport.width, viewport.height);

      const imageData = sourceContext.getImageData(
        0,
        0,
        viewport.width,
        viewport.height,
      );
      const particles = createParticles(imageData, viewport.width, viewport.height);
      const startedAt = performance.now();

      const render = (now: number) => {
        const progress = clamp((now - startedAt) / DURATION);

        drawMosaic(mosaicContext, imageData, viewport, progress);
        drawParticles(particleContext, particles, viewport, progress, now);

        if (progress < 1 && isActive) {
          animationFrame = requestAnimationFrame(render);
          return;
        }

        mosaicContext.clearRect(0, 0, viewport.width, viewport.height);
        particleContext.clearRect(0, 0, viewport.width, viewport.height);
        onComplete?.();
      };

      animationFrame = requestAnimationFrame(render);
    };

    image.onload = startAnimation;

    if (image.complete) {
      startAnimation();
    }

    return () => {
      isActive = false;
      cancelAnimationFrame(animationFrame);
    };
  }, [imageUrl, onComplete, viewport]);

  return (
    <div className="ai-reveal" ref={frameRef}>
      <img className="ai-reveal__image" src={imageUrl} alt={alt} />
      <img
        className="ai-reveal__blur-patch ai-reveal__blur-patch--one"
        src={imageUrl}
        alt=""
        aria-hidden="true"
      />
      <img
        className="ai-reveal__blur-patch ai-reveal__blur-patch--two"
        src={imageUrl}
        alt=""
        aria-hidden="true"
      />
      <canvas
        className="ai-reveal__canvas ai-reveal__canvas--mosaic"
        ref={mosaicCanvasRef}
        aria-hidden="true"
      />
      <canvas
        className="ai-reveal__canvas ai-reveal__canvas--particles"
        ref={particleCanvasRef}
        aria-hidden="true"
      />
      <span className="ai-reveal__grain" aria-hidden="true" />
    </div>
  );
}
