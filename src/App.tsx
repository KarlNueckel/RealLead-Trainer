import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { LandingPage } from "./components/LandingPage";
import CallScenarios from "./pages/CallScenarios";
import ChooseAILead from "./pages/ChooseAILead";
import PickScript from "./pages/PickScript";
import { CallSimulationPage } from "./components/CallSimulationPage";
import AveryPage from "./pages/AveryPage";
import TestVapi from "./TestVapi";
import SummaryWrapper from "./components/SummaryWrapper";
import { Toaster } from "./components/ui/sonner";

function ConversationWrapper() {
  const location = useLocation();
  const navigate = useNavigate();
  const { config } = location.state || {};

  if (!config) {
    // Redirect back if no config
    navigate("/scenarios");
    return <div>Redirecting...</div>;
  }

  return (
    <CallSimulationPage 
      config={config}
      onEndCall={(transcript, duration) => {
        console.log('🚀 onEndCall triggered in App.tsx');
        console.log('📊 Transcript received:', transcript);
        console.log('⏱️ Duration received:', duration);
        console.log('🗂️ Config:', { scenario: config.scenario, difficulty: config.difficulty, persona: config.persona?.displayName });
        
        navigate("/summary", { 
          state: { 
            transcript, 
            duration,
            scenario: config.scenario,
            difficulty: config.difficulty,
            persona: config.persona
          } 
        });
        
        console.log('✅ Navigate called to /summary');
      }}
    />
  );
}

// Summary wrapper moved to src/components/SummaryWrapper.tsx

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/scenarios" element={<CallScenarios />} />
        {/* Legacy route redirect for backward compatibility */}
        <Route path="/choose-ai-lead" element={<Navigate to="/seller-lead-referral-initial-call" replace />} />
        {/* New named routes */}
        <Route path="/seller-lead-referral-initial-call" element={<ChooseAILead />} />
        <Route path="/seller-lead-referral-listing-consultation" element={<ChooseAILead />} />
        <Route path="/seller-lead-referral-contract-negotiation" element={<ChooseAILead />} />
        <Route path="/pick-script" element={<PickScript />} />
        <Route path="/conversation" element={<ConversationWrapper />} />
        <Route path="/summary" element={<SummaryWrapper />} />
        <Route path="/avery" element={<AveryPage />} />
        <Route path="/vapi-debug" element={<TestVapi />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
