import { AvatarConfig, Emotion } from '../types';
import { safeExportFileName } from './avatarExport';

export const TELEGRAM_STICKER_SIZE = 512;
export const TELEGRAM_STICKER_FPS = 60;
export const TELEGRAM_STICKER_DURATION_SECONDS = 3;
export const TELEGRAM_STICKER_MAX_TGS_BYTES = 64 * 1024;

export interface TelegramStickerSpec {
  emotion: Emotion;
  emoji: string;
  label: string;
  slug: string;
}

export const TELEGRAM_STICKER_SPECS: TelegramStickerSpec[] = [
  { emotion: 'happy', emoji: '😊', label: 'Happy', slug: 'happy' },
  { emotion: 'love', emoji: '😍', label: 'Love', slug: 'love' },
  { emotion: 'starry', emoji: '🤩', label: 'Starry', slug: 'starry' },
  { emotion: 'smug', emoji: '😏', label: 'Smug', slug: 'smug' },
  { emotion: 'shocked', emoji: '😮', label: 'Shocked', slug: 'shocked' },
  { emotion: 'angry', emoji: '😠', label: 'Angry', slug: 'angry' },
  { emotion: 'cry', emoji: '😭', label: 'Cry', slug: 'cry' },
  { emotion: 'cool', emoji: '😎', label: 'Cool', slug: 'cool' },
  { emotion: 'dizzy', emoji: '😵', label: 'Dizzy', slug: 'dizzy' },
];

type LottieValue = Record<string, unknown>;

interface ZipEntry {
  name: string;
  data: Uint8Array | string;
}

interface TelegramStickerFile {
  name: string;
  slug: string;
  emoji: string;
  emotion: Emotion;
  sizeBytes: number;
}

export interface TelegramStickerPack {
  fileName: string;
  zipBlob: Blob;
  manifest: {
    name: string;
    format: 'tgs';
    canvas: '512x512';
    fps: 60;
    durationSeconds: 3;
    background: 'transparent';
    maxTgsBytes: number;
    stickers: TelegramStickerFile[];
    note: string;
  };
}

const FRAME_COUNT = TELEGRAM_STICKER_FPS * TELEGRAM_STICKER_DURATION_SECONDS;
const SCALE = TELEGRAM_STICKER_SIZE / 400;
const s = (value: number) => Math.round(value * SCALE * 100) / 100;

const hexToRgba = (hex: string, fallback: string): [number, number, number, number] => {
  const safe = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(hex) ? hex : fallback;
  const raw = safe.slice(1);
  const expanded =
    raw.length === 3
      ? raw
          .split('')
          .map((char) => char + char)
          .join('')
      : raw;
  const alpha = expanded.length === 8 ? parseInt(expanded.slice(6, 8), 16) / 255 : 1;
  return [
    parseInt(expanded.slice(0, 2), 16) / 255,
    parseInt(expanded.slice(2, 4), 16) / 255,
    parseInt(expanded.slice(4, 6), 16) / 255,
    alpha,
  ];
};

const fill = (color: string, fallback = '#ffffff', opacity = 100): LottieValue => ({
  ty: 'fl',
  c: { a: 0, k: hexToRgba(color, fallback) },
  o: { a: 0, k: opacity },
  r: 1,
});

const stroke = (color: string, width: number, fallback = '#1c1917', opacity = 100): LottieValue => ({
  ty: 'st',
  c: { a: 0, k: hexToRgba(color, fallback) },
  o: { a: 0, k: opacity },
  w: { a: 0, k: width },
  lc: 2,
  lj: 2,
  ml: 4,
});

const ellipse = (cx: number, cy: number, width: number, height: number): LottieValue => ({
  ty: 'el',
  p: { a: 0, k: [s(cx), s(cy)] },
  s: { a: 0, k: [s(width), s(height)] },
  d: 1,
});

const rect = (cx: number, cy: number, width: number, height: number, radius = 0): LottieValue => ({
  ty: 'rc',
  p: { a: 0, k: [s(cx), s(cy)] },
  s: { a: 0, k: [s(width), s(height)] },
  r: { a: 0, k: radius },
  d: 1,
});

const path = (points: [number, number][], closed = true): LottieValue => ({
  ty: 'sh',
  ks: {
    a: 0,
    k: {
      i: points.map(() => [0, 0]),
      o: points.map(() => [0, 0]),
      v: points.map(([x, y]) => [s(x), s(y)]),
      c: closed,
    },
  },
});

