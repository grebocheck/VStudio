import { AvatarConfig, Emotion } from '../../types';
import {
  fill,
  stroke,
  ellipse,
  rect,
  smoothPath,
  linePath,
  group,
  layer,
  heartPath,
  sparklePath,
  tearDropPath,
  spiralPath,
  hslSafeOutline,
} from './lottie';
import type {
  LottieValue,
  Vec2,
  StickerLayerMotion,
  TelegramStickerSpec,
  TelegramEmotionAnimationPreset,
} from './core';

const buildHairShapes = (config: AvatarConfig): LottieValue[] => {
  const hair = config.hairColor;
  const highlight = config.hairHighlightColor;
  const shapes: LottieValue[] = [];

  if (config.hairStyleBack === 'tails' || config.hairStyleBack === 'drill-tails') {
    shapes.push(
      group('tail-left', [
        smoothPath(
          [
            [134, 114],
            [90, 140],
            [82, 224],
            [98, 312],
            [132, 350],
            [158, 304],
            [154, 190],
          ],
          true,
          config.hairStyleBack === 'drill-tails' ? 0.2 : 0.24,
        ),
        fill(hair, '#18181b'),
        stroke(highlight, 2, '#ffffff', 45),
      ]),
    );
    shapes.push(
      group('tail-right', [
        smoothPath(
          [
            [266, 114],
            [310, 140],
            [318, 224],
            [302, 312],
            [268, 350],
            [242, 304],
            [246, 190],
          ],
          true,
          config.hairStyleBack === 'drill-tails' ? 0.2 : 0.24,
        ),
        fill(hair, '#18181b'),
        stroke(highlight, 2, '#ffffff', 45),
      ]),
    );
    if (config.hairStyleBack === 'drill-tails') {
      shapes.push(
        group('tail-left-rings', [
          ellipse(114, 222, 34, 118),
          stroke(highlight, 3, '#ffffff', 55),
          fill(hair, '#18181b', 0),
        ]),
      );
      shapes.push(
        group('tail-right-rings', [
          ellipse(286, 222, 34, 118),
          stroke(highlight, 3, '#ffffff', 55),
          fill(hair, '#18181b', 0),
        ]),
      );
    }
  } else if (config.hairStyleBack === 'short') {
    shapes.push(
      group('short-back', [
        smoothPath(
          [
            [118, 122],
            [154, 74],
            [214, 70],
            [280, 118],
            [270, 214],
            [200, 246],
            [128, 214],
          ],
          true,
          0.22,
        ),
        fill(hair, '#18181b'),
        stroke(highlight, 2, '#ffffff', 38),
      ]),
    );
  } else if (config.hairStyleBack === 'braids') {
    shapes.push(
      group('braid-left', [
        ellipse(102, 190, 34, 52),
        ellipse(108, 236, 32, 52),
        ellipse(116, 282, 30, 48),
        fill(hair, '#18181b'),
        stroke(highlight, 2, '#ffffff', 42),
      ]),
    );
    shapes.push(
      group('braid-right', [
        ellipse(298, 190, 34, 52),
        ellipse(292, 236, 32, 52),
        ellipse(284, 282, 30, 48),
        fill(hair, '#18181b'),
        stroke(highlight, 2, '#ffffff', 42),
      ]),
    );
  } else {
    const wavy = config.hairStyleBack === 'curly' || config.hairStyleBack === 'wavy';
    shapes.push(
      group('long-back', [
        smoothPath(
          [
            [118, 118],
            [92, 172],
            [88, 250],
            [120, 334],
            [200, 360],
            [280, 334],
            [312, 250],
            [304, 172],
            [282, 118],
            [242, 88],
            [200, 78],
            [158, 88],
          ],
          true,
          wavy ? 0.28 : 0.2,
        ),
        fill(hair, '#18181b'),
        stroke(highlight, 2, '#ffffff', 38),
      ]),
    );
  }

  // Back hair sits in the rear-most layer; an extra inner shadow + highlight
  // sweep add depth without touching the face.
  shapes.unshift(group('back-hair-shadow', [ellipse(200, 214, 210, 250), fill('#0f172a', '#0f172a', 16)]));
  shapes.push(
    group('back-hair-sheen', [
      linePath([
        [128, 150],
        [120, 230],
        [136, 312],
      ]),
      stroke(highlight, 3, '#ffffff', 36),
    ]),
  );

  return shapes;
};

