import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loader from '../ui/Loader';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <Loader size="lg" label="Restoring your learning session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
export default ProtectedRoute;
