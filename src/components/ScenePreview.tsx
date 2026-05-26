import { useEffect, useState, type CSSProperties } from 'react';
import type { SceneAsset } from '../lib/scenes';
import { ParticleImageReveal } from './ParticleImageReveal';

type ScenePreviewProps = {
  scene: SceneAsset;
  onRevealComplete?: () => void;
};

type ImageDimensions = {
  width: number;
  height: number;
};

type SceneFrameStyle = CSSProperties & {
  '--scene-aspect-ratio'?: string;
  '--scene-aspect-ratio-value'?: string;
};

export function ScenePreview({ scene, onRevealComplete }: ScenePreviewProps) {
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);

  useEffect(() => {
    let isActive = true;
    const image = new Image();

    image.decoding = 'async';
    image.onload = () => {
      if (!isActive || image.naturalWidth === 0 || image.naturalHeight === 0) {
        return;
      }

      setDimensions({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.src = scene.imageUrl;

    return () => {
      isActive = false;
    };
  }, [scene.imageUrl]);

  const frameStyle: SceneFrameStyle | undefined = dimensions
    ? {
        '--scene-aspect-ratio': `${dimensions.width} / ${dimensions.height}`,
        '--scene-aspect-ratio-value': String(dimensions.width / dimensions.height),
      }
    : undefined;

  return (
    <section className="player-frame" style={frameStyle} aria-label={scene.title}>
      <div className="generation-frame">
        <ParticleImageReveal
          key={scene.id}
          imageUrl={scene.imageUrl}
          onComplete={onRevealComplete}
        />
        <span className="scanline" aria-hidden="true" />
      </div>
    </section>
  );
}
