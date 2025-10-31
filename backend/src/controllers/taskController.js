import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { deleteFile } from '../utils/upload.js';
import path from 'path';

// Получение задач (для дашборда, проекта или личных)
export const getTasks = async (req, res) => {
  try {
    const { projectId, personal, status, category, priority, assignee, search } = req.query;
    const userId = req.user._id;
    
    let query = { isArchived: false };
    
    if (projectId) {
      // Задачи конкретного проекта
      const project = await Project.findById(projectId);
      if (!project || !project.hasAccess(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Нет доступа к этому проекту'
        });
      }
      query.project = projectId;
    } else if (personal === 'true') {
      // Личные задачи
      query.isPersonal = true;
      query.createdBy = userId;
    } else {
      // Дашборд: все задачи пользователя (из проектов + личные)
      const userProjects = await Project.find({
        $or: [
          { owner: userId },
          { 'members.user': userId }
        ],
        isArchived: false
      }).select('_id');
      
      const projectIds = userProjects.map(p => p._id);
      
      query.$or = [
        { project: { $in: projectIds } },
        { isPersonal: true, createdBy: userId }
      ];
    }
    
    // Фильтры
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (assignee) query.assignee = assignee;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const tasks = await Task.find(query)
      .populate('project', 'name color')
      .populate('category', 'name color')
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .sort({ order: 1, createdAt: -1 });
    
    res.json({
      success: true,
      data: {
        tasks
      }
    });
    
  } catch (error) {
    console.error('Ошибка получения задач:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении задач'
    });
  }
};

// Получение задачи по ID
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const task = await Task.findById(id)
      .populate('project', 'name color')
      .populate('category', 'name color')
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar');
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Задача не найдена'
      });
    }
    
    // Проверка доступа
    if (task.isPersonal) {
      if (task.createdBy._id.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Нет доступа к этой задаче'
        });
      }
    } else if (task.project) {
      const project = await Project.findById(task.project._id);
      if (!project || !project.hasAccess(userId)) {
        return res.status(403).json({
          success: false,
          message: 'Нет доступа к этой задаче'
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        task
      }
    });
    
  } catch (error) {
    console.error('Ошибка получения задачи:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении задачи'
    });
  }
};

// Создание задачи
export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      projectId,
      category,
      priority,
      status,
      assignee,
      deadline,
      tags
    } = req.body;
    const userId = req.user._id;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Название задачи обязательно'
      });
    }
    
    let isPersonal = false;
    let taskStatus = status || 'Assigned';
    
    // Проверка доступа к проекту
    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Проект не найден'
        });
      }
      
      if (!project.hasAccess(userId, 'Member')) {
        return res.status(403).json({
          success: false,
          message: 'Нет доступа к этому проекту'
        });
      }
    } else {
      isPersonal = true;
    }
    
    const task = await Task.create({
      title,
      description: description || '',
      project: projectId || null,
      category: category || null,
      priority: priority || 'Medium',
      status: taskStatus,
      assignee: assignee || null,
      deadline: deadline || null,
      tags: tags || [],
      createdBy: userId,
      isPersonal
    });
    
    const populatedTask = await Task.findById(task._id)
      .populate('project', 'name color')
      .populate('category', 'name color')
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar');
    
    res.status(201).json({
      success: true,
      message: 'Задача успешно создана',
      data: {
        task: populatedTask
      }
    });
    
  } catch (error) {
    console.error('Ошибка создания задачи:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании задачи'
    });
  }
};

// Обновление задачи
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      priority,
      status,
      assignee,
      deadline,
      tags
    } = req.body;
    const userId = req.user._id;
    
    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Задача не найдена'
      });
    }
    
    // Проверка прав доступа
    if (task.isPersonal) {
      if (task.createdBy.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для редактирования этой задачи'
        });
      }
    } else if (task.project) {
      const project = await Project.findById(task.project);
      if (!project || !project.hasAccess(userId, 'Member')) {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для редактирования этой задачи'
        });
      }
    }
    
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (category !== undefined) task.category = category;
    if (priority) task.priority = priority;
    if (status) task.status = status;
    if (assignee !== undefined) task.assignee = assignee;
    if (deadline !== undefined) task.deadline = deadline;
    if (tags) task.tags = tags;
    
    await task.save();
    
    const updatedTask = await Task.findById(id)
      .populate('project', 'name color')
      .populate('category', 'name color')
      .populate('assignee', 'name email avatar')
      .populate('createdBy', 'name email avatar');
    
    res.json({
      success: true,
      message: 'Задача успешно обновлена',
      data: {
        task: updatedTask
      }
    });
    
  } catch (error) {
    console.error('Ошибка обновления задачи:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении задачи'
    });
  }
};

