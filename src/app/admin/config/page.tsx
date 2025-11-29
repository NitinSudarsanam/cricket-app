import { AdminLayout, DraftConfigEditor, ConsistencyChecker } from '@/components/admin';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function ConfigPage() {
  return (
    <ErrorBoundary>
      <AdminLayout>
        <div className="space-y-8">
          <DraftConfigEditor />
          <ConsistencyChecker />
        </div>
      </AdminLayout>
    </ErrorBoundary>
  );
}
