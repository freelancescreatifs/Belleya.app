import { useState } from 'react';
import { Edit2, Trash2, Plus, FileEdit, CalendarCheck, CheckCircle, Video, Image as ImageIcon, Layers, BookOpen, Camera, Scissors, Eye, EyeOff } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDraggable,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core';
import ProductionProgressBar from './ProductionProgressBar';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  content_type: string;
  platform: string;
  publication_date: string;
  publication_time?: string;
  status: 'idea' | 'script' | 'shooting' | 'editing' | 'scheduled' | 'published';
  image_url?: string;
  editorial_pillar?: string;
  angle?: string;
  enriched_title?: string;
  objective?: string;
  date_script?: string;
  date_shooting?: string;
  date_editing?: string;
  date_scheduling?: string;
  is_published?: boolean;
}

interface EditorialPillar {
  pillar_name: string;
  color: string;
}

interface KanbanViewProps {
  contents: ContentItem[];
  pillars: EditorialPillar[];
  viewMode: 'status' | 'type';
  onContentEdit: (content: ContentItem) => void;
  onContentDelete: (id: string) => void;
  onContentUpdated: (contentId: string, updates: Partial<ContentItem>) => void;
  onContentCreate: (options: { mode: 'create'; prefillData?: Partial<ContentItem> }) => void;
}

const STATUS_COLUMNS = [
  { id: 'script', label: 'Écriture', icon: FileEdit, color: 'bg-orange-100' },
  { id: 'shooting', label: 'Tournage', icon: Camera, color: 'bg-purple-100' },
  { id: 'editing', label: 'Montage', icon: Scissors, color: 'bg-indigo-100', hiddenByDefault: true },
  { id: 'scheduled', label: 'Programmé', icon: CalendarCheck, color: 'bg-blue-100' },
  { id: 'published', label: 'Publié', icon: CheckCircle, color: 'bg-green-100' },
];

const TYPE_COLUMNS = [
  { id: 'post', label: 'Posts', icon: ImageIcon },
  { id: 'reel', label: 'Reels', icon: Video },
  { id: 'carrousel', label: 'Carrousels', icon: Layers },
  { id: 'story', label: 'Stories', icon: BookOpen },
  { id: 'video', label: 'Vidéos', icon: Video },
  { id: 'live', label: 'Lives', icon: Video },
];

