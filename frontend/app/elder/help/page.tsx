'use client';

import { useState } from 'react';
import { smartHomeApi } from '@/lib/api';

export default function ElderHelpScreen() {
  const [helpRequested, setHelpRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // In a real app, these would come from authentication
  const demoHomeId = 'demo-home-id';
  const demoElderId = 'demo-elder-id';

  const handleHelpRequest = async () => {
    setLoading(true);
    try {
      await smartHomeApi.createHelpTrigger({
        homeId: demoHomeId,
        elderId: demoElderId,
        triggerType: 'BUTTON_PRESS',
        notes: 'Help button pressed from elder portal',
      });

      setHelpRequested(true);
      setMessage('Help is on the way! Your family has been notified.');

      // Reset after 10 seconds
      setTimeout(() => {
        setHelpRequested(false);
        setMessage('');
      }, 10000);
    } catch (error) {
      console.error('Error requesting help:', error);
      setMessage('Error sending help request. Please try again or call your family directly.');
    } finally {
      setLoading(false);
    }
  };

  const handleImOkay = () => {
    setHelpRequested(false);
    setMessage('Glad you\'re okay!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            ElderCare
          </h1>
          <p className="text-2xl text-gray-700">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          <p className="text-3xl text-gray-900 mt-2">
            {new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          {!helpRequested ? (
            <>
              <div className="text-center mb-8">
                <p className="text-2xl text-gray-700">
                  Press the button below if you need help
                </p>
              </div>

              {/* Big HELP Button */}
              <button
                onClick={handleHelpRequest}
                disabled={loading}
                className="w-full py-24 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-3xl shadow-xl transform transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="text-8xl font-bold mb-4">HELP</div>
                <div className="text-2xl">
                  {loading ? 'Calling for help...' : 'Press for Emergency Assistance'}
                </div>
              </button>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">✅</div>
                <p className="text-3xl font-bold text-green-600 mb-4">
                  Help Request Sent!
                </p>
                <p className="text-xl text-gray-700">
                  Your family has been notified and help is on the way.
                </p>
              </div>

              {/* I'm Okay Button */}
              <button
                onClick={handleImOkay}
                className="w-full py-12 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-3xl shadow-xl transform transition-all hover:scale-105 active:scale-95"
              >
                <div className="text-5xl font-bold mb-2">I'M OKAY</div>
                <div className="text-xl">Press if you no longer need help</div>
              </button>
            </>
          )}

          {/* Status Message */}
          {message && (
            <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <p className="text-lg text-gray-800">{message}</p>
            </div>
          )}
        </div>

        {/* Home Status Indicator */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xl text-gray-700">Home is in safe mode</span>
            </div>
            <div className="text-3xl">🏠</div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl">🚪</div>
              <p className="text-sm text-gray-600">Doors Locked</p>
            </div>
            <div>
              <div className="text-3xl">💡</div>
              <p className="text-sm text-gray-600">Lights Normal</p>
            </div>
            <div>
              <div className="text-3xl">🔔</div>
              <p className="text-sm text-gray-600">All Clear</p>
            </div>
          </div>
        </div>

        {/* Emergency Contact Info */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Emergency Contacts</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-lg text-gray-700">Sarah (Daughter)</span>
              <span className="text-blue-600 font-semibold">📞 Call</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg text-gray-700">Emergency Services</span>
              <span className="text-red-600 font-semibold">🚨 911</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
