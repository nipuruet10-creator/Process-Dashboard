import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';

export const metadata: Metadata = {
  title: 'Process Development & Industrial Engineering Information System',
  description: 'Enterprise information system for AC manufacturing process engineering, machines, SAM, capacity, costs, and documentation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex h-screen w-screen overflow-hidden bg-[#FAF9F5] font-sans text-[#172B3A] antialiased">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-5 lg:p-8 bg-[#FAF9F5]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
