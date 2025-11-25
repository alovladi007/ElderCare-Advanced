import type { Scene } from '@/types';

interface ScenePillProps {
  scene: Scene;
  onClick: () => void;
}

export default function ScenePill({ scene, onClick }: ScenePillProps) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-full hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
    >
      <div className="flex items-center gap-2">
        {scene.icon && <span>{scene.icon}</span>}
        <span className="font-medium">{scene.name}</span>
      </div>
    </button>
  );
}
