import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { ArrowLeft, Phone, FileText, Edit, Check, MessageSquare } from "lucide-react";
import { useState } from "react";

interface ConfigurationPageProps {
  onBack: () => void;
  onStartCall: (config: CallConfig) => void;
}

export interface CallConfig {
  scenario: string;
  mood: string;
  difficulty: string;
  voice?: string; // AI voice selection
  script?: {
    name: string;
    content: string;
    source: "upload" | "database";
  };
}

// Mock database scripts
const DATABASE_SCRIPTS = [
  {
    id: "buyer-qual",
    name: "Buyer Qualification",
    content: `Introduction:
"Hi [Name], this is [Your Name] with [Company]. I appreciate you taking the time to speak with me today. I understand you're interested in exploring homes in the [Area] area. Is now still a good time to chat?"

Qualifying Questions:
1. What's prompting your move at this time?
2. What's your ideal timeline for purchasing?
3. Have you been pre-approved for a mortgage yet?
4. What are your must-haves in a home?

Next Steps:
"Based on what you've shared, I'd love to set up a time to show you some properties that match your criteria. Are you available this [Day/Time]?"`,
  },
  {
    id: "cold-call",
    name: "Cold Call Intro",
    content: `Opening:
"Good [morning/afternoon], is this [Name]? Great! My name is [Your Name] and I'm a real estate agent with [Company] here in [Area]. I hope I'm not catching you at a bad time?"

Purpose Statement:
"The reason I'm calling is that I've been working extensively in your neighborhood, and I wanted to reach out to homeowners to share some interesting market trends. Have you given any thought to what your home might be worth in today's market?"

Value Proposition:
"I'm not calling to pressure you into anything - I just wanted to make sure you have the latest information about your neighborhood. Would you be open to a quick conversation about what's happening in your area?"`,
  },
  {
    id: "follow-up",
    name: "Follow-Up",
    content: `Reconnection:
"Hi [Name], this is [Your Name] from [Company]. We spoke [timeframe] ago about [specific topic]. How are you doing today?"

Recap & Update:
"When we last talked, you mentioned [specific concern/interest]. I wanted to follow up because [relevant update or new information]."

Call to Action:
"I'd love to continue our conversation and see how I can help you move forward. Do you have 10 minutes to chat now, or would later this week work better for you?"`,
  },
  {
    id: "listing-pitch",
    name: "Listing Pitch",
    content: `Introduction:
"Hi [Name], I'm [Your Name] with [Company]. I noticed your home at [Address] and I'm reaching out because I specialize in this area. Do you have a few minutes to talk about your property?"

Market Expertise:
"I've sold [X] homes in your neighborhood over the past [timeframe], and I have [X] active buyers looking for properties just like yours. The market has been particularly strong for homes in your price range."

Unique Value:
"What sets my approach apart is [unique selling proposition - e.g., targeted marketing strategy, professional photography, extensive network]. I'd love to meet with you to share a detailed market analysis and discuss how I can help you achieve your goals."

Next Steps:
"Would you be available for a brief meeting this week? I can show you exactly what your home could sell for and walk you through my proven process."`,
  },
];

