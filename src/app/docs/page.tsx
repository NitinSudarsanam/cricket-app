import Link from 'next/link';

export const metadata = {
  title: 'Documentation',
  description: 'Getting started and user guide for the Fantasy Cricket Draft system',
};

export default function DocsPage() {
  return (
    <div className="bg-page">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-8">
          <Link href="/" className="link-primary text-sm font-medium">
            Back to Home
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-2">Documentation</h1>
        <p className="text-slate-600 mb-8">
          Getting started and how it works.
        </p>

        <section className="card-padded mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Quick Start</h2>
          <ol className="list-decimal list-inside stack-sm text-slate-700">
            <li>Open the <Link href="/admin" className="link-primary hover:underline">Admin Panel</Link>.</li>
            <li>Add players (Player Management) and at least 2 participants (Participants).</li>
            <li>Configure draft rules (Draft Config) and run the Configuration Consistency Check.</li>
            <li>Go to Monitor Draft, click Start Draft, select participants and draft order (Snake recommended).</li>
            <li>Participants join via <Link href="/draft" className="link-primary hover:underline">Join Draft</Link>, select their name, and make picks when it's their turn.</li>
          </ol>
        </section>

        <section className="card-padded mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Draft Order</h2>
          <p className="text-slate-700 mb-2">
            <strong>Snake:</strong> Order reverses each round (e.g. A to B to C then C to B to A).
          </p>
          <p className="text-slate-700">
            <strong>Linear:</strong> Same order every round.
          </p>
        </section>

        <section className="card-padded mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Pick Validation</h2>
          <p className="text-slate-700 mb-2">
            Every pick is checked for: player not already drafted, team caps, role requirements (e.g. min Batsmen/Bowlers), and early-round rules.
          </p>
        </section>

        <section className="card-padded">
          <h2 className="text-xl font-semibold text-slate-900 mb-3">More Help</h2>
          <p className="text-slate-700">
            For database setup, see <strong>SETUP_DATABASE.md</strong> in the project. For the full guide, see <strong>README_DRAFT_SYSTEM.md</strong> in the repo.
          </p>
        </section>
      </div>
    </div>
  );
}
