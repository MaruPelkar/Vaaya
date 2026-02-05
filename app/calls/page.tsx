import CSVUpload from '@/components/csv-upload';

export const metadata = {
  title: 'Bolna AI Calls | Vaaya',
  description: 'Automate AI calls with Bolna using CSV uploads',
};

export default function CallsPage() {
  return (
    <main className="min-h-screen bg-[var(--vaaya-white)]">
      {/* Navigation */}
      <nav className="border-b border-[var(--vaaya-border)] bg-white">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="text-2xl font-bold text-[var(--vaaya-brand)]">
              Vaaya
            </a>
            <div className="flex gap-6">
              <a
                href="/"
                className="text-body text-[var(--vaaya-text-muted)] hover:text-[var(--vaaya-brand)] transition-colors"
              >
                Search
              </a>
              <a
                href="/calls"
                className="text-body text-[var(--vaaya-brand)] font-semibold"
              >
                AI Calls
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="py-12">
        <CSVUpload />
      </div>

      {/* Footer Info */}
      <div className="max-w-4xl mx-auto px-8 pb-12">
        <div className="border border-[var(--vaaya-border)] rounded-lg bg-white p-6">
          <h3 className="font-bold text-lg mb-3">CSV Format Requirements</h3>
          <p className="text-sm text-[var(--vaaya-text-muted)] mb-4">
            Your CSV file must include the following columns (case-insensitive):
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-[var(--vaaya-text-muted)] mb-4">
            <li><strong>sno</strong> - Serial number or ID</li>
            <li><strong>name</strong> - Contact person's name</li>
            <li><strong>software</strong> - Software or product name</li>
            <li><strong>phone_number</strong> - Phone number with country code (e.g., +1234567890)</li>
          </ul>
          <div className="bg-[var(--vaaya-neutral)] p-4 rounded-lg">
            <p className="text-xs font-mono text-[var(--vaaya-text-muted)] mb-2">Example CSV:</p>
            <pre className="text-xs font-mono">
sno,name,software,phone_number
1,John Doe,Salesforce,+14155551234
2,Jane Smith,HubSpot,+14155555678
            </pre>
          </div>
        </div>
      </div>
    </main>
  );
}
