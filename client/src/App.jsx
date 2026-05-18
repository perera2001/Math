import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { QuizProvider } from "./context/QuizContext";
import { UILanguageProvider } from "./context/UILanguageContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateQuestion from "./pages/CreateQuestion";
import AdminProfile from "./pages/AdminProfile";
import StudentProfile from "./pages/StudentProfile";
import StudentDashboard from "./pages/StudentDashboard";
import QuizSetup from "./pages/QuizSetup";
import QuizPlay from "./pages/QuizPlay";
import QuizResults from "./pages/QuizResults";
import Leaderboard from "./pages/Leaderboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import DocsPage from "./pages/DocsPage";

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="page-loading">Loading MathsApp…</div>;

  // Redirect students from the generic /dashboard to their own dashboard
  const defaultDash =
    user?.role === "USER" ? "/student/dashboard" : "/dashboard";

  return (
    <>
      <Navbar />
      <Routes>
        <Route
          path="/login"
          element={<Navigate to={user ? defaultDash : "/"} replace />}
        />
        <Route
          path="/register"
          element={<Navigate to={user ? defaultDash : "/"} replace />}
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator/create-question"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN"]}>
              <CreateQuestion />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator/profile"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <StudentProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/quiz/setup"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <QuizSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/quiz/play/:sessionId"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <QuizPlay />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/quiz/results/:sessionId"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <QuizResults />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/leaderboard"
          element={
            <ProtectedRoute allowedRoles={["USER"]}>
              <Leaderboard />
            </ProtectedRoute>
          }
        />
        <Route path="/docs" element={<DocsPage />} />
        <Route
          path="/"
          element={
            user ? <Navigate to={defaultDash} replace /> : <LandingPage />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const App = () => (
  <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <UILanguageProvider>
      <AuthProvider>
        <QuizProvider>
          <AppRoutes />
        </QuizProvider>
      </AuthProvider>
    </UILanguageProvider>
  </Router>
);

export default App;
