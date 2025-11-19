'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function SafeHomePage() {
  const [helpRequested, setHelpRequested] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const handleHelpPress = async () => {
    // TODO: Call API to trigger HELP event
    setHelpRequested(true);

    // Start countdown to cancel
    let count = 10;
    setCountdown(count);

    const interval = setInterval(() => {
      count -= 1;
      setCountdown(count);

      if (count <= 0) {
        clearInterval(interval);
        // Actually send help request
        console.log('Help request sent!');
      }
    }, 1000);
  };

  const handleCancel = () => {
    setHelpRequested(false);
    setCountdown(null);
  };

  const handleOkPress = () => {
    // TODO: Call API to acknowledge I'm OK
    console.log('OK button pressed');
  };

  return (
    <DashboardLayout allowedRoles={['ELDER']}>
      <div className="min-h-screen flex items-center justify-center p-4">
        {!helpRequested ? (
          /* Normal State - Big HELP Button */
          <div className="text-center space-y-12 max-w-2xl">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 mb-4">
                Safe Home
              </h1>
              <p className="text-2xl text-gray-600">
                Press the button below if you need help
              </p>
            </div>

            <button
              onClick={handleHelpPress}
              className="w-80 h-80 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-full shadow-2xl transition-all transform hover:scale-105 active:scale-95 mx-auto block"
            >
              <div className="flex flex-col items-center justify-center space-y-4">
                <svg className="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  <circle cx="12" cy="12" r="9" strokeWidth={3} />
                </svg>
                <span className="text-6xl font-bold">HELP</span>
              </div>
            </button>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg text-left">
              <p className="text-lg text-blue-800">
                <strong>You are safe.</strong> If you need assistance, press the HELP button and someone will come to help you right away.
              </p>
            </div>

            {/* I'm OK Button */}
            <div className="pt-8">
              <button
                onClick={handleOkPress}
                className="px-12 py-6 bg-green-600 hover:bg-green-700 text-white rounded-xl text-3xl font-semibold shadow-lg"
              >
                I'm OK ✓
              </button>
              <p className="mt-4 text-gray-600 text-lg">
                Press this if you're feeling well
              </p>
            </div>

            {/* Home Status */}
            <div className="grid grid-cols-3 gap-4 pt-8">
              <div className="bg-white shadow-lg rounded-lg p-6">
                <div className="text-4xl mb-2">🔒</div>
                <p className="text-sm text-gray-600">Doors</p>
                <p className="text-xl font-semibold text-green-600">Locked</p>
              </div>
              <div className="bg-white shadow-lg rounded-lg p-6">
                <div className="text-4xl mb-2">💡</div>
                <p className="text-sm text-gray-600">Lights</p>
                <p className="text-xl font-semibold text-gray-600">Auto</p>
              </div>
              <div className="bg-white shadow-lg rounded-lg p-6">
                <div className="text-4xl mb-2">🌡️</div>
                <p className="text-sm text-gray-600">Temperature</p>
                <p className="text-xl font-semibold text-gray-600">72°F</p>
              </div>
            </div>
          </div>
        ) : (
          /* Help Requested State */
          <div className="text-center space-y-8 max-w-2xl">
            <div className="animate-pulse">
              <svg className="w-40 h-40 mx-auto text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>

            <div>
              <h1 className="text-6xl font-bold text-red-600 mb-4">
                HELP REQUESTED
              </h1>
              <p className="text-3xl text-gray-700">
                Help is on the way!
              </p>
            </div>

            {countdown !== null && countdown > 0 && (
              <div>
                <p className="text-2xl text-gray-600 mb-4">
                  Alerting family in {countdown} seconds...
                </p>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-red-600 h-4 rounded-full transition-all duration-1000"
                    style={{ width: `${((10 - countdown) / 10) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {countdown === 0 && (
              <div className="space-y-4">
                <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
                  <p className="text-2xl text-green-800 font-semibold">
                    ✓ Family has been notified
                  </p>
                  <p className="text-lg text-green-700 mt-2">
                    Someone will be with you soon. Stay where you are.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleCancel}
              className="px-16 py-8 bg-gray-600 hover:bg-gray-700 text-white rounded-xl text-4xl font-semibold shadow-lg"
            >
              Cancel - I'm OK
            </button>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
              <p className="text-xl text-blue-800">
                If you pressed HELP by mistake, click "Cancel - I'm OK" above.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
