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
import { personas, type Persona } from "../config/personas";

interface ConfigurationPageProps {
  onBack: () => void;
  onStartCall: (config: CallConfig) => void;
}

export interface CallConfig {
  scenario: string;
  mood: string;
  difficulty: string;
  voice?: string; // AI voice selection
  persona?: Persona; // Selected AI persona
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
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  
  // Script state
  const [selectedScriptId, setSelectedScriptId] = useState<string>("");
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [scriptContent, setScriptContent] = useState<string>("");
  const [scriptSource, setScriptSource] = useState<"upload" | "database" | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedScript, setEditedScript] = useState<string>("");

  const handleStart = () => {
    if (scenario && selectedPersona) {
      const config: CallConfig = { 
        scenario, 
        mood: "Neutral", 
        difficulty: selectedPersona.difficulty, 
        persona: selectedPersona,
        voice: selectedPersona.elevenLabsVoiceId 
      };
      
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

  const isValid = scenario && selectedPersona;

  // Quick start - random cold call
  const handleQuickStart = () => {
    // Use Morgan (Medium difficulty) for quick start
    const defaultPersona = personas.find(p => p.id === "morgan") || personas[1];

    const quickCallConfig: CallConfig = {
      scenario: "Cold Call - Homeowner",
      mood: "Neutral",
      difficulty: "Medium",
      persona: defaultPersona,
      voice: defaultPersona.elevenLabsVoiceId,
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
    <div className="min-h-screen bg-gradient-to-br from-[#F9FAFB] via-[#F3F6FF] to-[#EFF6FF]">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-6 hover:bg-white/60"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">Configure Your Role-Play</h1>
          <p className="text-lg text-gray-600">
            Choose your scenario settings to begin the simulation
          </p>
        </div>

        {/* Quick Start Banner */}
        <Card className="mb-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white border-0 shadow-2xl hover:shadow-3xl transition-all">
          <div className="p-8">
            <div className="flex items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">⚡</span>
                  <h2 className="text-2xl font-bold tracking-tight">Quick Start: Cold Call Practice</h2>
                </div>
                <p className="text-blue-50 text-base max-w-2xl leading-relaxed">
                  Jump right into a realistic cold call scenario with a random AI prospect and a proven script. Perfect for quick practice!
                </p>
              </div>
              <Button
                onClick={handleQuickStart}
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-8 py-4 text-base shadow-xl hover:shadow-2xl transition-all ml-6 h-auto"
              >
                🎙️ Start Now
              </Button>
            </div>
          </div>
        </Card>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-10">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-sm text-gray-600 font-semibold">OR CUSTOMIZE YOUR CALL</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        <div className="space-y-8">
          {/* Scenario Selection */}
          <Card className="p-8 bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Call Scenario</h3>
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
            <p className="text-sm text-gray-600 mt-2">
              The type of call you want to practice
            </p>
          </Card>

          {/* Persona Selection */}
          <Card className="p-8 bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-lg">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Choose Your AI Lead</h3>
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {personas.map((persona) => {
                const difficultyStars = {
                  easy: "⭐",
                  medium: "⭐⭐⭐",
                  hard: "⭐⭐⭐⭐⭐"
                }[persona.difficulty] || "⭐";

                const difficultyLabel = {
                  easy: "Easy",
                  medium: "Medium",
                  hard: "Hard"
                }[persona.difficulty] || persona.difficulty;

                const handlePersonaSelect = (p: Persona) => {
                  setSelectedPersona(p);
                };

                return (
                  <div
                    key={persona.id}
                    onClick={() => handlePersonaSelect(persona)}
                    className={`flex flex-col items-center bg-white rounded-2xl shadow-md transition-all cursor-pointer p-6 border-2
                      ${selectedPersona?.id === persona.id 
                        ? "border-blue-500 shadow-blue-200 scale-105" 
                        : "border-transparent hover:shadow-lg hover:scale-102"
                      }`}
                  >
                    <div className="flex items-center w-full mb-4">
                      <img
                        src={persona.image}
                        alt={persona.displayName}
                        className="w-20 h-20 rounded-full object-cover mr-4 border-2 border-gray-200"
                      />
                      <div className="flex flex-col items-start flex-1">
                        <h4 className="text-xl font-semibold text-gray-800">{persona.displayName}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {difficultyStars} <span className="ml-1">({difficultyLabel})</span>
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm text-center leading-relaxed">
                      {persona.description}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-gray-600 mt-6 text-center">
              Select a persona to determine the AI's personality and difficulty level
            </p>
          </Card>

          {/* Scripts Section */}
          <Card className="p-8 bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Scripts</h3>
              <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-800">💬 Script Assistant</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-4">
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
                  <Label className="text-base font-semibold text-gray-900">Script Preview</Label>
                  <Badge variant="outline" className="bg-white">
                    {scriptSource === "database" ? "Database" : "Uploaded"}
                  </Badge>
                </div>
                <div className="border border-gray-200 rounded-xl p-5 bg-white/50 backdrop-blur-sm max-h-48 overflow-y-auto shadow-inner">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{scriptContent}</p>
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
            className="w-full h-14 text-base font-semibold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all"
            disabled={!isValid}
            onClick={handleStart}
          >
            <Phone className="w-5 h-5 mr-2" />
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
