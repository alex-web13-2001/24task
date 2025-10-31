import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Camera, User, Mail, Lock, Save } from 'lucide-react';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const updateProfileMutation = useMutation({
    mutationFn: userAPI.updateProfile,
    onSuccess: (response) => {
      const updatedUser = response.data.data.user;
      updateUser(updatedUser);
      queryClient.invalidateQueries(['user']);
      toast.success('Профиль обновлен!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка обновления профиля');
    }
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: userAPI.uploadAvatar,
    onSuccess: (response) => {
      const updatedUser = response.data.data.user;
      updateUser(updatedUser);
      queryClient.invalidateQueries(['user']);
      toast.success('Аватар обновлен!');
      setAvatarFile(null);
      setAvatarPreview(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка загрузки аватара');
    }
  });

  const deleteAvatarMutation = useMutation({
    mutationFn: userAPI.deleteAvatar,
    onSuccess: (response) => {
      const updatedUser = response.data.data.user;
      updateUser(updatedUser);
      queryClient.invalidateQueries(['user']);
      toast.success('Аватар удален!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка удаления аватара');
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: userAPI.changePassword,
    onSuccess: () => {
      toast.success('Пароль изменен!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Ошибка смены пароля');
    }
  });

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Пароль должен содержать минимум 8 символов');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Файл слишком большой. Максимум 5 МБ');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarUpload = () => {
    if (!avatarFile) return;
    
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    uploadAvatarMutation.mutate(formData);
  };

  const handleAvatarDelete = () => {
    if (confirm('Удалить аватар?')) {
      deleteAvatarMutation.mutate();
    }
  };

  const avatarUrl = user?.avatar 
    ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${user.avatar}`
    : null;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Профиль</h1>
          <p className="text-gray-600">Управление вашим аккаунтом</p>
        </div>

        {/* Avatar Section */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Аватар</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              {avatarPreview || avatarUrl ? (
                <img
                  src={avatarPreview || avatarUrl}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-dark transition-colors">
                <Camera className="w-4 h-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1">
              {avatarFile ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleAvatarUpload}
                    className="btn btn-primary"
                    disabled={uploadAvatarMutation.isPending}
                  >
                    {uploadAvatarMutation.isPending ? (
                      <>
                        <span className="spinner"></span>
                        Загрузка...
                      </>
                    ) : (
                      'Загрузить'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setAvatarFile(null);
                      setAvatarPreview(null);
                    }}
                    className="btn btn-secondary"
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <>
                  {avatarUrl && (
                    <button
                      onClick={handleAvatarDelete}
                      className="btn btn-danger"
                      disabled={deleteAvatarMutation.isPending}
                    >
                      Удалить аватар
                    </button>
                  )}
                </>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Рекомендуемый размер: 200x200px. Максимум 5 МБ
              </p>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Основная информация</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Имя
              </label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="input"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <>
                  <span className="spinner"></span>
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Сохранить изменения
                </>
              )}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Изменить пароль</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Текущий пароль
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Новый пароль
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="input"
                required
                minLength={8}
              />
              <p className="text-xs text-gray-500 mt-1">
                Минимум 8 символов, 1 цифра и 1 буква
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Подтвердите новый пароль
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="input"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? (
                <>
                  <span className="spinner"></span>
                  Изменение...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Изменить пароль
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
