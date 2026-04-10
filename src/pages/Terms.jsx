import React from 'react'

const Terms = () => {
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
          <h1 className="text-5xl font-bold tracking-tight mb-4">Terms of Service</h1>
          <p className="text-blue-200 text-lg max-w-xl mx-auto">
            Please read these terms carefully before using the Everywhere Cars platform or services.
          </p>
        </div>
      </section>

      {/* Body */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-card p-8 sm:p-10 space-y-8">

            <section>
              <h2 className="text-2xl font-bold text-[#1a365d] mb-4 pb-2 border-b border-gray-100">1. Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using Everywhere Cars, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#1a365d] mb-4 pb-2 border-b border-gray-100">2. Use License</h2>
              <p className="text-gray-700 leading-relaxed">
                Permission is granted to temporarily download one copy of the materials (information or software) on Everywhere Cars for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#1a365d] mb-4 pb-2 border-b border-gray-100">3. Disclaimer</h2>
              <p className="text-gray-700 leading-relaxed">
                The materials on Everywhere Cars are provided on an 'as is' basis. Everywhere Cars makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#1a365d] mb-4 pb-2 border-b border-gray-100">4. Limitations</h2>
              <p className="text-gray-700 leading-relaxed">
                In no event shall Everywhere Cars or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Everywhere Cars.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#1a365d] mb-4 pb-2 border-b border-gray-100">5. Accuracy of Materials</h2>
              <p className="text-gray-700 leading-relaxed">
                The materials appearing on Everywhere Cars could include technical, typographical, or photographic errors. Everywhere Cars does not warrant that any of the materials on our website are accurate, complete, or current.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-[#1a365d] mb-4 pb-2 border-b border-gray-100">6. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at{' '}
                <a href="mailto:legal@everywherecars.com" className="text-[#1a365d] font-semibold hover:underline">
                  legal@everywherecars.com
                </a>
              </p>
            </section>

          </div>
        </div>
      </section>
    </div>
  )
}

export default Terms
