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
// Phase 4:  import Properties from './pages/Properties/Properties';
// Phase 4:  import PropertyDetail from './pages/Properties/PropertyDetail';
// Phase 4:  import AdminProperties from './pages/Admin/AdminProperties';
// Phase 5:  import AdminTenants from './pages/Admin/AdminTenants';
// Phase 6:  import MaintenanceList from './pages/Maintenance/MaintenanceList';
// Phase 6:  import MaintenanceDetail from './pages/Maintenance/MaintenanceDetail';
// Phase 6:  import NewRequest from './pages/Maintenance/NewRequest';
// Phase 6:  import AdminMaintenance from './pages/Admin/AdminMaintenance';
// Phase 7:  import Amenities from './pages/Amenities/Amenities';
// Phase 7:  import AdminAmenities from './pages/Admin/AdminAmenities';
// Phase 8:  import BookingPage from './pages/Bookings/BookingPage';
// Phase 8:  import MyBookings from './pages/Bookings/MyBookings';
// Phase 8:  import AdminBookings from './pages/Admin/AdminBookings';
// Phase 9:  import Notifications from './pages/Notifications/Notifications';

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

// Phase 3: PropertyOwnerRoute, TenantRoute, MaintenanceStaffRoute will be added here

// ─── Dashboard Router (Phase 10 — temporary redirect for now) ─────────────────
const DashboardRouter: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.roles?.includes('admin')) return <Navigate to="/admin" />;
  // Phase 4+: if (user.roles?.includes('property_owner')) return <Navigate to="/properties" />;
  // Phase 5+: if (user.roles?.includes('tenant')) return <Navigate to="/my-requests" />;
  // Phase 6+: if (user.roles?.includes('maintenance_staff')) return <Navigate to="/maintenance" />;
  return (
    <div className="loading-container">
      <p>Welcome to PropSync! Role-specific dashboards coming soon.</p>
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

          {/* Phase 4: Admin Properties */}
          {/* <Route path="/admin/properties" element={<AdminRoute><AdminProperties /></AdminRoute>} /> */}

          {/* Phase 5: Admin Tenants */}
          {/* <Route path="/admin/tenants" element={<AdminRoute><AdminTenants /></AdminRoute>} /> */}

          {/* Phase 6: Maintenance */}
          {/* <Route path="/maintenance" element={<ProtectedRoute><MaintenanceList /></ProtectedRoute>} /> */}
          {/* <Route path="/maintenance/new" element={<ProtectedRoute><NewRequest /></ProtectedRoute>} /> */}
          {/* <Route path="/maintenance/:id" element={<ProtectedRoute><MaintenanceDetail /></ProtectedRoute>} /> */}
          {/* <Route path="/admin/maintenance" element={<AdminRoute><AdminMaintenance /></AdminRoute>} /> */}

          {/* Phase 7: Amenities */}
          {/* <Route path="/amenities" element={<ProtectedRoute><Amenities /></ProtectedRoute>} /> */}

          {/* Phase 8: Bookings */}
          {/* <Route path="/bookings" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} /> */}
          {/* <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} /> */}

          {/* Phase 9: Notifications */}
          {/* <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} /> */}

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
