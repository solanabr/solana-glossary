import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppHeader } from "@/components/AppHeader";
import { I18nProvider } from "@/lib/i18n";
import Index from "./pages/Index.tsx";

// Index is the home route (also serves /t/:id and /c/:category) so it stays
// eager. The secondary routes are split into their own on-demand chunks.
const Copilot = lazy(() => import("./pages/Copilot.tsx"));
const LearningPath = lazy(() => import("./pages/LearningPath.tsx"));
const Swipe = lazy(() => import("./pages/Swipe.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <TooltipProvider>
        <BrowserRouter>
          <AppHeader />
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/t/:id" element={<Index />} />
              <Route path="/c/:category" element={<Index />} />
              <Route path="/copilot" element={<Copilot />} />
              <Route path="/learn" element={<LearningPath />} />
              <Route path="/swipe" element={<Swipe />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
