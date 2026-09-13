import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppShell } from '@/components/layout/AppShell';
import { BrowsePage } from '@/pages/BrowsePage';
import { RentalsPage } from '@/pages/RentalsPage';
import { SavedPage } from '@/pages/SavedPage';
import { ListingDetailPage } from '@/pages/ListingDetailPage';
import { LoginPage } from '@/pages/LoginPage';
import { ComingSoonPage, NotFoundPage } from '@/pages/PlaceholderPage';

/** Sends signed-out visitors to /login, remembering where they were headed. */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/buy" replace />} />
        <Route path="/buy" element={<BrowsePage />} />
        <Route path="/rent" element={<RentalsPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/listings/:id" element={<ListingDetailPage />} />
        <Route path="/projects" element={<ComingSoonPage title="Projects" />} />
        <Route path="/insights" element={<ComingSoonPage title="Insights" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
