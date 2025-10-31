import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProjectsListPage from './pages/projects/ProjectsListPage';
import ProjectKanbanPage from './pages/projects/ProjectKanbanPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import ProfilePage from './pages/profile/ProfilePage';


import './styles/designSystem.css';
import './styles/global.css';



// Protected Route
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" style={{ width: 40, height: 40 }}></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" style={{ width: 40, height: 40 }}></div>
      </div>
    );
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><ProjectsListPage /></ProtectedRoute>} />
      <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectKanbanPage /></ProtectedRoute>} />
      <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
