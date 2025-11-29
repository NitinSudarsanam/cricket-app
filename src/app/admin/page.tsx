import { AdminLayout } from '@/components/admin';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <ErrorBoundary>
      <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">
            Welcome to the Fantasy Cricket Draft admin panel
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardCard
            title="Player Management"
            description="Add, edit, and manage the player pool"
            icon="👥"
            href="/admin/players"
            color="blue"
          />
          
          <DashboardCard
            title="Draft Configuration"
            description="Configure draft rules and constraints"
            icon="⚙️"
            href="/admin/config"
            color="purple"
          />
          
          <DashboardCard
            title="Participants"
            description="Manage draft participants"
            icon="🎯"
            href="/admin/participants"
            color="green"
          />
          
          <DashboardCard
            title="Monitor Draft"
            description="View active draft and participant rosters"
            icon="👁️"
            href="/admin/monitor"
            color="orange"
          />
          
          <DashboardCard
            title="View Draft"
            description="Go to the draft interface"
            icon="🏏"
            href="/draft"
            color="red"
          />
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Getting Started</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
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
  icon: string;
  href: string;
  color: 'blue' | 'purple' | 'green' | 'orange' | 'red';
}

function DashboardCard({ title, description, icon, href, color }: DashboardCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    green: 'bg-green-50 border-green-200 hover:bg-green-100',
    orange: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
    red: 'bg-red-50 border-red-200 hover:bg-red-100',
  };

  return (
    <Link
      href={href}
      className={`block p-6 rounded-lg border-2 transition-all ${colorClasses[color]}`}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </Link>
  );
}
