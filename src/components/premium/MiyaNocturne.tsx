import React, { useId } from 'react';
import type { AvatarConfig, RigParams } from '../../types';
import { miyaFrame } from './miyaMotion';
import { DeformableLayer } from './DeformableLayer';

const ART = '/models/miya-nocturne/portrait.png';
const HAIR = '/models/miya-nocturne/head-hair.png';
const BODY = '/models/miya-nocturne/body.png';

interface MiyaNocturneProps {
  config: AvatarConfig;
  rig: RigParams;
  svgRef?: React.Ref<SVGSVGElement>;
  transparent?: boolean;
  onScreenBuster?: boolean;
}

/** Original painted parts with a dedicated 2D puppet rig in illustration coordinates. */
export function MiyaNocturne({ config, rig, svgRef, transparent = false, onScreenBuster = false }: MiyaNocturneProps) {
  const prefix = `miya-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const id = (name: string) => `${prefix}-${name}`;
  const ref = (name: string) => `url(#${id(name)})`;
  const frame = miyaFrame(config, rig);
  const emotion = frame.emotion;
  const framing = config.modelFraming ?? 'portrait';
  const viewBox =
    framing === 'full' ? '-280 -48 1584 1584' : framing === 'halfbody' ? '0 -36 1024 1024' : '154 -28 716 716';
  const source = <use href={`#${id('portrait-art')}`} />;
  const hearts = emotion === 'love';
  const stars = emotion === 'starry';
  return (
    <div className={`premium-avatar relative w-full aspect-square ${transparent ? '' : 'rounded-2xl'}`}>
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 400 400"
        className="w-full h-full select-none"
        role="img"
        aria-label={`${config.name || 'Miya Nocturne'} illustrated avatar`}
        data-model="miya-nocturne"
      >
        <defs>
          <image id={id('portrait-art')} href={ART} width="1024" height="1536" />
          <image id={id('hair-art')} href={HAIR} x="85.333" y="0" width="853.333" height="1280" />
          <image id={id('body-art')} href={BODY} x="0" y="60" width="1024" height="1536" />
          <clipPath id={id('head-core')}>
            <path d="M0 -30H1024V418H0Z" />
          </clipPath>
          <clipPath id={id('neck')}>
            <rect x="442" y="375" width="145" height="120" />
          </clipPath>
          <clipPath id={id('hair-left')}>
            <path d="M0 405H445V1430H0Z" />
          </clipPath>
          <clipPath id={id('hair-right')}>
            <path d="M589 405H1024V1430H589Z" />
          </clipPath>
          <clipPath id={id('eye-left')}>
            <path d="M405 251Q437 244 472 257L485 289Q450 309 416 296Z" />
          </clipPath>
          <clipPath id={id('eye-right')}>
            <path d="M539 252Q572 237 615 243L619 287Q578 302 543 291Z" />
          </clipPath>
          <clipPath id={id('brow-left')}>
            <path d="M413 230Q440 222 472 235L471 242Q440 232 414 237Z" />
          </clipPath>
          <clipPath id={id('brow-right')}>
            <path d="M541 230Q566 220 598 228L602 234Q570 228 543 236Z" />
          </clipPath>
          <clipPath id={id('mouth-neutral')}>
            <ellipse cx="516" cy="357" rx="31" ry="13" />
          </clipPath>
          <clipPath id={id('mouth')}>
            <path data-miya-node="mouth-shape" d={frame.mouthPath} />
          </clipPath>
          <radialGradient id={id('flush')}>
            <stop stopColor="#f5749d" stopOpacity=".8" />
            <stop offset="1" stopColor="#f5749d" stopOpacity="0" />
          </radialGradient>
          <filter id={id('blend-feature')} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
          <mask id={id('left-eye-blend')} maskUnits="userSpaceOnUse" x="399" y="241" width="90" height="67">
            <ellipse cx="446" cy="275" rx="39" ry="25" fill="white" filter={ref('blend-feature')} />
          </mask>
          <mask id={id('right-eye-blend')} maskUnits="userSpaceOnUse" x="531" y="235" width="93" height="68">
            <ellipse cx="578" cy="270" rx="40" ry="26" fill="white" filter={ref('blend-feature')} />
          </mask>
          <mask id={id('mouth-blend')} maskUnits="userSpaceOnUse" x="480" y="337" width="75" height="39">
            <ellipse cx="516" cy="357" rx="28" ry="9" fill="white" filter={ref('blend-feature')} />
          </mask>
          <linearGradient id={id('mouth-shade')} x2=".25" y2="1">
            <stop stopColor="#472231" />
            <stop offset="1" stopColor="#b55265" />
          </linearGradient>
          <linearGradient id={id('tear')} x2="1" y2="1">
            <stop stopColor="#b9f4ff" stopOpacity=".8" />
            <stop offset=".6" stopColor="#82c9e1" stopOpacity=".45" />
            <stop offset="1" stopColor="#eaffff" stopOpacity=".9" />
          </linearGradient>
          <filter id={id('aura')} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#b8a0ff" floodOpacity=".45" />
          </filter>
        </defs>
        {!transparent && (
          <rect
            data-avatar-background="true"
            width="400"
            height="400"
            fill={config.backgroundStyle === 'green-screen' ? '#00ff00' : '#171724'}
          />
        )}
        <svg x="0" y="0" width="400" height="400" viewBox={viewBox} overflow="hidden">
          <g data-miya-node="body" transform={frame.body} filter={config.modelGlow ? ref('aura') : undefined}>
            <g data-miya-node="neck" transform={frame.head} clipPath={ref('neck')}>
              <DeformableLayer part="neck" sourceId={id('hair-art')} prefix={prefix} pose={frame.pose} />
            </g>
            <DeformableLayer part="body" sourceId={id('body-art')} prefix={prefix} pose={frame.pose} />
            <g data-miya-node="head" transform={frame.head}>
              <g data-miya-node="hair-left" transform={frame.hairLeft}>
                <DeformableLayer part="hair-left" sourceId={id('hair-art')} prefix={prefix} pose={frame.pose} />
              </g>
              <g data-miya-node="hair-right" transform={frame.hairRight}>
                <DeformableLayer part="hair-right" sourceId={id('hair-art')} prefix={prefix} pose={frame.pose} />
              </g>
              <DeformableLayer part="head" sourceId={id('hair-art')} prefix={prefix} pose={frame.pose} />
              <g data-miya-node="gaze" transform={frame.gaze}>
                <g
                  data-miya-node="eye-left"
                  transform={frame.eyeLeft}
                  opacity={frame.eyeLeftOpacity}
                  clipPath={ref('eye-left')}
                  mask={ref('left-eye-blend')}
                >
                  {source}
                </g>
                <g
                  data-miya-node="eye-right"
                  transform={frame.eyeRight}
                  opacity={frame.eyeRightOpacity}
                  clipPath={ref('eye-right')}
                  mask={ref('right-eye-blend')}
                >
                  {source}
                </g>
                <path
                  data-miya-node="lid-left"
                  transform={frame.featureLeft}
                  d={frame.lidLeft}
                  opacity={frame.lidLeftOpacity}
                  fill="none"
                  stroke="#4e3e55"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <path
                  data-miya-node="lid-right"
                  transform={frame.featureRight}
                  d={frame.lidRight}
                  opacity={frame.lidRightOpacity}
                  fill="none"
                  stroke="#4e3e55"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </g>
              <g data-miya-node="brow-left" transform={frame.browLeft} clipPath={ref('brow-left')}>
                {source}
              </g>
              <g data-miya-node="brow-right" transform={frame.browRight} clipPath={ref('brow-right')}>
                {source}
              </g>
              <g data-miya-node="blush" opacity={frame.blush} transform={frame.featureBlush}>
                <ellipse cx="431" cy="318" rx="37" ry="24" fill={ref('flush')} />
                <ellipse cx="596" cy="316" rx="34" ry="23" fill={ref('flush')} />
              </g>
              <g
                data-miya-node="mouth-neutral"
                transform={frame.featureMouth}
                opacity={Math.max(0, 1 - frame.mouth * 8)}
              >
                <g
                  data-miya-node="mouth-painted"
                  opacity={frame.smile >= -0.2 && frame.smile <= 0.5 ? 1 : 0}
                  clipPath={ref('mouth-neutral')}
                  mask={ref('mouth-blend')}
                >
                  {source}
                </g>
                <path
                  data-miya-node="mouth-line"
                  d={frame.mouthLine}
                  opacity={frame.smile >= -0.2 && frame.smile <= 0.5 ? 0 : 1}
                  fill="none"
                  stroke="#9b5158"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </g>
              <g data-miya-node="mouth-open" transform={frame.featureMouth} opacity={Math.min(1, frame.mouth * 6)}>
                <path
                  data-miya-node="mouth-opening"
                  d={frame.mouthPath}
                  fill={ref('mouth-shade')}
                  stroke="#a86c73"
                  strokeWidth="1.2"
                />
                <g clipPath={ref('mouth')}>
                  <path d="M489 353Q516 357 543 351L541 364Q516 368 491 362Z" fill="#fff2ed" />
                  <ellipse cx="517" cy="383" rx="18" ry="12" fill="#e98da2" />
                  <path d="M506 377Q517 374 529 378" fill="none" stroke="#f8b5bf" strokeWidth="1.5" />
                </g>
                <path
                  data-miya-node="mouth-highlight"
                  d={frame.mouthHighlight}
                  fill="none"
                  stroke="#fff1e9"
                  strokeWidth="1"
                  opacity=".5"
                />
              </g>
              <g
                data-miya-node="emotion-love"
                transform={frame.featureEyes}
                opacity={hearts ? frame.expressionStrength : 0}
              >
                {[448, 574].map((x, index) => (
                  <g key={x} transform={`translate(${x} ${index ? 274 : 280})`}>
                    <path
                      d="M0 8C-18 -2 -8 -15 0 -6C8 -15 18 -2 0 8"
                      fill="#e989b4"
                      stroke="#f9d9ed"
                      strokeWidth="1"
                      opacity=".8"
                    />
                  </g>
                ))}
              </g>
              <g
                data-miya-node="emotion-starry"
                transform={frame.featureEyes}
                opacity={stars ? frame.expressionStrength : 0}
              >
                {[448, 574].map((x, index) => (
                  <path
                    key={x}
                    transform={`translate(${x} ${index ? 274 : 280})`}
                    d="M0 -13L3 -3 13 0 3 3 0 13 -3 3 -13 0 -3 -3Z"
                    fill="#fff3b9"
                    opacity=".9"
                  />
                ))}
              </g>
              <g
                data-miya-node="emotion-cry"
                transform={frame.featureEyes}
                opacity={emotion === 'cry' ? frame.expressionStrength : 0}
              >
                <path d="M418 292Q415 309 416 331Q422 345 426 331L425 295Z" fill={ref('tear')} />
                <path d="M602 288Q607 309 603 329Q598 340 594 327L596 290Z" fill={ref('tear')} />
                <path
                  d="M419 302L419 324M600 299L601 322"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity=".8"
                />
              </g>
              <g
                data-miya-node="emotion-dizzy"
                transform={frame.featureEyes}
                fill="none"
                stroke="#91b7c7"
                strokeWidth="2.4"
                opacity={emotion === 'dizzy' ? 0.85 * frame.expressionStrength : 0}
              >
                {[448, 574].map((x, index) => (
                  <path
                    key={x}
                    transform={`translate(${x} ${index ? 274 : 280})`}
                    d="M0 0c9 -7 11 8 0 8c-17 0 -17 -22 0 -22c25 0 25 34 0 34"
                  />
                ))}
              </g>
            </g>
          </g>
          {onScreenBuster && (
            <g fill="none" stroke="#55ffd5" strokeWidth="1" opacity=".7">
              <rect x="85" y="0" width="854" height="1280" />
              <circle cx="512" cy="418" r="8" />
              <circle cx="449" cy="279" r="25" />
              <circle cx="577" cy="273" r="25" />
              <circle cx="516" cy="357" r="30" />
            </g>
          )}
        </svg>
      </svg>
    </div>
  );
}
