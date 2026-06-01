export const DESKTOP_MIN_WIDTH = 1024;
export const ONBOARDING_STEP_COUNT = 4;

export const isDesktopViewport = (width: number) => width >= DESKTOP_MIN_WIDTH;

export const nextOnboardingStep = (step: number) => Math.min(ONBOARDING_STEP_COUNT - 1, step + 1);

export const previousOnboardingStep = (step: number) => Math.max(0, step - 1);
