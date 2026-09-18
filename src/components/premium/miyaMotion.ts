import type { AvatarConfig, Emotion, RigParams } from '../../types';
import { deformationFor, featureTransform } from './miyaMesh';
import { applyMiyaMesh } from './DeformableLayer';

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, Number.isFinite(value) ? value : 0));
const fixed = (value: number) => Number(value.toFixed(3));

export function miyaFrame(config: AvatarConfig, rig: RigParams) {
  const pose = deformationFor(config, rig);
  const emotion: Emotion =
    rig.activeEmotion && rig.activeEmotion !== 'none' ? rig.activeEmotion : (config.activeEmotion ?? 'none');
  const breathing = Math.sin(clamp(rig.breath, 0, 1) * Math.PI * 2);
  const yaw = clamp(rig.angleX, -30, 30);
  const pitch = clamp(rig.angleY, -30, 30);
  const roll = clamp(rig.angleZ, -15, 15) * 0.56 * pose.intensity;
  const x = clamp(rig.bodyX, -15, 15) * 0.62 * pose.intensity;
  const headX = yaw * 0.46 * pose.intensity;
  const headY = pitch * 0.21 * pose.intensity;
  const hair = clamp(rig.hairSwayX ?? 0, -18, 18) * 0.022 * pose.intensity;
  let leftEye = clamp(rig.eyeLOpen, 0, 1);
  let rightEye = clamp(rig.eyeROpen, 0, 1);
  let mouth = clamp(rig.mouthOpen, 0, 1);
  let smile = clamp(rig.mouthForm, -1, 1);
  let brow = clamp(rig.eyebrowY, -5, 5) * 0.65;
  const expressionStrength =
    rig.activeEmotion && rig.activeEmotion !== 'none' ? clamp(rig.emotionStrength ?? 1, 0, 1) : 1;
  const base = { leftEye, rightEye, mouth, smile, brow };
  if (emotion === 'happy' || emotion === 'love') {
    smile = 0.9;
    mouth = Math.max(mouth, 0.22);
  }
  if (emotion === 'shocked') {
    mouth = Math.max(mouth, 0.72);
    smile = -0.1;
    brow = -3;
  }
  if (emotion === 'scared') {
    mouth = Math.max(mouth, 0.5);
    smile = -0.8;
    brow = -2;
  }
  if (emotion === 'angry') {
    smile = -0.65;
    brow = 1.5;
    leftEye *= 0.83;
    rightEye *= 0.83;
  }
  if (emotion === 'smug') {
    smile = 0.6;
    leftEye *= 0.75;
    rightEye *= 0.9;
  }
  if (emotion === 'cool') {
    smile = 0.35;
    brow = -0.7;
    leftEye *= 0.78;
    rightEye *= 0.78;
  }
  if (emotion === 'sleepy') {
    leftEye *= 0.28;
    rightEye *= 0.28;
    smile = -0.15;
  }
  if (emotion === 'relaxed') {
    leftEye *= 0.68;
    rightEye *= 0.68;
    smile = 0.25;
    mouth *= 0.4;
  }
  if (emotion === 'squint') {
    leftEye *= 0.12;
    rightEye *= 0.12;
    smile = 0.65;
  }
  if (emotion === 'shy') {
    smile = 0.5;
    mouth *= 0.4;
  }
  if (emotion === 'cry' || emotion === 'depressed') {
    smile = -0.55;
    brow = -1.5;
    leftEye *= 0.7;
    rightEye *= 0.7;
  }
  const blend = (from: number, to: number) => from + (to - from) * expressionStrength;
  leftEye = blend(base.leftEye, leftEye);
  rightEye = blend(base.rightEye, rightEye);
  mouth = blend(base.mouth, mouth);
  smile = blend(base.smile, smile);
  brow = blend(base.brow, brow);
  pose.jaw = mouth;
  const mouthHalfWidth = 25 + Math.min(0, smile) * 9 + Math.max(0, smile) * 3;
  const mouthLeft = fixed(516 - mouthHalfWidth),
    mouthRight = fixed(516 + mouthHalfWidth);
  const eyeTransform = (cx: number, cy: number, openness: number) =>
    `${featureTransform(cx, cy, pose)} translate(${cx} ${cy}) scale(1 ${fixed(Math.max(0.035, openness))}) translate(${-cx} ${-cy})`;
  const smilingLids = emotion === 'happy' || emotion === 'love' || emotion === 'squint';
  return {
    pose,
    emotion,
    expressionStrength,
    mouth,
    smile,
    body: `translate(${fixed(x)} ${fixed(breathing * 2.5)}) rotate(${fixed(pose.body * 0.08)} 512 1050)`,
    head: `translate(${fixed(headX)} ${fixed(headY)}) rotate(${fixed(roll)} 512 418)`,
    hairLeft: `rotate(${fixed(hair + breathing * 0.13)} 382 340)`,
    hairRight: `rotate(${fixed(-hair - breathing * 0.13)} 650 340)`,
    gaze: `translate(${fixed(clamp(rig.pupilX, -1, 1) * 2.2)} ${fixed(clamp(rig.pupilY, -1, 1) * 1.2)})`,
    eyeLeft: eyeTransform(449, 279, leftEye),
    eyeRight: eyeTransform(577, 273, rightEye),
    featureLeft: featureTransform(449, 279, pose),
    featureRight: featureTransform(577, 273, pose),
    featureEyes: featureTransform(512, 277, pose),
    featureMouth: featureTransform(516, 357, pose),
    featureBlush: featureTransform(512, 318, pose),
    eyeLeftOpacity: clamp(leftEye / 0.18, 0, 1),
    eyeRightOpacity: clamp(rightEye / 0.18, 0, 1),
    lidLeft: `M414 278 Q446 ${fixed(smilingLids ? 290 - expressionStrength * 27 : 290)} 478 278 M418 279l-5 -3 M422 281l-6 -1`,
    lidRight: `M544 273 Q577 ${fixed(smilingLids ? 285 - expressionStrength * 27 : 285)} 610 272 M606 274l5 -3 M602 276l6 -1`,
    lidLeftOpacity: clamp((0.22 - leftEye) / 0.22, 0, 1),
    lidRightOpacity: clamp((0.22 - rightEye) / 0.22, 0, 1),
    browLeft: `${featureTransform(447, 235, pose)} translate(0 ${fixed(brow)}) rotate(${fixed((emotion === 'angry' ? 9 : emotion === 'cry' ? -7 : 0) * expressionStrength)} 447 235)`,
    browRight: `${featureTransform(578, 232, pose)} translate(0 ${fixed(brow)}) rotate(${fixed((emotion === 'angry' ? -9 : emotion === 'cry' ? 7 : 0) * expressionStrength)} 578 232)`,
    mouthPath: `M ${mouthLeft} 356 Q 516 ${fixed(354 + smile * 3)} ${mouthRight} 354 Q ${mouthRight} ${fixed(356 + mouth * 38)} 516 ${fixed(358 + mouth * 35)} Q ${mouthLeft} ${fixed(358 + mouth * 33)} ${mouthLeft} 356 Z`,
    mouthLine: `M 492 357 Q 516 ${fixed(357 + smile * 7)} 539 355`,
    mouthHighlight: `M500 ${361 + mouth * 34}Q516 ${365 + mouth * 35} 531 ${360 + mouth * 34}`,
    blush: (emotion === 'shy' ? 0.55 : emotion === 'love' ? 0.35 : emotion === 'angry' ? 0.24 : 0) * expressionStrength,
  };
}

