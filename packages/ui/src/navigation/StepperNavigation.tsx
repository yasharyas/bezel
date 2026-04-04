import React from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

type StepperNavigationProps = {
  currentStepIndex: number;
  totalSteps: number;
  isLoading?: boolean;
  loadingLabel?: string;
  isLastStep?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  nextLabel?: string;
  previousLabel?: string;
};

export function StepperNavigation({
  currentStepIndex,
  totalSteps,
  isLoading = false,
  loadingLabel,
  isLastStep = false,
  onPrevious,
  onNext,
  onSubmit,
  submitLabel = 'Submit',
  nextLabel = 'Next',
  previousLabel = 'Previous',
}: StepperNavigationProps) {
  const isFirstStep = currentStepIndex === 0;

  return (
    <div className="flex items-center gap-4 pt-6 mt-6 border-t border-neutral-200 w-full">
      {!isFirstStep && (
        <button
          type="button"
          onClick={onPrevious}
          disabled={isLoading}
          className="flex-1 h-9 px-5 rounded-full font-semibold bg-neutral-100 text-neutral-800
                     hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-300
                     transition-all duration-200 disabled:opacity-50
                     inline-flex items-center justify-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          {previousLabel}
        </button>
      )}

      {isLastStep ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading}
          className="flex-1 h-9 px-5 rounded-full font-semibold bg-indigo-500 text-white
                     hover:bg-indigo-600 active:bg-indigo-700
                     focus:outline-none focus:ring-2 focus:ring-indigo-300
                     transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                     inline-flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {loadingLabel ?? 'Submitting...'}
            </>
          ) : (
            <>
              {submitLabel}
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={isLoading}
          className="flex-1 h-9 px-5 rounded-full font-semibold bg-indigo-500 text-white
                     hover:bg-indigo-600 active:bg-indigo-700
                     focus:outline-none focus:ring-2 focus:ring-indigo-300
                     transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                     inline-flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {loadingLabel ?? 'Saving...'}
            </>
          ) : (
            <>
              {nextLabel}
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
