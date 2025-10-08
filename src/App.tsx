import { useState } from "react";
import { LandingPage } from "./components/LandingPage";
import { ConfigurationPage, CallConfig } from "./components/ConfigurationPage";
import { CallSimulationPage, TranscriptEntry } from "./components/CallSimulationPage";
import { SessionSummaryPage } from "./components/SessionSummaryPage";

type Screen = "landing" | "configuration" | "simulation" | "summary";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("landing");
  const [callConfig, setCallConfig] = useState<CallConfig | null>(null);
  const [sessionData, setSessionData] = useState<{
    transcript: TranscriptEntry[];
    duration: number;
  } | null>(null);

  const handleStart = () => {
    setCurrentScreen("configuration");
  };

  const handleBackToLanding = () => {
    setCurrentScreen("landing");
    setCallConfig(null);
    setSessionData(null);
  };

  const handleStartCall = (config: CallConfig) => {
    setCallConfig(config);
    setCurrentScreen("simulation");
  };

  const handleEndCall = (transcript: TranscriptEntry[], duration: number) => {
    setSessionData({ transcript, duration });
    setCurrentScreen("summary");
  };

  const handleNewSession = () => {
    setSessionData(null);
    setCurrentScreen("configuration");
  };

  return (
    <div className="size-full">
      {currentScreen === "landing" && (
        <LandingPage onStart={handleStart} />
      )}
      
      {currentScreen === "configuration" && (
        <ConfigurationPage 
          onBack={handleBackToLanding}
          onStartCall={handleStartCall}
        />
      )}
      
      {currentScreen === "simulation" && callConfig && (
        <CallSimulationPage 
          config={callConfig}
          onEndCall={handleEndCall}
        />
      )}
      
      {currentScreen === "summary" && sessionData && (
        <SessionSummaryPage 
          transcript={sessionData.transcript}
          duration={sessionData.duration}
          onBackToHome={handleBackToLanding}
          onNewSession={handleNewSession}
        />
      )}
    </div>
  );
}

