import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';

// ─── Pages: Public ────────────────────────────────────────────────────────────
import Home from './pages/Home/Home';

// ─── Pages: Auth ─────────────────────────────────────────────────────────────
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';

// ─── Pages: Admin ────────────────────────────────────────────────────────────
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminAnalytics from './pages/Admin/AdminAnalytics';
import AdminSettings from './pages/Admin/AdminSettings';
import { AdminRealtimeProvider } from './contexts/AdminRealtimeContext';

// ─── Pages: PropSync Features (enabled progressively) ────────────────────────
import Properties from './pages/Properties/Properties';
import PropertyDetail from './pages/Properties/PropertyDetail';
import AdminProperties from './pages/Admin/AdminProperties';
import AdminTenants from './pages/Admin/AdminTenants';
import TenantProfile from './pages/Tenants/TenantProfile';
import MaintenanceList from './pages/Maintenance/MaintenanceList';
import MaintenanceDetail from './pages/Maintenance/MaintenanceDetail';
import AdminMaintenance from './pages/Admin/AdminMaintenance';
import Amenities from './pages/Amenities/Amenities';
import AdminAmenities from './pages/Admin/AdminAmenities';
import Notifications from './pages/Notifications/Notifications';
import TenantDashboard from './pages/Dashboard/TenantDashboard';
import OwnerDashboard from './pages/Dashboard/OwnerDashboard';
import StaffDashboard from './pages/Dashboard/StaffDashboard';

import Profile from './pages/Profile/Profile';
import './App.css';

// ─── Route Guards ─────────────────────────────────────────────────────────────

const LoadingScreen: React.FC = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Loading PropSync...</p>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Navigate to="/dashboard" /> : <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  if (!user.roles?.includes('admin')) return <Navigate to="/dashboard" />;
  return <>{children}</>;
};

const PropertyOwnerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  if (!user.roles?.includes('property_owner') && !user.roles?.includes('admin')) {
    return <Navigate to="/dashboard" />;
  }
  return <>{children}</>;
};

const TenantRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  if (!user.roles?.includes('tenant') && !user.roles?.includes('admin')) {
    return <Navigate to="/dashboard" />;
  }
  return <>{children}</>;
};

const MaintenanceStaffRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  if (!user.roles?.includes('maintenance_staff') && !user.roles?.includes('property_owner') && !user.roles?.includes('admin')) {
    return <Navigate to="/dashboard" />;
  }
  return <>{children}</>;
};

// Phase 7: future route guards here

const DashboardRouter: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.roles?.includes('admin'))             return <Navigate to="/admin" />;
  if (user.roles?.includes('property_owner'))    return <OwnerDashboard />;
  if (user.roles?.includes('tenant'))            return <TenantDashboard />;
  if (user.roles?.includes('maintenance_staff')) return <StaffDashboard />;
  return (
    <div className="loading-container">
      <p>Welcome to PropSync!</p>
    </div>
  );
};

// ─── App Content ──────────────────────────────────────────────────────────────

const AppContent: React.FC = () => {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />

          {/* Auth Routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

          {/* Protected Base Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

          {/* Phase 4: Properties */}
          <Route path="/properties" element={<PropertyOwnerRoute><Properties /></PropertyOwnerRoute>} />
          <Route path="/properties/:id" element={<ProtectedRoute><PropertyDetail /></ProtectedRoute>} />
          <Route path="/admin/properties" element={<AdminRoute><AdminProperties /></AdminRoute>} />

          {/* Phase 5: Tenant */}
          <Route path="/my-lease" element={<TenantRoute><TenantProfile /></TenantRoute>} />
          <Route path="/admin/tenants" element={<AdminRoute><AdminTenants /></AdminRoute>} />

          {/* Phase 6: Maintenance */}
          <Route path="/maintenance" element={<MaintenanceStaffRoute><MaintenanceList /></MaintenanceStaffRoute>} />
          <Route path="/maintenance/:id" element={<MaintenanceStaffRoute><MaintenanceDetail /></MaintenanceStaffRoute>} />
          <Route path="/admin/maintenance" element={<AdminRoute><AdminMaintenance /></AdminRoute>} />

          {/* Phase 7: Amenities */}
          <Route path="/amenities" element={<ProtectedRoute><Amenities /></ProtectedRoute>} />
          <Route path="/admin/amenities" element={<AdminRoute><AdminAmenities /></AdminRoute>} />

          {/* Phase 8: Notifications + Dashboards */}
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <AdminRealtimeProvider>
          <Router>
            <AppContent />
          </Router>
        </AdminRealtimeProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
