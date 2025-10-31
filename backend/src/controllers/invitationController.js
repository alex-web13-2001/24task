import Invitation from '../models/Invitation.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { sendProjectInvitation } from '../utils/email.js';
import crypto from 'crypto';

// Создание приглашения
export const createInvitation = async (req, res) => {
  try {
    const { projectId, email, role } = req.body;
    const userId = req.user._id;
    
    if (!projectId || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Все поля обязательны'
      });
    }
    
    // Валидация роли
    if (!['Collaborator', 'Member', 'Viewer'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Некорректная роль'
      });
    }
    
    // Проверка проекта
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Проект не найден'
      });
    }
    
    // Проверка прав (только Owner и Collaborator могут приглашать)
    if (!project.hasAccess(userId, 'Collaborator')) {
      return res.status(403).json({
        success: false,
        message: 'Недостаточно прав для приглашения участников'
      });
    }
    
    // Проверка, не является ли пользователь уже участником
    const isAlreadyMember = project.members.some(
      member => member.user.toString() === email || 
      (member.user.email && member.user.email === email)
    );
    
    if (isAlreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'Этот пользователь уже является участником проекта'
      });
    }
    
    // Проверка существующего активного приглашения
    const existingInvitation = await Invitation.findOne({
      project: projectId,
      email,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });
    
    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        message: 'Активное приглашение для этого email уже существует'
      });
    }
    
    // Генерация уникального токена
    const token = crypto.randomBytes(32).toString('hex');
    
    // Создание приглашения
    const invitation = await Invitation.create({
      project: projectId,
      email: email.toLowerCase(),
      role,
      token,
      invitedBy: userId
    });
    
    // Отправка email
    try {
      await sendProjectInvitation(
        email,
        project.name,
        req.user.name,
        role,
        token
      );
    } catch (emailError) {
      console.error('Ошибка отправки приглашения:', emailError);
      // Продолжаем, даже если email не отправлен
    }
    
    res.status(201).json({
      success: true,
      message: 'Приглашение успешно отправлено',
      data: {
        invitation
      }
    });
    
  } catch (error) {
    console.error('Ошибка создания приглашения:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании приглашения'
    });
  }
};

// Получение информации о приглашении по токену
export const getInvitationByToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    const invitation = await Invitation.findOne({ token })
      .populate('project', 'name color description')
      .populate('invitedBy', 'name email');
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Приглашение не найдено'
      });
    }
    
    // Проверка истечения срока
    if (invitation.isExpired()) {
      return res.status(400).json({
        success: false,
        message: 'Срок действия приглашения истек'
      });
    }
    
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Приглашение уже использовано'
      });
    }
    
    res.json({
      success: true,
      data: {
        invitation: {
          project: invitation.project,
          role: invitation.role,
          invitedBy: invitation.invitedBy,
          expiresAt: invitation.expiresAt,
          createdAt: invitation.createdAt
        }
      }
    });
    
  } catch (error) {
    console.error('Ошибка получения приглашения:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении приглашения'
    });
  }
};

// Принятие приглашения
export const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user._id;
    const userEmail = req.user.email;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Токен не предоставлен'
      });
    }
    
    const invitation = await Invitation.findOne({ token });
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Приглашение не найдено'
      });
    }
    
    // Проверка email
    if (invitation.email !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'Это приглашение предназначено для другого email'
      });
    }
    
    // Проверка истечения срока
    if (invitation.isExpired()) {
      return res.status(400).json({
        success: false,
        message: 'Срок действия приглашения истек'
      });
    }
    
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Приглашение уже использовано'
      });
    }
    
    // Проверка проекта
    const project = await Project.findById(invitation.project);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Проект не найден'
      });
    }
    
    // Проверка, не является ли пользователь уже участником
    const isAlreadyMember = project.members.some(
      member => member.user.toString() === userId.toString()
    );
    
    if (isAlreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'Вы уже являетесь участником этого проекта'
      });
    }
    
    // Добавление пользователя в проект
    project.members.push({
      user: userId,
      role: invitation.role,
      addedAt: new Date()
    });
    
    await project.save();
    
    // Обновление статуса приглашения
    invitation.status = 'accepted';
    await invitation.save();
    
    res.json({
      success: true,
      message: 'Вы успешно присоединились к проекту',
      data: {
        project: {
          _id: project._id,
          name: project.name,
          color: project.color
        }
      }
    });
    
  } catch (error) {
    console.error('Ошибка принятия приглашения:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при принятии приглашения'
    });
  }
};

// Удаление участника из проекта
export const removeMember = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;
    const userId = req.user._id;
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Проект не найден'
      });
    }
    
    // Только Owner и Collaborator могут удалять участников
    if (!project.hasAccess(userId, 'Collaborator')) {
      return res.status(403).json({
        success: false,
        message: 'Недостаточно прав для удаления участников'
      });
    }
    
    // Нельзя удалить владельца
    if (project.owner.toString() === memberId) {
      return res.status(400).json({
        success: false,
        message: 'Невозможно удалить владельца проекта'
      });
    }
    
    // Удаление участника
    project.members = project.members.filter(
      member => member.user.toString() !== memberId
    );
    
    await project.save();
    
    res.json({
      success: true,
      message: 'Участник успешно удален из проекта'
    });
    
  } catch (error) {
    console.error('Ошибка удаления участника:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении участника'
    });
  }
};

// Изменение роли участника
export const updateMemberRole = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;
    const { role } = req.body;
    const userId = req.user._id;
    
    if (!['Collaborator', 'Member', 'Viewer'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Некорректная роль'
      });
    }
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Проект не найден'
      });
    }
    
    // Только Owner может изменять роли
    if (project.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Только владелец может изменять роли участников'
      });
    }
    
    // Нельзя изменить роль владельца
    if (project.owner.toString() === memberId) {
      return res.status(400).json({
        success: false,
        message: 'Невозможно изменить роль владельца проекта'
      });
    }
    
    // Обновление роли
    const member = project.members.find(
      m => m.user.toString() === memberId
    );
    
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Участник не найден'
      });
    }
    
    member.role = role;
    await project.save();
    
    res.json({
      success: true,
      message: 'Роль участника успешно обновлена'
    });
    
  } catch (error) {
    console.error('Ошибка обновления роли:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении роли'
    });
  }
};
