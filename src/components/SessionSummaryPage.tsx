import { TranscriptEntry } from "./CallSimulationPage";
import { GradeDisplay } from "./GradeDisplay";
import { useState, useEffect, useMemo } from "react";
import { Persona } from "../config/personas";
import { toast } from "sonner";

interface SessionSummaryPageProps {
  transcript: TranscriptEntry[];
  duration: number;
  scenario?: string;
  difficulty?: string;
  persona?: Persona;
  onBackToHome: () => void;
  onNewSession: () => void;
}

interface Evaluation {
  score: number;
  grade: string;
  strengths: string[];
  improvements: string[];
  breakdown: {
    opening: number;
    value: number;
    objections: number;
    questions: number;
    closing: number;
  };
  summary: string;
}

export function SessionSummaryPage({
  transcript,
  duration,
  scenario,
  difficulty,
  persona,
  onBackToHome,
  onNewSession,
}: SessionSummaryPageProps) {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(true);
  const [nextStepUnlocked, setNextStepUnlocked] = useState<string | null>(null);
  const [stepsState, setStepsState] = useState<Array<{ name: string; status: 'locked' | 'unlocked' | 'completed'; order: number }>>([]);

  // Map of path -> ordered steps for scalability
  const stepFlow = useMemo(() => ({
    "Seller Lead - Referral": ["Initial Call", "Listing Consultation", "Follow-Up"],
  }), []);

  // Derive training path and current step from scenario
  const trainingPath = useMemo(() => {
    const s = String(scenario || "").toLowerCase();
    if (s.includes("seller lead - referral")) return "Seller Lead - Referral";
    return null;
  }, [scenario]);
  const currentTrainingStep = useMemo(() => {
    return trainingPath ? stepFlow[trainingPath]?.[0] || null : null;
  }, [trainingPath, stepFlow]);

  const handleProgression = async (score: number) => {
    const passThreshold = 80;
    if (!trainingPath || !currentTrainingStep) return;
    try {
      const resp = await fetch('/api/training/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: trainingPath, currentStep: currentTrainingStep, score, passThreshold })
      });
      if (!resp.ok) throw new Error('progress update failed');
      const data = await resp.json();
      if (Array.isArray(data?.steps)) {
        const mapped = data.steps.map((s: any) => ({ name: s.name, status: s.status, order: s.order }));
        setStepsState(mapped);
      }
      if (data.status === 'passed') {
        setNextStepUnlocked(data.nextStep || null);
        toast.success(` Congrats! You've passed the ${currentTrainingStep}. ${data.nextStep ? `The next step, ${data.nextStep}, is now unlocked.` : ''}`);
      } else {
        toast.error(' You did not pass this step yet. Review your responses and try again.');
      }
    } catch {
      if (score >= passThreshold) {
        const next = trainingPath ? stepFlow[trainingPath]?.[1] : null;
        setNextStepUnlocked(next || null);
        toast.success(` Congrats! You've passed the ${currentTrainingStep}. ${next ? `The next step, ${next}, is now unlocked.` : ''}`);
      } else {
        toast.error(' You did not pass this step yet. Review your responses and try again.');
      }
    }
  };

  // Fetch current steps on mount for UI state
  useEffect(() => {
    const fetchSteps = async () => {
      if (!trainingPath) return;
      try {
        const r = await fetch(`/api/training/steps?path=${encodeURIComponent(trainingPath)}`);
        if (!r.ok) return;
        const data = await r.json();
        if (Array.isArray(data?.steps)) {
          const mapped = data.steps.map((s: any) => ({ name: s.name, status: s.status, order: s.order }));
          setStepsState(mapped);
        }
      } catch {}
    };
    fetchSteps();
  }, [trainingPath]);

  useEffect(() => {
    // Call the scoring API
    const evaluateCall = async () => {
      try {
        setIsEvaluating(true);
        
        // Check if user actually spoke during the call
        const userMessages = transcript.filter((entry) => entry.speaker === "user");
        
        if (userMessages.length === 0) {
          // User did not say anything - give appropriate grade
          setEvaluation({
            score: 0,
            grade: "F",
            strengths: [],
            improvements: [
              "No participation detected",
              "Speak clearly into your microphone",
              "Ensure microphone permissions are enabled",
              "Try speaking louder if the system isn't detecting your voice"
            ],
            breakdown: { opening: 0, value: 0, objections: 0, questions: 0, closing: 0 },
            summary: "You did not speak during this call. Make sure your microphone is working and try again."
          });
          setIsEvaluating(false);
          return;
        }
        
        const response = await fetch('http://localhost:3001/api/scoring/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript,
            scenario,
            difficulty,
            persona,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setEvaluation(data.evaluation);
          if (typeof data?.evaluation?.score === 'number') {
            handleProgression(data.evaluation.score);
          }
        } else {
          console.error('Failed to evaluate call');
          // Provide a default score if API fails
          const fallback = {
            score: 70,
            grade: "C",
            strengths: ["Completed the call with " + userMessages.length + " message(s)"],
            improvements: ["Evaluation service temporarily unavailable - please try again"],
            breakdown: { opening: 14, value: 14, objections: 14, questions: 14, closing: 14 },
            summary: "Call completed. Unable to provide detailed evaluation at this time."
          } as Evaluation;
          setEvaluation(fallback);
          handleProgression(fallback.score);
        }
      } catch (error) {
        console.error('Error evaluating call:', error);
        
        // Check if user spoke before showing generic error
        const userMessages = transcript.filter((entry) => entry.speaker === "user");
        
        if (userMessages.length === 0) {
          setEvaluation({
            score: 0,
            grade: "F",
            strengths: [],
            improvements: [
              "No participation detected",
              "Ensure your microphone is working",
              "Check browser permissions for microphone access"
            ],
            breakdown: { opening: 0, value: 0, objections: 0, questions: 0, closing: 0 },
            summary: "You did not speak during this call. Please check your microphone settings."
          });
        } else {
          const fallback = {
            score: 70,
            grade: "C",
            strengths: ["Completed the call with " + userMessages.length + " message(s)"],
            improvements: ["Evaluation service unavailable - score based on participation only"],
            breakdown: { opening: 14, value: 14, objections: 14, questions: 14, closing: 14 },
            summary: "Call completed successfully."
          } as Evaluation;
          setEvaluation(fallback);
          handleProgression(fallback.score);
        }
      } finally {
        setIsEvaluating(false);
      }
    };

    evaluateCall();
  }, [transcript, scenario, difficulty, persona]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const userMessages = transcript.filter((entry) => entry.speaker === "user");
  const aiMessages = transcript.filter((entry) => entry.speaker === "ai");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9FAFB] via-[#F3F6FF] to-[#EFF6FF] py-12">
      <div className="max-w-5xl mx-auto px-6">
        <div className="bg-white rounded-[20px] shadow-sm p-8 md:p-10 border border-[#E2E8F0]">
          <h2 className="text-[28px] md:text-[28px] font-semibold text-[#1E293B] mb-6 tracking-tight">
            Session Complete
          </h2>

          {/* Grade Display */}
          {isEvaluating ? (
            <div className="bg-white rounded-[20px] shadow-sm p-10 mb-8 border border-[#E2E8F0]">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-base text-[#64748B] font-medium">Evaluating your performance...</p>
              </div>
            </div>
          ) : evaluation ? (
            <>
              <GradeDisplay 
                score={evaluation.score} 
                grade={evaluation.grade}
                breakdown={evaluation.breakdown}
              />

              {/* Next Step CTA if unlocked */}
              {nextStepUnlocked && (
                <div className="mt-6 mb-8 rounded-[16px] border border-[#BFDBFE] bg-[#DBEAFE] p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[#1E40AF] font-semibold mb-1">Next Step Unlocked</div>
                      <div className="text-[#1E40AF]">{nextStepUnlocked}</div>
                    </div>
                    <button
                      onClick={() => {
                        // Map next step to the correct route
                        const step = String(nextStepUnlocked || '').toLowerCase();
                        let path = '/seller-lead-referral-initial-call';
                        if (step.includes('listing consultation')) path = '/seller-lead-referral-listing-consultation';
                        if (step.includes('contract')) path = '/seller-lead-referral-contract-negotiation';
                        const url = new URL(window.location.origin + path);
                        if (typeof scenario === 'string') url.searchParams.set('path', scenario);
                        window.location.href = url.toString();
                      }}
                      className="px-4 py-2 bg-[#2563EB] text-white rounded-2xl hover:bg-[#1E40AF] transition"
                    >
                      Start {nextStepUnlocked}
                    </button>
                  </div>
                </div>
              )}

              {trainingPath && stepsState.length > 0 && (
                <div className="mt-2 mb-6">
                  <div className="text-sm text-gray-700 mb-2 font-medium">{trainingPath} Progress</div>
                  <div className="flex gap-3 flex-wrap">
                    {stepsState.sort((a,b)=>a.order-b.order).map((s) => {
                      const clickable = (s.status === 'unlocked' || s.status === 'completed');
                      return (
                        <button
                          key={s.name}
                          disabled={!clickable}
                          onClick={() => {
                            if (!clickable) return;
                            const step = String(s.name || '').toLowerCase();
                            let path = '/seller-lead-referral-initial-call';
                            if (step.includes('listing consultation')) path = '/seller-lead-referral-listing-consultation';
                            if (step.includes('contract')) path = '/seller-lead-referral-contract-negotiation';
                            const url = new URL(window.location.origin + path);
                            url.searchParams.set('path', trainingPath);
                            window.location.href = url.toString();
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm border transition ${
                            s.status === 'completed' ? 'bg-green-100 text-[#166534] border-green-200' :
                            s.status === 'unlocked' ? 'bg-blue-100 text-[#1E40AF] border-blue-200 hover:bg-blue-200' :
                            'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          }`}
                        >
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="bg-white rounded-[20px] p-6 mb-8 border border-[#E2E8F0] shadow-sm">
                <h3 className="text-lg font-bold text-[#1E40AF] mb-2">Overall Assessment</h3>
                <p className="text-[#1E40AF] leading-relaxed">{evaluation.summary}</p>
              </div>

              {/* Strengths and Improvements */}
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="rounded-[20px] p-6 border border-[#BBF7D0] bg-[#DCFCE7] shadow-sm">
                  <h3 className="text-[20px] font-semibold text-[#166534] mb-4 flex items-center gap-2">
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {evaluation.strengths.map((strength, idx) => (
                      <li key={idx} className="text-[#166534] flex items-start gap-2">
                        <span className="text-[#166534] mt-1">-</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[20px] p-6 border border-[#FDE68A] bg-[#FEF3C7] shadow-sm">
                  <h3 className="text-[20px] font-semibold text-[#92400E] mb-4 flex items-center gap-2">
                    Areas to Improve
                  </h3>
                  <ul className="space-y-2">
                    {evaluation.improvements.map((improvement, idx) => (
                      <li key={idx} className="text-[#92400E] flex items-start gap-2">
                        <span className="text-[#92400E] mt-1">-</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          ) : null}

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            <div className="bg-white rounded-[20px] p-6 border border-[#BFDBFE] shadow-sm">
              <div className="text-xs text-[#1E40AF] font-semibold mb-2 uppercase tracking-wide">
                Duration
              </div>
              <div className="text-3xl font-semibold text-[#2563EB]">
                {formatTime(duration)}
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-6 border border-[#BBF7D0] shadow-sm">
              <div className="text-xs text-[#166534] font-semibold mb-2 uppercase tracking-wide">
                Your Messages
              </div>
              <div className="text-3xl font-semibold text-[#22C55E]">
                {userMessages.length}
              </div>
            </div>

            <div className="bg-white rounded-[20px] p-6 border border-[#DDD6FE] shadow-sm">
              <div className="text-xs text-[#6D28D9] font-semibold mb-2 uppercase tracking-wide">
                AI Responses
              </div>
              <div className="text-3xl font-semibold text-[#7C3AED]">
                {aiMessages.length}
              </div>
            </div>
          </div>

          {/* Transcript */}
          <div className="mb-10">
            <h3 className="text-[20px] font-semibold text-[#1E293B] mb-4">Call Transcript</h3>
            <div className="bg-[#F1F5F9] rounded-[20px] p-6 space-y-4 max-h-[32rem] overflow-y-auto border border-[#E2E8F0]">
              {transcript.map((entry, idx) => (
                <div key={idx} className={`inline-block max-w-[80%] rounded-2xl px-4 py-3 shadow-sm border ${
                  entry.speaker === "user" ? "bg-[#DBEAFE] border-[#BFDBFE] text-[#1E40AF]" : "bg-white border-[#E2E8F0] text-[#475569]"
                }`}>
                  <div className="text-[12px] font-semibold text-[#64748B] mb-2 flex items-center gap-2">
                    {entry.speaker === "user" ? (
                      <>
                        <span>You</span>
                        <span>You</span>
                      </>
                    ) : (
                      <>
                        {persona?.image && (
                          <img 
                            src={persona.image} 
                            alt={persona.displayName} 
                            className="w-6 h-6 rounded-full object-cover border border-gray-300"
                          />
                        )}
                        <span>{persona?.displayName || "AI Prospect"}</span>
                      </>
                    )}
                    <span className="text-gray-400">·</span>
                    <span className="text-[#64748B] font-mono text-xs">{formatTime(entry.timestamp)}</span>
                  </div>
                  <div className="text-gray-900 leading-relaxed">{entry.message}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-5">
            <button
              onClick={onBackToHome}
              className="flex-1 px-8 py-4 border-2 border-gray-300 text-gray-800 font-bold rounded-xl hover:bg-white hover:border-gray-400 transition-all shadow-sm hover:shadow-md"
            >
              &larr; Back to Home
            </button>
            <button
              onClick={onNewSession}
              className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
            >
              Start New Session &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}







            <h3 className="text-[20px] font-semibold text-[#1E293B] mb-4">Call Transcript</h3>


