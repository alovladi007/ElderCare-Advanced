import React, { useEffect } from 'react';
import { Home, ArrowRight, Zap, Shield, Activity } from 'lucide-react';

const SmartHomeRedirectPage = () => {
  const smartHomePlatformUrl = 'http://localhost:6100';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center transform rotate-12 animate-pulse">
            <Home className="w-14 h-14 text-white transform -rotate-12" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Smart Home Platform
        </h1>
        <p className="text-xl text-blue-200 mb-8">
          Advanced home automation and device management
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
            <p className="text-white font-semibold">Automation</p>
            <p className="text-blue-200 text-sm">Smart scenes & rules</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <Activity className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <p className="text-white font-semibold">Real-Time</p>
            <p className="text-blue-200 text-sm">Live device control</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <Shield className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <p className="text-white font-semibold">Security</p>
            <p className="text-blue-200 text-sm">Secure & encrypted</p>
          </div>
        </div>

        {/* CTA Button */}
        <a
          href={smartHomePlatformUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
        >
          Open Smart Home Dashboard
          <ArrowRight className="w-6 h-6" />
        </a>

        {/* Info */}
        <p className="text-blue-300 text-sm mt-6">
          Opens in a new window at {smartHomePlatformUrl}
        </p>

        {/* Note */}
        <div className="mt-10 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-yellow-200 text-sm">
            <strong>Note:</strong> Make sure the Smart Home Platform is running.
            <br />
            If you see an error, start it with: <code className="bg-black/30 px-2 py-1 rounded">docker compose up</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SmartHomeRedirectPage;
