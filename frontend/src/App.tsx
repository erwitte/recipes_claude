import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { ClerkProvider, SignedIn, SignedOut, UserButton, useAuth } from "@clerk/clerk-react";
import { trpc } from "./trpc";
import { RecipesApp } from "./RecipesApp";
import { AuthPage } from "./AuthPage";
import { ChefHatIcon } from "./icons";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3000";

function TrpcProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${BACKEND_URL}/trpc`,
          async headers() {
            const token = await getToken();
            return token ? { authorization: `Bearer ${token}` } : {};
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-brand">
        <span className="app-brand-mark">
          <ChefHatIcon width={20} height={20} />
        </span>
        Kitchen Book
      </div>
      <div className="app-header-actions">
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}

export function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <TrpcProvider>
        <SignedOut>
          <AuthPage />
        </SignedOut>
        <SignedIn>
          <div className="app-shell">
            <AppHeader />
            <main className="app-main">
              <RecipesApp />
            </main>
          </div>
        </SignedIn>
      </TrpcProvider>
    </ClerkProvider>
  );
}
