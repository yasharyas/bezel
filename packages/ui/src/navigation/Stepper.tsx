import React from 'react';

type Step = {
  id: string;
  title: string;
};

type StepperProps = {
  steps: Step[];
  currentStepIndex: number;
  completedStepIds: Set<string>;
};

export function Stepper({ steps, currentStepIndex, completedStepIds }: StepperProps) {
  const totalSteps = steps.length;
  const currentStep = currentStepIndex + 1;

  return (
    <div className="w-full">
      {/* Mobile: progress bar */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-neutral-500">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-xs font-semibold text-indigo-600">
            {steps[currentStepIndex]?.title}
          </span>
        </div>
        <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          {steps.map((step, i) => {
            const isCompleted = completedStepIds.has(step.id);
            const isCurrent = i === currentStepIndex;
            return (
              <div
                key={step.id}
                className={[
                  'w-2 h-2 rounded-full transition-all duration-300',
                  isCompleted ? 'bg-green-500' : isCurrent ? 'bg-indigo-500 scale-125' : 'bg-neutral-300',
                ].join(' ')}
              />
            );
          })}
        </div>
      </div>

      {/* Desktop: labelled step indicators */}
      <div className="hidden sm:block w-full pb-2">
        <div className="flex items-start w-full px-4">
          {steps.map((step, index) => {
            const isCompleted = completedStepIds.has(step.id);
            const isCurrent = index === currentStepIndex;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center flex-shrink-0 w-16">
                  <div
                    className={[
                      'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300',
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                          ? 'bg-indigo-500 text-white shadow-[0_0_0_3px_rgba(99,102,241,0.3)]'
                          : 'bg-neutral-200 text-neutral-500',
                    ].join(' ')}
                  >
                    {isCompleted ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={[
                      'text-xs text-center w-full leading-tight mt-1.5',
                      isCurrent ? 'text-indigo-600 font-semibold' : isCompleted ? 'text-green-600 font-medium' : 'text-neutral-400',
                    ].join(' ')}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={[
                      'flex-1 h-0.5 mt-[18px] transition-all duration-300',
                      isCompleted ? 'bg-green-500' : 'bg-neutral-200',
                    ].join(' ')}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
