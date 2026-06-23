import React from 'react';
import AdminSidebar from './AdminSidebar';
import './admin.css';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-shell__content">{children}</div>
    </div>
  );
};

export default AdminLayout;