const groupTransform = (): LottieValue => ({
  ty: 'tr',
  p: { a: 0, k: [0, 0] },
  a: { a: 0, k: [0, 0] },
  s: { a: 0, k: [100, 100] },
  r: { a: 0, k: 0 },
  o: { a: 0, k: 100 },
  sk: { a: 0, k: 0 },
  sa: { a: 0, k: 0 },
});

const group = (name: string, items: LottieValue[]): LottieValue => ({
  ty: 'gr',
  nm: name,
  it: [...items, groupTransform()],
});

const keyframe = (time: number, value: number[], endValue?: number[]): LottieValue => ({
  t: time,
  s: value,
  ...(endValue ? { e: endValue } : {}),
  i: { x: [0.667], y: [1] },
  o: { x: [0.333], y: [0] },
});

const loopPosition = (lift = 0): LottieValue => ({
  a: lift === 0 ? 0 : 1,
  k:
    lift === 0
      ? [0, 0, 0]
      : [
          keyframe(0, [0, 0, 0], [0, -lift, 0]),
          keyframe(FRAME_COUNT / 2, [0, -lift, 0], [0, 0, 0]),
          keyframe(FRAME_COUNT, [0, 0, 0]),
        ],
});

const loopScale = (gain = 0): LottieValue => ({
  a: gain === 0 ? 0 : 1,
  k:
    gain === 0
      ? [100, 100, 100]
      : [
          keyframe(0, [100, 100, 100], [100 + gain, 100 + gain, 100]),
          keyframe(FRAME_COUNT / 2, [100 + gain, 100 + gain, 100], [100, 100, 100]),
          keyframe(FRAME_COUNT, [100, 100, 100]),
        ],
});

const layer = (index: number, name: string, shapes: LottieValue[], lift = 0, scaleGain = 0): LottieValue => ({
  ddd: 0,
  ind: index,
  ty: 4,
  nm: name,
  sr: 1,
  ks: {
    o: { a: 0, k: 100 },
    r: { a: 0, k: 0 },
    p: loopPosition(lift),
    a: { a: 0, k: [0, 0, 0] },
    s: loopScale(scaleGain),
  },
  ao: 0,
  shapes,
  ip: 0,
  op: FRAME_COUNT,
  st: 0,
  bm: 0,
});

const heartPath = (cx: number, cy: number, size: number): LottieValue =>
  path(
    [
      [cx, cy + size * 0.75],
      [cx - size, cy],
      [cx - size * 0.72, cy - size * 0.62],
      [cx, cy - size * 0.28],
      [cx + size * 0.72, cy - size * 0.62],
      [cx + size, cy],
    ],
    true,
  );

const sparklePath = (cx: number, cy: number, size: number): LottieValue =>
  path(
    [
      [cx, cy - size],
      [cx + size * 0.28, cy - size * 0.28],
      [cx + size, cy],
      [cx + size * 0.28, cy + size * 0.28],
      [cx, cy + size],
      [cx - size * 0.28, cy + size * 0.28],
      [cx - size, cy],
      [cx - size * 0.28, cy - size * 0.28],
    ],
    true,
  );

const buildHairShapes = (config: AvatarConfig): LottieValue[] => {
  const hair = config.hairColor;
  const highlight = config.hairHighlightColor;
  const backShapes: LottieValue[] = [];

  if (config.hairStyleBack === 'tails' || config.hairStyleBack === 'drill-tails') {
    backShapes.push(group('tail-left', [ellipse(108, 210, 56, 150), fill(hair, '#18181b')]));
    backShapes.push(group('tail-right', [ellipse(292, 210, 56, 150), fill(hair, '#18181b')]));
  } else if (config.hairStyleBack === 'short') {
    backShapes.push(group('short-back', [ellipse(200, 142, 170, 118), fill(hair, '#18181b')]));
  } else {
    backShapes.push(
      group('long-back', [
        path([
          [118, 130],
          [92, 240],
          [132, 330],
          [200, 350],
          [268, 330],
          [308, 240],
          [282, 130],
        ]),
        fill(hair, '#18181b'),
      ]),
    );
  }

  const bang: [number, number][] =
    config.hairStyleBang === 'side'
      ? [
          [126, 128],
          [210, 84],
          [282, 130],
          [232, 166],
          [170, 150],
        ]
      : config.hairStyleBang === 'center-part'
        ? [
            [126, 126],
            [200, 86],
            [274, 126],
            [220, 160],
            [200, 104],
            [180, 160],
          ]
        : config.hairStyleBang === 'spiky' || config.hairStyleBang === 'cross-bangs'
          ? [
              [118, 132],
              [148, 92],
              [170, 148],
              [200, 82],
              [226, 148],
              [256, 92],
              [286, 132],
              [238, 164],
              [200, 146],
              [162, 164],
            ]
          : [
              [124, 130],
              [150, 92],
              [200, 82],
              [250, 92],
              [276, 130],
              [238, 158],
              [200, 150],
              [162, 158],
            ];

  backShapes.push(group('front-bangs', [path(bang), fill(hair, '#18181b'), stroke(highlight, 2, '#ffffff', 45)]));
  return backShapes;
};

