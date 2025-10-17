import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { useEffect, useState } from 'react';
import ChangePasswordModal from './components/admin/ChangePasswordModal';
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ClickSpark from "./components/ClickSpark";
import { supabase } from "@/integrations/supabase/client";

// Optimized QueryClient configuration to prevent continuous loading
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry failed requests up to 3 times
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors (401, 403)
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Retry up to 2 times for other errors (reduced from 3)
        return failureCount < 2;
      },
      // Keep data fresh for 10 minutes (increased from 5)
      staleTime: 10 * 60 * 1000, // 10 minutes
      // Cache data for 30 minutes (increased from 10)
      gcTime: 30 * 60 * 1000, // 30 minutes
      // Only refetch on window focus if data is stale
      refetchOnWindowFocus: 'always',
      // Refetch data when reconnecting to internet
      refetchOnReconnect: true,
      // Don't retry on mount to prevent initial loading issues
      retryOnMount: false,
      // Add retry delay to prevent rapid successive requests
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Network mode: only fetch when online
      networkMode: 'online',
    },
    mutations: {
      // Retry mutations up to 2 times
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 2;
      },
      // Add retry delay for mutations
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

const App = () => {
  const [showChangePw, setShowChangePw] = useState(false);

  useEffect(() => {
    const open = () => setShowChangePw(true);
    window.addEventListener('openChangePassword', open);
    return () => window.removeEventListener('openChangePassword', open);
  }, []);

  return (
    <ClickSpark sparkColor="#ff69b4" sparkSize={10} sparkRadius={15} sparkCount={8} duration={400}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/submission" element={<Index />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>

            {/* Password-change modal */}
            <ChangePasswordModal
              isOpen={showChangePw}
              onClose={() => setShowChangePw(false)} userId={""} email={""}            />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ClickSpark>
  );
};

export default App;