import { ApolloProvider } from '@apollo/client/react';
import type { ReactNode } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import { ChatWidget } from './components/ChatWidget';
import { Header } from './components/Header';
import { apolloClient } from './lib/apollo';
import { AuthProvider, useAuth } from './lib/auth';
import { useI18n } from './lib/i18n';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Trees } from './pages/Trees';

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Shell() {
  const { t } = useI18n();
  const { user } = useAuth();
  return (
    <div className="flex min-h-dvh flex-col bg-[#faf7f0] text-stone-900 antialiased dark:bg-stone-950 dark:text-stone-100">
      <Header />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/trees"
            element={
              <RequireAuth>
                <Trees />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <footer className="border-t border-amber-900/10 py-6 text-center text-xs text-stone-400 dark:border-stone-800 dark:text-stone-600">
        Heirloom — open source · self-hosted · {t('tagline')}
      </footer>
      {user && <ChatWidget />}
    </div>
  );
}

export function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <BrowserRouter>
          <Shell />
        </BrowserRouter>
      </AuthProvider>
    </ApolloProvider>
  );
}
