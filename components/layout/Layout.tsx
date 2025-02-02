import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="relative min-h-screen bg-background">
      <Sidebar />
      <main className={cn(
        "container mx-auto px-4 py-8",
        "lg:pl-72" // 64px sidebar + 8px gap
      )}>
        {children}
      </main>
    </div>
  );
} 