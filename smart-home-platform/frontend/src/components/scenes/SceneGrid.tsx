import SceneCard from './SceneCard';
import type { Scene } from '@/types';

interface SceneGridProps {
  scenes: Scene[];
  onActivate: (sceneId: string) => void;
  onEdit?: (scene: Scene) => void;
  onDelete?: (sceneId: string) => void;
}

export default function SceneGrid({ scenes, onActivate, onEdit, onDelete }: SceneGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {scenes.map((scene) => (
        <SceneCard
          key={scene.id}
          scene={scene}
          onActivate={() => onActivate(scene.id)}
          onEdit={onEdit ? () => onEdit(scene) : undefined}
          onDelete={onDelete ? () => onDelete(scene.id) : undefined}
        />
      ))}
    </div>
  );
}
