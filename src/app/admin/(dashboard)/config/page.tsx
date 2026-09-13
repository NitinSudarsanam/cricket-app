import { DraftConfigEditor, ConsistencyChecker } from '@/components/admin';

export default function ConfigPage() {
  return (
    <div className="space-y-8">
      <DraftConfigEditor />
      <ConsistencyChecker />
    </div>
  );
}
