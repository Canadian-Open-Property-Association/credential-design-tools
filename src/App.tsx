import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AppSelectionPage from './pages/AppSelectionPage';
import AuthGuard from './components/Auth/AuthGuard';
import PlatformShell from './components/Platform/PlatformShell';
import VctBuilderApp from './apps/VctBuilder/VctBuilderApp';
import SchemaBuilderApp from './apps/SchemaBuilder/SchemaBuilderApp';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route - Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          path="/apps"
          element={
            <AuthGuard>
              <PlatformShell showBackButton={false}>
                <AppSelectionPage />
              </PlatformShell>
            </AuthGuard>
          }
        />

        <Route
          path="/apps/vct-builder/*"
          element={
            <AuthGuard>
              <PlatformShell showBackButton={true}>
                <VctBuilderApp />
              </PlatformShell>
            </AuthGuard>
          }
        />

        <Route
          path="/apps/schema-builder/*"
          element={
            <AuthGuard>
              <PlatformShell showBackButton={true}>
                <SchemaBuilderApp />
              </PlatformShell>
            </AuthGuard>
          }
        />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/apps" replace />} />
        <Route path="*" element={<Navigate to="/apps" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
