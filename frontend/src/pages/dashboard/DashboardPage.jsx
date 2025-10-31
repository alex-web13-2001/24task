import { useQuery } from '@tanstack/react-query';
import Layout from '../../components/layout/Layout';
import { projectAPI, taskAPI, categoryAPI } from '../../services/api';
import { ListTodo, FolderKanban, Tag, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectAPI.getAll({ status: 'active' })
  });

  const { data: tasks } = useQuery({
    queryKey: ['dashboard-tasks'],
    queryFn: () => taskAPI.getAll({})
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getAll({})
  });

  const projectsCount = projects?.data?.data?.projects?.length || 0;
  const tasksCount = tasks?.data?.data?.tasks?.length || 0;
  const categoriesCount = categories?.data?.data?.categories?.length || 0;

  const recentTasks = tasks?.data?.data?.tasks?.slice(0, 5) || [];
  const overdueTasks = recentTasks.filter(task => 
    task.deadline && new Date(task.deadline) < new Date() && task.status !== 'Done'
  );

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Дашборд</h1>
        <p className="text-gray-600">Обзор ваших задач и проектов</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Всего задач</h3>
            <ListTodo className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold">{tasksCount}</p>
          <p className="text-sm text-gray-500 mt-2">Активных задач</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Проектов</h3>
            <FolderKanban className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold">{projectsCount}</p>
          <p className="text-sm text-gray-500 mt-2">Активных проектов</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Категорий</h3>
            <Tag className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold">{categoriesCount}</p>
          <p className="text-sm text-gray-500 mt-2">Созданных категорий</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Просрочено</h3>
            <AlertCircle className="w-5 h-5 text-error" />
          </div>
          <p className="text-3xl font-bold text-error">{overdueTasks.length}</p>
          <p className="text-sm text-gray-500 mt-2">Просроченных задач</p>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Последние задачи</h2>
          <Link to="/projects" className="text-sm text-primary hover:underline">
            Все задачи →
          </Link>
        </div>

        {recentTasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ListTodo className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>У вас пока нет задач</p>
            <p className="text-sm mt-2">Создайте первую задачу или проект</p>
            <Link to="/projects" className="btn btn-primary mt-4">
              Создать проект
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <div
                key={task._id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-medium">{task.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                    {task.project && (
                      <span className="flex items-center gap-1">
                        <FolderKanban className="w-4 h-4" />
                        {task.project.name}
                      </span>
                    )}
                    {task.deadline && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(task.deadline).toLocaleDateString('ru-RU')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${
                    task.priority === 'Urgent' ? 'badge-error' :
                    task.priority === 'High' ? 'badge-warning' :
                    'badge-primary'
                  }`}>
                    {task.priority}
                  </span>
                  <span className="badge badge-primary">{task.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;
