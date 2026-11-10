import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Sparkles, Heart, Gift, RotateCcw } from 'lucide-react';

interface GiftBoxProps {
  visitorName: string;
  onReplay: () => void;
}

export const GiftBox: React.FC<GiftBoxProps> = ({ visitorName, onReplay }) => {
  const [isOpen, setIsOpen] = useState(false);

  const triggerCelebration = () => {
    if (isOpen) return;
    setIsOpen(true);

    // Burst confetti from multiple angles
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f43f5e', '#ec4899', '#fb7185', '#ffd700', '#ffffff']
      });

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#f43f5e', '#ec4899', '#ffd700']
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#f43f5e', '#ec4899', '#ffd700']
        });
      }, 250);
    } catch {
      // safe fallback if canvas not available
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto px-4 py-8">
      {!isOpen ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
          className="flex flex-col items-center text-center"
        >
          {/* Header */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm mb-6 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-rose-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Ek chhota sa tohfa tumhaare liye</span>
            <Sparkles className="w-4 h-4 text-rose-400 animate-spin" style={{ animationDuration: '4s' }} />
          </div>

          <h2 className="text-3xl md:text-4xl font-serif-display text-rose-100 font-bold mb-3 tracking-wide">
            Yayyy! ❤️
          </h2>
          <p className="text-rose-200/80 mb-8 max-w-md text-sm md:text-base">
            {visitorName}, tumne mera din bana diya! Is gift box par tap karo aur apna surprise dekho.
          </p>

          {/* Interactive 3D Gift Box Graphic */}
          <motion.div
            onClick={triggerCelebration}
            whileHover={{ scale: 1.05, rotate: [0, -2, 2, 0] }}
            whileTap={{ scale: 0.95 }}
            className="relative cursor-pointer group py-6"
          >
            {/* Ambient Backlight Glow */}
            <div className="absolute inset-0 bg-rose-500/25 blur-3xl rounded-full scale-125 group-hover:bg-rose-500/40 transition-all duration-500 pointer-events-none" />

            {/* Gift Box Container */}
            <div className="relative w-44 h-44 md:w-52 md:h-52 flex items-center justify-center">
              {/* Ribbon Bow on top */}
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="absolute -top-5 z-20 flex items-center justify-center"
              >
                <div className="w-14 h-9 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 rounded-full shadow-lg border border-amber-200 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-amber-600/60" />
                </div>
              </motion.div>

              {/* Box Lid */}
              <div className="absolute top-4 w-44 md:w-52 h-14 bg-gradient-to-b from-rose-600 to-rose-700 rounded-lg shadow-2xl border-b-4 border-rose-900 z-10 flex items-center justify-center">
                {/* Gold Vertical Ribbon on lid */}
                <div className="w-7 h-full bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400 shadow-inner" />
              </div>

              {/* Box Base Body */}
              <div className="absolute bottom-2 w-40 md:w-48 h-32 md:h-36 bg-gradient-to-b from-rose-700 via-rose-800 to-rose-950 rounded-b-xl shadow-2xl flex items-center justify-center overflow-hidden border border-rose-600/30">
                {/* Gold Ribbon Vertical */}
                <div className="w-7 h-full bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400 shadow-inner" />
                {/* Gold Ribbon Horizontal */}
                <div className="absolute w-full h-7 bg-gradient-to-b from-amber-300 via-amber-200 to-amber-400 shadow-inner" />
              </div>

              {/* Heart Badge */}
              <div className="absolute z-20 w-10 h-10 rounded-full bg-rose-950/80 border border-amber-300 flex items-center justify-center shadow-lg">
                <Heart className="w-5 h-5 text-rose-400 fill-rose-500" />
              </div>
            </div>

            {/* Click to open badge */}
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
              className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium shadow-lg shadow-rose-500/30 text-sm"
            >
              <Gift className="w-4 h-4" />
              <span>Tap to Open Gift 🎁</span>
            </motion.div>
          </motion.div>
        </motion.div>
      ) : (
        /* Letter Revealed */
        <AnimatePresence>
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: 'spring' }}
            className="w-full flex flex-col items-center"
          >
            {/* Letter Card */}
            <div className="relative w-full bg-gradient-to-b from-[#2a0e1c] via-[#1a0812] to-[#12040c] border border-rose-500/30 rounded-2xl p-6 md:p-9 shadow-2xl shadow-rose-950/80 text-left backdrop-blur-xl">
              {/* Decorative Corner Filigree */}
              <div className="absolute top-3 left-3 text-rose-500/30 text-xs font-serif">❦</div>
              <div className="absolute top-3 right-3 text-rose-500/30 text-xs font-serif">❦</div>
              <div className="absolute bottom-3 left-3 text-rose-500/30 text-xs font-serif">❦</div>
              <div className="absolute bottom-3 right-3 text-rose-500/30 text-xs font-serif">❦</div>

              {/* Wax Seal Stamp */}
              <div className="flex justify-center mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-600 via-rose-700 to-rose-900 border-2 border-rose-400/50 flex items-center justify-center shadow-lg shadow-rose-700/50">
                  <Heart className="w-7 h-7 text-rose-100 fill-rose-200" />
                </div>
              </div>

              {/* Exact Approved Letter Text */}
              <div className="space-y-4 text-rose-100 font-romantic text-xl md:text-2xl leading-relaxed tracking-wide">
                <p>
                  Some moments become beautiful memories, and some people make those moments unforgettable.
                </p>
                <p>
                  Thank you for being a part of this little journey. I hope this brings a smile to your face and gives you a memory worth keeping. ❤️
                </p>
                <div className="pt-4 text-right">
                  <p className="text-rose-200">With warm wishes,</p>
                  <p className="font-bold text-rose-300 text-2xl md:text-3xl">Always keep smiling! ✨</p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex items-center justify-center mt-8 w-full">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onReplay}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-400 hover:to-pink-500 text-white font-medium shadow-xl shadow-rose-950/60 flex items-center justify-center gap-2 text-sm md:text-base border border-rose-400/30 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Phir se dekho (Replay) 🔄</span>
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};