// Front hair (bangs, sidelocks, ahoge) renders on its own layer in front of the
// face so it frames the forehead and cheeks instead of hiding behind the head.
const buildFrontHairShapes = (config: AvatarConfig): LottieValue[] => {
  const hair = config.hairColor;
  const highlight = config.hairHighlightColor;
  const shapes: LottieValue[] = [];

  const bang: Vec2[] =
    config.hairStyleBang === 'side'
      ? [
          [114, 132],
          [162, 92],
          [220, 86],
          [284, 128],
          [238, 166],
          [178, 152],
          [138, 166],
        ]
      : config.hairStyleBang === 'center-part'
        ? [
            [118, 128],
            [170, 92],
            [200, 82],
            [230, 92],
            [282, 128],
            [236, 164],
            [206, 118],
            [200, 160],
            [194, 118],
            [164, 164],
          ]
        : config.hairStyleBang === 'hime'
          ? [
              [114, 128],
              [146, 88],
              [200, 78],
              [254, 88],
              [286, 128],
              [262, 176],
              [232, 148],
              [200, 166],
              [168, 148],
              [138, 176],
            ]
          : config.hairStyleBang === 'short'
            ? [
                [124, 126],
                [156, 98],
                [200, 86],
                [244, 98],
                [276, 126],
                [252, 150],
                [200, 142],
                [148, 150],
              ]
            : config.hairStyleBang === 'spiky' || config.hairStyleBang === 'cross-bangs'
              ? [
                  [112, 132],
                  [146, 92],
                  [168, 150],
                  [200, 80],
                  [230, 150],
                  [256, 92],
                  [290, 132],
                  [240, 166],
                  [200, 146],
                  [160, 166],
                ]
              : [
                  [118, 130],
                  [150, 94],
                  [200, 82],
                  [250, 94],
                  [282, 130],
                  [238, 160],
                  [200, 150],
                  [162, 160],
                ];

  // Soft shadow the bangs cast onto the forehead, painted under the bang fill.
  shapes.push(group('bang-shadow', [ellipse(200, 158, 156, 30), fill('#0f172a', '#0f172a', 16)]));

  // Face-framing sidelocks down the cheeks.
  shapes.push(
    group('sidelock-left', [
      smoothPath(
        [
          [126, 138],
          [110, 192],
          [120, 256],
          [136, 252],
          [142, 190],
          [142, 148],
        ],
        true,
        0.22,
      ),
      fill(hair, '#18181b'),
      stroke(highlight, 1.5, '#ffffff', 42),
    ]),
  );
  shapes.push(
    group('sidelock-right', [
      smoothPath(
        [
          [274, 138],
          [290, 192],
          [280, 256],
          [264, 252],
          [258, 190],
          [258, 148],
        ],
        true,
        0.22,
      ),
      fill(hair, '#18181b'),
      stroke(highlight, 1.5, '#ffffff', 42),
    ]),
  );

  shapes.push(
    group('front-bangs', [
      smoothPath(bang, true, config.hairStyleBang === 'spiky' || config.hairStyleBang === 'cross-bangs' ? 0.08 : 0.19),
      fill(hair, '#18181b'),
      stroke(highlight, 2, '#ffffff', 50),
    ]),
  );

  shapes.push(
    group('bang-highlight', [
      linePath([
        [154, 110],
        [180, 100],
        [210, 98],
        [242, 114],
      ]),
      stroke(highlight, 3, '#ffffff', 58),
    ]),
  );

  // Strand separation lines down the bangs.
  shapes.push(
    group('bang-strands', [
      linePath([
        [166, 108],
        [160, 152],
      ]),
      linePath([
        [192, 100],
        [190, 152],
      ]),
      linePath([
        [218, 102],
        [224, 152],
      ]),
      linePath([
        [246, 112],
        [252, 150],
      ]),
      stroke('#0f172a', 1.4, '#0f172a', 22),
    ]),
  );

  // Sheen running down the sidelocks.
  shapes.push(
    group('sidelock-sheen', [
      linePath([
        [124, 150],
        [118, 212],
      ]),
      linePath([
        [276, 150],
        [282, 212],
      ]),
      stroke(highlight, 2, '#ffffff', 38),
    ]),
  );

  // Ahoge — the signature cowlick rising from the crown.
  shapes.push(
    group('ahoge', [
      smoothPath(
        [
          [198, 92],
          [206, 60],
          [226, 52],
          [218, 68],
          [210, 82],
        ],
        true,
        0.16,
      ),
      fill(hair, '#18181b'),
      stroke(highlight, 1.5, '#ffffff', 40),
    ]),
  );

  return shapes;
};

