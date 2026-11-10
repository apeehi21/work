import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  Sparkles,
  ArrowRight,
  MoreVertical,
  Ghost,
  MessageCircle,
  Clock,
  RotateCcw,
  CheckCircle2,
  Lock,
  Volume2,
  VolumeX
} from 'lucide-react';
import { BackgroundEffects } from './components/BackgroundEffects.tsx';
import { GiftBox } from './components/GiftBox.tsx';
import { MemoriesAlbum } from './components/MemoriesAlbum.tsx';
import { AdminLogin } from './components/AdminLogin.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import {
  testConnection,
  createVisitorRecord,
  updateVisitorStep
} from './firebase.ts';

type AppView = 'experience' | 'album' | 'admin-login' | 'admin-dashboard';

export default function App() {
  // Current view mode
  const [currentView, setCurrentView] = useState<AppView>('experience');

  // Scene state (1 to 10)
  const [scene, setScene] = useState<number>(1);

  // Visitor session state - isolated per visit
  const [visitorId, setVisitorId] = useState<string>('');
  const [visitorName, setVisitorName] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');
  const [nameError, setNameError] = useState<string | null>(null);

  // Scene 4: Snapchat
  const [snapchatOption, setSnapchatOption] = useState<string>('');
  const [snapchatIdInput, setSnapchatIdInput] = useState<string>('');

  // Scene 6: Memory
  const [memoryOption, setMemoryOption] = useState<string>('');
  const [memoryFollowUpInput, setMemoryFollowUpInput] = useState<string>('');

  // Scene 7: Personal Message
  const [personalMessageInput, setPersonalMessageInput] = useState<string>('');

  // Scene 8: Final Proposal
  const [finalProposalAnswer, setFinalProposalAnswer] = useState<'YES' | 'NO' | null>(null);

  // Admin in-memory authentication state (STRICT: not in localStorage / sessionStorage)
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminUsername, setAdminUsername] = useState<string>('');

  // Subtle saving status indicator
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Initialize and test connection on boot
  useEffect(() => {
    testConnection();
    // Initialize first session ID
    setVisitorId('vis_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8));
  }, []);

  // Browser Back button guard for Admin Privacy
  useEffect(() => {
    const handlePopState = () => {
      // If user tries to use browser back button into admin dashboard without token, redirect immediately
      if (currentView === 'admin-dashboard' && !adminToken) {
        setCurrentView('admin-login');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentView, adminToken]);

  // Handle Replay - CRITICAL CORRECTION: Starts from Scene 1 (Name Entry) with NEW session ID!
  const handleReplay = () => {
    // 1. Generate fresh unique visitor session ID
    const newSessionId = 'vis_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    setVisitorId(newSessionId);

    // 2. Wipe all visitor inputs from frontend memory
    setVisitorName('');
    setNameInput('');
    setNameError(null);
    setSnapchatOption('');
    setSnapchatIdInput('');
    setMemoryOption('');
    setMemoryFollowUpInput('');
    setPersonalMessageInput('');
    setFinalProposalAnswer(null);

    // 3. Return to Scene 1 — Name Entry
    setScene(1);
    setCurrentView('experience');
  };

  // Scene 1: Submit Name
  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError('Please enter your name ❤️');
      return;
    }
    setNameError(null);
    setVisitorName(trimmed);
    setIsSaving(true);

    try {
      await createVisitorRecord(visitorId, trimmed);
    } catch (err) {
      console.error('Failed to create visitor record:', err);
    } finally {
      setIsSaving(false);
    }

    setScene(2);
  };

  // Scene 2: Mast button clicked
  const handleGreetingSubmit = () => {
    setScene(3);
  };

  // Scene 3: Poocho button clicked
  const handleIntroSubmit = () => {
    setScene(4);
  };

  // Scene 4: Snapchat Submit
  const handleSnapchatSubmit = async () => {
    if (!snapchatOption) return;
    setIsSaving(true);

    try {
      await updateVisitorStep(visitorId, {
        visitorName,
        snapchatAnswer: snapchatOption,
        snapchatId: snapchatOption.includes('Nahi') ? null : (snapchatIdInput.trim() || null)
      });
    } catch (err) {
      console.error('Error saving Snapchat answer:', err);
    } finally {
      setIsSaving(false);
    }

    setScene(5);
  };

  // Scene 5: Shayari Next
  const handleShayariNext = () => {
    setScene(6);
  };

  // Scene 6: Memory Submit
  const handleMemorySubmit = async () => {
    if (!memoryOption) return;
    setIsSaving(true);

    try {
      await updateVisitorStep(visitorId, {
        visitorName,
        memoryAnswer: memoryOption,
        memoryFollowUp: memoryFollowUpInput.trim() || undefined
      });
    } catch (err) {
      console.error('Error saving memory answer:', err);
    } finally {
      setIsSaving(false);
    }

    setScene(7);
  };

  // Scene 7: Personal Message Submit
  const handleMessageSubmit = async () => {
    setIsSaving(true);

    try {
      await updateVisitorStep(visitorId, {
        visitorName,
        personalMessage: personalMessageInput.trim() || undefined
      });
    } catch (err) {
      console.error('Error saving personal message:', err);
    } finally {
      setIsSaving(false);
    }

    setScene(8);
  };

  // Scene 8: Proposal Answer
  const handleProposalAnswer = async (answer: 'YES' | 'NO') => {
    setFinalProposalAnswer(answer);
    setIsSaving(true);

    try {
      await updateVisitorStep(visitorId, {
        visitorName,
        finalAnswer: answer,
        completionStatus: answer === 'YES' ? 'completed' : 'declined'
      });
    } catch (err) {
      console.error('Error saving proposal answer:', err);
    } finally {
      setIsSaving(false);
    }

    if (answer === 'YES') {
      setScene(9);
    } else {
      setScene(10);
    }
  };

  // Admin Logout: completely resets admin credentials, sensitive memory data, and returns to Login or public
  const handleAdminLogout = async () => {
    if (adminToken) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });
      } catch {
        // Continue logout locally
      }
    }

    setAdminToken(null);
    setAdminUsername('');
    setCurrentView('admin-login');
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0b0308] text-rose-50 flex flex-col justify-between overflow-x-hidden selection:bg-rose-500 selection:text-white">
      {/* Background Animated Floating Hearts & Glowing Canvas */}
      <BackgroundEffects />

      {/* Top Header / Navigation Bar */}
      <header className="relative z-20 w-full px-4 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shadow-lg shadow-rose-950"
          >
            <Heart className="w-4 h-4 text-rose-400 fill-rose-500" />
          </motion.div>
          <span className="font-serif-display font-semibold tracking-wider text-rose-200 text-sm md:text-base">
            ehehehe ❤️
          </span>
        </div>

        {/* Three-Dot Admin Menu:
            Position: TOP-RIGHT corner
            Visible ONLY after either YES or NO is selected (Scene 9 or 10), or when already in admin mode
        */}
        {(scene >= 9 || currentView === 'admin-login' || currentView === 'admin-dashboard') && (
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (currentView === 'admin-dashboard') {
                  setCurrentView('experience');
                } else if (currentView === 'admin-login') {
                  setCurrentView('experience');
                } else {
                  // Always open Admin Login (never bypasses login)
                  if (adminToken) {
                    setCurrentView('admin-dashboard');
                  } else {
                    setCurrentView('admin-login');
                  }
                }
              }}
              title="Admin Menu"
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-rose-200 border border-rose-500/30 transition-all shadow-lg backdrop-blur-md cursor-pointer"
              aria-label="Admin options"
            >
              <MoreVertical className="w-4 h-4" />
            </motion.button>
          </div>
        )}
      </header>

      {/* Main Experience View */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6">
        {currentView === 'album' ? (
          <MemoriesAlbum onBack={() => setCurrentView('experience')} />
        ) : currentView === 'admin-login' ? (
          <AdminLogin
            onLoginSuccess={(token, user) => {
              setAdminToken(token);
              setAdminUsername(user);
              setCurrentView('admin-dashboard');
            }}
            onBackToWebsite={() => setCurrentView('experience')}
          />
        ) : currentView === 'admin-dashboard' ? (
          <AdminDashboard
            token={adminToken || ''}
            adminUsername={adminUsername}
            onLogout={handleAdminLogout}
            onBackToWebsite={() => setCurrentView('experience')}
          />
        ) : (
          /* Scenes 1 through 10 Container */
          <div className="w-full max-w-xl mx-auto text-center">
            <AnimatePresence mode="wait">
              {/* SCENE 1: Name Entry */}
              {scene === 1 && (
                <motion.div
                  key="scene-1"
                  initial={{ opacity: 0, scale: 0.92, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="p-6 md:p-10 rounded-3xl bg-gradient-to-b from-[#250d1b] via-[#1a0713] to-[#12030b] border border-rose-500/30 shadow-2xl backdrop-blur-xl"
                >
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
                    <Heart className="w-8 h-8 fill-rose-500/40 text-rose-400 animate-pulse" />
                  </div>

                  <h1 className="text-3xl md:text-4xl font-serif-display font-bold text-rose-100 mb-3 tracking-wide">
                    Apna naam batao ❤️
                  </h1>
                  <p className="text-xs md:text-sm text-rose-200/70 mb-8 max-w-sm mx-auto">
                    Kyunki tumhare bina ye kahani adhuri hai...
                  </p>

                  <form onSubmit={handleNameSubmit} className="space-y-4 max-w-sm mx-auto">
                    <div>
                      <input
                        type="text"
                        value={nameInput}
                        onChange={e => {
                          setNameInput(e.target.value);
                          if (nameError) setNameError(null);
                        }}
                        placeholder="Yahan apna pyara sa naam likho..."
                        className="w-full px-5 py-3.5 rounded-2xl bg-black/40 border border-rose-500/30 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-rose-100 placeholder-rose-300/30 text-center font-medium transition-all text-base shadow-inner"
                        autoFocus
                      />
                      {nameError && (
                        <p className="text-xs text-rose-400 mt-2 font-medium">
                          {nameError}
                        </p>
                      )}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      type="submit"
                      disabled={isSaving}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-400 hover:to-pink-500 text-white font-medium shadow-xl shadow-rose-950/60 flex items-center justify-center gap-2 transition-all cursor-pointer text-base"
                    >
                      <span>Aage badho ✨</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {/* SCENE 2: Greeting */}
              {scene === 2 && (
                <motion.div
                  key="scene-2"
                  initial={{ opacity: 0, scale: 0.92, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="p-8 md:p-12 rounded-3xl bg-gradient-to-b from-[#250d1b] via-[#1a0713] to-[#12030b] border border-rose-500/30 shadow-2xl backdrop-blur-xl"
                >
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <Sparkles className="w-8 h-8 text-rose-300" />
                  </div>

                  <h2 className="text-3xl md:text-4xl font-serif-display font-bold text-rose-100 mb-8">
                    Kaisi ho?
                  </h2>

                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={handleGreetingSubmit}
                    className="px-8 py-3.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold text-lg shadow-xl shadow-rose-500/30 border border-rose-400/40 cursor-pointer"
                  >
                    Mast! ❤️
                  </motion.button>
                </motion.div>
              )}

              {/* SCENE 3: Introduction */}
              {scene === 3 && (
                <motion.div
                  key="scene-3"
                  initial={{ opacity: 0, scale: 0.92, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="p-8 md:p-12 rounded-3xl bg-gradient-to-b from-[#250d1b] via-[#1a0713] to-[#12030b] border border-rose-500/30 shadow-2xl backdrop-blur-xl"
                >
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <MessageCircle className="w-8 h-8 text-rose-300" />
                  </div>

                  <h2 className="text-2xl md:text-3xl font-serif-display font-bold text-rose-100 mb-8 leading-snug">
                    Mujhe tumse kuch poochna hai...
                  </h2>

                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={handleIntroSubmit}
                    className="px-8 py-3.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold text-base shadow-xl shadow-rose-500/30 border border-rose-400/40 flex items-center justify-center gap-2 mx-auto cursor-pointer"
                  >
                    <span>Haan bolo, kya poochna hai? ✨</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              )}

              {/* SCENE 4: Snapchat Question (Exact 3 approved options) */}
              {scene === 4 && (
                <motion.div
                  key="scene-4"
                  initial={{ opacity: 0, scale: 0.92, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="p-6 md:p-10 rounded-3xl bg-gradient-to-b from-[#250d1b] via-[#1a0713] to-[#12030b] border border-rose-500/30 shadow-2xl backdrop-blur-xl text-left"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300">
                      <Ghost className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-serif-display font-bold text-rose-100">
                        Kya tumne Snapchat per ID bana li hai kya? 👻
                      </h2>
                      <p className="text-xs text-rose-200/60">
                        Sach-sach batana!
                      </p>
                    </div>
                  </div>

                  {/* 3 Approved Options */}
                  <div className="space-y-3 mb-6">
                    {[
                      {
                        key: 'Haan, bana li hai! 👻',
                        label: 'Haan, bana li hai! 👻',
                        followUpText: 'Arre waah! Apna Snapchat ID batao phir 😉'
                      },
                      {
                        key: 'Bana to li hai, par zyada use nahi karti 🌸',
                        label: 'Bana to li hai, par zyada use nahi karti 🌸',
                        followUpText: 'Chalo koi nahi, ID share karogi? 😊'
                      },
                      {
                        key: 'Nahi, abhi tak nahi banayi! 🙅‍♀️',
                        label: 'Nahi, abhi tak nahi banayi! 🙅‍♀️',
                        followUpText: 'Koi baat nahi, bina Snapchat ke bhi tum sabse best ho! ❤️'
                      }
                    ].map(opt => (
                      <div
                        key={opt.key}
                        onClick={() => setSnapchatOption(opt.key)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          snapchatOption === opt.key
                            ? 'bg-rose-500/20 border-rose-400 text-rose-100 shadow-md'
                            : 'bg-black/30 border-rose-500/20 text-rose-200/80 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm md:text-base font-medium">{opt.label}</span>
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              snapchatOption === opt.key
                                ? 'border-rose-400 bg-rose-500 text-white'
                                : 'border-rose-500/40'
                            }`}
                          >
                            {snapchatOption === opt.key && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Conditional Follow-up and Input */}
                  {snapchatOption && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mb-6 pt-4 border-t border-rose-500/20"
                    >
                      {snapchatOption === 'Nahi, abhi tak nahi banayi! 🙅‍♀️' ? (
                        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs text-center font-medium">
                          Koi baat nahi, bina Snapchat ke bhi tum sabse best ho! ❤️
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-medium text-rose-300 mb-1.5">
                            {snapchatOption === 'Haan, bana li hai! 👻'
                              ? 'Arre waah! Apna Snapchat ID batao phir 😉'
                              : 'Chalo koi nahi, ID share karogi? 😊'}
                          </label>
                          <input
                            type="text"
                            value={snapchatIdInput}
                            onChange={e => setSnapchatIdInput(e.target.value)}
                            placeholder="@your_snapchat_id (optional)"
                            className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-rose-500/30 text-rose-100 text-sm focus:outline-none focus:border-rose-400"
                          />
                        </div>
                      )}
                    </motion.div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!snapchatOption || isSaving}
                    onClick={handleSnapchatSubmit}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium text-sm shadow-xl shadow-rose-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>Aage Chalo ✨</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              )}

              {/* SCENE 5: Shayari (Exact Approved Text Reveal) */}
              {scene === 5 && (
                <motion.div
                  key="scene-5"
                  initial={{ opacity: 0, scale: 0.92, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="p-8 md:p-12 rounded-3xl bg-gradient-to-b from-[#280e1e] via-[#1a0714] to-[#12030c] border border-rose-500/30 shadow-2xl backdrop-blur-xl relative overflow-hidden"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs mb-6">
                    <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                    <span>Khaas tumhare liye</span>
                  </div>

                  {/* Staggered Animated Lines */}
                  <div className="space-y-3 font-romantic text-2xl md:text-3xl text-rose-100 mb-10 leading-relaxed tracking-wide">
                    <motion.p
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      className="text-rose-200"
                    >
                      Roses are red,
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.1, duration: 0.6 }}
                      className="text-pink-200"
                    >
                      Violets are blue,
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.9, duration: 0.6 }}
                      className="text-rose-200"
                    >
                      In the sky, there are many stars,
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 2.7, duration: 0.6 }}
                      className="text-rose-300 font-bold text-3xl md:text-4xl"
                    >
                      But none are like you. ❤️
                    </motion.p>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3.2 }}
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleShayariNext}
                      className="px-8 py-3.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium text-base shadow-xl shadow-rose-500/30 border border-rose-400/40 inline-flex items-center gap-2 cursor-pointer"
                    >
                      <span>Aage dekho... ✨</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}

              {/* SCENE 6: Memory Question (Exact Options & Follow-ups) */}
              {scene === 6 && (
                <motion.div
                  key="scene-6"
                  initial={{ opacity: 0, scale: 0.92, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="p-6 md:p-10 rounded-3xl bg-gradient-to-b from-[#250d1b] via-[#1a0713] to-[#12030b] border border-rose-500/30 shadow-2xl backdrop-blur-xl text-left"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-serif-display font-bold text-rose-100">
                        Jo waqt humne saath spend kiya tha, kya tumhe yaad hai? ❤️
                      </h2>
                    </div>
                  </div>

                  {/* 3 Exact Options */}
                  <div className="space-y-3 mb-6">
                    {[
                      {
                        key: 'Haan, bilkul yaad hai ❤️',
                        label: 'Haan, bilkul yaad hai ❤️',
                        followUp: 'Achha, toh hamara sabse yaadgaar moment kaunsa tha?'
                      },
                      {
                        key: 'Nahi, yaad nahi hai.',
                        label: 'Nahi, yaad nahi hai.',
                        followUp: 'Koi baat nahi, kya tumhe koi chhoti si baat yaad hai?'
                      },
                      {
                        key: 'Thoda-thoda yaad hai. 😊',
                        label: 'Thoda-thoda yaad hai. 😊',
                        followUp: 'Achha, phir tumhe sabse pehle kya yaad aata hai?'
                      }
                    ].map(opt => (
                      <div
                        key={opt.key}
                        onClick={() => setMemoryOption(opt.key)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                          memoryOption === opt.key
                            ? 'bg-rose-500/20 border-rose-400 text-rose-100 shadow-md'
                            : 'bg-black/30 border-rose-500/20 text-rose-200/80 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm md:text-base font-medium">{opt.label}</span>
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              memoryOption === opt.key
                                ? 'border-rose-400 bg-rose-500 text-white'
                                : 'border-rose-500/40'
                            }`}
                          >
                            {memoryOption === opt.key && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Follow-up question input */}
                  {memoryOption && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mb-6 pt-4 border-t border-rose-500/20"
                    >
                      <label className="block text-xs font-medium text-rose-300 mb-2">
                        {memoryOption === 'Haan, bilkul yaad hai ❤️'
                          ? 'Achha, toh hamara sabse yaadgaar moment kaunsa tha?'
                          : memoryOption === 'Nahi, yaad nahi hai.'
                          ? 'Koi baat nahi, kya tumhe koi chhoti si baat yaad hai?'
                          : 'Achha, phir tumhe sabse pehle kya yaad aata hai?'}
                      </label>
                      <input
                        type="text"
                        value={memoryFollowUpInput}
                        onChange={e => setMemoryFollowUpInput(e.target.value)}
                        placeholder="Yahan likho..."
                        className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-rose-500/30 text-rose-100 text-sm focus:outline-none focus:border-rose-400"
                      />
                    </motion.div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!memoryOption || isSaving}
                    onClick={handleMemorySubmit}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium text-sm shadow-xl shadow-rose-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>Aage Badho ✨</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              )}

              {/* SCENE 7: Personal Message */}
              {scene === 7 && (
                <motion.div
                  key="scene-7"
                  initial={{ opacity: 0, scale: 0.92, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="p-6 md:p-10 rounded-3xl bg-gradient-to-b from-[#250d1b] via-[#1a0713] to-[#12030b] border border-rose-500/30 shadow-2xl backdrop-blur-xl text-left"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-300">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-serif-display font-bold text-rose-100">
                        Achha, ab tum bhi kuch bolo... ❤️
                      </h2>
                      <p className="text-xs text-rose-200/60">
                        Jo bhi dil mein ho, khulkar likho!
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <textarea
                      rows={4}
                      value={personalMessageInput}
                      onChange={e => setPersonalMessageInput(e.target.value)}
                      placeholder="Dil ki baat yahan likho..."
                      className="w-full p-4 rounded-2xl bg-black/40 border border-rose-500/30 text-rose-100 text-sm focus:outline-none focus:border-rose-400 placeholder-rose-300/30 resize-none font-romantic text-lg"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSaving}
                    onClick={handleMessageSubmit}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium text-sm shadow-xl shadow-rose-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>Sabse Khaas Baat Dekho ❤️</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              )}

              {/* SCENE 8: Final Proposal (YES and NO choices, neither is forced!) */}
              {scene === 8 && (
                <motion.div
                  key="scene-8"
                  initial={{ opacity: 0, scale: 0.92, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="p-8 md:p-12 rounded-3xl bg-gradient-to-b from-[#2a0e20] via-[#1c0816] to-[#12030c] border border-rose-500/40 shadow-2xl backdrop-blur-xl"
                >
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 animate-bounce">
                    <Heart className="w-9 h-9 fill-rose-500 text-rose-300" />
                  </div>

                  <h2 className="text-2xl md:text-3xl font-serif-display font-bold text-rose-100 mb-10 leading-relaxed">
                    Kya tum meri zindagi ka ek khaas hissa banna pasand karogi? ❤️
                  </h2>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-sm mx-auto">
                    {/* YES BUTTON */}
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleProposalAnswer('YES')}
                      disabled={isSaving}
                      className="w-full sm:w-1/2 py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white font-bold text-lg shadow-xl shadow-rose-500/40 border border-rose-300/40 cursor-pointer"
                    >
                      YES ❤️
                    </motion.button>

                    {/* NO BUTTON (Functional and respected, never forced!) */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleProposalAnswer('NO')}
                      disabled={isSaving}
                      className="w-full sm:w-1/2 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-rose-200 font-medium text-base border border-rose-500/30 cursor-pointer transition-colors"
                    >
                      NO
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* SCENE 9: YES Celebration & Gift Box */}
              {scene === 9 && (
                <motion.div
                  key="scene-9"
                  initial={{ opacity: 0, scale: 0.92, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="w-full"
                >
                  <GiftBox
                    visitorName={visitorName || 'Dear'}
                    onReplay={handleReplay}
                  />
                </motion.div>
              )}

              {/* SCENE 10: NO Response (Respectful & Sweet) */}
              {scene === 10 && (
                <motion.div
                  key="scene-10"
                  initial={{ opacity: 0, scale: 0.92, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="p-8 md:p-12 rounded-3xl bg-gradient-to-b from-[#220c1a] via-[#180612] to-[#10030a] border border-rose-500/30 shadow-2xl backdrop-blur-xl max-w-lg mx-auto"
                >
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-300">
                    <Sparkles className="w-8 h-8" />
                  </div>

                  <h2 className="text-2xl md:text-3xl font-serif-display font-bold text-rose-100 mb-4">
                    Thank You, {visitorName} 🌸
                  </h2>

                  <p className="text-rose-200/80 text-sm md:text-base leading-relaxed mb-8">
                    Main tumhare faisle ka poora samman karta hoon. Sachhaai se jawab dene ke liye shukriya! Tum jahan bhi raho, hamesha khush aur muskurati raho ✨
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleReplay}
                      className="px-6 py-3 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium text-sm shadow-lg shadow-rose-950 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Phir se shuru karein (Replay) 🔄</span>
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Subtle Bottom Footer */}
      <footer className="relative z-20 py-4 px-4 text-center text-[11px] text-rose-300/40">
        <p>Made with love • ehehehe ❤️</p>
      </footer>
    </div>
  );
}
