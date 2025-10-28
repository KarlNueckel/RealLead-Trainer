import { useState } from 'react';
import { ThumbsUp, Share2, Bookmark, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

type Step = {
  title: string;
  icon: 'phone' | 'home';
  description?: string;
  link: string; // e.g., '/seller-lead-referral-initial-call' or '/seller-lead-referral-listing-consultation'
};

interface ScenarioGroupProps {
  title: string;
  description: string;
  steps: Step[];
  likes?: number;
}

export function ScenarioGroup({ title, description, steps, likes = 0 }: ScenarioGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const navigate = useNavigate();

  const toggle = () => setIsExpanded((v) => !v);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikeCount((c) => (isLiked ? c - 1 : c + 1));
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  const handleStepClick = (step: Step) => {
    // Map step title to scenario state for downstream pages
    let scenarioTitle = title;
    if (step.title.toLowerCase().includes('listing consultation')) {
      scenarioTitle = 'Seller Lead - Referral 2 (Listing Consultation)';
    } else if (step.title.toLowerCase().includes('initial call')) {
      scenarioTitle = 'Seller Lead - Referral';
    } else if (step.title.toLowerCase().includes('contract negotiations')) {
      scenarioTitle = 'Seller Lead – Referral: Contract Negotiations';
    }
    navigate(step.link, { state: { scenario: scenarioTitle } });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={toggle}
      className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 relative overflow-hidden cursor-pointer"
    >
      {/* Header (no phone/house mockup on the right) */}
      <div className="flex items-start justify-between gap-6 relative z-10">
        <div className="flex-1 min-w-0">
          <div className="mb-6">
            <h3 className="text-[#1a2540] uppercase tracking-tight leading-tight text-xl font-bold mb-2 group-hover:text-blue-900 transition-colors">
              {title}
            </h3>
            <p className="text-gray-700 text-base md:text-lg">{description}</p>
          </div>

          {/* Social/Actions row */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-gray-500">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 transition-colors ${isLiked ? 'text-blue-600' : 'hover:text-blue-600'}`}
              >
                <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-blue-600' : ''}`} />
                <span className="text-xs">{likeCount} likes</span>
              </button>
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <button className="text-gray-400 hover:text-blue-600 transition-all hover:scale-110" onClick={(e) => e.stopPropagation()}>
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleBookmark}
                className={`transition-all hover:scale-110 ${isBookmarked ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'}`}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Chevron */}
        <button
          onClick={(e) => { e.stopPropagation(); toggle(); }}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronDown className={`w-6 h-6 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-6 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-3">
              {steps.map((step) => (
                <button
                  key={step.title}
                  onClick={() => handleStepClick(step)}
                  className="group w-full flex items-center justify-between gap-5 bg-white border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 rounded-xl px-6 py-5 text-left transition-all shadow-sm"
                >
                  <div className="flex-1">
                    <div className="text-lg md:text-xl font-semibold text-gray-900">{step.title}</div>
                    {step.description && (
                      <div className="text-base md:text-lg text-gray-600">{step.description}</div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <div className="relative transform group-hover:scale-105 transition-transform duration-300">
                      {step.icon === 'phone' ? (
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
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