const buildClothingDetails = (config: AvatarConfig): LottieValue[] => {
  const color2 = config.clothingColor2;
  const outline = hslSafeOutline;
  const details: LottieValue[] = [];

  if (config.clothingStyle === 'hoodie') {
    details.push(
      group('hood', [
        smoothPath(
          [
            [126, 318],
            [158, 292],
            [200, 310],
            [242, 292],
            [274, 318],
            [248, 372],
            [152, 372],
          ],
          true,
          0.24,
        ),
        stroke(color2, 4, '#ffffff', 78),
        fill(config.clothingColor1, '#111827', 0),
      ]),
    );
    details.push(
      group('drawstrings', [
        linePath([
          [176, 326],
          [170, 368],
        ]),
        linePath([
          [224, 326],
          [230, 368],
        ]),
        stroke(color2, 3, '#ffffff', 80),
      ]),
    );
  } else if (config.clothingStyle === 'kimono') {
    details.push(
      group('kimono-cross', [
        linePath([
          [132, 314],
          [206, 390],
        ]),
        linePath([
          [268, 314],
          [190, 390],
        ]),
        stroke(color2, 5, '#ffffff', 88),
      ]),
    );
    details.push(group('obi', [rect(200, 362, 156, 22, 4), fill(color2, '#ffffff', 86)]));
  } else if (config.clothingStyle === 'suit') {
    details.push(
      group('lapel-left', [
        smoothPath(
          [
            [148, 314],
            [194, 346],
            [168, 392],
            [132, 332],
          ],
          true,
          0.14,
        ),
        fill(color2, '#ffffff', 88),
        stroke(outline, 1.5, outline, 40),
      ]),
    );
    details.push(
      group('lapel-right', [
        smoothPath(
          [
            [252, 314],
            [206, 346],
            [232, 392],
            [268, 332],
          ],
          true,
          0.14,
        ),
        fill(color2, '#ffffff', 88),
        stroke(outline, 1.5, outline, 40),
      ]),
    );
    details.push(
      group('tie', [
        smoothPath(
          [
            [200, 330],
            [216, 360],
            [204, 396],
            [196, 396],
            [184, 360],
          ],
          true,
          0.12,
        ),
        fill(outline, outline, 92),
      ]),
    );
  } else if (config.clothingStyle === 'cyber-armor') {
    details.push(
      group('armor-core', [
        smoothPath(
          [
            [148, 322],
            [200, 308],
            [252, 322],
            [234, 388],
            [166, 388],
          ],
          true,
          0.16,
        ),
        stroke(color2, 5, '#22d3ee', 96),
        fill('#0f172a', '#0f172a', 35),
      ]),
    );
    details.push(
      group('armor-lines', [
        linePath([
          [144, 350],
          [92, 372],
        ]),
        linePath([
          [256, 350],
          [308, 372],
        ]),
        linePath([
          [200, 318],
          [200, 390],
        ]),
        stroke(color2, 3, '#22d3ee', 90),
      ]),
    );
  } else if (config.clothingStyle === 'goth-dress' || config.clothingStyle === 'maid') {
    details.push(
      group('lace-collar', [
        ellipse(166, 326, 34, 18),
        ellipse(200, 334, 38, 20),
        ellipse(234, 326, 34, 18),
        fill(color2, '#ffffff', 92),
        stroke(outline, 1.2, outline, 35),
      ]),
    );
    if (config.clothingStyle === 'maid')
      details.push(
        group('apron', [
          smoothPath(
            [
              [164, 340],
              [236, 340],
              [252, 396],
              [148, 396],
            ],
            true,
            0.16,
          ),
          fill(color2, '#ffffff', 86),
        ]),
      );
  } else if (config.clothingStyle === 'sailor-fuku') {
    details.push(
      group('sailor-collar', [
        smoothPath(
          [
            [134, 316],
            [200, 350],
            [266, 316],
            [240, 386],
            [160, 386],
          ],
          true,
          0.16,
        ),
        fill(color2, '#ffffff', 86),
        stroke(outline, 1.5, outline, 35),
      ]),
    );
    details.push(
      group('ribbon', [
        smoothPath(
          [
            [186, 342],
            [154, 332],
            [172, 366],
          ],
          true,
          0.14,
        ),
        smoothPath(
          [
            [214, 342],
            [246, 332],
            [228, 366],
          ],
          true,
          0.14,
        ),
        fill(config.clothingColor1, '#111827'),
        stroke(color2, 2, '#ffffff', 70),
      ]),
    );
  } else if (config.clothingStyle === 'druid-cloak') {
    details.push(
      group('cloak-folds', [
        linePath([
          [128, 318],
          [96, 396],
        ]),
        linePath([
          [200, 326],
          [200, 398],
        ]),
        linePath([
          [272, 318],
          [304, 396],
        ]),
        stroke(color2, 4, '#86efac', 78),
      ]),
    );
    details.push(
      group('brooch', [ellipse(200, 326, 28, 28), fill(color2, '#86efac', 94), stroke(outline, 2, outline, 45)]),
    );
  } else {
    details.push(
      group('sweater-rib', [
        linePath([
          [132, 344],
          [268, 344],
        ]),
        linePath([
          [142, 366],
          [258, 366],
        ]),
        stroke(color2, 4, '#ffffff', 70),
      ]),
    );
  }

  if (config.clothingPrint === 'star') {
    details.push(group('print-star', [sparklePath(200, 360, 16), fill(color2, '#facc15', 92)]));
  } else if (config.clothingPrint === 'heart') {
    details.push(group('print-heart', [heartPath(200, 360, 14), fill(color2, '#ec4899', 92)]));
  } else if (config.clothingPrint === 'cat') {
    details.push(
      group('print-cat', [
        ellipse(200, 362, 28, 24),
        smoothPath(
          [
            [186, 350],
            [178, 336],
            [196, 346],
          ],
          true,
          0.12,
        ),
        smoothPath(
          [
            [214, 350],
            [222, 336],
            [204, 346],
          ],
          true,
          0.12,
        ),
        fill(color2, '#ffffff', 88),
      ]),
    );
  } else if (config.clothingPrint === 'cross') {
    details.push(
      group('print-cross', [rect(200, 360, 10, 44, 2), rect(200, 354, 34, 9, 2), fill(color2, '#ffffff', 92)]),
    );
  } else if (config.clothingPrint === 'cyber') {
    details.push(
      group('print-cyber', [
        linePath([
          [184, 350],
          [216, 350],
          [216, 374],
          [194, 374],
          [194, 360],
          [206, 360],
        ]),
        stroke(color2, 3, '#22d3ee', 92),
      ]),
    );
  }

  return details;
};

const buildBodyShapes = (config: AvatarConfig): LottieValue[] => {
  const shoulderScale = config.shoulderWidth ?? 1;
  const neckWidth = config.neckWidth ?? 1;
  const neckHeight = config.neckHeight ?? 1;
  return [
    group('neck', [rect(200, 286, 42 * neckWidth, 56 * neckHeight, 11), fill(config.skinColor, '#f5d0c5')]),
    group('shoulders', [
      smoothPath(
        [
          [200 - 92 * shoulderScale, 316],
          [152, 304],
          [200, 322],
          [248, 304],
          [200 + 92 * shoulderScale, 316],
          [200 + 145 * shoulderScale, 400],
          [200 - 145 * shoulderScale, 400],
        ],
        true,
        0.2,
      ),
      fill(config.clothingColor1, '#111827'),
      stroke(config.clothingColor2, 3, '#ffffff', 82),
    ]),
    group('neck-shade', [ellipse(200, 298, 64, 22), fill('#0f172a', '#0f172a', 20)]),
    group('collarbone', [
      linePath([
        [168, 322],
        [186, 330],
      ]),
      linePath([
        [232, 322],
        [214, 330],
      ]),
      stroke('#0f172a', 1.6, '#0f172a', 26),
    ]),
    group('shoulder-rim', [
      linePath([
        [200 - 138 * shoulderScale, 392],
        [200 - 96 * shoulderScale, 322],
        [156, 312],
      ]),
      linePath([
        [200 + 138 * shoulderScale, 392],
        [200 + 96 * shoulderScale, 322],
        [244, 312],
      ]),
      stroke('#ffffff', 2, '#ffffff', 30),
    ]),
    group('chest-shade', [ellipse(200, 360, 150, 70), fill('#0f172a', '#0f172a', 12)]),
    group('fabric-folds', [
      linePath([
        [156, 340],
        [178, 396],
      ]),
      linePath([
        [244, 340],
        [222, 396],
      ]),
      linePath([
        [200, 332],
        [200, 398],
      ]),
      stroke('#0f172a', 1.6, '#0f172a', 18),
    ]),
    ...buildClothingDetails(config),
  ];
};

