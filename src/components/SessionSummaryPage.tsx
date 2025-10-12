import { TranscriptEntry } from "./CallSimulationPage";
import { GradeDisplay } from "./GradeDisplay";
import { useState, useEffect } from "react";

interface SessionSummaryPageProps {
  transcript: TranscriptEntry[];
  duration: number;
  scenario?: string;
  difficulty?: string;
  persona?: string;
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

  useEffect(() => {
    // Call the scoring API
    const evaluateCall = async () => {
      try {
        setIsEvaluating(true);
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
        } else {
          console.error('Failed to evaluate call');
          // Provide a default score if API fails
          setEvaluation({
            score: 75,
            grade: "C+",
            strengths: ["Completed the call", "Maintained conversation"],
            improvements: ["Evaluation unavailable"],
            breakdown: { opening: 15, value: 15, objections: 15, questions: 15, closing: 15 },
            summary: "Call completed successfully. Evaluation service temporarily unavailable."
          });
        }
      } catch (error) {
        console.error('Error evaluating call:', error);
        // Provide a default score if API fails
        setEvaluation({
          score: 75,
          grade: "C+",
          strengths: ["Completed the call"],
          improvements: ["Evaluation unavailable"],
          breakdown: { opening: 15, value: 15, objections: 15, questions: 15, closing: 15 },
          summary: "Call completed successfully."
        });
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
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-10 border border-gray-200/50">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-8 tracking-tight">
            🎉 Session Complete
          </h2>

          {/* Grade Display */}
          {isEvaluating ? (
            <div className="bg-white rounded-2xl shadow-2xl p-12 mb-8 border-2 border-gray-200">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-lg text-gray-600 font-medium">Evaluating your performance...</p>
              </div>
            </div>
          ) : evaluation ? (
            <>
              <GradeDisplay 
                score={evaluation.score} 
                grade={evaluation.grade}
                breakdown={evaluation.breakdown}
              />

              {/* Summary */}
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-bold text-blue-900 mb-2">Overall Assessment</h3>
                <p className="text-blue-800 leading-relaxed">{evaluation.summary}</p>
              </div>

              {/* Strengths and Improvements */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                    <span>✅</span> Strengths
                  </h3>
                  <ul className="space-y-2">
                    {evaluation.strengths.map((strength, idx) => (
                      <li key={idx} className="text-green-800 flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                  <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                    <span>💡</span> Areas to Improve
                  </h3>
                  <ul className="space-y-2">
                    {evaluation.improvements.map((improvement, idx) => (
                      <li key={idx} className="text-amber-800 flex items-start gap-2">
                        <span className="text-amber-600 mt-1">•</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          ) : null}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mb-10">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl border border-blue-200/50 shadow-lg">
              <div className="text-sm text-blue-700 font-bold mb-2 uppercase tracking-wide">
                Duration
              </div>
              <div className="text-4xl font-extrabold bg-gradient-to-br from-blue-600 to-blue-700 bg-clip-text text-transparent">
                {formatTime(duration)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-xl border border-green-200/50 shadow-lg">
              <div className="text-sm text-green-700 font-bold mb-2 uppercase tracking-wide">
                Your Messages
              </div>
              <div className="text-4xl font-extrabold bg-gradient-to-br from-green-600 to-green-700 bg-clip-text text-transparent">
                {userMessages.length}
              </div>
            </div>

            <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-8 rounded-xl border border-violet-200/50 shadow-lg">
              <div className="text-sm text-violet-700 font-bold mb-2 uppercase tracking-wide">
                AI Responses
              </div>
              <div className="text-4xl font-extrabold bg-gradient-to-br from-violet-600 to-violet-700 bg-clip-text text-transparent">
                {aiMessages.length}
              </div>
            </div>
          </div>

          {/* Transcript */}
          <div className="mb-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-5 flex items-center gap-2">
              <span>💬</span>
              Call Transcript
            </h3>
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-8 space-y-5 max-h-[32rem] overflow-y-auto border border-gray-200/50 shadow-inner">
              {transcript.map((entry, idx) => (
                <div key={idx} className={`border-l-4 pl-6 py-3 rounded-r-lg transition-all hover:bg-white/60 ${
                  entry.speaker === "user" ? "border-blue-500 bg-blue-50/30" : "border-violet-500 bg-violet-50/30"
                }`}>
                  <div className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <span>{entry.speaker === "user" ? "🎙️" : "🤖"}</span>
                    <span>{entry.speaker === "user" ? "You" : "AI Prospect"}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600 font-mono text-xs">{formatTime(entry.timestamp)}</span>
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
              ← Back to Home
            </button>
            <button
              onClick={onNewSession}
              className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
            >
              Start New Session →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
