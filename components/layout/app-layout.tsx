'use client';

import { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { AppHeader } from './app-header';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export function AppLayout({ children, title, breadcrumbs }: AppLayoutProps) {
  return (
    <div className="app-layout noise-overlay">
      <Sidebar />
      <main className="app-main">
        <AppHeader title={title} breadcrumbs={breadcrumbs} />
        <div className="app-content">
          {children}
        </div>
      </main>
    </div>
  );
}
