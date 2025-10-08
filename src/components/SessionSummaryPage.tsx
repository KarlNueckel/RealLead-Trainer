import { TranscriptEntry } from "./CallSimulationPage";

interface SessionSummaryPageProps {
  transcript: TranscriptEntry[];
  duration: number;
  onBackToHome: () => void;
  onNewSession: () => void;
}

export function SessionSummaryPage({
  transcript,
  duration,
  onBackToHome,
  onNewSession,
}: SessionSummaryPageProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const userMessages = transcript.filter((entry) => entry.speaker === "user");
  const aiMessages = transcript.filter((entry) => entry.speaker === "ai");

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Session Summary
          </h2>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-indigo-50 p-6 rounded-lg">
              <div className="text-sm text-indigo-600 font-semibold mb-1">
                Duration
              </div>
              <div className="text-3xl font-bold text-indigo-900">
                {formatTime(duration)}
              </div>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <div className="text-sm text-green-600 font-semibold mb-1">
                Your Messages
              </div>
              <div className="text-3xl font-bold text-green-900">
                {userMessages.length}
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="text-sm text-blue-600 font-semibold mb-1">
                AI Responses
              </div>
              <div className="text-3xl font-bold text-blue-900">
                {aiMessages.length}
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Call Transcript
            </h3>
            <div className="bg-gray-50 rounded-lg p-6 space-y-4 max-h-96 overflow-y-auto">
              {transcript.map((entry, idx) => (
                <div key={idx} className="border-l-4 border-indigo-600 pl-4">
                  <div className="text-sm font-semibold text-gray-700">
                    {entry.speaker === "user" ? "You" : "AI Prospect"} •{" "}
                    {formatTime(entry.timestamp)}
                  </div>
                  <div className="text-gray-900 mt-1">{entry.message}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onBackToHome}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Home
            </button>
            <button
              onClick={onNewSession}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              New Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

