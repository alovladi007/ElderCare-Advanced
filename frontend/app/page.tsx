import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            ElderCare Advanced
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Smart Home & Extreme Safety Module
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Family/Caregiver Portal */}
          <Link href="/elders/demo-elder-id/home">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer">
              <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Family Portal
              </h2>
              <p className="text-gray-600 mb-4">
                Monitor your loved one's home safety, devices, and alerts
              </p>
              <div className="text-blue-600 font-semibold">
                View Smart Home Dashboard →
              </div>
            </div>
          </Link>

          {/* Elder Portal */}
          <Link href="/elder/help">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer">
              <div className="text-4xl mb-4">👴</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Elder Portal
              </h2>
              <p className="text-gray-600 mb-4">
                Simple interface with big HELP button for emergencies
              </p>
              <div className="text-blue-600 font-semibold">
                Go to Help Screen →
              </div>
            </div>
          </Link>

          {/* Admin Portal */}
          <Link href="/admin/simulator">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer">
              <div className="text-4xl mb-4">⚙️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Admin/Demo
              </h2>
              <p className="text-gray-600 mb-4">
                Test emergency scenarios and automation rules
              </p>
              <div className="text-blue-600 font-semibold">
                Open Simulator →
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-16 max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Features</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <span className="text-2xl mr-3">🏠</span>
              <div>
                <h4 className="font-semibold">Smart Home Monitoring</h4>
                <p className="text-sm text-gray-600">Real-time device status and sensor data</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">🚨</span>
              <div>
                <h4 className="font-semibold">Emergency Detection</h4>
                <p className="text-sm text-gray-600">Fall, smoke, gas leak, and more</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">⚡</span>
              <div>
                <h4 className="font-semibold">Automation Rules</h4>
                <p className="text-sm text-gray-600">Trigger lights, alerts based on events</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">🆘</span>
              <div>
                <h4 className="font-semibold">Escalation Protocols</h4>
                <p className="text-sm text-gray-600">Stepwise emergency response</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-600">
          <p className="text-sm">
            Demo credentials are available in the README.md file
          </p>
        </div>
      </div>
    </div>
  )
}
