import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Название проекта обязательно'],
    trim: true,
    maxlength: [100, 'Название не должно превышать 100 символов']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  color: {
    type: String,
    required: [true, 'Цвет проекта обязателен'],
    match: [/^#[0-9A-Fa-f]{6}$/, 'Некорректный формат цвета (должен быть HEX)'],
    default: '#8B5CF6'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['Owner', 'Collaborator', 'Member', 'Viewer'],
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  links: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    }
  }],
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
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
  columns: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    order: {
      type: Number,
      required: true
    }
  }],
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Индексы для оптимизации запросов
projectSchema.index({ owner: 1, isArchived: 1 });
projectSchema.index({ 'members.user': 1, isArchived: 1 });

// Виртуальное поле для подсчета задач
projectSchema.virtual('tasksCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project',
  count: true
});

// Метод для проверки прав доступа
projectSchema.methods.hasAccess = function(userId, requiredRole = null) {
  const userIdStr = userId.toString();
  
  // Владелец имеет полный доступ
  if (this.owner.toString() === userIdStr) {
    return true;
  }
  
  // Проверка участника
  const member = this.members.find(m => m.user.toString() === userIdStr);
  if (!member) return false;
  
  // Если требуется конкретная роль
  if (requiredRole) {
    const roleHierarchy = { Owner: 4, Collaborator: 3, Member: 2, Viewer: 1 };
    return roleHierarchy[member.role] >= roleHierarchy[requiredRole];
  }
  
  return true;
};

// Метод для получения роли пользователя в проекте
projectSchema.methods.getUserRole = function(userId) {
  const userIdStr = userId.toString();
  
  if (this.owner.toString() === userIdStr) {
    return 'Owner';
  }
  
  const member = this.members.find(m => m.user.toString() === userIdStr);
  return member ? member.role : null;
};

const Project = mongoose.model('Project', projectSchema);

export default Project;