const buildBodyShapes = (config: AvatarConfig): LottieValue[] => [
  group('neck', [rect(200, 282, 44, 54, 10), fill(config.skinColor, '#f5d0c5')]),
  group('shoulders', [
    path([
      [112, 315],
      [288, 315],
      [330, 392],
      [70, 392],
    ]),
    fill(config.clothingColor1, '#111827'),
    stroke(config.clothingColor2, 4, '#ffffff', 85),
  ]),
  group('collar', [
    path([
      [162, 318],
      [200, 350],
      [238, 318],
      [218, 392],
      [182, 392],
    ]),
    fill(config.clothingColor2, '#ffffff', 90),
  ]),
];

const buildHeadShapes = (config: AvatarConfig): LottieValue[] => {
  const shapes: LottieValue[] = [];
  if (config.earStyle === 'elf' || config.earStyle === 'pointy') {
    shapes.push(
      group('left-ear', [
        path([
          [136, 155],
          [86, 130],
          [128, 188],
        ]),
        fill(config.skinColor, '#f5d0c5'),
      ]),
    );
    shapes.push(
      group('right-ear', [
        path([
          [264, 155],
          [314, 130],
          [272, 188],
        ]),
        fill(config.skinColor, '#f5d0c5'),
      ]),
    );
  }
  shapes.push(
    group('head', [
      ellipse(200, 178, 148, 174),
      fill(config.skinColor, '#f5d0c5'),
      stroke('#1c1917', 2, '#1c1917', 22),
    ]),
  );
  if (config.blushOpacity > 0.05) {
    shapes.push(
      group('blush-left', [ellipse(150, 198, 26, 13), fill(config.blushColor, '#fb7185', config.blushOpacity * 100)]),
    );
    shapes.push(
      group('blush-right', [ellipse(250, 198, 26, 13), fill(config.blushColor, '#fb7185', config.blushOpacity * 100)]),
    );
  }
  return shapes;
};

const buildEyes = (config: AvatarConfig, emotion: Emotion): LottieValue[] => {
  if (emotion === 'cool') {
    return [
      group('cool-shades', [
        path([
          [126, 166],
          [180, 160],
          [176, 190],
          [132, 188],
        ]),
        fill('#0f172a', '#0f172a'),
        stroke('#38bdf8', 3, '#38bdf8'),
      ]),
      group('cool-shades-r', [
        path([
          [220, 160],
          [274, 166],
          [268, 188],
          [224, 190],
        ]),
        fill('#0f172a', '#0f172a'),
        stroke('#d946ef', 3, '#d946ef'),
      ]),
      group('bridge', [
        path(
          [
            [178, 174],
            [222, 174],
          ],
          false,
        ),
        stroke('#0f172a', 4),
      ]),
    ];
  }

  const leftEye = [ellipse(156, 176, 36, 32), fill('#ffffff'), stroke('#1c1917', 2)];
  const rightEye = [ellipse(244, 176, 36, 32), fill('#ffffff'), stroke('#1c1917', 2)];

  if (emotion === 'love') {
    leftEye.push(heartPath(156, 176, 12), fill(config.pupilColor, '#ec4899'));
    rightEye.push(heartPath(244, 176, 12), fill(config.pupilColor, '#ec4899'));
  } else if (emotion === 'starry') {
    leftEye.push(sparklePath(156, 176, 12), fill(config.pupilColor, '#facc15'));
    rightEye.push(sparklePath(244, 176, 12), fill(config.pupilColor, '#facc15'));
  } else if (emotion === 'dizzy') {
    leftEye.push(ellipse(156, 176, 22, 22), stroke('#4f46e5', 4), fill('#ffffff', '#ffffff', 0));
    rightEye.push(ellipse(244, 176, 22, 22), stroke('#4f46e5', 4), fill('#ffffff', '#ffffff', 0));
  } else {
    const pupilWidth = config.pupilStyle === 'slit' ? 7 : 13;
    leftEye.push(ellipse(156, 176, pupilWidth, 18), fill(config.pupilColor, '#111827'));
    rightEye.push(ellipse(244, 176, pupilWidth, 18), fill(config.pupilColor, '#111827'));
    leftEye.push(ellipse(156, 176, 24, 24), fill(config.eyeColor, '#06b6d4', 72));
    rightEye.push(ellipse(244, 176, 24, 24), fill(config.eyeColor, '#06b6d4', 72));
  }

  return [group('left-eye', leftEye), group('right-eye', rightEye)];
};

