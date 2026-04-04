import React from 'react';

type ScreenLayoutProps = {
  brandInitials?: string;
  brandName?: string;
  title: string;
  subtitle?: string;
  stepper?: React.ReactNode;
  navigation?: React.ReactNode;
  children: React.ReactNode;
};

export function ScreenLayout({
  brandInitials = 'YB',
  brandName = 'Your Brand Name',
  title,
  subtitle,
  stepper,
  navigation,
  children,
}: ScreenLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
              {brandInitials}
            </div>
            <span className="text-base font-semibold text-neutral-800">{brandName}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 py-6 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {stepper && <div className="mb-6">{stepper}</div>}

          <div className="bg-white rounded-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.12),0_1px_4px_-1px_rgba(0,0,0,0.06)] border border-neutral-200/80 p-5 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-neutral-900 sm:text-2xl">{title}</h2>
              {subtitle && <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>}
            </div>

            {children}

            {navigation && <div>{navigation}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
