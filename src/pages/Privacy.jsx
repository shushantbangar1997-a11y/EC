import React from 'react'

const Privacy = () => {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)', transition: 'background 300ms ease' }}>

      {/* Branded Hero */}
      <section className="relative bg-gradient-to-br from-[#0f1f3d] via-[#1a365d] to-[#1a3a6b] text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600 opacity-10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-800 opacity-15 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="flex justify-center mb-6">
            <img src="/logo.png?v=3" alt="Everywhere Cars" className="h-14 w-auto" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-blue-200 text-lg max-w-xl mx-auto">
            How Everywhere Cars collects, uses, and protects your personal information.
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-card p-8 sm:p-10 space-y-8">

            <section>
              <h2 className="text-2xl font-bold text-[#1a365d] mb-4 pb-2 border-b border-gray-100">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                Everywhere Cars ("Company", "we", "our", or "us") operates the website and mobile application. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#1a365d] mb-4 pb-2 border-b border-gray-100">2. Information Collection and Use</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We collect several different types of information for various purposes to provide and improve our Service to you.
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Personal Data: Name, email address, phone number, location data</li>
                <li>Usage Data: Pages visited, time spent, device information, browser information</li>
                <li>Payment Information: Transaction details (processed securely by third parties)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#1a365d] mb-4 pb-2 border-b border-gray-100">3. Use of Data</h2>
              <p className="text-gray-700 leading-relaxed">
                Everywhere Cars uses the collected data for various purposes, including providing and maintaining our Service, notifying you about changes to our Service, allowing you to participate in interactive features, and for analysis and improvement of our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#1a365d] mb-4 pb-2 border-b border-gray-100">4. Security of Data</h2>
              <p className="text-gray-700 leading-relaxed">
                The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#1a365d] mb-4 pb-2 border-b border-gray-100">5. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at{' '}
                <a href="mailto:privacy@everywherecars.com" className="text-[#1a365d] font-semibold hover:underline">
                  privacy@everywherecars.com
                </a>
              </p>
            </section>

          </div>
        </div>
      </section>
    </div>
  )
}

export default Privacy
