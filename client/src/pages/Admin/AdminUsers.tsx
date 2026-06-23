import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
// @ts-ignore
import { saveAs } from 'file-saver';
import AdminLayout from '../../components/Admin/AdminLayout';
import AdminHeader from '../../components/Admin/AdminHeader';
import DataTable from '../../components/Admin/DataTable';
import Modal from '../../components/Admin/Modal';
import { adminApi, type AdminUser, type UserDetailResponse } from '../../lib/adminApi';
import { useToast } from '../../contexts/ToastContext';
import { useAdminRealtime } from '../../contexts/AdminRealtimeContext';
import './AdminUsers.css';

const prettyEventName = (name: string) =>
  name.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const AdminUsers: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { events } = useAdminRealtime();
  const [search, setSearch] = React.useState('');
  const [selectedUsers, setSelectedUsers] = React.useState<AdminUser[]>([]);
  const [roleFilter, setRoleFilter] = React.useState<'all' | 'admin' | 'user'>('all');
  const [detailUserId, setDetailUserId] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const [lastManualRefresh, setLastManualRefresh] = React.useState<Date | null>(null);

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: adminApi.getUsers
  });

  const detailQuery = useQuery({
    queryKey: ['admin-user-detail', detailUserId],
    queryFn: () => adminApi.getUserDetail(detailUserId!),
    enabled: Boolean(detailUserId)
  });

  const bulkActionMutation = useMutation({
    mutationFn: ({ action, userIds }: { action: string; userIds: string[] }) =>
      adminApi.runUserBulkAction(action, userIds),
    onSuccess: () => {
      showToast('Bulk action completed', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: any) => {
      showToast(error?.response?.data?.message || 'Bulk action failed', 'error');
    }
  });

  const toggleAdminMutation = useMutation({
    mutationFn: ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) =>
      adminApi.toggleUserAdmin(userId, isAdmin),
    onSuccess: () => {
      showToast('User updated', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: any) => {
      showToast(error?.response?.data?.message || 'Failed to update user', 'error');
    }
  });

  const filteredUsers = React.useMemo(() => {
    if (!usersQuery.data) return [];
    return usersQuery.data.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const isAdminUser = user.roles?.includes('admin') || user.isAdmin;
      const matchesRole =
        roleFilter === 'all' || (roleFilter === 'admin' ? isAdminUser : !isAdminUser);
      return matchesSearch && matchesRole;
    });
  }, [usersQuery.data, search, roleFilter]);

  const columns = React.useMemo<ColumnDef<AdminUser>[]>(() => [
    {
      id: 'select',
      header: () => <span>Select</span>,
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      )
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <strong>{row.original.name}</strong>
          <div className="muted">{row.original.email}</div>
        </div>
      )
    },
    {
      accessorKey: 'roles',
      header: 'Roles',
      cell: ({ row }) => (row.original.roles ? row.original.roles.join(', ') : 'user')
    },
    {
      accessorKey: 'city',
      header: 'City',
      cell: ({ row }) => row.original.city ?? '—'
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined',
      cell: ({ row }) =>
        row.original.createdAt
          ? new Date(row.original.createdAt).toLocaleDateString()
          : '—'
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        if (row.original.softDeleted) return <span className="status status-deleted">Deleted</span>;
        if (row.original.suspended) return <span className="status status-warning">Suspended</span>;
        return <span className="status status-success">Active</span>;
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const isAdminUser = row.original.roles?.includes('admin') || row.original.isAdmin;
        return (
          <div className="admin-user-actions">
            <button
              onClick={() => setDetailUserId(row.original._id)}
            >
              View
            </button>
            <button
              onClick={() =>
                toggleAdminMutation.mutate({
                  userId: row.original._id,
                  isAdmin: !isAdminUser
                })
              }
            >
              {isAdminUser ? 'Remove Admin' : 'Make Admin'}
            </button>
          </div>
        );
      }
    }
  ], [toggleAdminMutation]);

  const handleBulkAction = (action: string) => {
    if (selectedUsers.length === 0) {
      showToast('Select at least one user', 'info');
      return;
    }
    bulkActionMutation.mutate({
      action,
      userIds: selectedUsers.map((user) => user._id)
    });
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await adminApi.exportUsers();
      saveAs(blob, `neighborfit-users-${new Date().toISOString().slice(0, 10)}.csv`);
      showToast('Export ready', 'success');
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Failed to export users', 'error');
    } finally {
      setExporting(false);
    }
  };

  const latestEvent = events[0];
  const isRefreshing = usersQuery.isFetching;

  const handleManualRefresh = () => {
    setLastManualRefresh(new Date());
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  return (
    <AdminLayout>
      <AdminHeader
        title="User Management"
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        lastUpdated={lastManualRefresh}
      />
      {latestEvent && (
        <div className="admin-banner">
          <strong>Live update:</strong> {prettyEventName(latestEvent.event)}
          <span>{new Date(latestEvent.timestamp).toLocaleTimeString()}</span>
        </div>
      )}
      <div className="admin-users-toolbar">
        <input
          type="search"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as any)}>
          <option value="all">All Roles</option>
          <option value="admin">Admins</option>
          <option value="user">Users</option>
        </select>
        <span className="selection-count">
          {selectedUsers.length} selected
        </span>
        <div className="admin-users-bulk">
          <button onClick={() => handleBulkAction('suspend')}>Suspend</button>
          <button onClick={() => handleBulkAction('activate')}>Activate</button>
          <button onClick={() => handleBulkAction('softDelete')}>Soft Delete</button>
        </div>
        <button onClick={handleExport} disabled={exporting}>
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>
      <DataTable
        data={filteredUsers}
        columns={columns}
        loading={usersQuery.isLoading}
        enableSelection
        onSelectionChange={setSelectedUsers}
        emptyMessage="No users found"
      />
      <UserDetailModal
        data={detailQuery.data}
        isLoading={detailQuery.isLoading}
        onClose={() => setDetailUserId(null)}
        isOpen={Boolean(detailUserId)}
      />
    </AdminLayout>
  );
};

