import ScenePill from './ScenePill';
import type { Scene } from '@/types';

interface QuickScenesRowProps {
  scenes: Scene[];
  onActivate: (sceneId: string) => void;
}

export default function QuickScenesRow({ scenes, onActivate }: QuickScenesRowProps) {
  const favoriteScenes = scenes.filter(s => s.is_favorite).slice(0, 6);

  if (favoriteScenes.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Quick Scenes</h2>
      <div className="flex flex-wrap gap-3">
        {favoriteScenes.map((scene) => (
          <ScenePill
            key={scene.id}
            scene={scene}
            onClick={() => onActivate(scene.id)}
          />
        ))}
      </div>
    </div>
  );
}
