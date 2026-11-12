import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { RevenuePage } from './pages/RevenuePage';
import { SeatsPage } from './pages/SeatsPage';
import { PlansPage } from './pages/PlansPage';
import { StudentsPage } from './pages/StudentsPage';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { SuperAdminPage } from './pages/SuperAdminPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { ProfilePage } from './pages/ProfilePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Platform Super-Admin Route */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowPendingPayment={true}>
              <SuperAdminPage />
            </ProtectedRoute>
          }
        />

        {/* Onboarding Route (Authenticated, allowed with pending payment) */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute allowPendingPayment={true}>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* Protected routes wrapped in AppShell layout (Subscription required) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppShell>
                <DashboardPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/revenue"
          element={
            <ProtectedRoute>
              <AppShell>
                <RevenuePage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/seats"
          element={
            <ProtectedRoute>
              <AppShell>
                <SeatsPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/plans"
          element={
            <ProtectedRoute>
              <AppShell>
                <PlansPage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/subscription"
          element={
            <ProtectedRoute>
              <AppShell>
                <SubscriptionPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/students"
          element={
            <ProtectedRoute>
              <AppShell>
                <StudentsPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/students/:id"
          element={
            <ProtectedRoute>
              <AppShell>
                <StudentProfilePage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppShell>
                <ProfilePage />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
