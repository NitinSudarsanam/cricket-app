import { AdminLayout } from '@/components/admin';
import { DraftResultsView } from '@/components/admin/DraftResultsView';

export default function ResultsPage() {
  return (
    <AdminLayout>
      <DraftResultsView />
    </AdminLayout>
  );
}
