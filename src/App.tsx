import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { useEffect, useState } from 'react';
import ChangePasswordModal from './components/admin/ChangePasswordModal';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ClickSpark from "./components/ClickSpark";
import { supabase } from "@/integrations/supabase/client";

// Enhanced QueryClient configuration with proper error handling and retry logic
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry failed requests up to 3 times
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors (401, 403)
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      // Keep data fresh for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Cache data for 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      // Refetch data when window regains focus
      refetchOnWindowFocus: true,
      // Refetch data when reconnecting to internet
      refetchOnReconnect: true,
      // Retry on network error
      retryOnMount: true,
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
                <Route path="/" element={<Index />} />
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