/** Small typed wrapper around localStorage that never throws (SSR / blocked storage). */
export function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded / blocked — ignore, persistence is best-effort */
  }
}

export const STORAGE_KEYS = {
  config: 'vstudio_config',
  customPresets: 'vstudio_custom_presets',
  activePresetKey: 'vstudio_active_preset',
  cameraCalibration: 'vstudio_camera_calibration',
  desktopNoticeDismissed: 'vstudio_desktop_notice_dismissed',
  onboardingComplete: 'vstudio_onboarding_complete',
} as const;
