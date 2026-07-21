import type { Metadata } from 'next';
import './globals.css';
import "react-toastify/dist/ReactToastify.css";

import { ReactQueryProvider } from '@/lib/query-provider';
import { AuthProvider } from '@/lib/auth-provider';
import { ToastContainer } from "react-toastify";

export const metadata: Metadata = {
  title: 'Shaadi Milan — Admin Panel',
  description: 'Pro-level admin panel for Shaadi Milan matrimony application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent hydration mismatch from fonts/extensions */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>

      <body suppressHydrationWarning>
        <ReactQueryProvider>
          <AuthProvider>
            {children}

            {/* Global Toast */}
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              pauseOnHover
              draggable
              theme="dark"
            />
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}