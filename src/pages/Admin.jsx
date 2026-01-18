/**
 * Admin Page
 *
 * Access at: /admin
 *
 * Shows admin dashboard for reviewing flagged submissions
 */

import React from 'react';
import AdminDashboard from '../components/AdminDashboard';

const AdminPage = () => {
  return (
    <div className="admin-page">
      <AdminDashboard />
    </div>
  );
};

export default AdminPage;
