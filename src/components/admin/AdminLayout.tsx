'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconDashboard, IconUsers, IconSettings, IconTarget, IconEye, IconTrophy, IconChartBar, IconRefresh } from '@/components/Icons';
import { NavLink } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function navItemsList(pathname: string): NavItem[] {
  const base = [
    { label: 'Dashboard', href: '/admin', icon: <IconDashboard /> },
    { label: 'Players', href: '/admin/players', icon: <IconUsers /> },
    { label: 'Draft Config', href: '/admin/config', icon: <IconSettings /> },
    { label: 'Participants', href: '/admin/participants', icon: <IconTarget /> },
    { label: 'Monitor Draft', href: '/admin/monitor', icon: <IconEye /> },
    { label: 'Results', href: '/admin/results', icon: <IconTrophy /> },
    { label: 'Leaderboard', href: '/admin/leaderboard', icon: <IconChartBar /> },
    { label: 'Sync', href: '/admin/sync', icon: <IconRefresh /> },
  ];
  return base;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const navItems = navItemsList(pathname);

  return (
    <div className="bg-page admin-shell">
      <a
        href="#main-content"
        className="absolute left-[-9999px] w-px h-px overflow-hidden focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:w-auto focus:h-auto focus:btn-primary focus:rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:overflow-visible"
      >
        Skip to main content
      </a>
      <header className="header-bar-sticky">
        <div className="flex-center-between px-3 md:px-4 lg:px-6 py-3">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md hover:bg-slate-100 transition-colors flex-shrink-0 touch-manipulation"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-base md:text-xl font-semibold text-slate-900 truncate">
              Fantasy Cricket Draft · Admin
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/" className="link-subtle px-3 md:px-4 py-2 text-sm font-medium">
              Home
            </Link>
            <Link href="/draft" className="link-subtle px-3 md:px-4 py-2 text-sm font-medium">
              Draft
            </Link>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-57px)]">
        <aside
          className={cn(
            'admin-sidebar fixed lg:sticky top-[57px] left-0 z-30 h-[calc(100vh-57px)] w-64 flex-shrink-0 transform transition-transform duration-200 ease-in-out',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          <nav className="p-4 space-y-0.5 overflow-y-auto h-full">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <NavLink
                  key={item.href}
                  href={item.href}
                  active={isActive}
                  icon={<span className={isActive ? 'text-emerald-700' : 'text-slate-500'}>{item.icon}</span>}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={toggleSidebar} aria-hidden />
        )}

        <main id="main-content" className="flex-1 p-4 lg:p-6 xl:p-8 w-full overflow-x-hidden bg-surface" tabIndex={-1}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