export function ConfigurationPage({ onBack, onStartCall }: ConfigurationPageProps) {
  const [scenario, setScenario] = useState<string>("");
  const [mood, setMood] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [voice, setVoice] = useState<string>("EXAVITQu4vr4xnSDxMaL"); // Default: Sarah voice
  
  // Script state
  const [selectedScriptId, setSelectedScriptId] = useState<string>("");
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [scriptContent, setScriptContent] = useState<string>("");
  const [scriptSource, setScriptSource] = useState<"upload" | "database" | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedScript, setEditedScript] = useState<string>("");

  const handleStart = () => {
    if (scenario && mood && difficulty) {
      const config: CallConfig = { scenario, mood, difficulty, voice };
      
      // Add script if one is selected
      if (scriptContent && scriptSource) {
        config.script = {
          name: scriptSource === "database" 
            ? DATABASE_SCRIPTS.find(s => s.id === selectedScriptId)?.name || "Custom Script"
            : uploadedFileName || "Uploaded Script",
          content: scriptContent,
          source: scriptSource,
        };
      }
      
      onStartCall(config);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setScriptContent(content);
        setScriptSource("upload");
        setSelectedScriptId("");
      };
      reader.readAsText(file);
    }
  };

  const handleDatabaseScriptSelect = (scriptId: string) => {
    const script = DATABASE_SCRIPTS.find(s => s.id === scriptId);
    if (script) {
      setSelectedScriptId(scriptId);
      setScriptContent(script.content);
      setScriptSource("database");
      setUploadedFileName("");
    }
  };

  const handleEditScript = () => {
    setEditedScript(scriptContent);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    setScriptContent(editedScript);
    setShowEditModal(false);
  };

  const isValid = scenario && mood && difficulty;

  // Quick start - random cold call
  const handleQuickStart = () => {
    const voices = [
      "EXAVITQu4vr4xnSDxMaL", // Sarah
      "pNInz6obpgDQGcFmaJgB", // Adam
      "21m00Tcm4TlvDq8ikWAM", // Josh
      "AZnzlk1XvdvUeBnXmlld", // Domi
      "MF3mGyEYCl7XYWbV9V6O", // Elli
      "TxGEqnHWrfWFTfGW9XjX", // Brian
    ];
    const randomVoice = voices[Math.floor(Math.random() * voices.length)];

    const quickCallConfig: CallConfig = {
      scenario: "Cold Call - Homeowner",
      mood: "Neutral",
      difficulty: "Medium",
      voice: randomVoice,
      script: {
        name: "Basic Cold Call Script",
        content: `Introduction:
"Hi, this is [Your Name] with [Your Real Estate Company]. How are you doing today?"

Purpose:
"I'm reaching out because I've been working in your neighborhood and noticed your property at [Address]. We've had several buyers specifically looking for homes in your area."

Value Proposition:
"In fact, homes on your street have been selling 15% above asking price in the last 3 months. I wanted to see if you'd be open to learning what your home might be worth in today's market?"

Qualifying Question:
"Have you given any thought to selling in the next year or so?"

Objection Response:
"I completely understand. Even if you're not planning to sell right now, knowing your home's value can be really helpful for financial planning. Would you be open to a quick 10-minute conversation where I can share what similar homes are selling for?"

Next Steps:
"Great! I'd love to stop by for just 10 minutes to give you a free market analysis. Would Tuesday or Thursday work better for you?"`,
        source: "database",
      },
    };

    onStartCall(quickCallConfig);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="mb-2">Configure Your Role-Play</h1>
          <p className="text-slate-600">
            Choose your scenario settings to begin the simulation
          </p>
        </div>

        {/* Quick Start Banner */}
        <Card className="mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">⚡</span>
                  <h2 className="text-xl font-bold">Quick Start: Cold Call Practice</h2>
                </div>
                <p className="text-indigo-100 text-sm max-w-2xl">
                  Jump right into a realistic cold call scenario with a random AI prospect and a proven script. Perfect for quick practice!
                </p>
              </div>
              <Button
                onClick={handleQuickStart}
                size="lg"
                className="bg-white text-indigo-600 hover:bg-indigo-50 font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition-all ml-6"
              >
                🎙️ Start Now
              </Button>
            </div>
          </div>
        </Card>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-slate-300"></div>
          <span className="text-sm text-slate-500 font-medium">OR CUSTOMIZE YOUR CALL</span>
          <div className="flex-1 h-px bg-slate-300"></div>
        </div>

        <div className="space-y-6">
          {/* Scenario Selection */}
          <Card className="p-6">
            <h3 className="mb-4">Call Scenario</h3>
            <Select value={scenario} onValueChange={setScenario}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a scenario..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fsbo">FSBO (For Sale By Owner)</SelectItem>
                <SelectItem value="expired">Expired Listing</SelectItem>
                <SelectItem value="buyer-consult">Buyer Consultation</SelectItem>
                <SelectItem value="seller-consult">Seller Consultation</SelectItem>
                <SelectItem value="cold-call">Cold Call Prospecting</SelectItem>
                <SelectItem value="circle-prospect">Circle Prospecting</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-slate-500 mt-2">
              The type of call you want to practice
            </p>
          </Card>

          {/* Prospect Mood */}
          <Card className="p-6">
            <h3 className="mb-4">Prospect Mood</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setMood("friendly")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  mood === "friendly"
                    ? "border-slate-800 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="text-2xl mb-2">😊</div>
                <div>Friendly</div>
                <p className="text-xs text-slate-500 mt-1">
                  Open and receptive
                </p>
              </button>
              
              <button
                onClick={() => setMood("neutral")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  mood === "neutral"
                    ? "border-slate-800 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="text-2xl mb-2">😐</div>
                <div>Neutral</div>
                <p className="text-xs text-slate-500 mt-1">
                  Cautiously interested
                </p>
              </button>
              
              <button
                onClick={() => setMood("skeptical")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  mood === "skeptical"
                    ? "border-slate-800 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="text-2xl mb-2">🤨</div>
                <div>Skeptical</div>
                <p className="text-xs text-slate-500 mt-1">
                  Resistant and doubtful
                </p>
              </button>
            </div>
          </Card>

          {/* Difficulty Level */}
          <Card className="p-6">
            <h3 className="mb-4">Difficulty Level</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setDifficulty("easy")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  difficulty === "easy"
                    ? "border-slate-800 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="text-green-600 mb-2">●</div>
                <div>Easy</div>
                <p className="text-xs text-slate-500 mt-1">
                  Basic objections
                </p>
              </button>
              
              <button
                onClick={() => setDifficulty("medium")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  difficulty === "medium"
                    ? "border-slate-800 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="text-yellow-600 mb-2">●</div>
                <div>Medium</div>
                <p className="text-xs text-slate-500 mt-1">
                  Moderate challenges
                </p>
              </button>
              
              <button
                onClick={() => setDifficulty("hard")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  difficulty === "hard"
                    ? "border-slate-800 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="text-red-600 mb-2">●</div>
                <div>Hard</div>
                <p className="text-xs text-slate-500 mt-1">
                  Complex objections
                </p>
              </button>
            </div>
          </Card>

          {/* AI Voice Selection */}
          <Card className="p-6">
            <h3 className="mb-4">AI Voice</h3>
            <Select value={voice} onValueChange={setVoice}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXAVITQu4vr4xnSDxMaL">
                  <div className="flex items-center gap-2">
                    <span>👩</span>
                    <div>
                      <div className="font-medium">Sarah</div>
                      <div className="text-xs text-slate-500">Professional, warm (default)</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="pNInz6obpgDQGcFmaJgB">
                  <div className="flex items-center gap-2">
                    <span>👨</span>
                    <div>
                      <div className="font-medium">Adam</div>
                      <div className="text-xs text-slate-500">Deep, confident male</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="21m00Tcm4TlvDq8ikWAM">
                  <div className="flex items-center gap-2">
                    <span>👨</span>
                    <div>
                      <div className="font-medium">Josh</div>
                      <div className="text-xs text-slate-500">Young, energetic male</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="AZnzlk1XvdvUeBnXmlld">
                  <div className="flex items-center gap-2">
                    <span>👨</span>
                    <div>
                      <div className="font-medium">Domi</div>
                      <div className="text-xs text-slate-500">Strong, authoritative</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="MF3mGyEYCl7XYWbV9V6O">
                  <div className="flex items-center gap-2">
                    <span>👩</span>
                    <div>
                      <div className="font-medium">Elli</div>
                      <div className="text-xs text-slate-500">Friendly, approachable</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="TxGEqnHWrfWFTfGW9XjX">
                  <div className="flex items-center gap-2">
                    <span>👨</span>
                    <div>
                      <div className="font-medium">Brian</div>
                      <div className="text-xs text-slate-500">Calm, professional</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-slate-500 mt-2">
              Choose the AI prospect's voice personality
            </p>
          </Card>

          {/* Scripts Section */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-slate-600" />
              <h3>Scripts</h3>
              <Badge variant="secondary" className="ml-auto">💬 Script Assistant</Badge>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Upload or select a script to guide your conversation (optional)
            </p>
            
            <Tabs defaultValue="database" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="database">Select from Database</TabsTrigger>
                <TabsTrigger value="upload">Upload Script</TabsTrigger>
              </TabsList>
              
              <TabsContent value="database" className="space-y-4">
                <div>
                  <Label htmlFor="database-script">Choose a pre-saved script</Label>
                  <Select value={selectedScriptId} onValueChange={handleDatabaseScriptSelect}>
                    <SelectTrigger id="database-script" className="w-full mt-2">
                      <SelectValue placeholder="Select a script..." />
                    </SelectTrigger>
                    <SelectContent>
                      {DATABASE_SCRIPTS.map((script) => (
                        <SelectItem key={script.id} value={script.id}>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            {script.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              
              <TabsContent value="upload" className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Upload a custom script</Label>
                  <div className="mt-2">
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".txt,.doc,.docx,.pdf"
                      onChange={handleFileUpload}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Supported formats: TXT, DOCX, PDF
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Script Preview */}
            {scriptContent && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Script Preview</Label>
                  <Badge variant="outline">
                    {scriptSource === "database" ? "Database" : "Uploaded"}
                  </Badge>
                </div>
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 max-h-48 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap">{scriptContent}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleEditScript}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Script
                  </Button>
                  <Button 
                    type="button" 
                    size="sm"
                    className="ml-auto"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Use This Script
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Start Button */}
          <Button 
            size="lg" 
            className="w-full"
            disabled={!isValid}
            onClick={handleStart}
          >
            <Phone className="w-4 h-4 mr-2" />
            Start Call Simulation
          </Button>
        </div>
      </div>

      {/* Edit Script Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Edit Script</DialogTitle>
            <DialogDescription>
              Customize your script to better fit your needs
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="script-editor">Script Content</Label>
              <Textarea
                id="script-editor"
                value={editedScript}
                onChange={(e) => setEditedScript(e.target.value)}
                className="min-h-[400px] mt-2 font-mono text-sm"
                placeholder="Enter your script content here..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                <Check className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
