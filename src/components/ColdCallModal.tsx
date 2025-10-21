import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Phone, Shuffle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface ColdCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart?: () => void;
}

interface Script {
  id: string;
  title: string;
  description: string;
}

export function ColdCallModal({ isOpen, onClose, onStart }: ColdCallModalProps) {
  const [selectedScript, setSelectedScript] = useState<string>('');
  const [isRandomMode, setIsRandomMode] = useState(false);
  const [aiVoiceEnabled, setAiVoiceEnabled] = useState(true);

  const scripts: Script[] = [
    { id: 'expired-listing', title: 'Expired Listing', description: 'Reach out to homeowners whose listings have expired without selling' },
    { id: 'fsbo', title: 'FSBO (For Sale By Owner)', description: 'Connect with sellers attempting to sell their home without an agent' },
    { id: 'just-listed', title: 'Just Listed', description: 'Inform neighbors about a new listing in their area to generate leads' },
    { id: 'open-house', title: 'Open House Invite', description: 'Invite potential buyers and neighbors to an upcoming open house event' },
    { id: 'circle-prospecting', title: 'Circle Prospecting', description: 'Contact homeowners in a specific neighborhood to build your presence' },
    { id: 'geographic-farming', title: 'Geographic Farming', description: 'Establish yourself as the go-to agent in a targeted geographic area' },
    { id: 'buyer-followup', title: 'Buyer Lead Follow-Up', description: 'Follow up with potential buyers to nurture the relationship' },
    { id: 'seller-followup', title: 'Seller Lead Follow-Up', description: 'Check in with potential sellers and move them through your pipeline' },
  ];

  const handleStartCall = () => {
    console.log('Starting call with:', { script: isRandomMode ? 'Random' : selectedScript, aiVoice: aiVoiceEnabled });
    onStart?.();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-2.5">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            Choose Your Cold Call Script
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Random Mode Toggle */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 rounded-2xl border-2 border-blue-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-xl p-2.5 shadow-sm">
                  <Shuffle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <Label htmlFor="random-mode" className="cursor-pointer text-base">Random Script Mode</Label>
                  <p className="text-sm text-gray-600 mt-0.5">Let the system choose a script for you</p>
                </div>
              </div>
              <Switch id="random-mode" checked={isRandomMode} onCheckedChange={setIsRandomMode} className="data-[state=checked]:bg-blue-600" />
            </div>
          </div>

          {/* Script Selection Grid */}
          <div>
            <Label className="text-sm text-gray-500 uppercase tracking-wider mb-4 block">Or Select a Specific Script</Label>
            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2">
              {scripts.map((script) => (
                <button
                  key={script.id}
                  onClick={() => { setSelectedScript(script.id); setIsRandomMode(false); }}
                  disabled={isRandomMode}
                  className={`text-left p-5 rounded-xl border-2 transition-all duration-200 ${selectedScript === script.id && !isRandomMode ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100/30 shadow-md' : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'} ${isRandomMode ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-sm cursor-pointer'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[#1a2540] mb-1.5">{script.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{script.description}</p>
                    </div>
                    {selectedScript === script.id && !isRandomMode && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* AI Voice Toggle */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="ai-voice" className="cursor-pointer">Practice with AI voice</Label>
                <p className="text-xs text-gray-500 mt-1">AI will respond to your prompts in real-time</p>
              </div>
              <Switch id="ai-voice" checked={aiVoiceEnabled} onCheckedChange={setAiVoiceEnabled} className="data-[state=checked]:bg-blue-600" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button onClick={onClose} variant="outline" className="flex-1 py-6 border-gray-200 hover:bg-gray-50">Cancel</Button>
            <Button onClick={handleStartCall} disabled={!isRandomMode && !selectedScript} className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-200 hover:shadow-xl transition-all py-6 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none">
              <Phone className="w-4 h-4 mr-2" />
              Start Call
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
