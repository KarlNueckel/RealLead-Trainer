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

function SummaryWrapper() {
  const location = useLocation();
  const navigate = useNavigate();
  const { transcript, duration, scenario, difficulty, persona } = location.state || {};

  console.log('📍 SummaryWrapper - location.state:', location.state);
  console.log('📊 Transcript:', transcript, 'type:', typeof transcript, 'is array:', Array.isArray(transcript));
  console.log('⏱️ Duration:', duration, 'type:', typeof duration);

  // Check for undefined/null specifically, not falsy values (0 is a valid duration)
  if (!transcript || duration === undefined || duration === null) {
    console.log('❌ Missing transcript or duration - redirecting to home');
    console.log('   Transcript:', transcript, 'Duration:', duration);
    
    // Use useEffect to prevent navigation during render
    setTimeout(() => navigate("/"), 0);
    return <div>Redirecting...</div>;
  }
  
  console.log('✅ SummaryWrapper has valid data, rendering SessionSummaryPage');

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