const buildMouthAndBrows = (config: AvatarConfig, emotion: Emotion): LottieValue[] => {
  const browColor = config.eyebrowColor;
  const mouthColor = '#1c1917';
  const smile =
    emotion === 'happy' || emotion === 'love' || emotion === 'starry' || emotion === 'smug' || emotion === 'cool';
  const open = emotion === 'shocked' || emotion === 'cry' || emotion === 'dizzy';
  const angry = emotion === 'angry';

  const mouth = open
    ? group('mouth-open', [
        ellipse(200, 222, emotion === 'shocked' ? 34 : 26, emotion === 'shocked' ? 44 : 30),
        fill(mouthColor),
      ])
    : group('mouth-line', [
        path(
          smile
            ? [
                [178, 218],
                [200, emotion === 'smug' ? 226 : 232],
                [222, 218],
              ]
            : [
                [180, 228],
                [200, 218],
                [220, 228],
              ],
          false,
        ),
        stroke(mouthColor, 4),
      ]);

  const leftBrow: [number, number][] = angry
    ? [
        [136, 148],
        [178, 140],
      ]
    : [
        [136, 144],
        [178, 146],
      ];
  const rightBrow: [number, number][] = angry
    ? [
        [222, 140],
        [264, 148],
      ]
    : [
        [222, 146],
        [264, 144],
      ];

  return [
    group('left-brow', [path(leftBrow, false), stroke(browColor, 4, '#1c1917')]),
    group('right-brow', [path(rightBrow, false), stroke(browColor, 4, '#1c1917')]),
    mouth,
  ];
};

const buildAccessoryShapes = (config: AvatarConfig): LottieValue[] => {
  const color = config.accessoryColor;
  switch (config.accessoryStyle) {
    case 'horns':
      return [
        group('horn-left', [
          path([
            [132, 110],
            [90, 50],
            [72, 110],
          ]),
          fill(color, '#ef4444'),
          stroke('#1c1917', 3),
        ]),
        group('horn-right', [
          path([
            [268, 110],
            [310, 50],
            [328, 110],
          ]),
          fill(color, '#ef4444'),
          stroke('#1c1917', 3),
        ]),
      ];
    case 'neko-ears':
      return [
        group('neko-left', [
          path([
            [132, 104],
            [72, 38],
            [105, 125],
          ]),
          fill(color, '#f43f5e'),
          stroke('#1c1917', 3),
        ]),
        group('neko-right', [
          path([
            [268, 104],
            [328, 38],
            [295, 125],
          ]),
          fill(color, '#f43f5e'),
          stroke('#1c1917', 3),
        ]),
      ];
    case 'glasses':
      return [
        group('glasses', [
          ellipse(156, 176, 48, 42),
          ellipse(244, 176, 48, 42),
          path(
            [
              [180, 176],
              [220, 176],
            ],
            false,
          ),
          stroke(color, 4, '#111827'),
          fill('#ffffff', '#ffffff', 0),
        ]),
      ];
    case 'headphones':
      return [
        group('headphone-band', [
          path(
            [
              [96, 154],
              [130, 88],
              [200, 70],
              [270, 88],
              [304, 154],
            ],
            false,
          ),
          stroke('#27272a', 8),
        ]),
        group('headphone-left', [ellipse(94, 156, 26, 56), fill(color, '#06b6d4'), stroke('#27272a', 4)]),
        group('headphone-right', [ellipse(306, 156, 26, 56), fill(color, '#06b6d4'), stroke('#27272a', 4)]),
      ];
    case 'angel-halo':
      return [group('halo', [ellipse(200, 56, 116, 24), stroke(color, 6, '#facc15'), fill('#ffffff', '#ffffff', 0)])];
    case 'fox-mask':
      return [
        group('fox-mask', [
          path([
            [284, 112],
            [324, 92],
            [346, 136],
            [332, 190],
            [286, 206],
            [266, 156],
          ]),
          fill('#ffffff'),
          stroke('#1c1917', 3),
        ]),
        group('fox-mark', [
          path([
            [298, 132],
            [322, 120],
            [338, 132],
          ]),
          stroke('#ef4444', 4, '#ef4444'),
        ]),
      ];
    default:
      return [];
  }
};

