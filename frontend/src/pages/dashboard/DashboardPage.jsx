import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, ListTodo, Tag, User, LogOut } from 'lucide-react';

const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T24</span>
              </div>
              <span className="text-xl font-bold">Task24</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Привет, {user?.name}!</span>
              <button onClick={logout} className="btn btn-outline btn-sm">
                <LogOut className="w-4 h-4" />
                Выход
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6">
          <div className="flex gap-6">
            <Link to="/dashboard" className="flex items-center gap-2 px-4 py-3 border-b-2 border-primary text-primary font-medium">
              <LayoutDashboard className="w-5 h-5" />
              Дашборд
            </Link>
            <Link to="/projects" className="flex items-center gap-2 px-4 py-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
              <FolderKanban className="w-5 h-5" />
              Проекты
            </Link>
            <Link to="/categories" className="flex items-center gap-2 px-4 py-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
              <Tag className="w-5 h-5" />
              Категории
            </Link>
            <Link to="/profile" className="flex items-center gap-2 px-4 py-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900">
              <User className="w-5 h-5" />
              Профиль
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Дашборд</h1>
          <p className="text-gray-600">Обзор ваших задач и проектов</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">Всего задач</h3>
              <ListTodo className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm text-gray-500 mt-2">Активных задач</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">Проектов</h3>
              <FolderKanban className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm text-gray-500 mt-2">Активных проектов</p>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">Категорий</h3>
              <Tag className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm text-gray-500 mt-2">Созданных категорий</p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Последние задачи</h2>
          <div className="text-center py-12 text-gray-500">
            <ListTodo className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>У вас пока нет задач</p>
            <p className="text-sm mt-2">Создайте первую задачу или проект</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
