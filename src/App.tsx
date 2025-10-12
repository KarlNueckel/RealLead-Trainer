import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { LandingPage } from "./components/LandingPage";
import CallScenarios from "./pages/CallScenarios";
import ChooseAILead from "./pages/ChooseAILead";
import PickScript from "./pages/PickScript";
import { CallSimulationPage } from "./components/CallSimulationPage";
import { SessionSummaryPage } from "./components/SessionSummaryPage";

function ConversationWrapper() {
  const location = useLocation();
  const navigate = useNavigate();
  const { config } = location.state || {};

  if (!config) {
    // Redirect back if no config
    navigate("/call-scenarios");
    return <div>Redirecting...</div>;
  }

  return (
    <CallSimulationPage 
      config={config}
      onEndCall={(transcript, duration) => {
        navigate("/summary", { 
          state: { 
            transcript, 
            duration,
            scenario: config.scenario,
            difficulty: config.difficulty,
            persona: config.persona?.displayName
          } 
        });
      }}
    />
  );
}

function SummaryWrapper() {
  const location = useLocation();
  const navigate = useNavigate();
  const { transcript, duration, scenario, difficulty, persona } = location.state || {};

  if (!transcript || !duration) {
    navigate("/");
    return <div>Redirecting...</div>;
  }

  return (
    <SessionSummaryPage 
      transcript={transcript}
      duration={duration}
      scenario={scenario}
      difficulty={difficulty}
      persona={persona}
      onBackToHome={() => navigate("/")}
      onNewSession={() => navigate("/call-scenarios")}
    />
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/call-scenarios" element={<CallScenarios />} />
        <Route path="/choose-ai-lead" element={<ChooseAILead />} />
        <Route path="/pick-script" element={<PickScript />} />
        <Route path="/conversation" element={<ConversationWrapper />} />
        <Route path="/summary" element={<SummaryWrapper />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