const buildEmotionOverlay = (emotion: Emotion): LottieValue[] => {
  switch (emotion) {
    case 'angry':
      return [
        group('rage-mark', [
          path(
            [
              [244, 112],
              [274, 104],
            ],
            false,
          ),
          path(
            [
              [244, 128],
              [274, 136],
            ],
            false,
          ),
          path(
            [
              [250, 100],
              [246, 142],
            ],
            false,
          ),
          path(
            [
              [266, 100],
              [270, 142],
            ],
            false,
          ),
          stroke('#dc2626', 5, '#dc2626'),
        ]),
      ];
    case 'cry':
      return [
        group('tears', [
          path(
            [
              [152, 190],
              [148, 244],
            ],
            false,
          ),
          path(
            [
              [248, 190],
              [244, 244],
            ],
            false,
          ),
          stroke('#60a5fa', 6, '#60a5fa'),
        ]),
      ];
    case 'shocked':
      return [group('shock-mark', [ellipse(200, 72, 34, 28), fill('#eab308'), stroke('#1c1917', 2)])];
    case 'love':
      return [
        group('heart-left', [heartPath(102, 130, 16), fill('#ec4899')]),
        group('heart-right', [heartPath(298, 130, 16), fill('#ec4899')]),
      ];
    case 'starry':
      return [
        group('spark-left', [sparklePath(118, 150, 16), fill('#fbbf24')]),
        group('spark-right', [sparklePath(282, 150, 16), fill('#fbbf24')]),
      ];
    case 'cool':
      return [
        group('music-left', [
          path(
            [
              [92, 126],
              [92, 90],
              [118, 98],
              [118, 132],
            ],
            false,
          ),
          stroke('#d946ef', 4, '#d946ef'),
        ]),
      ];
    case 'dizzy':
      return [
        group('dizzy-loop', [
          ellipse(200, 58, 80, 28),
          ellipse(200, 58, 42, 16),
          stroke('#facc15', 4, '#facc15'),
          fill('#ffffff', '#ffffff', 0),
        ]),
      ];
    default:
      return [];
  }
};

export function buildTelegramStickerLottie(config: AvatarConfig, spec: TelegramStickerSpec): LottieValue {
  const stickerConfig = { ...config, activeEmotion: spec.emotion, backgroundStyle: 'dark-studio' as const };
  const layers = [
    layer(1, 'back-hair', buildHairShapes(stickerConfig), 5),
    layer(2, 'body', buildBodyShapes(stickerConfig), 3),
    layer(3, 'head', buildHeadShapes(stickerConfig), 6, spec.emotion === 'shocked' ? 4 : 2),
    layer(
      4,
      'face',
      [...buildEyes(stickerConfig, spec.emotion), ...buildMouthAndBrows(stickerConfig, spec.emotion)],
      6,
    ),
    layer(5, 'accessory', buildAccessoryShapes(stickerConfig), 7),
    layer(
      6,
      'emotion-overlay',
      buildEmotionOverlay(spec.emotion),
      12,
      spec.emotion === 'love' || spec.emotion === 'starry' ? 12 : 0,
    ),
  ].filter((item) => (item.shapes as unknown[]).length > 0);

  return {
    v: '5.7.4',
    fr: TELEGRAM_STICKER_FPS,
    ip: 0,
    op: FRAME_COUNT,
    w: TELEGRAM_STICKER_SIZE,
    h: TELEGRAM_STICKER_SIZE,
    nm: `${config.name || 'V-Studio'} ${spec.label} Telegram sticker`,
    ddd: 0,
    assets: [],
    layers,
    markers: [],
  };
}