/** Dedicated illustrated rig: never apply the generator's 400px head geometry. */
export function applyMiyaFrame(svg: SVGSVGElement, config: AvatarConfig, rig: RigParams): void {
  const frame = miyaFrame(config, rig);
  const transforms = {
    body: frame.body,
    head: frame.head,
    neck: frame.head,
    'hair-left': frame.hairLeft,
    'hair-right': frame.hairRight,
    gaze: frame.gaze,
    'eye-left': frame.eyeLeft,
    'eye-right': frame.eyeRight,
    'brow-left': frame.browLeft,
    'brow-right': frame.browRight,
    'lid-left': frame.featureLeft,
    'lid-right': frame.featureRight,
    'mouth-neutral': frame.featureMouth,
    'mouth-open': frame.featureMouth,
    blush: frame.featureBlush,
    'emotion-love': frame.featureEyes,
    'emotion-starry': frame.featureEyes,
    'emotion-cry': frame.featureEyes,
    'emotion-dizzy': frame.featureEyes,
  };
  for (const [part, transform] of Object.entries(transforms))
    svg.querySelector(`[data-miya-node="${part}"]`)?.setAttribute('transform', transform);
  svg.querySelector('[data-miya-node="eye-left"]')?.setAttribute('opacity', String(frame.eyeLeftOpacity));
  svg.querySelector('[data-miya-node="eye-right"]')?.setAttribute('opacity', String(frame.eyeRightOpacity));
  svg.querySelector('[data-miya-node="lid-left"]')?.setAttribute('d', frame.lidLeft);
  svg.querySelector('[data-miya-node="lid-right"]')?.setAttribute('d', frame.lidRight);
  svg.querySelector('[data-miya-node="lid-left"]')?.setAttribute('opacity', String(frame.lidLeftOpacity));
  svg.querySelector('[data-miya-node="lid-right"]')?.setAttribute('opacity', String(frame.lidRightOpacity));
  svg.querySelector('[data-miya-node="mouth-opening"]')?.setAttribute('d', frame.mouthPath);
  svg.querySelector('[data-miya-node="mouth-shape"]')?.setAttribute('d', frame.mouthPath);
  svg.querySelector('[data-miya-node="mouth-line"]')?.setAttribute('d', frame.mouthLine);
  svg.querySelector('[data-miya-node="mouth-highlight"]')?.setAttribute('d', frame.mouthHighlight);
  svg.querySelector('[data-miya-node="mouth-open"]')?.setAttribute('opacity', String(Math.min(1, frame.mouth * 6)));
  svg
    .querySelector('[data-miya-node="mouth-neutral"]')
    ?.setAttribute('opacity', String(Math.max(0, 1 - frame.mouth * 8)));
  const paintedMouth = frame.smile >= -0.2 && frame.smile <= 0.5;
  svg.querySelector('[data-miya-node="mouth-painted"]')?.setAttribute('opacity', paintedMouth ? '1' : '0');
  svg.querySelector('[data-miya-node="mouth-line"]')?.setAttribute('opacity', paintedMouth ? '0' : '1');
  svg.querySelector('[data-miya-node="blush"]')?.setAttribute('opacity', String(frame.blush));
  for (const emotion of ['love', 'starry', 'cry', 'dizzy']) {
    svg
      .querySelector(`[data-miya-node="emotion-${emotion}"]`)
      ?.setAttribute(
        'opacity',
        String(frame.emotion === emotion ? frame.expressionStrength * (emotion === 'dizzy' ? 0.85 : 1) : 0),
      );
  }
  applyMiyaMesh(svg, frame.pose);
}