const buildHeadShapes = (config: AvatarConfig): LottieValue[] => {
  const shapes: LottieValue[] = [];
  const headSize = config.headSize ?? 1;
  if (config.earStyle === 'elf' || config.earStyle === 'pointy') {
    const long = config.earStyle === 'elf';
    shapes.push(
      group('left-ear', [
        smoothPath(
          [
            [138, 154],
            [long ? 74 : 92, long ? 120 : 132],
            [126, 190],
          ],
          true,
          0.18,
        ),
        fill(config.skinColor, '#f5d0c5'),
        stroke(hslSafeOutline, 2, hslSafeOutline, 25),
      ]),
    );
    shapes.push(
      group('right-ear', [
        smoothPath(
          [
            [262, 154],
            [long ? 326 : 308, long ? 120 : 132],
            [274, 190],
          ],
          true,
          0.18,
        ),
        fill(config.skinColor, '#f5d0c5'),
        stroke(hslSafeOutline, 2, hslSafeOutline, 25),
      ]),
    );
  }
  if (config.earStyle !== 'elf' && config.earStyle !== 'pointy') {
    shapes.push(
      group('left-ear', [
        ellipse(128, 188, 34, 52),
        fill(config.skinColor, '#f5d0c5'),
        stroke(hslSafeOutline, 2, hslSafeOutline, 22),
      ]),
      group('right-ear', [
        ellipse(272, 188, 34, 52),
        fill(config.skinColor, '#f5d0c5'),
        stroke(hslSafeOutline, 2, hslSafeOutline, 22),
      ]),
    );
  }
  shapes.push(
    group('head', [
      ellipse(200, 178, 148 * headSize, 174 * headSize),
      fill(config.skinColor, '#f5d0c5'),
      stroke(hslSafeOutline, 2, hslSafeOutline, 24),
    ]),
  );
  // Subtle jaw/chin shading and cheek contours give the flat oval some volume.
  shapes.push(group('jaw-shade', [ellipse(200, 244, 124, 64), fill('#0f172a', '#0f172a', 10)]));
  shapes.push(
    group('cheek-contour', [
      linePath([
        [132, 206],
        [140, 238],
        [160, 256],
      ]),
      linePath([
        [268, 206],
        [260, 238],
        [240, 256],
      ]),
      stroke('#b45309', 1.4, '#b45309', 16),
    ]),
  );
  shapes.push(
    group('nose', [
      linePath([
        [199, 190],
        [195, 204],
        [202, 206],
      ]),
      stroke('#b45309', 1.6, '#b45309', 22),
    ]),
  );
  return shapes;
};

const buildBlushShapes = (config: AvatarConfig, emotion: Emotion): LottieValue[] => {
  const baseOpacity = Math.max(config.blushOpacity * 100, emotion === 'love' ? 70 : emotion === 'angry' ? 46 : 0);
  if (baseOpacity < 5) return [];
  return [
    group('blush-left', [
      ellipse(150, 204, emotion === 'love' ? 34 : 28, 15),
      fill(config.blushColor, '#fb7185', baseOpacity),
    ]),
    group('blush-right', [
      ellipse(250, 204, emotion === 'love' ? 34 : 28, 15),
      fill(config.blushColor, '#fb7185', baseOpacity),
    ]),
  ];
};

const buildPupilShape = (config: AvatarConfig, emotion: Emotion, cx: number, cy: number): LottieValue[] => {
  if (emotion === 'love' || config.pupilStyle === 'heart')
    return [heartPath(cx, cy, emotion === 'love' ? 13 : 9), fill(config.pupilColor, '#ec4899')];
  if (emotion === 'starry' || config.pupilStyle === 'star')
    return [sparklePath(cx, cy, emotion === 'starry' ? 13 : 9), fill(config.pupilColor, '#facc15')];
  if (emotion === 'dizzy')
    return [spiralPath(cx, cy, 2.1, 14), stroke(config.pupilColor, 4, '#4f46e5'), fill('#ffffff', '#ffffff', 0)];
  if (config.pupilStyle === 'slit') return [ellipse(cx, cy, 7, 22), fill(config.pupilColor, '#111827')];
  return [ellipse(cx, cy, 12, 17), fill(config.pupilColor, '#111827')];
};

const buildCoolShades = (): LottieValue[] => [
  group('shade-left', [
    smoothPath(
      [
        [124, 166],
        [180, 160],
        [176, 190],
        [132, 190],
      ],
      true,
      0.12,
    ),
    fill('#0f172a', '#0f172a'),
    stroke('#38bdf8', 3, '#38bdf8', 86),
  ]),
  group('shade-right', [
    smoothPath(
      [
        [220, 160],
        [276, 166],
        [268, 190],
        [224, 190],
      ],
      true,
      0.12,
    ),
    fill('#0f172a', '#0f172a'),
    stroke('#d946ef', 3, '#d946ef', 86),
  ]),
  group('shade-bridge', [
    linePath([
      [178, 175],
      [222, 175],
    ]),
    stroke('#0f172a', 4, '#0f172a'),
  ]),
];

