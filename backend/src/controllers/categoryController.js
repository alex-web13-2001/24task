import Category from '../models/Category.js';
import Task from '../models/Task.js';
import Project from '../models/Project.js';

// Получение всех категорий пользователя
export const getCategories = async (req, res) => {
  try {
    const userId = req.user._id;
    const { search, sortBy } = req.query;
    
    let query = { createdBy: userId };
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    const categories = await Category.find(query);
    
    // Подсчет использований
    const categoriesWithUsage = await Promise.all(
      categories.map(async (category) => {
        const tasksCount = await Task.countDocuments({
          category: category._id,
          isArchived: false
        });
        
        const projectsCount = await Project.countDocuments({
          categories: category._id,
          isArchived: false
        });
        
        return {
          ...category.toObject(),
          usageInTasks: tasksCount,
          usageInProjects: projectsCount
        };
      })
    );
    
    // Сортировка
    if (sortBy === 'usage') {
      categoriesWithUsage.sort((a, b) => 
        (b.usageInTasks + b.usageInProjects) - (a.usageInTasks + a.usageInProjects)
      );
    } else {
      categoriesWithUsage.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    res.json({
      success: true,
      data: {
        categories: categoriesWithUsage
      }
    });
    
  } catch (error) {
    console.error('Ошибка получения категорий:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении категорий'
    });
  }
};

// Получение категории по ID
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const category = await Category.findOne({
      _id: id,
      createdBy: userId
    });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Категория не найдена'
      });
    }
    
    res.json({
      success: true,
      data: {
        category
      }
    });
    
  } catch (error) {
    console.error('Ошибка получения категории:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении категории'
    });
  }
};

// Создание категории
export const createCategory = async (req, res) => {
  try {
    const { name, color, description } = req.body;
    const userId = req.user._id;
    
    if (!name || !color) {
      return res.status(400).json({
        success: false,
        message: 'Название и цвет обязательны'
      });
    }
    
    // Проверка формата цвета
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!colorRegex.test(color)) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный формат цвета (должен быть HEX)'
      });
    }
    
    // Проверка уникальности названия для пользователя
    const existingCategory = await Category.findOne({
      name,
      createdBy: userId
    });
    
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Категория с таким названием уже существует'
      });
    }
    
    const category = await Category.create({
      name,
      color,
      description: description || '',
      createdBy: userId
    });
    
    res.status(201).json({
      success: true,
      message: 'Категория успешно создана',
      data: {
        category
      }
    });
    
  } catch (error) {
    console.error('Ошибка создания категории:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании категории'
    });
  }
};

// Обновление категории
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, description } = req.body;
    const userId = req.user._id;
    
    const category = await Category.findOne({
      _id: id,
      createdBy: userId
    });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Категория не найдена'
      });
    }
    
    if (name) {
      // Проверка уникальности нового названия
      const existingCategory = await Category.findOne({
        name,
        createdBy: userId,
        _id: { $ne: id }
      });
      
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Категория с таким названием уже существует'
        });
      }
      
      category.name = name;
    }
    
    if (color) {
      const colorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (!colorRegex.test(color)) {
        return res.status(400).json({
          success: false,
          message: 'Некорректный формат цвета (должен быть HEX)'
        });
      }
      category.color = color;
    }
    
    if (description !== undefined) {
      category.description = description;
    }
    
    await category.save();
    
    res.json({
      success: true,
      message: 'Категория успешно обновлена',
      data: {
        category
      }
    });
    
  } catch (error) {
    console.error('Ошибка обновления категории:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении категории'
    });
  }
};

// Удаление категории
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const category = await Category.findOne({
      _id: id,
      createdBy: userId
    });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Категория не найдена'
      });
    }
    
    // Проверка использования категории
    const tasksCount = await Task.countDocuments({ category: id });
    const projectsCount = await Project.countDocuments({ categories: id });
    
    if (tasksCount > 0 || projectsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Невозможно удалить категорию, которая используется в задачах или проектах',
        data: {
          tasksCount,
          projectsCount
        }
      });
    }
    
    await Category.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Категория успешно удалена'
    });
    
  } catch (error) {
    console.error('Ошибка удаления категории:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении категории'
    });
  }
};

// Получение статистики категорий
export const getCategoriesStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const totalCategories = await Category.countDocuments({ createdBy: userId });
    
    const categories = await Category.find({ createdBy: userId });
    
    let totalUsageInTasks = 0;
    for (const category of categories) {
      const count = await Task.countDocuments({
        category: category._id,
        isArchived: false
      });
      totalUsageInTasks += count;
    }
    
    res.json({
      success: true,
      data: {
        totalCategories,
        totalUsageInTasks
      }
    });
    
  } catch (error) {
    console.error('Ошибка получения статистики категорий:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении статистики'
    });
  }
};
