export type PlatformType = "desktop" | "mobile" | "tablet";
export type ControlMode = "auto" | "touch" | "mouse_keyboard";

export type ColorPalette = "cga" | "ega" | "vga" | "vulkan_metal" | "neon_cyber";

export interface BrickType {
  hp: number; // 0 = broken, 1 = normal, 2 = sturdy, 3 = armored, -1 = indestructible
  maxHp: number;
  color: string;
  points: number;
  isExplosive?: boolean;
  isGhost?: boolean;
  powerUpType?: PowerUpType;
}

export type PowerUpType =
  | "multiball"
  | "laser"
  | "wide_paddle"
  | "shrink_paddle"
  | "fireball"
  | "slow_motion"
  | "magnet"
  | "extra_life";

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  type: PowerUpType;
  color: string;
  icon: string;
}

export interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
  isFireball: boolean;
  isStuckToPaddle?: boolean;
  stuckOffsetX?: number;
  consecutiveWallBounces?: number;
  spin?: number;
  trail: Array<{ x: number; y: number; alpha: number }>;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  targetX: number;
  speed: number;
  hasLaser: boolean;
  laserAmmo: number;
  hasMagnet: boolean;
  activeEffects: {
    laserTimer: number;
    wideTimer: number;
    slowTimer: number;
    fireballTimer: number;
  };
}

export interface LaserBeam {
  id: string;
  x: number;
  y: number;
  vy: number;
  width: number;
  height: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface LevelDefinition {
  levelNumber: number;
  name: string;
  subtitle: string;
  rows: number;
  cols: number;
  brickLayout: number[][]; // 0: empty, 1: normal, 2: sturdy, 3: armored, 4: TNT explosive, 5: indestructible, 6: mystery powerup
  ballBaseSpeed: number;
  targetAccuracy: number; // For cognitive benchmark
  targetReactionMs: number; // Expected reaction threshold in ms
}

export interface CognitiveMetrics {
  averageReactionTimeMs: number;
  reactionTimeHistory: number[];
  accuracyPercentage: number;
  anticipationScore: number;
  totalHits: number;
  perfectHits: number; // Hit within center 25% of paddle
  angularControlScore: number;
  cognitiveGrade: "S+" | "S" | "A" | "B" | "C" | "D";
  evaluatedSessions: number;
  reactionPercentile: number; // e.g. 94th percentile
  lastEvaluationTimestamp: number;
}

export interface CognitiveSample {
  timestamp: number;
  reactionTimeMs: number;
  offsetFromPaddleCenter: number; // -1 to 1
  ballSpeedAtImpact: number;
  level: number;
}

export interface EngineProfilerMetrics {
  fps: number;
  frameTimeMs: number;
  renderPassCount: number;
  commandBuffersRecorded: number;
  drawCalls: number;
  particleCount: number;
  activeShaders: string[];
  backendApi: "Vulkan RHI (Emulated WebGL2/Direct2D)" | "Metal RHI (Emulated WebGPU/Direct2D)";
  gpuMemoryEstKb: number;
  subMillisecondLatency: number;
}

export interface GameSaveState {
  userId: string;
  userName: string;
  currentLevel: number;
  highestLevelUnlocked: number;
  score: number;
  lives: number;
  highScore: number;
  soundEnabled: boolean;
  crtFilterEnabled: boolean;
  palette: ColorPalette;
  controlMode: ControlMode;
  cognitiveMetrics: CognitiveMetrics;
  lastSavedAt: string;
}
