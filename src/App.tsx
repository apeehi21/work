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
  const [snapchatFollowUpAnswer, setSnapchatFollowUpAnswer] = useState<string>('');
  const [snapNoPosition, setSnapNoPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [snapNoAttempts, setSnapNoAttempts] = useState<number>(0);

  // Scene 6: Memory
  const [memoryOption, setMemoryOption] = useState<string>('');
  const [memoryFollowUpInput, setMemoryFollowUpInput] = useState<string>('');

  // Scene 7: Personal Message
  const [personalMessageInput, setPersonalMessageInput] = useState<string>('');

  // Scene 8: Final Proposal
  const [finalProposalAnswer, setFinalProposalAnswer] = useState<'YES' | 'NO' | null>(null);
  const [noPosition, setNoPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [noAttempts, setNoAttempts] = useState<number>(0);

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
      if (currentView === 'admin-dashboard') {
        handleAdminLogout();
        setCurrentView('experience');
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
    setSnapchatFollowUpAnswer('');
    setSnapNoPosition({ x: 0, y: 0 });
    setSnapNoAttempts(0);
    setMemoryOption('');
    setMemoryFollowUpInput('');
    setPersonalMessageInput('');
    setFinalProposalAnswer(null);
    setNoPosition({ x: 0, y: 0 });
    setNoAttempts(0);

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

  // Validation helpers for advancing through scenes
  const isNameValid = () => nameInput.trim().length > 0;

  const isSnapchatValid = () => {
    if (!snapchatOption) return false;
    if (snapchatOption === 'Haan, bana li hai! 👻') {
      return snapchatIdInput.trim().length > 0;
    }
    if (snapchatOption === 'Main nahi bana rahi hoon! 🙅‍♀️') {
      return snapchatFollowUpAnswer.trim().length > 0;
    }
    if (snapchatOption === 'Abhi nahi banayi hai, par bana lungi 😊') {
      return snapchatFollowUpAnswer.trim().length > 0;
    }
    return false;
  };

  const isMemoryValid = () => {
    return Boolean(memoryOption && memoryFollowUpInput.trim().length > 0);
  };

  const isMessageValid = () => {
    return personalMessageInput.trim().length > 0;
  };

  // Scene 4: Snapchat Submit
  const handleSnapchatSubmit = async () => {
    if (!isSnapchatValid()) return;
    setIsSaving(true);

    let submittedId: string | null = null;
    let recordedAnswer = snapchatOption;

    if (snapchatOption === 'Haan, bana li hai! 👻') {
      submittedId = snapchatIdInput.trim();
    } else if (snapchatOption === 'Main nahi bana rahi hoon! 🙅‍♀️') {
      recordedAnswer = `${snapchatOption} (Jawab: ${snapchatFollowUpAnswer.trim()})`;
    } else if (snapchatOption === 'Abhi nahi banayi hai, par bana lungi 😊') {
      recordedAnswer = `${snapchatOption} (Kab banaogi: ${snapchatFollowUpAnswer.trim()})`;
    }

    try {
      await updateVisitorStep(visitorId, {
        visitorName,
        snapchatAnswer: recordedAnswer,
        snapchatId: submittedId
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
    if (!isMemoryValid()) return;
    setIsSaving(true);

    try {
      await updateVisitorStep(visitorId, {
        visitorName,
        memoryAnswer: memoryOption,
        memoryFollowUp: memoryFollowUpInput.trim()
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
    if (!isMessageValid()) return;
    setIsSaving(true);

    try {
      await updateVisitorStep(visitorId, {
        visitorName,
        personalMessage: personalMessageInput.trim()
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

  // Playful dodging jump for the Snapchat NO button
  const handleSnapNoDodge = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const maxX = 120;
    const maxY = 65;
    const newX = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * (maxX - 30) + 30);
    const newY = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * (maxY - 20) + 20);
    setSnapNoPosition({ x: newX, y: newY });
    setSnapNoAttempts(prev => prev + 1);
  };

  const snapPlayfulTexts = [
    'Nahi! 😜',
    'Bilkul nahi! 😂',
    'Pakad ke dikhao! 🏃‍♂️',
    'Nahi banaungi! 🙈',
    'Na baba na! 🤪',
    'Haan bolna padega! ❤️'
  ];

  // Playful dodging jump for the NO button
  const handleNoButtonDodge = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const maxX = 140;
    const maxY = 110;
    const newX = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * (maxX - 40) + 40);
    const newY = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * (maxY - 30) + 30);
    setNoPosition({ x: newX, y: newY });
    setNoAttempts(prev => prev + 1);
  };

  const playfulNoTexts = [
    'NO',
    'Nahi? Soch lo! 😉',
    'Arre aise kaise? 🙈',
    'Pakad ke dikhao! 🏃‍♂️',
    'Itni jaldi nahi! ❤️',
    'Ek baar aur socho! 😂',
    'Chalo maan jao na! 🥺',
    'Nahi dabne dunga! 😜'
  ];

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
                  handleAdminLogout();
                  setCurrentView('experience');
                } else if (currentView === 'admin-login') {
                  setCurrentView('experience');
                } else {
                  // Always open fresh login
                  setCurrentView('admin-login');
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
            onBackToWebsite={async () => {
              await handleAdminLogout();
              setCurrentView('experience');
            }}
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
                      whileHover={isNameValid() ? { scale: 1.03 } : {}}
                      whileTap={isNameValid() ? { scale: 0.97 } : {}}
                      type="submit"
                      disabled={isSaving || !isNameValid()}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-400 hover:to-pink-500 text-white font-medium shadow-xl shadow-rose-950/60 flex items-center justify-center gap-2 transition-all text-base cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      <span>Aage badho ✨</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                    {!isNameValid() && (
                      <p className="text-xs text-rose-300/60 text-center mt-2">
                        Pehle apna pyara sa naam likho tabhi aage ja sakte ho ❤️
                      </p>
                    )}
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

                  {/* 3 Options */}
                  <div className="space-y-3 mb-6">
                    {[
                      {
                        key: 'Haan, bana li hai! 👻',
                        label: 'Haan, bana li hai! 👻'
                      },
                      {
                        key: 'Main nahi bana rahi hoon! 🙅‍♀️',
                        label: 'Main nahi bana rahi hoon! 🙅‍♀️'
                      },
                      {
                        key: 'Abhi nahi banayi hai, par bana lungi 😊',
                        label: 'Abhi nahi banayi hai, par bana lungi 😊'
                      }
                    ].map(opt => (
                      <div
                        key={opt.key}
                        onClick={() => {
                          setSnapchatOption(opt.key);
                          setSnapchatFollowUpAnswer('');
                        }}
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
                      {/* Follow-up for Option 1: Haan, bana li hai */}
                      {snapchatOption === 'Haan, bana li hai! 👻' && (
                        <div>
                          <label className="block text-xs font-medium text-rose-300 mb-1.5">
                            Arre waah! Apna Snapchat ID batao phir 😉 <span className="text-rose-400 font-bold ml-1">*</span>
                          </label>
                          <input
                            type="text"
                            value={snapchatIdInput}
                            onChange={e => setSnapchatIdInput(e.target.value)}
                            placeholder="Yahan apna Snapchat username / ID likho..."
                            className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-rose-500/30 text-rose-100 text-sm focus:outline-none focus:border-rose-400 placeholder-rose-300/30"
                          />
                        </div>
                      )}

                      {/* Follow-up for Option 2: Main nahi bana rahi hoon */}
                      {snapchatOption === 'Main nahi bana rahi hoon! 🙅‍♀️' && (
                        <div>
                          <p className="text-xs md:text-sm font-medium text-rose-200 mb-3">
                            Aisa mat bolo na, sach mein nahi banaogi? 🥺
                          </p>

                          <div className="relative flex items-center justify-start gap-3 min-h-[55px] mb-3">
                            {/* Option to agree */}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => setSnapchatFollowUpAnswer('Achha baba, bana lungi ❤️')}
                              className={`px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                                snapchatFollowUpAnswer === 'Achha baba, bana lungi ❤️'
                                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-rose-400 shadow-md'
                                  : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border-rose-500/40'
                              }`}
                            >
                              Achha baba, bana lungi ❤️
                            </motion.button>

                            {/* Playful Jumping NAHI Button */}
                            <motion.button
                              type="button"
                              animate={{
                                x: snapNoPosition.x,
                                y: snapNoPosition.y,
                                rotate: snapNoAttempts ? (snapNoAttempts % 2 === 0 ? 5 : -5) : 0
                              }}
                              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                              onMouseEnter={handleSnapNoDodge}
                              onClick={handleSnapNoDodge}
                              onTouchStart={handleSnapNoDodge}
                              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-rose-200 border border-rose-500/30 text-xs font-medium cursor-pointer transition-colors shadow-lg z-20 whitespace-nowrap"
                            >
                              {snapPlayfulTexts[Math.min(snapNoAttempts, snapPlayfulTexts.length - 1)]}
                            </motion.button>
                          </div>

                          <div className="mt-2">
                            <label className="block text-xs font-medium text-rose-300 mb-1.5">
                              Kyun nahi bana rahi? Sach-sach wajah yahan likho... 🥺✍️ <span className="text-rose-400 font-bold ml-1">*</span>
                            </label>
                            <input
                              type="text"
                              value={snapchatFollowUpAnswer}
                              onChange={e => setSnapchatFollowUpAnswer(e.target.value)}
                              placeholder="Apni wajah yahan likho (ya upar button daba kar haan bolo)..."
                              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-rose-500/30 text-rose-100 text-sm focus:outline-none focus:border-rose-400 placeholder-rose-300/30"
                            />
                          </div>

                          {snapchatFollowUpAnswer === 'Achha baba, bana lungi ❤️' && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs text-center font-medium mt-3"
                            >
                              Hehe, I knew it! Chalo ID baad mein le lunga 😉❤️
                            </motion.div>
                          )}
                        </div>
                      )}

                      {/* Follow-up for Option 3: Abhi nahi banayi hai, par bana lungi */}
                      {snapchatOption === 'Abhi nahi banayi hai, par bana lungi 😊' && (
                        <div>
                          <label className="block text-xs md:text-sm font-medium text-rose-200 mb-2 leading-relaxed">
                            Achha ji? Kab banaogi... jab tumhari shaadi ho jayegi tab kya? 😂😜 <span className="text-rose-400 font-bold ml-1">*</span>
                          </label>
                          <input
                            type="text"
                            value={snapchatFollowUpAnswer}
                            onChange={e => setSnapchatFollowUpAnswer(e.target.value)}
                            placeholder="Yahan batao kab banaogi... 😉 (likhna zaroori hai)"
                            className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-rose-500/30 text-rose-100 text-sm focus:outline-none focus:border-rose-400 placeholder-rose-300/30"
                          />
                        </div>
                      )}
                    </motion.div>
                  )}

                  <motion.button
                    whileHover={isSnapchatValid() ? { scale: 1.02 } : {}}
                    whileTap={isSnapchatValid() ? { scale: 0.98 } : {}}
                    disabled={!isSnapchatValid() || isSaving}
                    onClick={handleSnapchatSubmit}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium text-sm shadow-xl shadow-rose-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all"
                  >
                    <span>Aage Chalo ✨</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                  {!isSnapchatValid() && (
                    <p className="text-xs text-rose-300/70 text-center mt-2.5 font-medium">
                      {!snapchatOption
                        ? '👆 Pehle upar option chuno aur type karo tabhi aage ja sakte ho'
                        : snapchatOption === 'Haan, bana li hai! 👻'
                        ? '✍️ Aage badhne ke liye apna Snapchat ID likhna zaroori hai'
                        : snapchatOption === 'Main nahi bana rahi hoon! 🙅‍♀️'
                        ? '✍️ Aage badhne ke liye wajah likho ya button dabao'
                        : '✍️ Aage badhne ke liye batao kab banaogi'}
                    </p>
                  )}
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
                        <span className="text-rose-400 font-bold ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        value={memoryFollowUpInput}
                        onChange={e => setMemoryFollowUpInput(e.target.value)}
                        placeholder="Yahan likhna zaroori hai..."
                        className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-rose-500/30 text-rose-100 text-sm focus:outline-none focus:border-rose-400 placeholder-rose-300/30"
                      />
                    </motion.div>
                  )}

                  <motion.button
                    whileHover={isMemoryValid() ? { scale: 1.02 } : {}}
                    whileTap={isMemoryValid() ? { scale: 0.98 } : {}}
                    disabled={!isMemoryValid() || isSaving}
                    onClick={handleMemorySubmit}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium text-sm shadow-xl shadow-rose-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all"
                  >
                    <span>Aage Badho ✨</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                  {!isMemoryValid() && (
                    <p className="text-xs text-rose-300/70 text-center mt-2.5 font-medium">
                      {!memoryOption
                        ? '👆 Pehle upar option chuno aur type karo tabhi aage ja sakte ho'
                        : '✍️ Box mein kuch likhna zaroori hai tabhi aage ja sakte ho ❤️'}
                    </p>
                  )}
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
                        Jo bhi dil mein ho, khulkar likho! <span className="text-rose-400 font-bold">*</span>
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <textarea
                      rows={4}
                      value={personalMessageInput}
                      onChange={e => setPersonalMessageInput(e.target.value)}
                      placeholder="Dil ki baat yahan likho... (likhna zaroori hai ❤️)"
                      className="w-full p-4 rounded-2xl bg-black/40 border border-rose-500/30 text-rose-100 text-sm focus:outline-none focus:border-rose-400 placeholder-rose-300/30 resize-none font-romantic text-lg"
                    />
                  </div>

                  <motion.button
                    whileHover={isMessageValid() ? { scale: 1.02 } : {}}
                    whileTap={isMessageValid() ? { scale: 0.98 } : {}}
                    disabled={!isMessageValid() || isSaving}
                    onClick={handleMessageSubmit}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium text-sm shadow-xl shadow-rose-950/60 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all"
                  >
                    <span>Sabse Khaas Baat Dekho ❤️</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                  {!isMessageValid() && (
                    <p className="text-xs text-rose-300/70 text-center mt-2.5 font-medium">
                      ✍️ Message box mein kuch likhna zaroori hai tabhi aage ja sakte ho ❤️
                    </p>
                  )}
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

                  <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4 max-w-sm mx-auto min-h-[140px]">
                    {/* YES BUTTON */}
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleProposalAnswer('YES')}
                      disabled={isSaving}
                      className="w-full sm:w-1/2 py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white font-bold text-lg shadow-xl shadow-rose-500/40 border border-rose-300/40 cursor-pointer z-10"
                    >
                      YES ❤️
                    </motion.button>

                    {/* PLAYFUL JUMPING NO BUTTON */}
                    <motion.button
                      animate={{
                        x: noPosition.x,
                        y: noPosition.y,
                        rotate: noAttempts ? (noAttempts % 2 === 0 ? 6 : -6) : 0
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                      onMouseEnter={handleNoButtonDodge}
                      onClick={handleNoButtonDodge}
                      onTouchStart={handleNoButtonDodge}
                      disabled={isSaving}
                      className="w-full sm:w-1/2 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-rose-200 font-medium text-base border border-rose-500/30 cursor-pointer transition-colors shadow-lg z-20 whitespace-nowrap px-4"
                    >
                      {playfulNoTexts[Math.min(noAttempts, playfulNoTexts.length - 1)]}
                    </motion.button>
                  </div>

                  {/* Playful hint or confirmation if attempted multiple times */}
                  {noAttempts > 0 && noAttempts < 6 && (
                    <motion.p
                      key={noAttempts}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-rose-300/70 mt-4 italic"
                    >
                      {noAttempts === 1 && "Hehe pakad ke dikhao! 😜"}
                      {noAttempts === 2 && "NO bolna itna aasaan thodi hai! ❤️"}
                      {noAttempts === 3 && "Maan jao na, YES bolo! ✨"}
                      {noAttempts >= 4 && "Dil se poochho, YES hi aayega! 😉"}
                    </motion.p>
                  )}

                  {noAttempts >= 6 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 text-center"
                    >
                      <button
                        onClick={() => handleProposalAnswer('NO')}
                        className="text-xs text-rose-300/40 hover:text-rose-200 underline transition-colors cursor-pointer"
                      >
                        Agar sach mein 'NO' kehna hai, toh yahan click karein
                      </button>
                    </motion.div>
                  )}
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

      {/* Bottom spacing */}
      <div className="py-2" />
    </div>
  );
}
