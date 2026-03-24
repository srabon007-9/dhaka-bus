import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import HomePage from './pages/HomePage';
import RoutesPage from './pages/RoutesPage';
import TrackingPage from './pages/TrackingPage';
import BookingPage from './pages/BookingPage';
import TicketsPage from './pages/TicketsPage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';
import AuthPage from './pages/AuthPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route
            path="/tracking"
            element={(
              <ErrorBoundary>
                <TrackingPage />
              </ErrorBoundary>
            )}
          />
          <Route
            path="/booking"
            element={(
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/tickets"
            element={(
              <ErrorBoundary>
                <ProtectedRoute>
                  <TicketsPage />
                </ProtectedRoute>
              </ErrorBoundary>
            )}
          />
          <Route
            path="/admin"
            element={(
              <ErrorBoundary>
                <ProtectedRoute adminOnly>
                  <AdminPage />
                </ProtectedRoute>
              </ErrorBoundary>
            )}
          />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