const buildEyes = (config: AvatarConfig, emotion: Emotion): LottieValue[] => {
  if (emotion === 'cool') return buildCoolShades();

  const eyeHeight =
    emotion === 'smug' || emotion === 'angry' ? 24 : emotion === 'shocked' ? 38 : emotion === 'cry' ? 27 : 32;
  const eyeWidth = emotion === 'shocked' ? 42 : 36;
  const irisOpacity = emotion === 'cry' ? 84 : 74;
  const irisD = emotion === 'shocked' ? 28 : 24;
  const halfW = eyeWidth / 2;
  const halfH = eyeHeight / 2;
  const lashWidth = emotion === 'shocked' ? 3 : 5;

  // One eye assembled back-to-front: socket white, layered iris (base sheen +
  // upper shade), pupil, crisp iris rim, two catchlights, and a framing lash
  // line on top. Catchlights share an upper-left offset so the lighting reads
  // consistently across both eyes.
  const plainIris =
    emotion !== 'love' &&
    emotion !== 'starry' &&
    emotion !== 'dizzy' &&
    config.pupilStyle !== 'heart' &&
    config.pupilStyle !== 'star';

  const eyeAssembly = (cx: number, cy: number, side: 'left' | 'right'): LottieValue[] => {
    const dir = side === 'left' ? -1 : 1; // outward direction
    const outerX = cx + dir * halfW;
    const innerX = cx - dir * halfW;
    const lashTop: Vec2[] =
      side === 'left'
        ? [
            [cx - halfW - 2, cy - 3],
            [cx - 2, cy - halfH - 3],
            [cx + halfW, cy - halfH + 5],
          ]
        : [
            [cx - halfW, cy - halfH + 5],
            [cx + 2, cy - halfH - 3],
            [cx + halfW + 2, cy - 3],
          ];
    const creaseTop: Vec2[] =
      side === 'left'
        ? [
            [cx - halfW + 2, cy - halfH - 3],
            [cx - 2, cy - halfH - 8],
            [cx + halfW - 4, cy - halfH - 1],
          ]
        : [
            [cx - halfW + 4, cy - halfH - 1],
            [cx + 2, cy - halfH - 8],
            [cx + halfW - 2, cy - halfH - 3],
          ];

    const parts: LottieValue[] = [
      group(`${side}-eye-white`, [
        ellipse(cx, cy, eyeWidth, eyeHeight),
        fill('#ffffff'),
        stroke(hslSafeOutline, 2, hslSafeOutline, 88),
      ]),
      // eyelid shadow cast onto the upper sclera
      group(`${side}-lid-shadow`, [ellipse(cx, cy - halfH + 2, eyeWidth * 0.86, 9), fill('#0f172a', '#0f172a', 12)]),
      group(`${side}-iris`, [ellipse(cx, cy, irisD, irisD), fill(config.eyeColor, '#06b6d4', irisOpacity)]),
      group(`${side}-iris-shade`, [
        ellipse(cx, cy - irisD * 0.26, irisD * 0.94, irisD * 0.52),
        fill('#0f172a', '#0f172a', 26),
      ]),
      group(`${side}-iris-glow`, [
        ellipse(cx, cy + irisD * 0.24, irisD * 0.66, irisD * 0.48),
        fill('#ffffff', '#ffffff', 34),
      ]),
    ];

    if (plainIris) {
      parts.push(
        group(`${side}-iris-ring`, [
          ellipse(cx, cy, irisD * 0.66, irisD * 0.66),
          stroke(config.eyeColor, 1.4, '#06b6d4', 60),
          fill('#ffffff', '#ffffff', 0),
        ]),
      );
    }

    parts.push(
      group(`${side}-pupil`, buildPupilShape(config, emotion, cx, cy)),
      group(`${side}-iris-rim`, [
        ellipse(cx, cy, irisD, irisD),
        stroke(hslSafeOutline, 1.5, hslSafeOutline, 42),
        fill('#ffffff', '#ffffff', 0),
      ]),
      group(`${side}-catchlight`, [ellipse(cx - 5, cy - 6, 9, 11), fill('#ffffff')]),
      group(`${side}-catchlight-secondary`, [ellipse(cx + 5, cy + 5, 4.5, 5.5), fill('#ffffff', '#ffffff', 78)]),
      group(`${side}-catchlight-sparkle`, [ellipse(cx - 8, cy + 3, 2.4, 2.4), fill('#ffffff', '#ffffff', 70)]),
      // pink tear duct at the inner corner
      group(`${side}-tear-duct`, [ellipse(innerX - dir * 3, cy + 3, 6, 7), fill('#fb7185', '#fb7185', 48)]),
      // lower lash line
      group(`${side}-lower-lash`, [
        linePath([
          [outerX + dir * 2, cy + halfH - 2],
          [cx, cy + halfH + 1],
          [innerX, cy + halfH - 3],
        ]),
        stroke(hslSafeOutline, 2, hslSafeOutline, 70),
      ]),
      // double-eyelid crease above the lash
      group(`${side}-eyelid-crease`, [linePath(creaseTop), stroke(hslSafeOutline, 1.6, hslSafeOutline, 45)]),
      // fanned eyelashes at the outer corner
      group(`${side}-lashes`, [
        linePath([
          [outerX - dir * 2, cy - halfH + 1],
          [outerX + dir * 9, cy - halfH - 9],
        ]),
        linePath([
          [outerX, cy - halfH + 4],
          [outerX + dir * 13, cy - halfH - 4],
        ]),
        linePath([
          [outerX + dir * 2, cy - halfH + 8],
          [outerX + dir * 15, cy - halfH + 2],
        ]),
        stroke(hslSafeOutline, 2.4, hslSafeOutline),
      ]),
      // primary upper lash line on top
      group(`${side}-upper-lash`, [linePath(lashTop), stroke(hslSafeOutline, lashWidth, hslSafeOutline)]),
    );

    return parts;
  };

  const leftEye: LottieValue[] = eyeAssembly(156, 176, 'left');
  const rightEye: LottieValue[] = eyeAssembly(244, 176, 'right');

  if (emotion === 'angry') {
    leftEye.push(
      group('left-eye-cut', [
        linePath([
          [134, 166],
          [178, 174],
        ]),
        stroke(hslSafeOutline, 4, hslSafeOutline),
      ]),
    );
    rightEye.push(
      group('right-eye-cut', [
        linePath([
          [222, 174],
          [266, 166],
        ]),
        stroke(hslSafeOutline, 4, hslSafeOutline),
      ]),
    );
  } else if (emotion === 'cry') {
    leftEye.push(
      group('left-waterline', [
        linePath([
          [138, 190],
          [172, 190],
        ]),
        stroke('#60a5fa', 3, '#60a5fa', 86),
      ]),
    );
    rightEye.push(
      group('right-waterline', [
        linePath([
          [226, 190],
          [260, 190],
        ]),
        stroke('#60a5fa', 3, '#60a5fa', 86),
      ]),
    );
  }

  return [group('left-eye', leftEye), group('right-eye', rightEye)];
};

