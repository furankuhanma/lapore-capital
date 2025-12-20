import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './src/context/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Public route - redirects to dashboard if authenticated */}
        <Route 
          path="/auth" 
          element={
            <ProtectedRoute requireAuth={false}>
              <AuthPage />
            </ProtectedRoute>
          } 
        />

        {/* Protected route - requires authentication */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute requireAuth={true}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        {/* Catch-all redirect */}
        <Route 
          path="*" 
          element={<Navigate to="/auth" replace />} 
        />
      </Routes>
    </HashRouter>
  );
};

export default App;