import { AdminLayout } from '@/components/admin';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { IconUsers, IconSettings, IconTarget, IconEye, IconTrophy, IconCricket, IconChartBar } from '@/components/Icons';

export default function AdminDashboard() {
  return (
    <ErrorBoundary>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Admin Dashboard</h2>
            <p className="text-sm text-slate-600 mt-1">
              Manage players, config, and draft
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DashboardCard
              title="Player Management"
              description="Add, edit, and manage the player pool"
              icon={<IconUsers className="text-emerald-600" />}
              href="/admin/players"
            />
            <DashboardCard
              title="Draft Configuration"
              description="Configure draft rules and constraints"
              icon={<IconSettings className="text-emerald-600" />}
              href="/admin/config"
            />
            <DashboardCard
              title="Participants"
              description="Manage draft participants"
              icon={<IconTarget className="text-emerald-600" />}
              href="/admin/participants"
            />
            <DashboardCard
              title="Monitor Draft"
              description="View active draft and participant rosters"
              icon={<IconEye className="text-emerald-600" />}
              href="/admin/monitor"
            />
            <DashboardCard
              title="Results"
              description="View completed draft results"
              icon={<IconTrophy className="text-emerald-600" />}
              href="/admin/results"
            />
            <DashboardCard
              title="Leaderboard"
              description="Team and player rankings by season"
              icon={<IconChartBar className="text-emerald-600" />}
              href="/admin/leaderboard"
            />
            <DashboardCard
              title="Join Draft"
              description="Open the draft interface"
              icon={<IconCricket className="text-emerald-600" />}
              href="/draft"
            />
          </div>

          <div className="border border-slate-200 rounded-md p-6 bg-white">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Getting Started</h3>
            <ol className="list-decimal list-inside space-y-1.5 text-sm text-slate-600">
              <li>Import or add players to the player pool</li>
              <li>Configure draft rules and validate consistency</li>
              <li>Add participants to the draft</li>
              <li>Start the draft and monitor progress</li>
            </ol>
          </div>
        </div>
      </AdminLayout>
    </ErrorBoundary>
  );
}

interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

function DashboardCard({ title, description, icon, href }: DashboardCardProps) {
  return (
    <Link
      href={href}
      className="block p-6 rounded-md border border-slate-200 bg-white transition-colors hover:border-slate-300 hover:bg-slate-50/50"
    >
      <div className="mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600">{description}</p>
    </Link>
  );
}
