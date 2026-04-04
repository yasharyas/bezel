import React from 'react';

type Phase = 'verifying' | 'validating' | 'submitting' | 'complete';

type PhaseConfig = {
  text: string;
  subtitle: string;
};

const DEFAULT_PHASES: Phase[] = ['verifying', 'validating', 'submitting', 'complete'];

const DEFAULT_CONFIG: Record<Phase, PhaseConfig> = {
  verifying:  { text: 'Verifying Details',     subtitle: 'Checking your information...' },
  validating: { text: 'Validating Documents',  subtitle: 'Reviewing uploaded files...' },
  submitting: { text: 'Submitting',            subtitle: 'Saving your submission...' },
  complete:   { text: 'All Done!',             subtitle: 'Your submission was successful.' },
};

type SubmissionLoaderProps = {
  phase: Phase | null;
  phases?: Phase[];
  phaseConfig?: Record<Phase, PhaseConfig>;
};

export function SubmissionLoader({ phase, phases = DEFAULT_PHASES, phaseConfig = DEFAULT_CONFIG }: SubmissionLoaderProps) {
  if (!phase) return null;

  const config = phaseConfig[phase];
  const isComplete = phase === 'complete';
  const currentIndex = phases.indexOf(phase);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 max-w-sm w-full mx-4 text-center">

        {/* Icon */}
        <div className="flex justify-center mb-6">
          {isComplete ? (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
        </div>

        {/* Text */}
        <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-2">{config.text}</h3>
        <p className="text-sm text-neutral-500 mb-6">{config.subtitle}</p>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {phases.map((p, i) => (
            <div
              key={p}
              className={[
                'w-2.5 h-2.5 rounded-full transition-all duration-300',
                i <= currentIndex
                  ? isComplete ? 'bg-green-500' : 'bg-indigo-500'
                  : 'bg-neutral-200',
              ].join(' ')}
            />
          ))}
        </div>
        <p className="text-xs text-neutral-400 mt-3">
          Step {currentIndex + 1} of {phases.length}
        </p>
      </div>
    </div>
  );
}
