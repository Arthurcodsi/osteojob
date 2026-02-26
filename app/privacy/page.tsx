export const metadata = { title: 'Privacy Policy – OsteoJob' }

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">OsteoJob Limited</p>

        <div className="prose prose-gray max-w-none text-gray-700 space-y-8">

          <p className="text-lg font-medium text-gray-800">We take the privacy of our users very seriously.</p>

          <p>OsteoJob values the trust placed in us by job seekers and employers. We invest in protecting your personal data and are guided by the following privacy principles.</p>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Our Core Commitments</h2>

            <div className="space-y-5">
              <div>
                <h3 className="font-medium text-gray-800 mb-1">1. Equal Treatment</h3>
                <p>We provide a broad suite of privacy rights to all users globally, enabling you to:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Access your personal data</li>
                  <li>Request deletion of your personal data</li>
                  <li>Obtain a portable version of your personal data</li>
                  <li>Restrict or object to certain processing of your personal data</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-1">2. Privacy by Design</h3>
                <p>We adhere to privacy-first principles in building and operating our services.</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-1">3. Transparency</h3>
                <p>We clearly communicate what personal data is collected and how it is processed.</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-1">4. Data Minimisation</h3>
                <p>We limit the collection and storage of personal data to what is adequate, relevant, and necessary for the purposes for which it is processed.</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-1">5. Data Quality</h3>
                <p>We keep personal information accurate and current where appropriate.</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-1">6. Security & Accountability</h3>
                <p>We process data using appropriate security measures and demonstrate responsibility under applicable privacy laws.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Contact</h2>
            <p>If you have any questions or concerns regarding this Privacy Policy or your personal data, please contact us at <a href="mailto:contact@osteojob.com" className="text-blue-600 hover:underline">contact@osteojob.com</a>.</p>
          </section>

        </div>
      </div>
    </main>
  )
}
