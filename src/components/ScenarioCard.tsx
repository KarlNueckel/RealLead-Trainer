import { ThumbsUp, Share2, Bookmark } from 'lucide-react';
import { useState } from 'react';

export type ScenarioLocation = 'Phone Call' | 'In Person';

interface ScenarioCardProps {
  title: string;
  likes: number;
  location?: ScenarioLocation;
  description?: string;
  onClick?: () => void;
}

export function ScenarioCard({ title, likes, location = 'Phone Call', description, onClick }: ScenarioCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 cursor-pointer hover:-translate-y-1 relative overflow-hidden"
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-blue-50/0 to-blue-100/0 group-hover:from-blue-50/30 group-hover:via-blue-50/10 group-hover:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="flex items-start justify-between gap-6 relative z-10">
        {/* Content Section */}
        <div className="flex-1 min-w-0">
          <div className="mb-8">
            <h3 className="text-[#1a2540] uppercase tracking-tight leading-tight text-xl mb-2 group-hover:text-blue-900 transition-colors">
              {title}
            </h3>
            {description && (
              <p className="text-gray-600 text-sm mb-2">{description}</p>
            )}
            <div className="h-1 w-12 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Social Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-gray-500">
              <button 
                onClick={handleLike}
                className={`flex items-center gap-1.5 transition-colors ${
                  isLiked ? 'text-blue-600' : 'hover:text-blue-600'
                }`}
              >
                <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-blue-600' : ''}`} />
                <span className="text-xs">{likeCount} likes</span>
              </button>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <button className="text-gray-400 hover:text-blue-600 transition-all hover:scale-110">
                <Share2 className="w-4 h-4" />
              </button>
              <button 
                onClick={handleBookmark}
                className={`transition-all hover:scale-110 ${
                  isBookmarked ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Icon Mockup - Phone or House */}
        <div className="flex-shrink-0">
          <div className="relative transform group-hover:scale-105 transition-transform duration-300">
            {location === 'Phone Call' ? (
              <svg width="80" height="110" viewBox="0 0 80 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="5" width="64" height="100" rx="12" fill="#1a2540" />
                <rect x="10" y="7" width="60" height="96" rx="10" fill="#2a3550" />
                <rect x="13" y="11" width="54" height="85" rx="8" fill="#e8eaf0" />
                <path d="M30 11 H50 Q48 11 48 14 V16 Q48 17 47 17 H33 Q32 17 32 16 V14 Q32 11 30 11 Z" fill="#2a3550"/>
                <circle cx="20" cy="14" r="1" fill="#4a5570" />
                <rect x="23" y="13" width="6" height="2" rx="1" fill="#4a5570" />
                <rect x="20" y="25" width="40" height="3" rx="1.5" fill="#1a2540" />
                <rect x="20" y="31" width="25" height="2" rx="1" fill="#6b7280" />
                <text x="40" y="47" fontSize="8" fill="#1a2540" fontFamily="system-ui" textAnchor="middle">00:00</text>
                <circle cx="40" cy="82" r="12" fill="#ef4444" className="group-hover:fill-[#dc2626] transition-colors" />
                <rect x="35" y="80" width="10" height="4" rx="2" fill="white" />
                <rect x="32" y="99" width="16" height="3" rx="1.5" fill="#1a2540" />
              </svg>
            ) : (
              <svg width="90" height="110" viewBox="0 0 90 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g transform="translate(10, 20)">
                  <path d="M35 8 L8 32 L13 32 L13 70 L57 70 L57 32 L62 32 Z" fill="#1a2540" />
                  <path d="M35 8 L11 30 L15 30 L15 68 L55 68 L55 30 L59 30 Z" fill="#2a3550" className="group-hover:fill-[#1e3a5f] transition-colors" />
                  <rect x="15" y="30" width="40" height="38" fill="#e8eaf0" />
                  <rect x="26" y="48" width="18" height="20" rx="1" fill="#1a2540" />
                  <circle cx="40" cy="58" r="1.5" fill="#6b7280" />
                  <rect x="19" y="36" width="11" height="9" rx="1" fill="#4a5570" />
                  <rect x="40" y="36" width="11" height="9" rx="1" fill="#4a5570" />
                  <line x1="24.5" y1="36" x2="24.5" y2="45" stroke="#2a3550" strokeWidth="1" />
                  <line x1="19" y1="40.5" x2="30" y2="40.5" stroke="#2a3550" strokeWidth="1" />
                  <line x1="45.5" y1="36" x2="45.5" y2="45" stroke="#2a3550" strokeWidth="1" />
                  <line x1="40" y1="40.5" x2="51" y2="40.5" stroke="#2a3550" strokeWidth="1" />
                  <rect x="44" y="16" width="6" height="14" fill="#1a2540" />
                </g>
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
