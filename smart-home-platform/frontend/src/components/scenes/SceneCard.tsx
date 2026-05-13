import { Play, Star, Edit, Trash2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { Scene } from '@/types';

interface SceneCardProps {
  scene: Scene;
  onActivate: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function SceneCard({ scene, onActivate, onEdit, onDelete }: SceneCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          {scene.icon && <span className="text-3xl">{scene.icon}</span>}
          <div>
            <h3 className="font-semibold text-lg">{scene.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {scene.devices?.length || 0} devices
            </p>
          </div>
        </div>

        {scene.is_favorite && (
          <Star className="text-yellow-500 fill-yellow-500" size={20} />
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          className="flex-1"
          onClick={onActivate}
        >
          <Play size={16} className="mr-2" />
          Activate
        </Button>

        {onEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit size={16} />
          </Button>
        )}

        {onDelete && (
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 size={16} />
          </Button>
        )}
      </div>
    </Card>
  );
}
