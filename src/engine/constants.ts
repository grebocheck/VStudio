/**
 * Centralized tuning constants for the avatar animation engine.
 *
 * Every "magic number" that controls physics, tracking response, emotion
 * thresholds, or procedural motion lives here so the per-frame loop reads as
 * intent rather than arithmetic, and so tuning stays in one auditable place.
 *
 * Values are grouped by concern. Comments describe units/ranges where they are
 * not obvious. MediaPipe blendshape scores are all in the 0..1 range.
 */

/** Breathing: a normalized 0..1 phase that drives chest scale and idle bounce. */
export const BREATHING = {
  /** Phase cycles per second (lower = slower breaths). */
  PHASE_SPEED: 0.9,
} as const;

/** Procedural blink state machine (used outside camera mode). */
export const BLINK = {
  /** Random idle gap before the next blink: BASE + [0, RANDOM) milliseconds. */
  IDLE_BASE_MS: 1500,
  IDLE_RANDOM_MS: 4000,
  /** Eyelid step per frame while closing / opening (eye-open is 0..1). */
  CLOSE_STEP: 0.25,
  OPEN_STEP: 0.22,
} as const;

/** Microphone-driven mouth flap. */
export const MIC = {
  /** Byte-frequency average that maps to a fully open mouth. */
  VOLUME_FULL_OPEN: 45,
  /** Mouth-form baseline + volume gain when speaking (smile-shaped flap). */
  FORM_BASE: 0.5,
  FORM_VOLUME_GAIN: 0.4,
} as const;

/** AFK auto-look: gentle Lissajous idle motion when no input is active. */
export const AUTO_LOOK = {
  YAW_FREQ: 0.6,
  YAW_AMP: 12,
  PITCH_FREQ: 0.4,
  PITCH_AMP: 6,
  ROLL_FREQ: 0.52,
  ROLL_AMP: 5,
  BODY_FREQ: 0.3,
  BODY_AMP: 6,
  PUPIL_X_FREQ: 0.2,
  PUPIL_X_AMP: 0.4,
  PUPIL_Y_FREQ: 0.15,
  PUPIL_Y_AMP: 0.2,
  /** Subtle idle mouth movement frequency / amplitude when mic is off. */
  MOUTH_FREQ: 3,
  MOUTH_AMP: 0.12,
} as const;

/** Mouse-driven head tracking (normalized pointer offset -> rig angles). */
export const MOUSE = {
  YAW: 28,
  PITCH: 16,
  ROLL: -10,
  PUPIL_X: 0.75,
  PUPIL_Y: 0.6,
  BODY_X: 12,
} as const;

/** MediaPipe camera head-pose mapping and follow response. */
export const CAMERA = {
  /** Raw yaw/pitch scale before sensitivity is applied. */
  YAW_SCALE: -110,
  PITCH_SCALE: 90,
  /** Pitch midpoint bias so a neutral face reads as level. */
  PITCH_BIAS: 0.05,
  /** Clamp ranges for the smoothed head angles (degrees). */
  YAW_LIMIT: 30,
  PITCH_LIMIT: 20,
  ROLL_LIMIT: 15,
  /** Pupil offset derived from head angle (angle / limit * factor). */
  PUPIL_X_FACTOR: 0.75,
  PUPIL_Y_FACTOR: 0.55,
  /** Body sway follows head yaw with its own easing. */
  BODY_FOLLOW: 0.45,
  BODY_RESPONSE: 0.12,
} as const;

/** MediaPipe blendshape -> rig expression mapping. */
export const EXPRESSION = {
  /** Eye-blink gain before clamping to 0..1 open. */
  EYE_BLINK_GAIN: 1.15,
  /** Jaw-open gain for mouth open. */
  MOUTH_OPEN_GAIN: 1.3,
  /** Mouth form from smile minus pucker. */
  SMILE_GAIN: 1.5,
  PUCKER_GAIN: 0.8,
  /** Eyebrow up/down gain and clamp range. */
  BROW_UP_GAIN: 4.0,
  BROW_DOWN_GAIN: 4.0,
  BROW_RANGE: 5,
} as const;

/** Spring-mass secondary motion for hair. */
export const HAIR_PHYSICS = {
  /** Inertial impulse from sudden head turns. */
  IMPULSE_X: 0.38,
  IMPULSE_Y: 0.25,
  /** Resting target sway from current head pose. */
  TARGET_X_FROM_YAW: 0.7,
  TARGET_X_FROM_ROLL: 0.6,
  TARGET_Y_FROM_PITCH: 0.35,
  /** Spring stiffness toward the resting target. */
  STIFFNESS_X: 0.16,
  STIFFNESS_Y: 0.2,
  /** Velocity damping per frame (closer to 1 = floatier). */
  DAMPING_X: 0.82,
  DAMPING_Y: 0.79,
  /** Extra sway gain applied to the anime art style. */
  ANIME_GAIN_X: 1.35,
  ANIME_GAIN_Y: 1.25,
} as const;

