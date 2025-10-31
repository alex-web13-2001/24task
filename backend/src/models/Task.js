import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Название задачи обязательно'],
    trim: true,
    maxlength: [200, 'Название не должно превышать 200 символов']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null // null для личных задач
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  status: {
    type: String,
    required: true,
    default: 'Assigned'
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  deadline: {
    type: Date,
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }],
  files: [{
    name: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPersonal: {
    type: Boolean,
    default: false // true для личных задач
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date,
    default: null
  },
  // Для сортировки в колонках Kanban
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Индексы для оптимизации запросов
taskSchema.index({ project: 1, isArchived: 1 });
taskSchema.index({ createdBy: 1, isPersonal: 1, isArchived: 1 });
taskSchema.index({ assignee: 1, isArchived: 1 });
taskSchema.index({ status: 1, project: 1 });

// Метод для проверки просрочки
taskSchema.methods.isOverdue = function() {
  if (!this.deadline) return false;
  return new Date() > this.deadline && this.status !== 'Done';
};

const Task = mongoose.model('Task', taskSchema);

export default Task;
