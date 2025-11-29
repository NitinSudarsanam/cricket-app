import { AdminLayout, PlayerManagement } from '@/components/admin';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function PlayersPage() {
  return (
    <ErrorBoundary>
      <AdminLayout>
        <PlayerManagement />
      </AdminLayout>
    </ErrorBoundary>
  );
}
