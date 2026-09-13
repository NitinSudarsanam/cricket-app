import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-session';
import { AdminLayout } from '@/components/admin';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const dynamic = 'force-dynamic';

/**
 * Auth-checking layout for all admin pages (except /admin/login which
 * lives outside this route group). Redirects unauthenticated users to
 * the admin login page.
 */
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    redirect('/admin/login');
  }

  return (
    <AdminLayout>
      <ErrorBoundary>{children}</ErrorBoundary>
    </AdminLayout>
  );
}