/** Dizziness: only fast deliberate head shaking accumulates and locks. */
export const DIZZINESS = {
  /** Accumulator decays by elapsed / DECAY_DIVISOR each frame. */
  DECAY_DIVISOR: 30,
  /** Minimum head velocity (deg/frame) that counts as shaking. */
  VELOCITY_THRESHOLD: 4.0,
  /** Velocity-to-accumulator gain and accumulator ceiling. */
  VELOCITY_GAIN: 2.5,
  MAX: 100,
  /** Accumulator level that triggers the dizzy lock. */
  TRIGGER: 60,
  /** How long the dizzy state stays locked once triggered (ms). */
  LOCK_MS: 2500,
  /** Crossed-eyes (looking inward) also reads as dizzy. */
  EYE_LOOK_IN_THRESHOLD: 0.6,
} as const;

/** Drowsiness: slow half-blinks plus downward gaze accumulate to sleepy. */
export const DROWSINESS = {
  DECAY_DIVISOR: 12,
  /** Half-blink window that feeds the accumulator. */
  BLINK_MIN: 0.35,
  BLINK_MAX: 0.9,
  /** Accumulator gain per qualifying frame and ceiling. */
  GAIN: 1.0,
  MAX: 120,
  /** Accumulator + downward gaze required to read as sleepy. */
  TRIGGER: 80,
  EYE_LOOK_DOWN_THRESHOLD: 0.4,
} as const;

/** Pitch compensation so looking up is not misread as an angry brow. */
export const PITCH_COMPENSATION = {
  MAX: 0.35,
  DIVISOR: 35,
} as const;

/** Emotion debounce / hysteresis to stop flicker between frames. */
export const EMOTION_STABILIZATION = {
  /** Per-emotion frame counter ceiling. */
  COUNTER_MAX: 14,
  /** Counts needed to be eligible as the high-confidence winner. */
  CONFIDENCE_THRESHOLD: 7,
  /** Counts that allow an immediate transition (override the dwell time). */
  STRONG_CONFIDENCE: 10,
  /** Counts of "none" required to relax back to neutral. */
  NONE_THRESHOLD: 8,
  /** Minimum dwell time in an expression before a normal transition (ms). */
  MIN_DWELL_MS: 1200,
} as const;

/**
 * Priority-ordered thresholds for the expression classifier. Names mirror the
 * branches in {@link classifyEmotion}; tweak here, not inline.
 */
export const EMOTION_THRESHOLDS = {
  shocked: { jawOpen: 0.15, browInnerUp: 0.3, eyeWideAvg: 0.3 },
  scared: { eyeWideAvg: 0.5, jawOpen: 0.25 },
  cool: { browOuterUpDiff: 0.45, browOuterUpAvg: 0.5 },
  shy: { cheekSquintAvg: 0.45, smileMin: 0.15, smileMax: 0.4, jawOpen: 0.1 },
  relaxed: { smileMin: 0.12, smileMax: 0.35, eyeLookDownAvg: 0.35, browInnerUp: 0.15, angryAvg: 0.15 },
  squint: { blinkAvg: 0.65, cheekSquintAvg: 0.3, smileAvg: 0.3 },
  angry: { adjustedAngryAvg: 0.45, mouthForm: 0.05 },
  smug: { smileAvg: 0.42, blinkAvg: 0.35 },
  happy: { smileAvg: 0.45, starryBrowInnerUp: 0.4 },
  love: { puckerAvg: 0.45 },
  depressed: { browInnerUp: 0.4, mouthForm: -0.15 },
  cry: { mouthForm: -0.3 },
} as const;

/** Avatar SVG frame transform multipliers (see avatarFrame.ts). */
export const FRAME = {
  /** Face / outline translation per head angle. */
  FACE_TRANSLATE_X: 0.6,
  FACE_TRANSLATE_Y: 0.5,
  OUTLINE_TRANSLATE_X: 0.2,
  OUTLINE_TRANSLATE_Y: 0.15,
  /** Retro art-style idle bounce amplitudes. */
  RETRO_BOUNCE_Y: 0.05,
  RETRO_BOUNCE_X: 0.03,
  /** Chest breathing scale gain (retro vs. default). */
  CHEST_BREATH_RETRO: 0.03,
  CHEST_BREATH_DEFAULT: 0.012,
  /** Head stretch from look distance (squash & stretch). */
  HEAD_STRETCH_Y: 0.0016,
  HEAD_STRETCH_X: 0.0008,
  /** Head translation factors. */
  HEAD_BODY_X: 0.6,
  HEAD_PITCH_OFFSET: 0.38,
  /** Floating-accessory follow and rotation factors. */
  ACCESSORY_FOLLOW: 0.72,
  ACCESSORY_SWAY: 0.25,
  ACCESSORY_OUTLINE: 1.15,
  ACCESSORY_ROTATE: 0.08,
  /** Hair sway/rotation transform factors. */
  BACK_HAIR_SWAY_X: 0.15,
  BACK_HAIR_FACE_X: -0.1,
  BACK_HAIR_SWAY_Y: 0.08,
  HAIR_ROTATE: 0.08,
  FRONT_HAIR_SHADOW_OFFSET_X: 1.5,
  FRONT_HAIR_SHADOW_OFFSET_Y: 4,
  /** Debug overlay head circle anchor. */
  DEBUG_HEAD_CX: 200,
  DEBUG_HEAD_CY: 160,
} as const;
