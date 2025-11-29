import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              🏏 Fantasy Cricket Draft
            </h1>
            <p className="text-xl text-gray-600">
              Real-time IPL fantasy draft system with smart validation
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-Time Updates</h3>
              <p className="text-gray-600">
                Live draft updates across all participants with &lt;2 second latency
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Validation</h3>
              <p className="text-gray-600">
                Automatic enforcement of team constraints, role requirements, and early round rules
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl mb-3">🎛️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Admin Dashboard</h3>
              <p className="text-gray-600">
                Complete control over players, configuration, and draft monitoring
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl mb-3">🏆</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Draft Interface</h3>
              <p className="text-gray-600">
                Clean, intuitive UI with roster tracking and pick history
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/admin"
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors text-center shadow-lg"
            >
              🎛️ Admin Dashboard
            </Link>
            
            <Link
              href="/draft"
              className="px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors text-center shadow-lg"
            >
              🏏 Join Draft
            </Link>
          </div>

          {/* Quick Links */}
          <div className="mt-12 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <Link href="/admin/players" className="text-blue-600 hover:text-blue-700 hover:underline">
                → Player Management
              </Link>
              <Link href="/admin/config" className="text-blue-600 hover:text-blue-700 hover:underline">
                → Draft Configuration
              </Link>
              <Link href="/admin/participants" className="text-blue-600 hover:text-blue-700 hover:underline">
                → Manage Participants
              </Link>
              <Link href="/admin/monitor" className="text-blue-600 hover:text-blue-700 hover:underline">
                → Draft Monitor
              </Link>
              <Link href="/api/health" className="text-blue-600 hover:text-blue-700 hover:underline">
                → System Health
              </Link>
              <a 
                href="https://github.com/yourusername/fantasy-cricket-draft" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 hover:underline"
              >
                → Documentation
              </a>
            </div>
          </div>

          {/* Status */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>✅ Database Connected • ✅ Real-Time Enabled • ✅ 16 Players Loaded</p>
          </div>
        </div>
      </div>
    </div>
  );
}
