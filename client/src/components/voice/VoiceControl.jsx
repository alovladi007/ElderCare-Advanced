import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  HelpCircle,
  CheckCircle,
  XCircle,
  Loader,
} from 'lucide-react';
import api from '../../utils/axios';

const VoiceControl = ({ elderId, homeId, className = '' }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const [supportedCommands, setSupportedCommands] = useState(null);

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  // Mirrors `speechEnabled` so `speak` can stay identity-stable and still read the
  // current value. Without this, the speech-recognition handlers registered below
  // would keep reading the value captured when recognition was created, and muting
  // would not take effect until elderId/homeId changed.
  const speechEnabledRef = useRef(speechEnabled);

  useEffect(() => {
    speechEnabledRef.current = speechEnabled;
  }, [speechEnabled]);

  const speak = useCallback((text) => {
    if (!synthRef.current || !speechEnabledRef.current) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9; // Slightly slower for elderly patients
    utterance.pitch = 1.0;
    utterance.volume = 0.9;

    synthRef.current.speak(utterance);
  }, []);

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript('');
      setResponse(null);
    };

    recognition.onresult = async (event) => {
      const result = event.results[0];
      const transcriptText = result[0].transcript;
      const confidence = result[0].confidence;

      setTranscript(transcriptText);
      setIsListening(false);
      setProcessing(true);

      // Process voice command
      try {
        const res = await api.post('/smart-home/voice/command', {
          elderId,
          homeId,
          transcript: transcriptText,
          confidence,
        });

        setResponse(res.data);

        // Add to history
        setCommandHistory((prev) => [
          {
            transcript: transcriptText,
            response: res.data.message,
            success: res.data.success,
            timestamp: new Date(),
          },
          ...prev.slice(0, 9), // Keep last 10 commands
        ]);

        // Speak response if enabled (`speak` no-ops when speech is muted)
        if (res.data.message) {
          speak(res.data.message);
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Failed to process voice command';
        setError(errorMsg);
        speak("I'm sorry, I had trouble processing that command.");
      } finally {
        setProcessing(false);
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setProcessing(false);

      if (event.error === 'no-speech') {
        setError("I didn't hear anything. Please try again.");
      } else if (event.error === 'audio-capture') {
        setError('No microphone detected. Please check your microphone.');
      } else if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone access.');
      } else {
        setError(`Voice recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    // Load supported commands
    loadSupportedCommands();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [elderId, homeId, speak]);

  const loadSupportedCommands = async () => {
    try {
      const res = await api.get('/smart-home/voice/commands');
      setSupportedCommands(res.data);
    } catch (err) {
      console.error('Failed to load supported commands:', err);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening && !processing) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const toggleSpeech = () => {
    setSpeechEnabled(!speechEnabled);
    if (speechEnabled) {
      synthRef.current.cancel();
    }
  };

  const getStatusColor = () => {
    if (isListening) return 'bg-red-500 animate-pulse';
    if (processing) return 'bg-yellow-500 animate-pulse';
    if (response?.success) return 'bg-green-500';
    if (error) return 'bg-red-500';
    return 'bg-gray-500';
  };

  const getStatusIcon = () => {
    if (isListening) return <Mic className="w-8 h-8" />;
    if (processing) return <Loader className="w-8 h-8 animate-spin" />;
    if (response?.success) return <CheckCircle className="w-8 h-8" />;
    if (error) return <XCircle className="w-8 h-8" />;
    return <MicOff className="w-8 h-8" />;
  };

  const getStatusText = () => {
    if (isListening) return 'Listening...';
    if (processing) return 'Processing...';
    if (response?.success) return 'Command executed';
    if (error) return 'Error occurred';
    return 'Ready to listen';
  };

  return (
    <div className={`${className}`}>
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Voice Control</h2>
            <p className="text-gray-400 text-sm">Speak naturally to control your home</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleSpeech}
              className={`p-3 rounded-lg transition-all ${
                speechEnabled
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-400'
              }`}
              title={speechEnabled ? 'Disable voice responses' : 'Enable voice responses'}
            >
              {speechEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all"
              title="Show help"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Control */}
        <div className="flex flex-col items-center mb-6">
          {/* Status Indicator */}
          <motion.div
            animate={{
              scale: isListening ? [1, 1.2, 1] : 1,
            }}
            transition={{
              duration: 1,
              repeat: isListening ? Infinity : 0,
            }}
            className={`w-32 h-32 rounded-full ${getStatusColor()} flex items-center justify-center mb-4 shadow-lg`}
          >
            <div className="text-white">{getStatusIcon()}</div>
          </motion.div>

          {/* Status Text */}
          <p className="text-white text-lg font-medium mb-4">{getStatusText()}</p>

          {/* Control Button */}
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={processing}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
              isListening
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : processing
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {isListening ? 'Stop Listening' : processing ? 'Processing...' : 'Start Listening'}
          </button>
        </div>

        {/* Transcript & Response */}
        <AnimatePresence>
          {(transcript || response || error) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              {/* Transcript */}
              {transcript && (
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-400 mb-1">You said:</p>
                  <p className="text-white font-medium">"{transcript}"</p>
                </div>
              )}

              {/* Response */}
              {response && (
                <div
                  className={`p-4 rounded-lg border ${
                    response.success
                      ? 'bg-green-900/30 border-green-500/50'
                      : 'bg-red-900/30 border-red-500/50'
                  }`}
                >
                  <p className="text-sm text-gray-400 mb-1">Response:</p>
                  <p className={`font-medium ${response.success ? 'text-green-400' : 'text-red-400'}`}>
                    {response.message}
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">Error:</p>
                  <p className="text-red-400 font-medium">{error}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Command History */}
        {commandHistory.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-bold text-white mb-3">Recent Commands</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {commandHistory.map((cmd, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-800 rounded-lg border border-gray-700 text-sm"
                >
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-gray-300">"{cmd.transcript}"</p>
                    {cmd.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 ml-2" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 ml-2" />
                    )}
                  </div>
                  <p className={`text-xs ${cmd.success ? 'text-green-400' : 'text-red-400'}`}>
                    {cmd.response}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(cmd.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Panel */}
        <AnimatePresence>
          {showHelp && supportedCommands && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
            >
              <h3 className="text-lg font-bold text-white mb-4">What Can I Say?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.values(supportedCommands).map((category, index) => (
                  <div key={index}>
                    <h4 className="text-sm font-bold text-indigo-400 mb-2">{category.category}</h4>
                    <ul className="space-y-1">
                      {category.examples.map((example, exIndex) => (
                        <li key={exIndex} className="text-sm text-gray-300 flex items-start">
                          <span className="text-gray-600 mr-2">•</span>
                          "{example}"
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tips */}
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-300">
            💡 <strong>Tips:</strong> Speak clearly and naturally. Say "help me" or "emergency" for immediate assistance.
            Use the help button to see all available commands.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceControl;
