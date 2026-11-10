import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ChevronLeft, ChevronRight, X, Sparkles, ArrowLeft, ZoomIn } from 'lucide-react';

interface AlbumPhoto {
  id: number;
  url: string;
  caption: string;
  date: string;
  tag: string;
  rotation: string;
}

const ALBUM_PHOTOS: AlbumPhoto[] = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80',
    caption: 'Woh pehli mulakaat, jahan waqt bas thehar sa gaya tha...',
    date: 'Pehli Mulakaat',
    tag: 'Special Day ✨',
    rotation: '-rotate-2'
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80',
    caption: 'Chai, be-matlab ki baatein aur tumhari pyari si hansi ❤️',
    date: 'Shaam Ki Chai',
    tag: 'Sweet Moments ☕',
    rotation: 'rotate-2'
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
    caption: 'Dheere-dheere chalte hue, bina kisi fikar ke bas saath chalna...',
    date: 'Long Walk',
    tag: 'Peace 🌿',
    rotation: '-rotate-1'
  },
  {
    id: 4,
    url: 'https://images.unsplash.com/photo-1513279922550-250c2129b13a?auto=format&fit=crop&w=800&q=80',
    caption: 'Taaron se bhara aasmaan aur tumhari aawaz ka sukoon ✨',
    date: 'Stargazing Night',
    tag: 'Forever 🌙',
    rotation: 'rotate-3'
  },
  {
    id: 5,
    url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=800&q=80',
    caption: 'Har chhota pal jo tumhare saath bitaya, sabse khaas ban gaya...',
    date: 'Golden Hour',
    tag: 'Memories 🌸',
    rotation: '-rotate-2'
  },
  {
    id: 6,
    url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80',
    caption: 'Ye safar bas abhi shuru hua hai, aage bohot saari yaadein banani hain! ❤️',
    date: 'Our Journey',
    tag: 'Always & Forever ❤️',
    rotation: 'rotate-1'
  }
];

interface MemoriesAlbumProps {
  onBack: () => void;
}

export const MemoriesAlbum: React.FC<MemoriesAlbumProps> = ({ onBack }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<AlbumPhoto | null>(null);

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedPhoto) return;
    const currentIndex = ALBUM_PHOTOS.findIndex(p => p.id === selectedPhoto.id);
    const nextIndex = (currentIndex + 1) % ALBUM_PHOTOS.length;
    setSelectedPhoto(ALBUM_PHOTOS[nextIndex]);
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedPhoto) return;
    const currentIndex = ALBUM_PHOTOS.findIndex(p => p.id === selectedPhoto.id);
    const prevIndex = (currentIndex - 1 + ALBUM_PHOTOS.length) % ALBUM_PHOTOS.length;
    setSelectedPhoto(ALBUM_PHOTOS[prevIndex]);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-rose-500/20">
        <motion.button
          whileHover={{ scale: 1.05, x: -3 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-rose-200 text-sm border border-rose-500/30 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Wapas jao (Back)</span>
        </motion.button>

        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 text-xs text-rose-300 font-medium px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>Khaas Yaadein</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif-display text-rose-100 font-bold">
            Humari Yaadon Ka Album 📸
          </h2>
        </div>

        <div className="w-24" /> {/* Spacer */}
      </div>

      <p className="text-center text-rose-200/70 text-sm mb-10 max-w-lg mx-auto">
        Har photo ke peeche ek pyari si kahani chhipti hai. Kisi bhi photo par tap karke bada dekho!
      </p>

      {/* Grid of Polaroid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {ALBUM_PHOTOS.map((photo, index) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.03, y: -6, rotate: 0 }}
            onClick={() => setSelectedPhoto(photo)}
            className={`cursor-pointer transform ${photo.rotation} transition-all duration-300`}
          >
            {/* Polaroid Frame */}
            <div className="relative bg-gradient-to-b from-stone-100 via-rose-50/95 to-amber-50/90 text-stone-800 p-3.5 pb-5 rounded-md shadow-xl shadow-black/40 border border-stone-200 group">
              {/* Washi Tape Accent */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-rose-300/40 backdrop-blur-sm -rotate-1 shadow-sm border-t border-b border-rose-400/40" />

              {/* Image Box */}
              <div className="relative w-full aspect-square overflow-hidden rounded bg-stone-900 mb-3">
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="p-2 rounded-full bg-black/60 text-white backdrop-blur-md">
                    <ZoomIn className="w-5 h-5" />
                  </div>
                </div>

                {/* Tag pill */}
                <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-black/60 text-rose-200 backdrop-blur-md border border-white/10">
                  {photo.tag}
                </span>
              </div>

              {/* Caption & Date */}
              <div className="px-1 text-center">
                <p className="font-romantic text-stone-900 text-xl font-bold leading-tight mb-1">
                  {photo.caption}
                </p>
                <div className="flex items-center justify-center gap-1 text-[11px] text-stone-500 font-medium">
                  <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                  <span>{photo.date}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="relative max-w-2xl w-full bg-[#1e0a15] border border-rose-500/40 rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 text-rose-200 transition-colors cursor-pointer border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Prev / Next controls */}
              <button
                onClick={handlePrevPhoto}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer border border-white/10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNextPhoto}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer border border-white/10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Big Photo Image */}
              <div className="w-full max-h-[60vh] overflow-hidden bg-black flex items-center justify-center">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.caption}
                  className="w-full h-full object-contain max-h-[60vh]"
                />
              </div>

              {/* Photo Caption Details */}
              <div className="p-6 text-center bg-gradient-to-t from-[#14050d] to-[#1e0a15]">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-2">
                  {selectedPhoto.tag} • {selectedPhoto.date}
                </span>
                <p className="font-romantic text-rose-100 text-2xl md:text-3xl leading-relaxed">
                  "{selectedPhoto.caption}"
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