async function gzipString(input: string): Promise<Uint8Array> {
  if (typeof CompressionStream === 'undefined') {
    throw new Error('This browser cannot create Telegram .TGS files because CompressionStream is unavailable.');
  }

  const compressed = new Blob([input]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(compressed).arrayBuffer());
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

const dosDateTime = (date: Date) => {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = Math.max(1980, date.getFullYear()) - 1980;
  return { date: (year << 9) | (month << 5) | day, time };
};

const writeU16 = (view: DataView, offset: number, value: number) => view.setUint16(offset, value, true);
const writeU32 = (view: DataView, offset: number, value: number) => view.setUint32(offset, value >>> 0, true);

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

export function createZipBlob(entries: ZipEntry[], date = new Date()): Blob {
  const encoder = new TextEncoder();
  const { date: zipDate, time: zipTime } = dosDateTime(date);
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const data = typeof entry.data === 'string' ? encoder.encode(entry.data) : entry.data;
    const checksum = crc32(data);

    const local = new Uint8Array(30 + name.length);
    const localView = new DataView(local.buffer);
    writeU32(localView, 0, 0x04034b50);
    writeU16(localView, 4, 20);
    writeU16(localView, 6, 0x0800);
    writeU16(localView, 8, 0);
    writeU16(localView, 10, zipTime);
    writeU16(localView, 12, zipDate);
    writeU32(localView, 14, checksum);
    writeU32(localView, 18, data.length);
    writeU32(localView, 22, data.length);
    writeU16(localView, 26, name.length);
    writeU16(localView, 28, 0);
    local.set(name, 30);

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    writeU32(centralView, 0, 0x02014b50);
    writeU16(centralView, 4, 20);
    writeU16(centralView, 6, 20);
    writeU16(centralView, 8, 0x0800);
    writeU16(centralView, 10, 0);
    writeU16(centralView, 12, zipTime);
    writeU16(centralView, 14, zipDate);
    writeU32(centralView, 16, checksum);
    writeU32(centralView, 20, data.length);
    writeU32(centralView, 24, data.length);
    writeU16(centralView, 28, name.length);
    writeU16(centralView, 30, 0);
    writeU16(centralView, 32, 0);
    writeU16(centralView, 34, 0);
    writeU16(centralView, 36, 0);
    writeU32(centralView, 38, 0);
    writeU32(centralView, 42, offset);
    central.set(name, 46);

    localParts.push(local, data);
    centralParts.push(central);
    offset += local.length + data.length;
  }

  const centralDirectory = concat(centralParts);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  writeU32(endView, 0, 0x06054b50);
  writeU16(endView, 8, entries.length);
  writeU16(endView, 10, entries.length);
  writeU32(endView, 12, centralDirectory.length);
  writeU32(endView, 16, offset);
  writeU16(endView, 20, 0);

  return new Blob([concat([...localParts, centralDirectory, end])], { type: 'application/zip' });
}

export async function createTelegramStickerPack(
  config: AvatarConfig,
  baseName: string,
  date = new Date(),
): Promise<TelegramStickerPack> {
  const safeName = safeExportFileName(baseName || config.name || 'vstudio-sticker-pack');
  const stickerFiles: TelegramStickerFile[] = [];
  const zipEntries: ZipEntry[] = [];

  for (const spec of TELEGRAM_STICKER_SPECS) {
    const lottie = buildTelegramStickerLottie(config, spec);
    const tgsData = await gzipString(JSON.stringify(lottie));
    const fileName = `stickers/${safeName}-${spec.slug}.tgs`;
    stickerFiles.push({
      name: fileName,
      slug: spec.slug,
      emoji: spec.emoji,
      emotion: spec.emotion,
      sizeBytes: tgsData.length,
    });
    zipEntries.push({ name: fileName, data: tgsData });
  }

  const manifest: TelegramStickerPack['manifest'] = {
    name: safeName,
    format: 'tgs',
    canvas: '512x512',
    fps: TELEGRAM_STICKER_FPS,
    durationSeconds: TELEGRAM_STICKER_DURATION_SECONDS,
    background: 'transparent',
    maxTgsBytes: TELEGRAM_STICKER_MAX_TGS_BYTES,
    stickers: stickerFiles,
    note: 'Upload the .tgs files with @Stickers. The ZIP is only a local bundle; Telegram uses the individual .tgs files.',
  };

  zipEntries.unshift({ name: 'manifest.json', data: JSON.stringify(manifest, null, 2) });

  return {
    fileName: `${safeName}-telegram-tgs-pack.zip`,
    zipBlob: createZipBlob(zipEntries, date),
    manifest,
  };
}