const buildBrows = (config: AvatarConfig, emotion: Emotion): LottieValue[] => {
  const browColor = config.eyebrowColor;
  const width = config.eyebrowStyle === 'thick' ? 5 : config.eyebrowStyle === 'thin' ? 3 : 4;
  const sad = emotion === 'cry' || config.eyebrowStyle === 'sad';
  const left: Vec2[] =
    emotion === 'angry'
      ? [
          [134, 148],
          [158, 142],
          [180, 144],
        ]
      : sad
        ? [
            [136, 142],
            [158, 150],
            [180, 154],
          ]
        : emotion === 'smug'
          ? [
              [136, 142],
              [158, 140],
              [180, 146],
            ]
          : [
              [136, 144],
              [158, 142],
              [180, 146],
            ];
  const right: Vec2[] =
    emotion === 'angry'
      ? [
          [220, 144],
          [242, 142],
          [266, 148],
        ]
      : sad
        ? [
            [220, 154],
            [242, 150],
            [264, 142],
          ]
        : emotion === 'smug'
          ? [
              [220, 148],
              [242, 139],
              [264, 140],
            ]
          : [
              [220, 146],
              [242, 142],
              [264, 144],
            ];

  // Thin hair strands rising off each brow add texture over the flat stroke.
  const browStrands = (pts: Vec2[], side: 'left' | 'right'): LottieValue => {
    const d = side === 'left' ? -3 : 3;
    return group(`${side}-brow-strands`, [
      ...pts.map((p) => linePath([[p[0], p[1] + 1] as Vec2, [p[0] + d, p[1] - 7] as Vec2])),
      stroke(browColor, 1.6, '#1c1917', 80),
    ]);
  };

  return [
    group('left-brow', [linePath(left), stroke(browColor, width, '#1c1917')]),
    browStrands(left, 'left'),
    group('right-brow', [linePath(right), stroke(browColor, width, '#1c1917')]),
    browStrands(right, 'right'),
  ];
};

const buildMouth = (config: AvatarConfig, emotion: Emotion): LottieValue[] => {
  const mouthColor = '#1c1917';
  // Each shape lives in its own group so a fill never bleeds onto a sibling path.
  if (emotion === 'shocked') {
    return [
      group('mouth-shock', [ellipse(200, 222, 34, 44), fill(mouthColor), stroke(mouthColor, 1.5, mouthColor, 60)]),
      group('mouth-shock-tongue', [ellipse(200, 234, 20, 14), fill('#fb7185', '#fb7185', 90)]),
      group('mouth-shock-shine', [ellipse(200, 212, 15, 9), fill('#ffffff', '#ffffff', 26)]),
    ];
  }
  if (emotion === 'cry' || emotion === 'dizzy') {
    const w = emotion === 'cry' ? 28 : 24;
    const h = emotion === 'cry' ? 34 : 28;
    return [
      group('mouth-sob', [ellipse(200, 224, w, h), fill(mouthColor), stroke(mouthColor, 1)]),
      group('mouth-sob-tongue', [ellipse(200, 224 + h * 0.22, w * 0.62, h * 0.32), fill('#fb7185', '#fb7185', 85)]),
      group('mouth-sob-shine', [ellipse(200, 224 - h * 0.24, w * 0.42, 5), fill('#ffffff', '#ffffff', 22)]),
    ];
  }
  if (emotion === 'angry') {
    return [
      group('mouth-angry', [
        linePath([
          [178, 226],
          [200, 218],
          [222, 226],
        ]),
        stroke(mouthColor, 4),
      ]),
      group('mouth-angry-teeth', [
        linePath([
          [184, 224],
          [216, 224],
        ]),
        stroke('#ffffff', 2, '#ffffff', 70),
      ]),
    ];
  }
  const points: Vec2[] =
    emotion === 'smug'
      ? [
          [178, 218],
          [196, 225],
          [222, 216],
        ]
      : emotion === 'happy' || emotion === 'love' || emotion === 'starry' || emotion === 'cool'
        ? [
            [176, 216],
            [200, 234],
            [224, 216],
          ]
        : [
            [182, 224],
            [200, 220],
            [218, 224],
          ];
  const result: LottieValue[] = [group('mouth', [linePath(points), stroke(mouthColor, 4)])];

  // Sheen along the lower lip just under the smile.
  result.push(
    group('lip-highlight', [
      linePath([
        [points[0][0] + 8, points[0][1] + 6],
        [points[1][0], points[1][1] + 5],
        [points[2][0] - 8, points[2][1] + 6],
      ]),
      stroke('#ffffff', 1.6, '#ffffff', 28),
    ]),
  );

  if (config.hasFangs && (emotion === 'happy' || emotion === 'smug' || emotion === 'love')) {
    result.push(
      group('fangs', [
        smoothPath(
          [
            [188, 219],
            [194, 232],
            [199, 219],
          ],
          true,
          0.08,
        ),
        smoothPath(
          [
            [206, 219],
            [212, 232],
            [218, 219],
          ],
          true,
          0.08,
        ),
        fill('#ffffff'),
      ]),
    );
  }
  return result;
};