// Архивирование задачи
export const archiveTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Задача не найдена'
      });
    }
    
    // Проверка прав
    if (task.isPersonal) {
      if (task.createdBy.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для архивирования этой задачи'
        });
      }
    } else if (task.project) {
      const project = await Project.findById(task.project);
      if (!project || !project.hasAccess(userId, 'Member')) {
        return res.status(403).json({
          success: false,
          message: 'Нет прав для архивирования этой задачи'
        });
      }
    }
    
    task.isArchived = true;
    task.archivedAt = new Date();
    await task.save();
    
    res.json({
      success: true,
      message: 'Задача успешно архивирована'
    });
    
  } catch (error) {
    console.error('Ошибка архивирования задачи:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при архивировании задачи'
    });
  }
};

// Восстановление задачи из архива
export const restoreTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Задача не найдена'
      });
    }
    
    // Проверка, что проект не удален
    if (task.project) {
      const project = await Project.findById(task.project);
      if (!project) {
        return res.status(400).json({
          success: false,
          message: 'Невозможно восстановить задачу: проект был удален'
        });
      }
    }
    
    task.isArchived = false;
    task.archivedAt = null;
    await task.save();
    
    res.json({
      success: true,
      message: 'Задача успешно восстановлена'
    });
    
  } catch (error) {
    console.error('Ошибка восстановления задачи:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при восстановлении задачи'
    });
  }
};

// Удаление задачи
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Задача не найдена'
      });
    }
    
    // Проверка прав
    let canDelete = false;
    
    if (task.isPersonal) {
      canDelete = task.createdBy.toString() === userId.toString();
    } else if (task.project) {
      const project = await Project.findById(task.project);
      canDelete = project && project.hasAccess(userId, 'Collaborator');
    }
    
    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Нет прав для удаления этой задачи'
      });
    }
    
    // Удаление файлов задачи
    if (task.files && task.files.length > 0) {
      task.files.forEach(file => {
        const filePath = path.join(process.cwd(), file.path);
        deleteFile(filePath);
      });
    }
    
    await Task.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Задача успешно удалена'
    });
    
  } catch (error) {
    console.error('Ошибка удаления задачи:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении задачи'
    });
  }
};

// Обновление порядка задач (для drag & drop)
export const updateTasksOrder = async (req, res) => {
  try {
    const { tasks } = req.body; // [{ id, status, order }]
    
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({
        success: false,
        message: 'Некорректные данные'
      });
    }
    
    // Обновление задач
    const updates = tasks.map(({ id, status, order }) =>
      Task.findByIdAndUpdate(id, { status, order })
    );
    
    await Promise.all(updates);
    
    res.json({
      success: true,
      message: 'Порядок задач обновлен'
    });
    
  } catch (error) {
    console.error('Ошибка обновления порядка задач:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении порядка задач'
    });
  }
};

// Получение архивных задач
export const getArchivedTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Получение проектов пользователя
    const userProjects = await Project.find({
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ]
    }).select('_id');
    
    const projectIds = userProjects.map(p => p._id);
    
    const tasks = await Task.find({
      isArchived: true,
      $or: [
        { project: { $in: projectIds } },
        { isPersonal: true, createdBy: userId }
      ]
    })
      .populate('project', 'name color')
      .populate('category', 'name color')
      .populate('assignee', 'name email avatar')
      .sort({ archivedAt: -1 });
    
    res.json({
      success: true,
      data: {
        tasks
      }
    });
    
  } catch (error) {
    console.error('Ошибка получения архивных задач:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении архивных задач'
    });
  }
};
