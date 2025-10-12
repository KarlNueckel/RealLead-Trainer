import { ProgressTracker } from "../components/ProgressTracker";
import { PersonaSelection } from "../components/PersonaSelection";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { Persona } from "../config/personas";
import { ArrowLeft } from "lucide-react";

export default function ChooseAILead() {
  const [persona, setPersona] = useState<Persona | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const scenario = location.state?.scenario || "Seller Lead - Initial Call";

  return (
    <div className="min-h-screen flex flex-col items-center py-10 bg-gray-50">
      <div className="w-full max-w-5xl px-6 mb-6">
        <button
          onClick={() => navigate("/call-scenarios")}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Scenarios
        </button>
      </div>
      <ProgressTracker currentStep="AI Lead" />
      <PersonaSelection onSelect={setPersona} />
      {persona && (
        <button
          onClick={() => navigate("/pick-script", { state: { scenario, persona } })}
          className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Continue with {persona.displayName}
        </button>
      )}
    </div>
  );
}

