import { useNavigate } from "react-router-dom";
import { ProgressTracker } from "../components/ProgressTracker";
import { ArrowLeft } from "lucide-react";

export default function CallScenarios() {
  const navigate = useNavigate();

  const handleScenarioSelect = (scenario: string) => {
    navigate("/choose-ai-lead", { state: { scenario } });
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-10 bg-gray-50">
      <div className="w-full max-w-5xl px-6 mb-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>
      <ProgressTracker currentStep="Call Scenarios" />
      <h2 className="text-3xl font-semibold mb-8">Select a Call Scenario</h2>
      <div 
        className="bg-white p-6 rounded-xl shadow-md w-80 hover:shadow-lg transition cursor-pointer"
        onClick={() => handleScenarioSelect("Seller Lead - Initial Call")}
      >
        <h3 className="text-xl font-semibold mb-2">🏠 Seller Lead - Initial Call</h3>
        <p className="text-gray-600 mb-4">
          Practice your first conversation with a homeowner considering selling their property.
        </p>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-md w-full hover:bg-blue-600 transition">
          Select Scenario
        </button>
      </div>
    </div>
  );
}

