'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: '📊' },
  { label: 'Players', href: '/admin/players', icon: '👥' },
  { label: 'Draft Config', href: '/admin/config', icon: '⚙️' },
  { label: 'Participants', href: '/admin/participants', icon: '🎯' },
  { label: 'Monitor Draft', href: '/admin/monitor', icon: '👁️' },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-3 md:px-4 lg:px-6 py-3">
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            {/* Mobile/Tablet menu button */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors flex-shrink-0 touch-manipulation"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <h1 className="text-base md:text-xl font-semibold text-gray-900 truncate">
              Fantasy Cricket Draft - Admin
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/"
              className="px-3 md:px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              View Draft
            </Link>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-57px)]">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-[57px] left-0 z-30 h-[calc(100vh-57px)]
            w-64 bg-white border-r border-gray-200 flex-shrink-0
            transform transition-transform duration-200 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <nav className="p-4 space-y-1 overflow-y-auto h-full">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    text-sm font-medium transition-colors
                    ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={toggleSidebar}
          />
        )}

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6 xl:p-8 w-full overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
