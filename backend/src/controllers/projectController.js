import Project from '../models/Project.js';
import Task from '../models/Task.js';
import { deleteFile } from '../utils/upload.js';
import path from 'path';

// Получение всех проектов пользователя
export const getProjects = async (req, res) => {
  try {
    const { type, status } = req.query;
    const userId = req.user._id;
    
    let query = { isArchived: status === 'archived' };
    
    if (type === 'own') {
      query.owner = userId;
    } else if (type === 'invited') {
      query['members.user'] = userId;
      query.owner = { $ne: userId };
    } else {
      // Все проекты (свои + приглашенные)
      query.$or = [
        { owner: userId },
        { 'members.user': userId }
      ];
    }
    
    const projects = await Project.find(query)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .populate('categories', 'name color')
      .sort({ updatedAt: -1 });
    
    // Подсчет задач для каждого проекта
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const tasksCount = await Task.countDocuments({
          project: project._id,
          isArchived: false
        });
        
        const overdueCount = await Task.countDocuments({
          project: project._id,
          isArchived: false,
          deadline: { $lt: new Date() },
          status: { $ne: 'Done' }
        });
        
        return {
          ...project.toObject(),
          tasksCount,
          overdueCount,
          userRole: project.getUserRole(userId)
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        projects: projectsWithStats
      }
    });
    
  } catch (error) {
    console.error('Ошибка получения проектов:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении проектов'
    });
  }
};

// Получение проекта по ID
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const project = await Project.findById(id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .populate('categories', 'name color');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Проект не найден'
      });
    }
    
    // Проверка доступа
    if (!project.hasAccess(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Нет доступа к этому проекту'
      });
    }
    
    // Статистика задач
    const tasksStats = await Task.aggregate([
      { $match: { project: project._id, isArchived: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalTasks = await Task.countDocuments({
      project: project._id,
      isArchived: false
    });
    
    const overdueCount = await Task.countDocuments({
      project: project._id,
      isArchived: false,
      deadline: { $lt: new Date() },
      status: { $ne: 'Done' }
    });
    
    res.json({
      success: true,
      data: {
        project: {
          ...project.toObject(),
          userRole: project.getUserRole(userId),
          stats: {
            total: totalTasks,
            overdue: overdueCount,
            byStatus: tasksStats
          }
        }
      }
    });
    
  } catch (error) {
    console.error('Ошибка получения проекта:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении проекта'
    });
  }
};

// Создание нового проекта
export const createProject = async (req, res) => {
  try {
    const { name, description, color, links, categories, tags } = req.body;
    const userId = req.user._id;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Название проекта обязательно'
      });
    }
    
    // Создание проекта с системными колонками
    const project = await Project.create({
      name,
      description: description || '',
      color: color || '#8B5CF6',
      owner: userId,
      members: [{
        user: userId,
        role: 'Owner',
        addedAt: new Date()
      }],
      links: links || [],
      categories: categories || [],
      tags: tags || [],
      columns: [
        { name: 'Assigned', order: 0 },
        { name: 'In Progress', order: 1 },
        { name: 'Done', order: 2 }
      ]
    });
    
    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'name email avatar')
      .populate('categories', 'name color');
    
    res.status(201).json({
      success: true,
      message: 'Проект успешно создан',
      data: {
        project: populatedProject
      }
    });
    
  } catch (error) {
    console.error('Ошибка создания проекта:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании проекта'
    });
  }
};

// Обновление проекта
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, links, categories, tags } = req.body;
    const userId = req.user._id;
    
    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Проект не найден'
      });
    }
    
    // Проверка прав (только Owner и Collaborator могут редактировать)
    if (!project.hasAccess(userId, 'Collaborator')) {
      return res.status(403).json({
        success: false,
        message: 'Недостаточно прав для редактирования проекта'
      });
    }
    
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (color) project.color = color;
    if (links) project.links = links;
    if (categories) project.categories = categories;
    if (tags) project.tags = tags;
    
    await project.save();
    
    const updatedProject = await Project.findById(id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .populate('categories', 'name color');
    
    res.json({
      success: true,
      message: 'Проект успешно обновлен',
      data: {
        project: updatedProject
      }
    });
    
  } catch (error) {
    console.error('Ошибка обновления проекта:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении проекта'
    });
  }
};

// Архивирование проекта
export const archiveProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Проект не найден'
      });
    }
    
    // Только владелец может архивировать
    if (project.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Только владелец может архивировать проект'
      });
    }
    
    project.isArchived = true;
    project.archivedAt = new Date();
    await project.save();
    
    // Архивировать все задачи проекта
    await Task.updateMany(
      { project: id },
      { isArchived: true, archivedAt: new Date() }
    );
    
    res.json({
      success: true,
      message: 'Проект успешно архивирован'
    });
    
  } catch (error) {
    console.error('Ошибка архивирования проекта:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при архивировании проекта'
    });
  }
};

// Восстановление проекта из архива
export const restoreProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Проект не найден'
      });
    }
    
    // Только владелец может восстанавливать
    if (project.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Только владелец может восстановить проект'
      });
    }
    
    project.isArchived = false;
    project.archivedAt = null;
    await project.save();
    
    // Восстановить задачи проекта
    await Task.updateMany(
      { project: id },
      { isArchived: false, archivedAt: null }
    );
    
    res.json({
      success: true,
      message: 'Проект успешно восстановлен'
    });
    
  } catch (error) {
    console.error('Ошибка восстановления проекта:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при восстановлении проекта'
    });
  }
};

// Удаление проекта
export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Проект не найден'
      });
    }
    
    // Только владелец может удалять
    if (project.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Только владелец может удалить проект'
      });
    }
    
    // Удаление файлов проекта
    if (project.files && project.files.length > 0) {
      project.files.forEach(file => {
        const filePath = path.join(process.cwd(), file.path);
        deleteFile(filePath);
      });
    }
    
    // Удаление всех задач проекта и их файлов
    const tasks = await Task.find({ project: id });
    for (const task of tasks) {
      if (task.files && task.files.length > 0) {
        task.files.forEach(file => {
          const filePath = path.join(process.cwd(), file.path);
          deleteFile(filePath);
        });
      }
    }
    
    await Task.deleteMany({ project: id });
    await Project.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Проект успешно удален'
    });
    
  } catch (error) {
    console.error('Ошибка удаления проекта:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении проекта'
    });
  }
};

// Выход из проекта
export const leaveProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Проект не найден'
      });
    }
    
    // Владелец не может выйти из проекта
    if (project.owner.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Владелец не может выйти из проекта. Удалите проект или передайте права другому пользователю'
      });
    }
    
    // Удаление пользователя из участников
    project.members = project.members.filter(
      member => member.user.toString() !== userId.toString()
    );
    
    await project.save();
    
    res.json({
      success: true,
      message: 'Вы успешно вышли из проекта'
    });
    
  } catch (error) {
    console.error('Ошибка выхода из проекта:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при выходе из проекта'
    });
  }
};

// Управление колонками
export const updateColumns = async (req, res) => {
  try {
    const { id } = req.params;
    const { columns } = req.body;
    const userId = req.user._id;
    
    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Проект не найден'
      });
    }
    
    if (!project.hasAccess(userId, 'Member')) {
      return res.status(403).json({
        success: false,
        message: 'Недостаточно прав'
      });
    }
    
    project.columns = columns;
    await project.save();
    
    res.json({
      success: true,
      message: 'Колонки успешно обновлены',
      data: {
        columns: project.columns
      }
    });
    
  } catch (error) {
    console.error('Ошибка обновления колонок:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении колонок'
    });
  }
};
