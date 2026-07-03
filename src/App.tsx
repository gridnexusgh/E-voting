import { Suspense, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { LandingPage } from "./pages/LandingPage";
import { AboutPage } from "./pages/AboutPage";
import { HowItWorksPage } from "./pages/HowItWorksPage";
import { FAQPage } from "./pages/FAQPage";
import { ContactPage } from "./pages/ContactPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { FaceEnrollmentPage } from "./pages/FaceEnrollmentPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { FacultyManagement } from "./pages/admin/FacultyManagement";
import { DepartmentManagement } from "./pages/admin/DepartmentManagement";
import { UserManagement } from "./pages/admin/UserManagement";
import { StudentImport } from "./pages/admin/StudentImport";
import { AuditOverview } from "./pages/admin/AuditOverview";
import { SystemSettings } from "./pages/admin/SystemSettings";
import { ElectionOfficerDashboard } from "./pages/ElectionOfficerDashboard";
import { StudentDashboard } from "./pages/student";
import { AuditorDashboard } from "./pages/AuditorDashboard";

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles?: string[];
}) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const dashboardRoutes: Record<string, string> = {
      admin: "/admin",
      student: "/student/dashboard",
    };
    return <Navigate to={dashboardRoutes[user.role] || "/"} replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    if (user.role === 'student' && !user.is_face_enrolled) {
      return <Navigate to="/face-enrollment" replace />;
    }

    const dashboardRoutes: Record<string, string> = {
      admin: "/admin",
      election_officer: "/election-officer/dashboard",
      auditor: "/auditor/dashboard",
      student: "/student/dashboard",
    };
    return <Navigate to={dashboardRoutes[user.role] || "/"} replace />;
  }

  return <>{children}</>;
}

function PublicPage({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-16 lg:pt-20">{children}</main>
      <Footer />
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-600">Loading experience...</p>
          </div>
        </div>
      }
    >
      <Routes>
      {/* Public Pages */}
      <Route
        path="/"
        element={
          <PublicPage>
            <LandingPage />
          </PublicPage>
        }
      />
      <Route
        path="/about"
        element={
          <PublicPage>
            <AboutPage />
          </PublicPage>
        }
      />
      <Route
        path="/how-it-works"
        element={
          <PublicPage>
            <HowItWorksPage />
          </PublicPage>
        }
      />
      <Route
        path="/faq"
        element={
          <PublicPage>
            <FAQPage />
          </PublicPage>
        }
      />
      <Route
        path="/contact"
        element={
          <PublicPage>
            <ContactPage />
          </PublicPage>
        }
      />

      {/* Auth Pages */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />

      {/* Face Enrollment */}
      <Route
        path="/face-enrollment"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <FaceEnrollmentPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="faculties" element={<FacultyManagement />} />
        <Route path="departments" element={<DepartmentManagement />} />
        <Route path="users" element={<UserManagement onUserCreated={() => {}} />} />
        <Route path="students/import" element={<StudentImport onImport={() => {}} />} />
        <Route path="audit" element={<AuditOverview />} />
        <Route path="settings" element={<SystemSettings />} />
      </Route>

      {/* Election Officer Routes */}
      <Route
        path="/election-officer/dashboard/*"
        element={
          <ProtectedRoute allowedRoles={["election_officer"]}>
            <ElectionOfficerDashboard />
          </ProtectedRoute>
        }
      />

      {/* Student Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />


      {/* Auditor Routes */}
      <Route
        path="/auditor/dashboard"
        element={
          <ProtectedRoute allowedRoles={["auditor"]}>
            <AuditorDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
