export default function SchemaBuilderApp() {
  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Header */}
      <header className="bg-slate-800 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Schema Builder</h1>
            <p className="text-slate-300 text-sm">
              Create JSON Schemas for credential data validation
            </p>
          </div>
        </div>
      </header>

      {/* Coming Soon Content */}
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Coming Soon</h2>
          <p className="text-gray-600 mb-6">
            The Schema Builder is currently under development. This tool will allow you to create
            and manage JSON Schemas for credential data validation in the COPA ecosystem.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 text-sm font-medium rounded-lg">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Under Development
          </div>
        </div>
      </main>
    </div>
  );
}
