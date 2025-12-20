import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean; // If true, require auth. If false, redirect authenticated users away
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const { session, loading } = useAuth();

  // Show loading spinner while auth state is being determined
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Require authentication
  if (requireAuth && !session) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect authenticated users away (e.g., from /auth to /dashboard)
  if (!requireAuth && session) {
    return <Navigate to="/dashboard" replace />;
  }

  // User meets the requirement, render children
  return <>{children}</>;
};