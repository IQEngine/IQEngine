import React from 'react';
import 'swagger-ui-react/swagger-ui.css';
// @ts-ignore
import reportWebVitals from '@/utils/reportWebVitals';
import { RouterProvider } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { FeatureFlagsProvider } from '@/hooks/use-feature-flags';
import { useRouter } from '@/hooks/use-router';
import { useAuthProvider } from '@/auth/hooks/use-auth-provider';
import { CLIENT_TYPE_BLOB } from '@/api/Models';

const container = document.getElementById('root');
if (!container) throw new Error('No root element found');
const root = createRoot(container);

// React Query stuff
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});
queryClient.setQueryDefaults(['config'], { staleTime: 1000 * 60 * 60 * 24 });
queryClient.setQueryDefaults(['datasource', CLIENT_TYPE_BLOB], { staleTime: 1000 * 60 });
queryClient.setQueryDefaults(['plugins'], { staleTime: 1000 * 60 * 5 });
queryClient.setQueryDefaults(['rawiqdata'], { staleTime: Infinity });
queryClient.setQueryDefaults(['iqData'], { staleTime: 5, cacheTime: 10 });
queryClient.setQueryDefaults(['user-settings'], { staleTime: Infinity });
queryClient.setQueryDefaults(['smart-query'], { staleTime: 1000 * 60 * 60 * 24 });

const { router } = useRouter();
const { AuthProvider } = useAuthProvider();
root.render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FeatureFlagsProvider flags={null}>
        <RouterProvider router={router} />
      </FeatureFlagsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

// For measuring performance uncomment the following.  see https://create-react-app.dev/docs/measuring-performance/
//reportWebVitals(console.log);
