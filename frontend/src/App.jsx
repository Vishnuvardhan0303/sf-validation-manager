import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import CallbackPage from './pages/CallbackPage';
import Dashboard from './pages/Dashboard';
import './styles/globals.css';

function AppContent() {
  const { user, loading } = useAuth();
  const isCallback = window.location.pathname === '/auth/callback';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid rgba(99,102,241,0.2)',
          borderTopColor: '#6366f1', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    );
  }

  if (isCallback) {
    return (
      <CallbackPage
        onSuccess={() => { window.history.replaceState({}, '', '/'); window.location.reload(); }}
        onError={(msg) => { alert('Auth error: ' + msg); window.location.href = '/'; }}
      />
    );
  }

  return user ? <Dashboard /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