const UserDetailModal: React.FC<{
  data?: UserDetailResponse;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
}> = ({ data, isLoading, isOpen, onClose }) => {
  return (
    <Modal title="User Details" isOpen={isOpen} onClose={onClose}>
      {isLoading && <p>Loading...</p>}
      {!isLoading && data && (
        <div className="admin-user-details">
          <div className="admin-user-details__section">
            <h4>Profile</h4>
            <div className="admin-user-details__grid">
              <span>Name: {data.user.name}</span>
              <span>Email: {data.user.email}</span>
              <span>Roles: {data.user.roles?.join(', ') || 'user'}</span>
              <span>Status: {data.user.suspended ? 'Suspended' : 'Active'}</span>
              <span>Last Active: {data.user.lastActive ? new Date(data.user.lastActive).toLocaleString() : '—'}</span>
            </div>
          </div>
          {data.preferences && (
            <div className="admin-user-details__section">
              <h4>Preferences</h4>
              <div className="admin-user-details__grid">
                {Object.entries(data.preferences.lifestyle || {}).map(([key, value]) => (
                  <span key={key}>
                    {key}: {value}
                  </span>
                ))}
              </div>
            </div>
          )}
          {data.reviews && data.reviews.length > 0 && (
            <div className="admin-user-details__section">
              <h4>Recent Reviews</h4>
              <div className="admin-reviews-list">
                {data.reviews.map((review, index) => (
                  <article key={`${review.neighborhood}-${index}`}>
                    <strong>{review.neighborhood}</strong> · {review.city}
                    <div>Rating: {review.rating}/5</div>
                    {review.comment && <p>{review.comment}</p>}
                    <small>{new Date(review.createdAt).toLocaleString()}</small>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default AdminUsers;
