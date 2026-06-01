import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';
import { useI18n } from '../i18n';
import { nextOnboardingStep, ONBOARDING_STEP_COUNT, previousOnboardingStep } from '../lib/onboarding';
import { useTheme } from '../theme/ThemeContext';
import { SidebarTab } from '../types';

interface OnboardingTourProps {
  open: boolean;
  onClose: () => void;
  onSelectTab: (tab: SidebarTab) => void;
}

const STEP_TABS: SidebarTab[] = ['presets', 'rigging', 'face', 'obs'];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ open, onClose, onSelectTab }) => {
  const { t } = useI18n();
  const { theme } = useTheme();
  const [step, setStep] = useState(0);
  const dialogRef = useRef<HTMLElement | null>(null);
  const primaryButtonRef = useRef<HTMLButtonElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const current = t.onboarding.steps[step];
  const isLastStep = step === ONBOARDING_STEP_COUNT - 1;
  const closeTour = useCallback(() => {
    setStep(0);
    onClose();
  }, [onClose]);
  const goToStep = (nextStep: number) => {
    setStep(nextStep);
    onSelectTab(STEP_TABS[nextStep]);
  };

  useEffect(() => {
    if (!open) return;

    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeTour();
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      returnFocusRef.current?.focus();
    };
  }, [closeTour, open]);

  useEffect(() => {
    if (!open) return;
    primaryButtonRef.current?.focus();
  }, [open, step]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <section
        ref={dialogRef}
        className={`w-full max-w-lg rounded-xl border p-6 shadow-2xl ${
          theme === 'dark' ? 'border-white/15 bg-[#121217] text-white' : 'border-slate-200 bg-white text-slate-900'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-description"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-400">
              {t.onboarding.progress
                .replace('{current}', String(step + 1))
                .replace('{total}', String(ONBOARDING_STEP_COUNT))}
            </span>
            <h2 id="onboarding-title" className="mt-2 flex items-center gap-2 text-xl font-bold">
              <Sparkles className="h-5 w-5 text-indigo-500" aria-hidden="true" />
              {current.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeTour}
            className="rounded-sm p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-current"
            aria-label={t.onboarding.skip}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <p id="onboarding-description" className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-white/65">
          {current.body}
        </p>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={closeTour}
            className="rounded-sm px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-white/70 transition hover:text-current"
          >
            {t.onboarding.skip}
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => goToStep(previousOnboardingStep(step))}
                className={`flex items-center gap-1 rounded-sm border px-3 py-2 text-xs font-bold uppercase tracking-wider transition ${
                  theme === 'dark'
                    ? 'border-white/15 bg-white/5 hover:bg-white/10'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                {t.onboarding.back}
              </button>
            )}
            <button
              ref={primaryButtonRef}
              type="button"
              onClick={() => {
                if (isLastStep) closeTour();
                else goToStep(nextOnboardingStep(step));
              }}
              className="flex items-center gap-1 rounded-sm bg-indigo-600 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-indigo-500"
            >
              {isLastStep ? t.onboarding.finish : t.onboarding.next}
              {!isLastStep && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
