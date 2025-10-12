interface GradeDisplayProps {
  score: number;
  grade: string;
  breakdown?: {
    opening: number;
    value: number;
    objections: number;
    questions: number;
    closing: number;
  };
}

export function GradeDisplay({ score, grade, breakdown }: GradeDisplayProps) {
  // Determine color scheme based on score
  const getColorClass = (score: number) => {
    if (score >= 95) return { bg: "from-emerald-500 to-green-600", text: "text-emerald-600", ring: "ring-emerald-500" };
    if (score >= 90) return { bg: "from-green-500 to-emerald-600", text: "text-green-600", ring: "ring-green-500" };
    if (score >= 80) return { bg: "from-blue-500 to-cyan-600", text: "text-blue-600", ring: "ring-blue-500" };
    if (score >= 70) return { bg: "from-cyan-500 to-blue-500", text: "text-cyan-600", ring: "ring-cyan-500" };
    if (score >= 60) return { bg: "from-yellow-500 to-orange-500", text: "text-yellow-600", ring: "ring-yellow-500" };
    return { bg: "from-orange-500 to-red-600", text: "text-red-600", ring: "ring-red-500" };
  };

  const colors = getColorClass(score);

  // Calculate percentage for circular progress
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 border-2 border-gray-200">
      <div className="flex items-center gap-8">
        {/* Circular Grade Display */}
        <div className="relative flex items-center justify-center">
          <svg className="transform -rotate-90" width="180" height="180">
            {/* Background circle */}
            <circle
              cx="90"
              cy="90"
              r="70"
              stroke="#E5E7EB"
              strokeWidth="12"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="90"
              cy="90"
              r="70"
              stroke="url(#gradient)"
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className={`${colors.bg.split(' ')[0].replace('from-', '')}`} stopColor={score >= 90 ? "#10b981" : score >= 70 ? "#3b82f6" : "#f59e0b"} />
                <stop offset="100%" className={`${colors.bg.split(' ')[1].replace('to-', '')}`} stopColor={score >= 90 ? "#059669" : score >= 70 ? "#2563eb" : "#ea580c"} />
              </linearGradient>
            </defs>
          </svg>
          {/* Score in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-5xl font-extrabold ${colors.text}`}>
              {score}
            </div>
            <div className="text-xl font-bold text-gray-600 mt-1">
              / 100
            </div>
          </div>
        </div>

        {/* Grade Letter and Description */}
        <div className="flex-1">
          <div className="flex items-baseline gap-4 mb-4">
            <div className={`text-6xl font-black ${colors.text}`}>
              {grade}
            </div>
            <div className="text-2xl font-semibold text-gray-700">
              {score >= 95 ? "Perfect!" : score >= 90 ? "Excellent!" : score >= 80 ? "Great!" : score >= 70 ? "Good!" : score >= 60 ? "Decent" : "Needs Work"}
            </div>
          </div>
          <div className="text-gray-600 leading-relaxed">
            {score >= 95 && "Outstanding performance! You've mastered the fundamentals and delivered a near-perfect call."}
            {score >= 90 && score < 95 && "Excellent work! Your technique is strong and your rapport-building is impressive."}
            {score >= 80 && score < 90 && "Great job! You demonstrated solid skills with minor areas for improvement."}
            {score >= 70 && score < 80 && "Good performance! You're on the right track with room to refine your approach."}
            {score >= 60 && score < 70 && "Decent effort! Focus on key areas to strengthen your pitch and objection handling."}
            {score < 60 && "Keep practicing! Review the feedback below to improve your technique."}
          </div>
        </div>
      </div>

      {/* Breakdown Bars */}
      {breakdown && (
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Performance Breakdown</h4>
          <div className="space-y-3">
            {[
              { label: "Opening & Rapport", value: breakdown.opening, max: 20 },
              { label: "Value Proposition", value: breakdown.value, max: 20 },
              { label: "Handling Objections", value: breakdown.objections, max: 20 },
              { label: "Question Quality", value: breakdown.questions, max: 20 },
              { label: "Closing & Next Steps", value: breakdown.closing, max: 20 },
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{item.label}</span>
                  <span className="font-bold text-gray-900">{item.value}/{item.max}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${colors.bg} transition-all duration-700 ease-out`}
                    style={{ width: `${(item.value / item.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