export default function KanbanView({
  contents,
  pillars,
  viewMode,
  onContentEdit,
  onContentDelete,
  onContentUpdated,
  onContentCreate
}: KanbanViewProps) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(() => {
    const stored = localStorage.getItem(`kanban-hidden-${viewMode}`);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
    const defaultHidden = STATUS_COLUMNS
      .filter(col => col.hiddenByDefault)
      .map(col => col.id);
    return new Set(defaultHidden);
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
        delay: 100,
        tolerance: 5,
      },
    })
  );

  const columns = viewMode === 'status' ? STATUS_COLUMNS : TYPE_COLUMNS;

  function toggleColumnVisibility(columnId: string) {
    const newHidden = new Set(hiddenColumns);
    if (newHidden.has(columnId)) {
      newHidden.delete(columnId);
    } else {
      newHidden.add(columnId);
    }
    setHiddenColumns(newHidden);
    localStorage.setItem(`kanban-hidden-${viewMode}`, JSON.stringify(Array.from(newHidden)));
  }

  function getContentsForColumn(columnId: string) {
    if (viewMode === 'status') {
      return contents.filter(c => c.status === columnId && c.status !== 'idea');
    } else {
      return contents.filter(c => c.content_type === columnId && c.status !== 'idea');
    }
  }

  function getPillarColor(pillarName: string) {
    const pillar = pillars.find(p => p.pillar_name === pillarName);
    return pillar?.color || '#3B82F6';
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over || active.id === over.id) return;

    const contentId = active.id as string;
    const newValue = over.id as string;

    if (viewMode === 'status') {
      onContentUpdated(contentId, { status: newValue as any });
    } else {
      onContentUpdated(contentId, { content_type: newValue });
    }
  }

  function handleCreateInColumn(columnId: string) {
    if (viewMode === 'status') {
      onContentCreate({
        mode: 'create',
        prefillData: {
          status: columnId as any,
          publication_date: new Date().toISOString().split('T')[0],
          publication_time: '12:00'
        }
      });
    } else {
      onContentCreate({
        mode: 'create',
        prefillData: {
          content_type: columnId,
          status: 'script',
          publication_date: new Date().toISOString().split('T')[0],
          publication_time: '12:00'
        }
      });
    }
  }

  const activeContent = activeDragId ? contents.find(c => c.id === activeDragId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(event) => setActiveDragId(event.active.id as string)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.filter(col => !hiddenColumns.has(col.id)).map((column) => {
          const columnContents = getContentsForColumn(column.id);
          const Icon = column.icon;

          return (
            <KanbanColumn
              key={column.id}
              columnId={column.id}
              label={column.label}
              icon={<Icon className="w-5 h-5" />}
              color={column.color}
              count={columnContents.length}
              isHidden={false}
              onToggleVisibility={() => toggleColumnVisibility(column.id)}
              onCreateContent={() => handleCreateInColumn(column.id)}
              viewMode={viewMode}
            >
              <div className="space-y-3 mb-3">
                {columnContents.map((content) => (
                  <KanbanCard
                    key={content.id}
                    content={content}
                    pillarColor={content.editorial_pillar ? getPillarColor(content.editorial_pillar) : undefined}
                    onEdit={() => onContentEdit(content)}
                    onDelete={() => onContentDelete(content.id)}
                    showImage={true}
                  />
                ))}
                {columnContents.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Aucun contenu
                  </div>
                )}
              </div>
              <button
                onClick={() => handleCreateInColumn(column.id)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors text-sm font-medium border-2 border-dashed border-gray-300 hover:border-gray-400"
              >
                <Plus className="w-4 h-4" />
                Nouveau contenu
              </button>
            </KanbanColumn>
          );
        })}

        {hiddenColumns.size > 0 && (
          <div className="flex-shrink-0 w-16">
            <div className="bg-gray-100 rounded-xl p-4 h-full min-h-[400px] flex flex-col gap-2">
              {columns.filter(col => hiddenColumns.has(col.id)).map((column) => {
                const Icon = column.icon;
                const columnContents = getContentsForColumn(column.id);
                return (
                  <button
                    key={column.id}
                    onClick={() => toggleColumnVisibility(column.id)}
                    className="p-2 bg-white rounded-lg hover:bg-gray-50 transition-colors group relative"
                    title={column.label}
                  >
                    <Icon className="w-4 h-4 text-gray-600" />
                    {columnContents.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                        {columnContents.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeContent ? (
          <div className="w-80 opacity-90">
            <KanbanCard
              content={activeContent}
              pillarColor={activeContent.editorial_pillar ? getPillarColor(activeContent.editorial_pillar) : undefined}
              onEdit={() => {}}
              onDelete={() => {}}
              showImage={true}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  columnId,
  label,
  icon,
  color,
  count,
  isHidden,
  onToggleVisibility,
  onCreateContent,
  viewMode,
  children
}: {
  columnId: string;
  label: string;
  icon: React.ReactNode;
  color?: string;
  count: number;
  isHidden: boolean;
  onToggleVisibility: () => void;
  onCreateContent: () => void;
  viewMode: 'status' | 'type';
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
  });

  return (
    <div className="flex-shrink-0 w-80">
      <div className={`rounded-xl border-2 transition-all duration-200 ${isOver ? 'border-orange-400 bg-orange-50 shadow-lg scale-[1.02]' : 'border-gray-200 bg-white'}`}>
        <div className={`p-4 rounded-t-xl ${color || 'bg-gray-100'} ${isOver ? 'bg-opacity-80' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {icon}
              <h3 className="font-bold text-gray-900">{label}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 bg-white rounded-full text-sm font-medium transition-colors ${isOver ? 'bg-orange-500 text-white' : 'text-gray-700'}`}>
                {count}
              </span>
              <button
                onClick={onToggleVisibility}
                className="p-1 hover:bg-white/80 rounded transition-colors"
                title="Masquer cette colonne"
              >
                <Eye className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
        <div
          ref={setNodeRef}
          className={`p-4 min-h-[400px] flex flex-col transition-colors ${isOver ? 'bg-orange-50/50' : ''}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function KanbanCard({
  content,
  pillarColor,
  onEdit,
  onDelete,
  showImage
}: {
  content: ContentItem;
  pillarColor?: string;
  onEdit: () => void;
  onDelete: () => void;
  showImage?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: content.id,
    data: { content }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.8 : 1,
    transition: isDragging ? 'none' : 'transform 200ms ease',
    zIndex: isDragging ? 50 : 1,
    scale: isDragging ? 1.05 : 1,
  } : undefined;

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'idea': 'Idée',
      'script': 'Écriture',
      'shooting': 'Tournage',
      'editing': 'Montage',
      'scheduled': 'Programmé',
      'published': 'Publié',
    };
    return labels[status] || status;
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      'idea': 'bg-gray-100 text-gray-700',
      'script': 'bg-blue-100 text-blue-700',
      'shooting': 'bg-purple-100 text-purple-700',
      'editing': 'bg-indigo-100 text-indigo-700',
      'scheduled': 'bg-blue-100 text-blue-700',
      'published': 'bg-green-100 text-green-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all ${isDragging ? 'shadow-2xl ring-2 ring-blue-400 cursor-grabbing' : 'hover:shadow-md cursor-grab'}`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 text-base mb-1">
              {(content.enriched_title || content.title).toUpperCase()}
            </h4>
            <p className="text-sm text-gray-500">
              {content.publication_time ? `à ${content.publication_time}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors"
              title="Modifier"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusBadgeColor(content.status)}`}>
            <CheckCircle className="w-3 h-3 inline mr-1" />
            {getStatusLabel(content.status)}
          </span>

          <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium flex items-center gap-1">
            <Layers className="w-3 h-3" />
            {content.content_type}
          </span>

          {content.platform.split(',').map((platform, idx) => (
            <span key={idx} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
              {platform.trim()}
            </span>
          ))}
        </div>

        <div className="mb-4">
          <ProductionProgressBar
            dates={{
              date_script: content.date_script,
              date_shooting: content.date_shooting,
              date_editing: content.date_editing,
              date_scheduling: content.date_scheduling,
            }}
            status={content.status}
            contentType={content.content_type}
            contentId={content.id}
            publicationDate={content.publication_date}
          />
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="w-full text-sm text-blue-600 font-medium hover:underline text-left"
        >
          Voir plus
        </button>
      </div>
    </div>
  );
}
