// server/client/src/pages/Admin/AdminNeighborhoods.tsx
// PLACEHOLDER — This page is being replaced by AdminProperties in Phase 5
// Keeping it here to avoid import errors until that phase completes.

import React from 'react';
import AdminLayout from '../../components/Admin/AdminLayout';
import AdminHeader from '../../components/Admin/AdminHeader';

const AdminNeighborhoods: React.FC = () => {
  return (
    <AdminLayout>
      <AdminHeader title="Properties" />
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏗️</div>
        <h2 style={{ margin: '0 0 0.5rem', color: '#1e293b' }}>Property Management</h2>
        <p>Full property management will be available in Phase 5.</p>
      </div>
    </AdminLayout>
  );
};

export default AdminNeighborhoods;
