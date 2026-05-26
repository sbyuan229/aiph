import { useCallback, useEffect, useState } from 'react';
import { ScenePreview } from './components/ScenePreview';
import { scenes } from './lib/scenes';

const PAUSE_AFTER_ANIMATION_MIN_MS = 4000;
const PAUSE_AFTER_ANIMATION_MAX_MS = 6000;
const PRELOAD_AHEAD_COUNT = 4;
const preloadedImages = new Map<string, HTMLImageElement>();

type PlaybackState = {
  order: number[];
  position: number;
};

const createPlaybackOrder = (length: number, previousIndex?: number) => {
  const order = Array.from({ length }, (_, index) => index);

  for (let index = order.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
  }

  if (previousIndex !== undefined && order.length > 1 && order[0] === previousIndex) {
    [order[0], order[1]] = [order[1], order[0]];
  }

  return order;
};

const createPauseAfterAnimation = () =>
  PAUSE_AFTER_ANIMATION_MIN_MS +
  Math.random() * (PAUSE_AFTER_ANIMATION_MAX_MS - PAUSE_AFTER_ANIMATION_MIN_MS);

const preloadSceneImages = (imageUrls: string[]) => {
  for (const imageUrl of imageUrls) {
    if (preloadedImages.has(imageUrl)) {
      continue;
    }

    const image = new Image();
    image.decoding = 'async';
    image.src = imageUrl;
    preloadedImages.set(imageUrl, image);
  }
};

const getUpcomingSceneImageUrls = (playback: PlaybackState) => {
  if (scenes.length <= 1 || playback.order.length === 0) {
    return [];
  }

  return Array.from(
    { length: Math.min(PRELOAD_AHEAD_COUNT, playback.order.length - 1) },
    (_, index) => {
      const nextPosition = (playback.position + index + 1) % playback.order.length;
      const sceneIndex = playback.order[nextPosition];

      return sceneIndex === undefined ? undefined : scenes[sceneIndex]?.imageUrl;
    },
  ).filter((imageUrl): imageUrl is string => Boolean(imageUrl));
};

function App() {
  const [playback, setPlayback] = useState<PlaybackState>(() => ({
    order: createPlaybackOrder(scenes.length),
    position: 0,
  }));
  const [completedSceneId, setCompletedSceneId] = useState<string | null>(null);

  const activeIndex = playback.order[playback.position] ?? 0;
  const activeScene = scenes[activeIndex] ?? scenes[0];

  const handleSceneComplete = useCallback(() => {
    if (!activeScene) {
      return;
    }

    setCompletedSceneId(activeScene.id);
  }, [activeScene]);

  useEffect(() => {
    setPlayback((currentPlayback) => {
      const isCurrentOrderValid =
        currentPlayback.order.length === scenes.length &&
        currentPlayback.order.every((index) => index >= 0 && index < scenes.length) &&
        currentPlayback.position < scenes.length;

      if (isCurrentOrderValid) {
        return currentPlayback;
      }

      return {
        order: createPlaybackOrder(scenes.length),
        position: 0,
      };
    });
  }, []);

  useEffect(() => {
    preloadSceneImages(getUpcomingSceneImageUrls(playback));
  }, [playback]);

  useEffect(() => {
    if (scenes.length <= 1 || !activeScene || completedSceneId !== activeScene.id) {
      return;
    }

    const timer = window.setTimeout(() => {
      setPlayback((currentPlayback) => {
        const nextPosition = currentPlayback.position + 1;

        if (nextPosition < currentPlayback.order.length) {
          return {
            ...currentPlayback,
            position: nextPosition,
          };
        }

        return {
          order: createPlaybackOrder(
            scenes.length,
            currentPlayback.order[currentPlayback.position],
          ),
          position: 0,
        };
      });
      setCompletedSceneId(null);
    }, createPauseAfterAnimation());

    return () => window.clearTimeout(timer);
  }, [activeScene, completedSceneId]);

  if (scenes.length === 0) {
    return (
      <main className="app-shell">
        <div className="player-frame player-frame--empty" aria-label="尚未放入素材" />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <ScenePreview scene={activeScene} onRevealComplete={handleSceneComplete} />
    </main>
  );
}

export default App;
