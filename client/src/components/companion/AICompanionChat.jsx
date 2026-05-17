import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Send,
  Volume2,
  VolumeX,
  Heart,
  Clock,
  Phone,
  Pill,
  Calendar,
  Activity,
  Smile,
  Settings,
  User,
} from 'lucide-react';
import api from '../../utils/axios';

const AICompanionChat = ({ elderId, className = '' }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [companionName, setCompanionName] = useState('Emma');
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [showActions, setShowActions] = useState(null);
  const [stats, setStats] = useState(null);

  const messagesEndRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const inputRef = useRef(null);

  useEffect(() => {
    loadConversationHistory();
    loadStats();
  }, [elderId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversationHistory = async () => {
    try {
      const res = await api.get(`/ai-companion/conversation/${elderId}?limit=20`);
      const formattedMessages = res.data.flatMap((conv) => [
        {
          role: 'user',
          content: conv.content,
          timestamp: conv.timestamp,
        },
        {
          role: 'assistant',
          content: res.data[res.data.indexOf(conv) + 1]?.content || '',
          timestamp: conv.timestamp,
        },
      ]).filter(m => m.content);
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const loadStats = async () => {
    try {
      const res = await api.get(`/ai-companion/stats/${elderId}?days=7`);
      setStats(res.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await api.post('/ai-companion/chat', {
        elderId,
        message: inputMessage,
      });

      const assistantMessage = {
        role: 'assistant',
        content: res.data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setCompanionName(res.data.companionName);

      // Handle actions
      if (res.data.actions && res.data.actions.length > 0) {
        setShowActions(res.data.actions);
        setTimeout(() => setShowActions(null), 10000);
      }

      // Speak response if enabled
      if (speechEnabled) {
        speak(res.data.response);
      }

      loadStats(); // Update stats
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const speak = (text) => {
    if (!synthRef.current) return;

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85; // Slower for elderly
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to use a warm, friendly voice
    const voices = synthRef.current.getVoices();
    const friendlyVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Samantha'));
    if (friendlyVoice) {
      utterance.voice = friendlyVoice;
    }

    synthRef.current.speak(utterance);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendQuickMessage = (message) => {
    setInputMessage(message);
    setTimeout(() => sendMessage(), 100);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const quickMessages = [
    { icon: Pill, text: "What medications do I need to take today?", color: "blue" },
    { icon: Calendar, text: "Do I have any appointments coming up?", color: "green" },
    { icon: Phone, text: "I'd like to call my family", color: "purple" },
    { icon: Activity, text: "Can you suggest some exercises?", color: "orange" },
    { icon: Heart, text: "I'm feeling lonely today", color: "pink" },
    { icon: Smile, text: "Tell me something cheerful", color: "yellow" },
  ];

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{companionName}</h2>
              <p className="text-indigo-200 text-sm">Your Personal Companion</p>
              {stats && (
                <p className="text-indigo-300 text-xs mt-1">
                  {stats.totalConversations} conversations this week
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSpeechEnabled(!speechEnabled)}
              className={`p-3 rounded-xl transition-all ${
                speechEnabled
                  ? 'bg-white/20 hover:bg-white/30 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-indigo-300'
              }`}
              title={speechEnabled ? 'Disable voice' : 'Enable voice'}
            >
              {speechEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-4" style={{ maxHeight: '60vh' }}>
        {/* Welcome message */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="inline-block p-6 bg-white rounded-2xl shadow-md mb-4">
              <MessageCircle className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Hello! I'm {companionName} 👋
              </h3>
              <p className="text-gray-600 text-lg max-w-md mx-auto">
                I'm here to keep you company, help with daily tasks, and make sure you're feeling well.
                How can I help you today?
              </p>
            </div>
          </motion.div>
        )}

        {/* Messages */}
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl shadow-md ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-800 border-2 border-indigo-100'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2 text-indigo-600">
                    <User className="w-5 h-5" />
                    <span className="font-semibold text-sm">{companionName}</span>
                  </div>
                )}
                <p className="text-lg leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-indigo-200' : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white p-4 rounded-2xl shadow-md border-2 border-indigo-100">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                <span className="font-semibold text-sm text-indigo-600">{companionName}</span>
              </div>
              <div className="flex gap-2 mt-2">
                <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4"
            >
              <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Quick Actions
              </h4>
              <div className="space-y-2">
                {showActions.map((action, index) => (
                  <div key={index} className="flex items-start gap-3 bg-white p-3 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {action.type === 'MEDICATION_REMINDER' && <Pill className="w-5 h-5 text-blue-600" />}
                      {action.type === 'APPOINTMENT_REMINDER' && <Calendar className="w-5 h-5 text-green-600" />}
                      {action.type === 'SUGGEST_CALL' && <Phone className="w-5 h-5 text-purple-600" />}
                      {action.type === 'SUGGEST_EXERCISE' && <Activity className="w-5 h-5 text-orange-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{action.type.replace('_', ' ')}</p>
                      {action.data && (
                        <p className="text-xs text-gray-600 mt-1">
                          {JSON.stringify(action.data).slice(0, 100)}...
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Messages (before first message) */}
      {messages.length === 0 && (
        <div className="p-4 bg-white border-t-2 border-gray-200">
          <p className="text-sm text-gray-600 mb-3 font-medium">Quick questions:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {quickMessages.map((quick, index) => (
              <button
                key={index}
                onClick={() => sendQuickMessage(quick.text)}
                className={`p-3 bg-${quick.color}-50 hover:bg-${quick.color}-100 border-2 border-${quick.color}-200 rounded-xl text-left transition-all flex items-start gap-2 group`}
              >
                <quick.icon className={`w-5 h-5 text-${quick.color}-600 flex-shrink-0 mt-0.5`} />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">{quick.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white p-4 border-t-2 border-gray-200 rounded-b-2xl">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Type your message to ${companionName}...`}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none transition-all"
              rows="2"
              disabled={loading}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={loading || !inputMessage.trim()}
            className={`px-6 py-3 rounded-xl font-bold text-lg transition-all flex items-center gap-2 ${
              loading || !inputMessage.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            <Send className="w-6 h-6" />
            Send
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          💡 Press Enter to send • {companionName} responds with voice and text
        </p>
      </div>
    </div>
  );
};

export default AICompanionChat;
