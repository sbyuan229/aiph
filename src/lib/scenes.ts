export type SceneAsset = {
  id: string;
  title: string;
  imageUrl: string;
  prompt: string;
};

const imageModules = import.meta.glob<string>(
  '../assets/scenes/*.{png,jpg,jpeg,webp,gif,svg}',
  {
    eager: true,
    query: '?url',
    import: 'default',
  },
);

const promptModules = import.meta.glob<string>('../assets/scenes/*.txt', {
  eager: true,
  query: '?raw',
  import: 'default',
});

const fileStem = (path: string) => {
  const fileName = path.split('/').pop() ?? path;
  return fileName.replace(/\.[^.]+$/, '');
};

const formatTitle = (id: string) =>
  id
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');

export const scenes: SceneAsset[] = Object.entries(imageModules)
  .map(([imagePath, imageUrl]) => {
    const id = fileStem(imagePath);
    const promptEntry = Object.entries(promptModules).find(
      ([promptPath]) => fileStem(promptPath) === id,
    );

    return {
      id,
      title: formatTitle(id),
      imageUrl,
      prompt: promptEntry?.[1].trim() || '尚未找到同名文字檔。',
    };
  })
  .sort((a, b) => a.id.localeCompare(b.id));
