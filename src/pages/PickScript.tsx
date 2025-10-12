import { ProgressTracker } from "../components/ProgressTracker";
import { useNavigate, useLocation } from "react-router-dom";
import { CallConfig } from "../components/ConfigurationPage";
import { ArrowLeft } from "lucide-react";

export default function PickScript() {
  const navigate = useNavigate();
  const location = useLocation();
  const { scenario, persona } = location.state || {};

  const handleScriptSelect = (scriptName: string) => {
    if (!persona) {
      alert("Please select a persona first");
      navigate("/choose-ai-lead");
      return;
    }

    const config: CallConfig = {
      scenario: scenario || "Seller Lead - Initial Call",
      mood: "Neutral",
      difficulty: persona.difficulty,
      persona: persona,
      voice: persona.elevenLabsVoiceId,
      script: {
        name: scriptName,
        content: getScriptContent(scriptName),
        source: "database",
      },
    };

    navigate("/conversation", { state: { config } });
  };

  const getScriptContent = (scriptName: string) => {
    const scripts: Record<string, string> = {
      "Cold Call - Seller Interest": `Introduction:
"Hi, this is [Your Name] with [Your Real Estate Company]. How are you doing today?"

Purpose:
"I'm reaching out because I've been working in your neighborhood and noticed your property at [Address]. We've had several buyers specifically looking for homes in your area."

Value Proposition:
"In fact, homes on your street have been selling 15% above asking price in the last 3 months. I wanted to see if you'd be open to learning what your home might be worth in today's market?"`,
      
      "FSBO - Objection Handling": `Acknowledgment:
"I understand you're selling your home on your own. That shows great initiative!"

Value Question:
"I'm curious - how has the process been going so far? Have you had many showings?"

Positioning:
"Many homeowners I work with initially tried FSBO, and I help them navigate the challenges they encountered. Would you be open to a quick conversation about what's working and what might not be?"`,
      
      "Expired Listing": `Empathy Opening:
"Hi [Name], I noticed your listing on [Address] recently expired. I know that can be frustrating."

Direct Question:
"I'm curious - what do you think prevented it from selling?"

Solution Positioning:
"I've helped several homeowners in similar situations sell their homes successfully. Would you be open to a brief conversation about a fresh approach?"`,
    };

    return scripts[scriptName] || "Practice script content here.";
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-10 bg-gray-50">
      <div className="w-full max-w-5xl px-6 mb-6">
        <button
          onClick={() => navigate("/choose-ai-lead", { state: { scenario } })}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to AI Lead Selection
        </button>
      </div>
      <ProgressTracker currentStep="Script" />
      <h2 className="text-3xl font-semibold mb-8">Select a Training Script</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {["Cold Call - Seller Interest", "FSBO - Objection Handling", "Expired Listing"].map((script) => (
          <div
            key={script}
            onClick={() => handleScriptSelect(script)}
            className="bg-white p-6 rounded-xl shadow-md w-72 hover:shadow-lg transition cursor-pointer"
          >
            <h3 className="text-lg font-semibold mb-2">{script}</h3>
            <p className="text-gray-600 text-sm">
              Practice a realistic {script.toLowerCase()} scenario with adaptive AI responses.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

