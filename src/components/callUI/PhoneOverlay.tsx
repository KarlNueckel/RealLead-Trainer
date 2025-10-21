import { Mic, Grid3X3, Volume2, Plus, Video, Timer, PhoneOff } from "lucide-react";

interface PhoneOverlayProps {
  contactName: string;
  profileImage: string;
  onEndCall?: () => void;
  callDuration?: string;
}

export function PhoneOverlay({ contactName, profileImage, onEndCall, callDuration = "03:24" }: PhoneOverlayProps) {
  return (
    <div className="absolute top-1/2 -translate-y-1/2 right-4 md:right-8 lg:right-12 w-72 md:w-80 lg:w-96 h-[620px] md:h-[700px] lg:h-[820px] max-h-[calc(100vh-64px)] overflow-hidden bg-gradient-to-b from-gray-900/95 to-black/95 rounded-[3.5rem] shadow-[0_20px_80px_rgba(0,0,0,0.8)] backdrop-blur-md border-[6px] border-gray-800/80 z-50 pointer-events-auto">
      {/* Dynamic Island */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-black rounded-full z-10"></div>
      
      {/* Status Bar */}
      <div className="flex justify-between items-center px-10 pt-12 pb-3">
        <span className="text-white/90 text-sm">9:41</span>
        <div className="flex gap-1.5 items-center">
          <svg className="w-5 h-4" viewBox="0 0 20 12" fill="none">
            <rect width="2" height="8" fill="white" fillOpacity="0.9"/>
            <rect x="4" width="2" height="10" fill="white" fillOpacity="0.9"/>
            <rect x="8" width="2" height="12" fill="white" fillOpacity="0.9"/>
            <rect x="12" width="2" height="10" fill="white" fillOpacity="0.6"/>
          </svg>
          <svg className="w-6 h-5" viewBox="0 0 24 12" fill="white" fillOpacity="0.9">
            <rect width="18" height="12" rx="2" stroke="white" strokeWidth="1.5" fill="none"/>
            <rect x="20" y="4" width="3" height="4" rx="1" fill="white"/>
            <rect x="2" y="2" width="14" height="8" rx="1" fill="white"/>
          </svg>
        </div>
      </div>

      {/* Contact Info */}
      <div className="flex flex-col items-center mt-10">
        <div className="w-24 h-24 rounded-full overflow-hidden mb-4 ring-4 ring-white/10 shadow-xl">
          <img 
            src={profileImage} 
            alt={contactName}
            className="w-full h-full object-cover"
          />
        </div>
        <h3 className="text-white text-2xl">{contactName}</h3>
        <p className="text-white/70 text-base mt-2">mobile</p>
        <p className="text-white/50 text-sm mt-3">{callDuration}</p>
      </div>

      {/* Call Controls Grid */}
      <div className="absolute bottom-36 left-0 right-0 px-10">
        <div className="grid grid-cols-3 gap-8">
          {/* Mute */}
          <button className="flex flex-col items-center gap-2.5">
            <div className="w-16 h-16 rounded-full bg-gray-700/60 flex items-center justify-center hover:bg-gray-600/60 transition-colors shadow-lg">
              <Mic className="w-7 h-7 text-white" />
            </div>
            <span className="text-white/80 text-sm">mute</span>
          </button>

          {/* Keypad */}
          <button className="flex flex-col items-center gap-2.5">
            <div className="w-16 h-16 rounded-full bg-gray-700/60 flex items-center justify-center hover:bg-gray-600/60 transition-colors shadow-lg">
              <Grid3X3 className="w-7 h-7 text-white" />
            </div>
            <span className="text-white/80 text-sm">keypad</span>
          </button>

          {/* Audio */}
          <button className="flex flex-col items-center gap-2.5">
            <div className="w-16 h-16 rounded-full bg-gray-700/60 flex items-center justify-center hover:bg-gray-600/60 transition-colors shadow-lg">
              <Volume2 className="w-7 h-7 text-white" />
            </div>
            <span className="text-white/80 text-sm">audio</span>
          </button>

          {/* Add Call */}
          <button className="flex flex-col items-center gap-2.5">
            <div className="w-16 h-16 rounded-full bg-gray-700/60 flex items-center justify-center hover:bg-gray-600/60 transition-colors shadow-lg">
              <Plus className="w-7 h-7 text-white" />
            </div>
            <span className="text-white/80 text-sm">add call</span>
          </button>

          {/* FaceTime */}
          <button className="flex flex-col items-center gap-2.5">
            <div className="w-16 h-16 rounded-full bg-gray-700/60 flex items-center justify-center hover:bg-gray-600/60 transition-colors shadow-lg">
              <Video className="w-7 h-7 text-white" />
            </div>
            <span className="text-white/80 text-sm">FaceTime</span>
          </button>

          {/* Contacts */}
          <button className="flex flex-col items-center gap-2.5">
            <div className="w-16 h-16 rounded-full bg-gray-700/60 flex items-center justify-center hover:bg-gray-600/60 transition-colors shadow-lg">
              <Timer className="w-7 h-7 text-white" />
            </div>
            <span className="text-white/80 text-sm">contacts</span>
          </button>
        </div>
      </div>

      {/* End Call Button */}
      <div className="absolute bottom-12 md:bottom-14 lg:bottom-16 left-0 right-0 flex justify-center z-50">
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("🔴 End call button clicked!");
            onEndCall?.();
          }}
          className="w-16 h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-full bg-red-500/90 hover:bg-red-600/90 active:scale-95 transition-all flex items-center justify-center shadow-2xl cursor-pointer relative z-50"
          type="button"
        >
          <PhoneOff className="w-7 h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 text-white pointer-events-none" strokeWidth={2.5} />
        </button>
      </div>

      {/* Home Indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-36 h-1.5 bg-white/40 rounded-full"></div>
    </div>
  );
}