const buildAccessoryShapes = (config: AvatarConfig): LottieValue[] => {
  const color = config.accessoryColor;
  switch (config.accessoryStyle) {
    case 'horns':
      return [
        group('horn-left', [
          smoothPath(
            [
              [132, 110],
              [92, 46],
              [72, 110],
            ],
            true,
            0.18,
          ),
          fill(color, '#ef4444'),
          stroke(hslSafeOutline, 3),
        ]),
        group('horn-right', [
          smoothPath(
            [
              [268, 110],
              [308, 46],
              [328, 110],
            ],
            true,
            0.18,
          ),
          fill(color, '#ef4444'),
          stroke(hslSafeOutline, 3),
        ]),
      ];
    case 'neko-ears':
      return [
        group('neko-left', [
          smoothPath(
            [
              [132, 106],
              [72, 38],
              [106, 126],
            ],
            true,
            0.16,
          ),
          fill(color, '#f43f5e'),
          stroke(hslSafeOutline, 3),
          smoothPath(
            [
              [116, 104],
              [90, 62],
              [106, 112],
            ],
            true,
            0.16,
          ),
          fill('#ffffff', '#ffffff', 30),
        ]),
        group('neko-right', [
          smoothPath(
            [
              [268, 106],
              [328, 38],
              [294, 126],
            ],
            true,
            0.16,
          ),
          fill(color, '#f43f5e'),
          stroke(hslSafeOutline, 3),
          smoothPath(
            [
              [284, 104],
              [310, 62],
              [294, 112],
            ],
            true,
            0.16,
          ),
          fill('#ffffff', '#ffffff', 30),
        ]),
      ];
    case 'glasses':
      return [
        group('glasses', [
          ellipse(156, 176, 48, 42),
          ellipse(244, 176, 48, 42),
          linePath([
            [180, 176],
            [220, 176],
          ]),
          stroke(color, 4, '#111827'),
          fill('#ffffff', '#ffffff', 0),
        ]),
      ];
    case 'headphones':
      return [
        group('headphone-band', [
          linePath([
            [96, 154],
            [130, 88],
            [200, 70],
            [270, 88],
            [304, 154],
          ]),
          stroke('#27272a', 8),
        ]),
        group('headphone-left', [ellipse(94, 156, 28, 58), fill(color, '#06b6d4'), stroke('#27272a', 4)]),
        group('headphone-right', [ellipse(306, 156, 28, 58), fill(color, '#06b6d4'), stroke('#27272a', 4)]),
      ];
    case 'angel-halo':
      return [group('halo', [ellipse(200, 56, 116, 24), stroke(color, 6, '#facc15'), fill('#ffffff', '#ffffff', 0)])];
    case 'fox-mask':
      return [
        group('fox-mask', [
          smoothPath(
            [
              [284, 112],
              [324, 92],
              [346, 136],
              [332, 190],
              [286, 206],
              [266, 156],
            ],
            true,
            0.18,
          ),
          fill('#ffffff'),
          stroke(hslSafeOutline, 3),
        ]),
        group('fox-mark', [
          linePath([
            [298, 132],
            [322, 120],
            [338, 132],
          ]),
          stroke('#ef4444', 4, '#ef4444'),
        ]),
        group('fox-eye', [ellipse(312, 154, 22, 12), fill(hslSafeOutline, hslSafeOutline, 86)]),
      ];
    default:
      return [];
  }
};

const buildRageMark = (): LottieValue[] => [
  group('rage-mark', [
    linePath([
      [244, 112],
      [274, 104],
    ]),
    linePath([
      [244, 128],
      [274, 136],
    ]),
    linePath([
      [250, 100],
      [246, 142],
    ]),
    linePath([
      [266, 100],
      [270, 142],
    ]),
    stroke('#dc2626', 5, '#dc2626'),
  ]),
];

const musicNote = (cx: number, cy: number, color: string): LottieValue[] => [
  group('music-note', [
    linePath([
      [cx, cy + 24],
      [cx, cy - 14],
      [cx + 28, cy - 8],
      [cx + 28, cy + 28],
    ]),
    ellipse(cx - 4, cy + 26, 18, 14),
    ellipse(cx + 24, cy + 30, 18, 14),
    stroke(color, 4, color),
    fill(color, color, 22),
  ]),
];

const exclamationShape = (): LottieValue[] => [
  group('shock-exclamation', [
    rect(200, 56, 12, 44, 6),
    ellipse(200, 84, 14, 14),
    fill('#facc15', '#facc15'),
    stroke(hslSafeOutline, 2, hslSafeOutline, 70),
  ]),
];

