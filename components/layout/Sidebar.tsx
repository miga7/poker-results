'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Settings,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useToast } from '@/components/ui/use-toast';

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/refresh-data', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to refresh data');
      }

      toast({
        title: 'Success',
        description: 'Data refreshed successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/',
    },
    {
      title: 'Admin',
      icon: Settings,
      onClick: () => setIsAdminOpen(!isAdminOpen),
      subItems: [
        {
          title: 'Settings',
          icon: Settings,
          href: '/admin',
        },
        {
          title: 'Refresh Data',
          icon: RefreshCw,
          href: '/refresh',
        },
      ],
    },
  ];

  const renderMenuItem = (item: any) => (
    <div key={item.title}>
      <Button
        variant={pathname === item.href ? 'secondary' : 'ghost'}
        className={cn(
          'w-full justify-between gap-2',
          pathname === item.href && 'bg-muted'
        )}
        onClick={() => {
          if (item.href) {
            router.push(item.href);
          } else if (item.subItems) {
            setIsAdminOpen(!isAdminOpen);
          }
        }}
      >
        <div className="flex items-center gap-2">
          <item.icon className="h-4 w-4" />
          {item.title}
        </div>
        {item.subItems && (
          isAdminOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
        )}
      </Button>
      {item.subItems && isAdminOpen && (
        <div className="ml-4 mt-2 space-y-2">
          {item.subItems.map((subItem: any) => (
            <Button
              key={subItem.title}
              variant="ghost"
              className={cn(
                'w-full justify-start gap-2',
                pathname === subItem.href && 'bg-muted'
              )}
              onClick={() => subItem.href && router.push(subItem.href)}
            >
              <subItem.icon className="h-4 w-4" />
              {subItem.title}
            </Button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden">
          <LayoutDashboard className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <div className="hidden lg:flex h-screen fixed left-0 top-0 z-40 w-64 bg-background border-r">
        <div className="flex flex-col w-full">
          <SheetHeader className="p-6">
            <SheetTitle>Poker Results</SheetTitle>
          </SheetHeader>
          <Separator />
          <nav className="flex-1 space-y-2 p-4">
            {menuItems.map(renderMenuItem)}
          </nav>
        </div>
      </div>
      <SheetContent side="left" className="w-64 lg:hidden">
        <SheetHeader>
          <SheetTitle>Poker Results</SheetTitle>
        </SheetHeader>
        <Separator className="my-4" />
        <nav className="flex-1 space-y-2">
          {menuItems.map(renderMenuItem)}
        </nav>
      </SheetContent>
    </Sheet>
  );
} 