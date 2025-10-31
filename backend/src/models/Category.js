import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Название категории обязательно'],
    trim: true,
    maxlength: [50, 'Название не должно превышать 50 символов']
  },
  color: {
    type: String,
    required: [true, 'Цвет категории обязателен'],
    match: [/^#[0-9A-Fa-f]{6}$/, 'Некорректный формат цвета (должен быть HEX)']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Описание не должно превышать 200 символов'],
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Индекс для быстрого поиска категорий пользователя
categorySchema.index({ createdBy: 1 });

// Виртуальное поле для подсчета использований (будет заполняться через aggregate)
categorySchema.virtual('usageInTasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'category',
  count: true
});

categorySchema.virtual('usageInProjects', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'categories',
  count: true
});

const Category = mongoose.model('Category', categorySchema);

export default Category;
