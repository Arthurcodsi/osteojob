import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">About OsteoJob</h1>
          <p className="text-xl opacity-95">
            Connecting osteopaths with opportunities worldwide since 2022
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-lg text-gray-700 mb-4">
              OsteoJob is the world's leading job board dedicated exclusively to the osteopathic profession. 
              We connect talented osteopaths with clinics, practices, and healthcare facilities across the globe.
            </p>
            <p className="text-lg text-gray-700 mb-4">
              Whether you're a newly qualified osteopath looking for your first role, an experienced practitioner 
              seeking new challenges, or a practice owner searching for the perfect addition to your team, 
              OsteoJob is here to help you succeed.
            </p>
            <p className="text-lg text-gray-700">
              Our platform makes job searching and hiring simple, efficient, and effective for everyone 
              in the osteopathic community.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🌍</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Global Reach</h3>
                  <p className="text-gray-600">Connecting osteopaths across 25+ countries</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">💼</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Specialized Platform</h3>
                  <p className="text-gray-600">100% focused on osteopathic careers</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🤝</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Trusted Community</h3>
                  <p className="text-gray-600">Thousands of professionals and employers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-blue-600 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">OsteoJob by the Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">5,000+</div>
              <div className="text-blue-100">Registered Professionals</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">2,500+</div>
              <div className="text-blue-100">Job Postings</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">25+</div>
              <div className="text-blue-100">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">98%</div>
              <div className="text-blue-100">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-3">Quality</h3>
            <p className="text-gray-600">
              We maintain high standards for both job postings and candidate profiles to ensure 
              the best matches for everyone.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-5xl mb-4">💙</div>
            <h3 className="text-xl font-semibold mb-3">Community</h3>
            <p className="text-gray-600">
              We're dedicated to supporting and growing the global osteopathic community through 
              better career opportunities.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-5xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold mb-3">Innovation</h3>
            <p className="text-gray-600">
              We continuously improve our platform with new features to make job searching and 
              hiring easier and more effective.
            </p>
          </div>
        </div>
      </section>

      {/* Founders Section */}
      <section className="bg-gray-100 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Meet Our Co-Founders</h2>
          
          {/* Photos side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="text-center">
              <img 
                src="/about-us-photo1.jpg" 
                alt="Morgan Grosset"
                className="rounded-xl shadow-lg w-full max-w-sm mx-auto mb-4"
              />
              <h3 className="text-xl font-bold">Morgan GROSSET</h3>
              <p className="text-blue-600 font-semibold">Co-Founder</p>
            </div>
            
            <div className="text-center">
              <img 
                src="/about-us-photo2.jpg" 
                alt="Arthur Codsi"
                className="rounded-xl shadow-lg w-full max-w-sm mx-auto mb-4"
              />
              <h3 className="text-xl font-bold">Arthur CODSI</h3>
              <p className="text-blue-600 font-semibold">Osteopath & Co-Founder</p>
            </div>
          </div>
          
          {/* Quote and Mission */}
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-8">
              <blockquote className="text-lg text-gray-700 italic border-l-4 border-blue-600 pl-6">
                "Our mission is to offer a brand-new tool for the world-wide osteopathic community. 
                Here you will be able to access everything with simplicity inside a single platform, 
                in one click. OSTEOJOB is our solution for you."
              </blockquote>
              <p className="text-right text-gray-600 mt-4 font-semibold">- Morgan GROSSET</p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-8">
              <h4 className="font-semibold text-xl mb-4">Who We Are</h4>
              <p className="text-gray-700 mb-4">
                OSTEOJOB is the new osteopathic hub, combining everything that the profession needs.
              </p>
              <p className="text-gray-700">
                Just a simple platform which offers ways for osteopaths to find the best opportunities 
                for their career, or find colleagues with the same mindset.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">They Trust Us</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 items-center justify-items-center">
          <img 
            src="/OsteoHustle-logo.png" 
            alt="OsteoHustle"
            className="h-16 object-contain grayscale hover:grayscale-0 transition"
          />
          <img 
            src="/OsteoAllies-logo.png" 
            alt="OsteoAllies"
            className="h-16 object-contain grayscale hover:grayscale-0 transition"
          />
          <img 
            src="/Atman-logo.png" 
            alt="Atman"
            className="h-16 object-contain grayscale hover:grayscale-0 transition"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
        <p className="text-xl text-gray-600 mb-8">
          Whether you're looking for your next opportunity or searching for talented osteopaths, 
          we're here to help.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/jobs"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Browse Jobs
          </Link>
          <Link
            href="/auth/signup"
            className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            Sign Up Today
          </Link>
        </div>
      </section>
    </div>
  )
}