const buildEmotionOverlayLayers = (
  spec: TelegramStickerSpec,
  preset: TelegramEmotionAnimationPreset,
  firstIndex: number,
): LottieValue[] => {
  const layers: LottieValue[] = [];
  const add = (name: string, shapes: LottieValue[], motion: StickerLayerMotion) => {
    layers.push(layer(firstIndex + layers.length, name, shapes, motion));
  };

  if (spec.emotion === 'happy') {
    add('happy-pop-left', [group('spark-left', [sparklePath(116, 140, 14), fill('#fbbf24')])], {
      ...preset.overlay,
      anchor: [116, 140],
      position: [
        [0, 0, 8],
        [16, -6, -10],
        [42, 2, 0],
        [90, 0, 8],
        [118, -6, -10],
        [180, 0, 8],
      ],
      opacity: [
        [0, 0],
        [12, 100],
        [50, 0],
        [96, 0],
        [112, 100],
        [150, 0],
        [180, 0],
      ],
    });
    add('happy-pop-right', [group('spark-right', [sparklePath(284, 140, 14), fill('#fbbf24')])], {
      ...preset.overlay,
      anchor: [284, 140],
      position: [
        [0, 0, 8],
        [20, 8, -10],
        [46, -2, 0],
        [90, 0, 8],
        [122, 8, -10],
        [180, 0, 8],
      ],
      opacity: [
        [0, 0],
        [16, 100],
        [54, 0],
        [98, 0],
        [118, 100],
        [154, 0],
        [180, 0],
      ],
    });
  } else if (spec.emotion === 'love') {
    add('love-heart-left', [group('heart-left', [heartPath(102, 132, 18), fill('#ec4899')])], {
      ...preset.overlay,
      anchor: [102, 132],
      position: [
        [0, 0, 18],
        [42, -8, -18],
        [90, -2, -32],
        [134, 8, -8],
        [180, 0, 18],
      ],
      opacity: [
        [0, 0],
        [10, 100],
        [92, 100],
        [114, 0],
        [134, 100],
        [164, 100],
        [180, 0],
      ],
    });
    add('love-heart-right', [group('heart-right', [heartPath(300, 130, 18), fill('#f43f5e')])], {
      ...preset.overlay,
      anchor: [300, 130],
      position: [
        [0, 0, 14],
        [36, 8, -20],
        [88, 0, -34],
        [132, -8, -8],
        [180, 0, 14],
      ],
      opacity: [
        [0, 0],
        [12, 100],
        [88, 100],
        [110, 0],
        [132, 100],
        [164, 100],
        [180, 0],
      ],
    });
  } else if (spec.emotion === 'starry') {
    add('starry-spark-left', [group('star-left', [sparklePath(116, 146, 18), fill('#fbbf24')])], {
      ...preset.overlay,
      anchor: [116, 146],
      rotation: [
        [0, 0],
        [44, 90],
        [90, 180],
        [136, 270],
        [180, 360],
      ],
      opacity: [
        [0, 30],
        [22, 100],
        [44, 40],
        [92, 100],
        [130, 38],
        [180, 30],
      ],
    });
    add('starry-spark-right', [group('star-right', [sparklePath(286, 146, 18), fill('#fde047')])], {
      ...preset.overlay,
      anchor: [286, 146],
      rotation: [
        [0, 0],
        [44, -90],
        [90, -180],
        [136, -270],
        [180, -360],
      ],
      opacity: [
        [0, 40],
        [26, 100],
        [58, 35],
        [108, 100],
        [150, 42],
        [180, 40],
      ],
    });
  } else if (spec.emotion === 'smug') {
    add('smug-glint', [group('smug-glint-shape', [sparklePath(270, 134, 12), fill('#fef08a')])], {
      ...preset.overlay,
      anchor: [270, 134],
      scale: [
        [0, 48],
        [46, 124],
        [78, 60],
        [130, 118],
        [180, 48],
      ],
      rotation: [
        [0, 0],
        [78, 45],
        [130, -20],
        [180, 0],
      ],
    });
  } else if (spec.emotion === 'shocked') {
    add('shock-alert', exclamationShape(), {
      ...preset.overlay,
      anchor: [200, 64],
      opacity: [
        [0, 0],
        [8, 100],
        [130, 100],
        [180, 0],
      ],
    });
  } else if (spec.emotion === 'angry') {
    add('angry-rage-mark', buildRageMark(), {
      ...preset.overlay,
      anchor: [262, 120],
      opacity: [
        [0, 55],
        [14, 100],
        [32, 70],
        [82, 100],
        [122, 70],
        [146, 100],
        [180, 55],
      ],
    });
  } else if (spec.emotion === 'cry') {
    add('cry-tear-left', [group('tear-left', [tearDropPath(152, 204, 10), fill('#60a5fa', '#60a5fa', 94)])], {
      ...preset.overlay,
      anchor: [152, 204],
      position: [
        [0, 0, -8],
        [54, -2, 54],
        [92, -4, 82],
        [126, 0, 0],
        [180, 0, -8],
      ],
    });
    add('cry-tear-right', [group('tear-right', [tearDropPath(248, 204, 10), fill('#38bdf8', '#38bdf8', 94)])], {
      ...preset.overlay,
      anchor: [248, 204],
      position: [
        [0, 0, 8],
        [40, 2, 58],
        [78, 4, 86],
        [116, 0, -4],
        [180, 0, 8],
      ],
      opacity: [
        [0, 0],
        [8, 100],
        [76, 100],
        [92, 0],
        [116, 100],
        [164, 100],
        [180, 0],
      ],
    });
  } else if (spec.emotion === 'cool') {
    add('cool-note-left', musicNote(100, 112, '#d946ef'), {
      ...preset.overlay,
      anchor: [100, 112],
      scale: [
        [0, 72],
        [42, 110],
        [78, 92],
        [116, 78],
        [180, 72],
      ],
    });
    add('cool-note-right', musicNote(302, 118, '#38bdf8'), {
      ...preset.overlay,
      anchor: [302, 118],
      position: [
        [0, 0, 24],
        [36, 8, -18],
        [70, -4, -34],
        [112, -8, 20],
        [180, 0, 24],
      ],
      opacity: [
        [0, 0],
        [10, 100],
        [70, 100],
        [88, 0],
        [112, 100],
        [158, 100],
        [180, 0],
      ],
      scale: [
        [0, 62],
        [36, 104],
        [70, 88],
        [112, 72],
        [180, 62],
      ],
    });
    add(
      'cool-shades-glint',
      [
        group('glint', [
          linePath([
            [138, 166],
            [166, 162],
          ]),
          linePath([
            [230, 164],
            [258, 168],
          ]),
          stroke('#ffffff', 3, '#ffffff', 92),
        ]),
      ],
      {
        anchor: [200, 170],
        position: [
          [0, -16, 0],
          [18, 18, 0],
          [40, 32, 0],
          [90, -16, 0],
          [116, 18, 0],
          [140, 32, 0],
          [180, -16, 0],
        ],
        opacity: [
          [0, 0],
          [12, 100],
          [34, 0],
          [90, 0],
          [110, 100],
          [136, 0],
          [180, 0],
        ],
      },
    );
  } else if (spec.emotion === 'dizzy') {
    add(
      'dizzy-spiral',
      [group('spiral', [spiralPath(200, 66, 2.5, 44), stroke('#facc15', 5, '#facc15'), fill('#ffffff', '#ffffff', 0)])],
      {
        ...preset.overlay,
        anchor: [200, 66],
        opacity: [
          [0, 65],
          [45, 100],
          [90, 70],
          [135, 100],
          [180, 65],
        ],
      },
    );
  }

  return layers;
};

export {
  buildHairShapes,
  buildFrontHairShapes,
  buildBodyShapes,
  buildHeadShapes,
  buildEyes,
  buildBrows,
  buildMouth,
  buildBlushShapes,
  buildAccessoryShapes,
  buildEmotionOverlayLayers,
};
