export function ProgressTracker({ currentStep }: { currentStep: string }) {
  const steps = ["Call Scenarios", "AI Lead", "Script", "Conversation"];

  return (
    <div className="flex justify-center items-center mb-8">
      <div className="flex space-x-4 text-sm font-medium">
        {steps.map((step, i) => {
          const active = step === currentStep;
          return (
            <div key={step} className="flex items-center">
              <div
                className={`w-3 h-3 rounded-full mr-2 ${
                  active ? "bg-blue-500" : "bg-gray-300"
                }`}
              ></div>
              <span className={active ? "text-blue-600" : "text-gray-500"}>
                {step}
              </span>
              {i < steps.length - 1 && (
                <span className="mx-2 text-gray-400">──</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

