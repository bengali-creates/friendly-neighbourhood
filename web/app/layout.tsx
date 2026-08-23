"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { WebCursor } from "@/components/WebCursor";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [qc] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 20_000, retry: 2 } },
      })
  );

  return (
    <html lang="en">
      <head>
        <title>Spider-Sense — Your Personal AI Radar</title>
        <meta
          name="description"
          content="Autonomous AI agent that monitors Terms of Service changes, product recalls, and civic alerts — so you're never blindsided."
        />
      </head>
      <body>
        <QueryClientProvider client={qc}>
          <ThemeProvider>
            <WebCursor />
            {children}
          </ThemeProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
    </html>
  );
}
