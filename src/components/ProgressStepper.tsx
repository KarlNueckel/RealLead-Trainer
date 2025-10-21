import { Check } from 'lucide-react';

interface Step {
  label: string;
  completed: boolean;
  active: boolean;
}

interface ProgressStepperProps {
  steps: Step[];
}

export function ProgressStepper({ steps }: ProgressStepperProps) {
  return (
    <div className="w-full max-w-2xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between relative">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center flex-1 last:flex-none">
            {/* Step Circle and Label */}
            <div className="flex flex-col items-center gap-3 relative">
              <div
                className={`
                  w-3 h-3 rounded-full transition-all duration-300
                  ${
                    step.completed || step.active
                      ? 'bg-blue-600'
                      : 'bg-gray-300'
                  }
                `}
              />
              <span
                className={`
                  text-sm whitespace-nowrap transition-colors duration-300
                  ${
                    step.active
                      ? 'text-blue-600'
                      : step.completed
                      ? 'text-gray-700'
                      : 'text-gray-400'
                  }
                `}
              >
                {step.label}
              </span>
            </div>

            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-[2px] bg-gray-300 mx-4 relative top-[-18px]">
                <div 
                  className={`h-full transition-all duration-300 ${
                    step.completed ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  style={{ width: step.completed ? '100%' : '0%' }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}