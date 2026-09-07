import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, useAuth } from "@clerk/clerk-react";
import { trpc } from "./trpc";
import { RecipesApp } from "./RecipesApp";

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

export function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <TrpcProvider>
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <RecipesApp />
        </SignedIn>
      </TrpcProvider>
    </ClerkProvider>
  );
}
