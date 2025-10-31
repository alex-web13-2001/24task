import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect() {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket.IO подключен');
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket.IO отключен');
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket.IO ошибка:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Присоединение к комнате проекта
  joinProject(projectId) {
    if (this.socket?.connected) {
      this.socket.emit('join-project', projectId);
    }
  }

  // Выход из комнаты проекта
  leaveProject(projectId) {
    if (this.socket?.connected) {
      this.socket.emit('leave-project', projectId);
    }
  }

  // Уведомление об обновлении задачи
  emitTaskUpdated(projectId, task) {
    if (this.socket?.connected) {
      this.socket.emit('task-updated', { projectId, task });
    }
  }

  // Уведомление о создании задачи
  emitTaskCreated(projectId, task) {
    if (this.socket?.connected) {
      this.socket.emit('task-created', { projectId, task });
    }
  }

  // Уведомление об удалении задачи
  emitTaskDeleted(projectId, taskId) {
    if (this.socket?.connected) {
      this.socket.emit('task-deleted', { projectId, taskId });
    }
  }

  // Уведомление об обновлении проекта
  emitProjectUpdated(projectId, project) {
    if (this.socket?.connected) {
      this.socket.emit('project-updated', { projectId, project });
    }
  }

  // Подписка на обновления задач
  onTaskUpdated(callback) {
    if (this.socket) {
      this.socket.on('task-updated', callback);
    }
  }

  // Подписка на создание задач
  onTaskCreated(callback) {
    if (this.socket) {
      this.socket.on('task-created', callback);
    }
  }

  // Подписка на удаление задач
  onTaskDeleted(callback) {
    if (this.socket) {
      this.socket.on('task-deleted', callback);
    }
  }

  // Подписка на обновления проекта
  onProjectUpdated(callback) {
    if (this.socket) {
      this.socket.on('project-updated', callback);
    }
  }

  // Отписка от событий
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

const socketService = new SocketService();

export default socketService;
