import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * AdminPromotions page has been permanently decommissioned per user request.
 */
export function AdminPromotions() {
  return <Navigate to="/admin" replace />;
}

export default AdminPromotions;
