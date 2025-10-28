import { ProgressStepper } from "../components/ProgressStepper";
import { useNavigate, useLocation } from "react-router-dom";
import { CallConfig } from "../components/ConfigurationPage";
import { ArrowLeft } from "lucide-react";
import { referralScriptContent } from "../scenarios/referralScript";

export default function PickScript() {
  const navigate = useNavigate();
  const location = useLocation();
  const { scenario, persona, seller_referral2, seller_referral_contract, vapiAssistantId } = location.state || {};

  const handleScriptSelect = (scriptName: string) => {
    if (!persona) {
      alert("Please select a persona first");
      navigate("/choose-ai-lead");
      return;
    }

    const config: CallConfig = {
      scenario: scenario || "Seller Lead - Refferal",
      mood: "Neutral",
      difficulty: persona.difficulty,
      persona: persona,
      voice: persona.elevenLabsVoiceId,
      // carry assistant override for Vapi (Avery variants)
      vapiAssistantId: vapiAssistantId,
      script: {
        name: scriptName,
        content: getScriptContent(scriptName),
        source: "database",
      },
    };

    navigate("/conversation", { state: { config } });
  };

  const getScriptContent = (scriptName: string) => {
    if (scriptName === "No Script") return "";
    const scripts: Record<string, string> = {
      "Seller Lead - Referral: Calling a Referral (Clash #1)": referralScriptContent,
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
      <ProgressStepper
        steps={[
          { label: "Scenarios", completed: true, active: false },
          { label: "AI Lead", completed: true, active: false },
          { label: "Script", completed: false, active: true },
          { label: "Conversation", completed: false, active: false },
        ]}
      />
      <h2 className="text-3xl font-semibold mb-8">Select a Training Script</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {((seller_referral2 || seller_referral_contract) ? ["No Script"] : ["No Script", "Seller Lead - Referral: Calling a Referral (Clash #1)"]).map((script) => (
          <div
            key={script}
            onClick={() => handleScriptSelect(script)}
            className="bg-white p-6 rounded-xl shadow-md w-72 hover:shadow-lg transition cursor-pointer"
          >
            <h3 className="text-lg font-semibold mb-2">{script}</h3>
            <p className="text-gray-600 text-sm">
              {script === "No Script"
                ? "Free-form practice without a guided script."
                : "Seller Lead - Referral pre-qualification & pre-listing training (6 slides)."}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

