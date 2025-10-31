import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, User, Paperclip, AlertCircle } from 'lucide-react';

const TaskCard = ({ task, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const priorityColors = {
    Low: 'bg-gray-100 text-gray-700',
    Medium: 'bg-blue-100 text-blue-700',
    High: 'bg-orange-100 text-orange-700',
    Urgent: 'bg-red-100 text-red-700'
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
    >
      <h4 className="font-medium mb-2">{task.title}</h4>
      
      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {task.priority && (
          <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
        )}
        {task.category && (
          <span
            className="text-xs px-2 py-1 rounded-full text-white"
            style={{ backgroundColor: task.category.color }}
          >
            {task.category.name}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          {task.deadline && (
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : ''}`}>
              {isOverdue && <AlertCircle className="w-3 h-3" />}
              <Calendar className="w-3 h-3" />
              {new Date(task.deadline).toLocaleDateString('ru-RU')}
            </div>
          )}
          {task.assignee && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {task.assignee.name}
            </div>
          )}
        </div>
        {task.files?.length > 0 && (
          <div className="flex items-center gap-1">
            <Paperclip className="w-3 h-3" />
            {task.files.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
