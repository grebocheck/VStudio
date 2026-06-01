export interface AvatarConfig {
  skinColor: string;
  eyeColor: string;
  pupilStyle: 'round' | 'star' | 'heart' | 'slit';
  pupilColor: string;
  eyebrowStyle: 'normal' | 'thick' | 'thin' | 'sad';
  eyebrowColor: string;
  hairStyleBang: 'classic' | 'side' | 'center-part' | 'short' | 'hime' | 'spiky' | 'curly-bangs' | 'cross-bangs';
  hairStyleBack: 'straight' | 'tails' | 'short' | 'curly' | 'braids' | 'hime-long' | 'drill-tails' | 'wavy';
  hairColor: string;
  hairHighlightColor: string;
  clothingStyle: 'hoodie' | 'kimono' | 'suit' | 'cyber-armor' | 'goth-dress' | 'druid-cloak' | 'sailor-fuku' | 'sweater' | 'maid';
  clothingColor1: string;
  clothingColor2: string;
  accessoryStyle: 'none' | 'headphones' | 'horns' | 'glasses' | 'neko-ears' | 'angel-halo' | 'fox-mask';
  accessoryColor: string;
  backgroundStyle: 'gaming' | 'nebula' | 'green-screen' | 'dark-studio';
  name: string;
  lore: string;
  // Expanded rich configurations
  blushOpacity: number; // 0 to 1
  blushColor: string; // HEX
  hasFangs: boolean;
  earStyle: 'normal' | 'elf' | 'pointy';
  hairGradient: 'none' | 'linear' | 'sunset' | 'indigo-fade';
  accessoryGlow: boolean;
  
  // Custom proportions variables
  headSize?: number; // 0.8 to 1.2
  neckWidth?: number; // 0.6 to 1.4
  neckHeight?: number; // 0.6 to 1.4
  shoulderWidth?: number; // 0.7 to 1.3
  clothingPrint?: 'none' | 'cat' | 'star' | 'heart' | 'cyber' | 'cross';
  activeEmotion?: 'none' | 'happy' | 'angry' | 'cry' | 'shocked' | 'smug' | 'love' | 'starry' | 'squint' | 'depressed' | 'dizzy' | 'cool' | 'scared' | 'sleepy' | 'shy' | 'relaxed';
  artStyle?: 'classic' | 'anime' | 'retro';
}

export interface RigParams {
  angleX: number; // -30 to 30 (degrees yaw)
  angleY: number; // -30 to 30 (degrees pitch)
  angleZ: number; // -15 to 15 (degrees roll)
  eyeLOpen: number; // 0 to 1
  eyeROpen: number; // 0 to 1
  pupilX: number; // -1 to 1
  pupilY: number; // -1 to 1
  mouthOpen: number; // 0 to 1
  mouthForm: number; // -1 to 1 (-1 sad, 1 happy/smile)
  eyebrowY: number; // -5 to 5 px
  breath: number; // 0 to 1
  bodyX: number; // -15 to 15 px
  hairSwayX?: number; // Physics secondary sway
  hairSwayY?: number; // Physics vertical bounce
  activeEmotion?: 'none' | 'happy' | 'angry' | 'cry' | 'shocked' | 'smug' | 'love' | 'starry' | 'squint' | 'depressed' | 'dizzy' | 'cool' | 'scared' | 'sleepy' | 'shy' | 'relaxed';
  tongueOut?: number; // 0 to 1
}

export interface PresetAvatar {
  id: string;
  name: string;
  config: AvatarConfig;
}
