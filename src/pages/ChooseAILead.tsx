import { ProgressStepper } from "../components/ProgressStepper";
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
  const isReferral = String(scenario).toLowerCase().includes("seller lead - referral");
  const allowedIds = isReferral ? ["avery", "morgan", "quinn"] : [];

  return (
    <div className="min-h-screen flex flex-col items-center py-10 bg-gray-50">
      <div className="w-full max-w-5xl px-6 mb-6">
        <button
          onClick={() => navigate("/scenarios")}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Scenarios
        </button>
      </div>
      <ProgressStepper
        steps={[
          { label: "Scenarios", completed: true, active: false },
          { label: "AI Lead", completed: false, active: true },
          { label: "Script", completed: false, active: false },
          { label: "Conversation", completed: false, active: false },
        ]}
      />
      {allowedIds.length === 0 ? (
        <div className="w-full max-w-3xl mt-10 text-center bg-white rounded-2xl border border-gray-200 p-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">AI personas not available</h2>
          <p className="text-gray-600">This scenario does not have AI personas yet. Please choose the Seller Lead - Referral scenario to practice with Avery, Morgan, or Quinn.</p>
          <button
            onClick={() => navigate("/scenarios")}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Scenarios
          </button>
        </div>
      ) : (
        <>
          <PersonaSelection onSelect={setPersona} allowedIds={allowedIds} />
          {persona && (
            <button
              onClick={() => navigate("/pick-script", { state: { scenario, persona } })}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Continue with {persona.displayName}
            </button>
          )}
        </>
      )}
    </div>
  );
}

