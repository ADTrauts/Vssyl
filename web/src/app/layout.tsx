import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ErrorBoundaryWrapper from "./ErrorBoundaryWrapper";
import SessionProvider from "./SessionProvider";
import HydrationHandler from "./HydrationHandler";
import { DashboardProvider } from "../contexts/DashboardContext";
import { WorkAuthProvider } from "../contexts/WorkAuthContext";
import React, { useEffect } from "react";
import { ThemeProvider } from '../components/ThemeProvider';
import { GlobalBrandingProvider } from "../contexts/GlobalBrandingContext";
import { GlobalSearchProvider } from "../contexts/GlobalSearchContext";
import { Toaster } from 'react-hot-toast';
import UnifiedGlobalChat from '../components/chat/UnifiedGlobalChat';
import { ToastProvider } from 'shared/components/ToastProvider';
import { ChatProvider } from '../contexts/ChatContext';
import { GlobalTrashProvider } from '../contexts/GlobalTrashContext';
import DevelopmentHelper from './DevelopmentHelper';

export const dynamic = "force-dynamic";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Vssyl",
  description: "Vssyl - Your Digital Workspace",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch(e) {}
            })();
          `
        }} />
      </head>
      <body
        className={`${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <HydrationHandler>
            <SessionProvider>
              <WorkAuthProvider>
              <DashboardProvider>
                  <GlobalBrandingProvider>
                    <GlobalSearchProvider>
                      <ChatProvider>
                        <GlobalTrashProvider>
                          <ToastProvider>
                            <ErrorBoundaryWrapper>
                              {children}
                              <UnifiedGlobalChat />
                              <Toaster position="top-right" />
                              <DevelopmentHelper />
                            </ErrorBoundaryWrapper>
                          </ToastProvider>
                        </GlobalTrashProvider>
                      </ChatProvider>
                    </GlobalSearchProvider>
                  </GlobalBrandingProvider>
              </DashboardProvider>
              </WorkAuthProvider>
            </SessionProvider>
          </HydrationHandler>
        </ThemeProvider>
      </body>
    </html>
  )
}
