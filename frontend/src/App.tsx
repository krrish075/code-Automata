import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import TimetablePage from "./pages/TimetablePage";
import StudyPlannerPage from "./pages/StudyPlannerPage";
import StudySessionPage from "./pages/StudySessionPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import PreExamPage from "./pages/PreExamPage";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { useAppStore } from "./store/useAppStore";

const queryClient = new QueryClient();

const App = () => {
  const init = useAppStore((state) => state.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/timetable" element={<TimetablePage />} />
              <Route path="/study-planner" element={<StudyPlannerPage />} />
              <Route path="/study-session" element={<StudySessionPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/pre-exam" element={<PreExamPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
