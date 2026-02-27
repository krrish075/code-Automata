import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import TimetablePage from "./pages/TimetablePage";
import StudyPlannerPage from "./pages/StudyPlannerPage";
import StudySessionPage from "./pages/StudySessionPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import PreExamPage from "./pages/PreExamPage";
import AuthPage from "./pages/AuthPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminStudentDetails from "./pages/AdminStudentDetails";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { useAppStore } from "./store/useAppStore";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, role } = useAppStore();
  if (!isAuthenticated) return <Navigate to="/auth" />;
  if (role === 'admin') return <Navigate to="/admin" />;
  return <>{children}</>;
};

// Admin Route Wrapper
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, role } = useAppStore();
  if (!isAuthenticated) return <Navigate to="/auth" />;
  if (role !== 'admin') return <Navigate to="/dashboard" />;
  return <>{children}</>;
};

const App = () => {
  const init = useAppStore((state) => state.init);
  const initialized = useAppStore((state) => state.initialized);

  useEffect(() => {
    init();
  }, [init]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center hero-bg">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />

            <Route path="/" element={<Layout><HomePage /></Layout>} />

            <Route path="/dashboard" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
            <Route path="/timetable" element={<ProtectedRoute><Layout><TimetablePage /></Layout></ProtectedRoute>} />
            <Route path="/study-planner" element={<ProtectedRoute><Layout><StudyPlannerPage /></Layout></ProtectedRoute>} />
            <Route path="/study-session" element={<ProtectedRoute><Layout><StudySessionPage /></Layout></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Layout><AnalyticsPage /></Layout></ProtectedRoute>} />
            <Route path="/pre-exam" element={<ProtectedRoute><Layout><PreExamPage /></Layout></ProtectedRoute>} />

            <Route path="/admin" element={<AdminRoute><Layout><AdminDashboard /></Layout></AdminRoute>} />
            <Route path="/admin/student/:id" element={<AdminRoute><Layout><AdminStudentDetails /></Layout></AdminRoute>} />

            <Route path="*" element={<Layout><NotFound /></Layout>} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
