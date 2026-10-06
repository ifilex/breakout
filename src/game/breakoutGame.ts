import {
  Ball,
  Paddle,
  PowerUp,
  LaserBeam,
  Particle,
  LevelDefinition,
  ColorPalette,
  PowerUpType,
} from "../types";
import { LEVELS } from "./levelData";
import { soundEngine } from "../engine/soundEngine";
import { VulkanMetalRHI } from "../engine/vulkanMetalRHI";
import { CognitiveTracker } from "../cognitive/cognitiveTracker";
import { inputManager } from "../input/inputManager";

export interface BrickEntity {
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  type: number; // 1: normal, 2: sturdy, 3: armored, 4: TNT, 5: indestructible, 6: powerup
  points: number;
  color: string;
  highlightColor: string;
  shadowColor: string;
  isExplosive: boolean;
  isIndestructible: boolean;
  powerUpType?: PowerUpType;
}

export class BreakoutGame {
  public readonly width: number = 800;
  public readonly height: number = 600;

  // Game state
  public score: number = 0;
  public lives: number = 3;
  public currentLevelNumber: number = 1;
  public isPaused: boolean = false;
  public isGameOver: boolean = false;
  public isLevelWon: boolean = false;
  public isWaitingToLaunch: boolean = true;

  // Entities
  public paddle: Paddle;
  public paddleVx: number = 0;
  public balls: Ball[] = [];
  public bricks: BrickEntity[] = [];
  public powerUps: PowerUp[] = [];
  public lasers: LaserBeam[] = [];
  public particles: Particle[] = [];

  // Cognitive tracker
  public cognitiveTracker: CognitiveTracker;

  // Palette & Visuals
  public palette: ColorPalette = "vga";
  public crtEnabled: boolean = true;

  // Callbacks
  public onStateChange?: () => void;
  public onLevelCompleteCallback?: (level: number, score: number) => void;
  public onGameOverCallback?: (finalScore: number, level: number) => void;

  constructor(initialLevel: number = 1, cognitiveTracker?: CognitiveTracker) {
    this.currentLevelNumber = Math.max(1, Math.min(LEVELS.length, initialLevel));
    this.cognitiveTracker = cognitiveTracker || new CognitiveTracker();

    this.paddle = {
      x: 350,
      y: 545,
      width: 100,
      height: 15,
      targetX: 350,
      speed: 14,
      hasLaser: false,
      laserAmmo: 0,
      hasMagnet: false,
      activeEffects: {
        laserTimer: 0,
        wideTimer: 0,
        slowTimer: 0,
        fireballTimer: 0,
      },
    };

    this.initLevel(this.currentLevelNumber);
  }

  public initLevel(levelNumber: number) {
    this.currentLevelNumber = Math.max(1, Math.min(LEVELS.length, levelNumber));
    this.isLevelWon = false;
    this.isWaitingToLaunch = true;
    this.balls = [];
    this.powerUps = [];
    this.lasers = [];
    this.particles = [];

    // Reset paddle position
    this.paddle.width = 100;
    this.paddle.x = this.width / 2 - this.paddle.width / 2;
    this.paddle.targetX = this.paddle.x;
    this.paddle.hasLaser = false;
    this.paddle.hasMagnet = false;
    this.paddle.activeEffects = {
      laserTimer: 0,
      wideTimer: 0,
      slowTimer: 0,
      fireballTimer: 0,
    };

    // Spawn initial ball resting on paddle
    this.spawnBall(true);

    // Build brick entities from level definition
    const levelDef = LEVELS[this.currentLevelNumber - 1];
    this.buildBricksFromLayout(levelDef);

    if (this.onStateChange) this.onStateChange();
  }

  private spawnBall(stuckToPaddle: boolean = false) {
    const levelDef = LEVELS[this.currentLevelNumber - 1] || LEVELS[0];
    const speed = levelDef.ballBaseSpeed;
    const initialAngle = (Math.random() * 0.5 - 0.25); // -14 to +14 deg from vertical

    const ball: Ball = {
      id: `ball-${Date.now()}-${Math.random()}`,
      x: this.paddle.x + this.paddle.width / 2,
      y: this.paddle.y - 10,
      vx: Math.sin(initialAngle) * speed,
      vy: -Math.cos(initialAngle) * speed,
      radius: 6,
      speed: speed,
      isFireball: false,
      isStuckToPaddle: stuckToPaddle,
      stuckOffsetX: this.paddle.width / 2,
      consecutiveWallBounces: 0,
      spin: 0,
      trail: [],
    };
    this.balls.push(ball);
  }

  private buildBricksFromLayout(levelDef: LevelDefinition) {
    this.bricks = [];
    const rows = levelDef.brickLayout.length;
    const cols = levelDef.brickLayout[0].length;

    const marginTop = 65;
    const marginSide = 45;
    const totalPlayWidth = this.width - marginSide * 2;
    const brickSpacing = 4;
    const brickWidth = (totalPlayWidth - (cols - 1) * brickSpacing) / cols;
    const brickHeight = 18;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const type = levelDef.brickLayout[r][c];
        if (type === 0) continue;

        const bx = marginSide + c * (brickWidth + brickSpacing);
        const by = marginTop + r * (brickHeight + brickSpacing);

        const colors = this.getBrickColors(type, r);
        let hp = 1;
        let points = 100;
        let isExplosive = false;
        let isIndestructible = false;
        let powerUpType: PowerUpType | undefined = undefined;

        if (type === 2) {
          hp = 2;
          points = 200;
        } else if (type === 3) {
          hp = 3;
          points = 350;
        } else if (type === 4) {
          hp = 1;
          points = 300;
          isExplosive = true;
        } else if (type === 5) {
          hp = -1;
          isIndestructible = true;
          points = 0;
        } else if (type === 6) {
          hp = 1;
          points = 250;
          powerUpType = this.getRandomPowerUpType();
        }

        this.bricks.push({
          x: bx,
          y: by,
          width: brickWidth,
          height: brickHeight,
          hp,
          maxHp: hp,
          type,
          points,
          color: colors.base,
          highlightColor: colors.highlight,
          shadowColor: colors.shadow,
          isExplosive,
          isIndestructible,
          powerUpType,
        });
      }
    }
  }

  private getRandomPowerUpType(): PowerUpType {
    const list: PowerUpType[] = [
      "multiball",
      "laser",
      "wide_paddle",
      "fireball",
      "slow_motion",
      "magnet",
      "extra_life",
    ];
    return list[Math.floor(Math.random() * list.length)];
  }

  private getBrickColors(
    type: number,
    row: number
  ): { base: string; highlight: string; shadow: string } {
    if (type === 4) {
      // TNT
      return { base: "#D32F2F", highlight: "#FF6659", shadow: "#9A0007" };
    }
    if (type === 5) {
      // Indestructible Titanium
      return { base: "#546E7A", highlight: "#819CA9", shadow: "#29434E" };
    }
    if (type === 6) {
      // Powerup Mystery
      return { base: "#9C27B0", highlight: "#D05CE3", shadow: "#6A0080" };
    }

    if (this.palette === "cga") {
      const cgaRows = [
        { base: "#00AAAA", highlight: "#55FFFF", shadow: "#005555" }, // Cyan
        { base: "#AA00AA", highlight: "#FF55FF", shadow: "#550055" }, // Magenta
        { base: "#AAAAAA", highlight: "#FFFFFF", shadow: "#555555" }, // White
      ];
      return cgaRows[row % cgaRows.length];
    }

    if (this.palette === "vulkan_metal") {
      const metalColors = [
        { base: "#FF5722", highlight: "#FF8A50", shadow: "#C41C00" }, // Vulkan Orange
        { base: "#00E5FF", highlight: "#6EFFE8", shadow: "#00B2CC" }, // Metal Cyan
        { base: "#7C4DFF", highlight: "#B47CFF", shadow: "#3F1DCB" }, // Violet compute
        { base: "#FFD600", highlight: "#FFFF52", shadow: "#C7A500" }, // Gold bus
      ];
      return metalColors[row % metalColors.length];
    }

    if (this.palette === "neon_cyber") {
      const cyberColors = [
        { base: "#FF007F", highlight: "#FF66B2", shadow: "#99004C" },
        { base: "#00F0FF", highlight: "#66F5FF", shadow: "#009099" },
        { base: "#39FF14", highlight: "#85FF6E", shadow: "#20990B" },
        { base: "#FFE600", highlight: "#FFF066", shadow: "#998A00" },
      ];
      return cyberColors[row % cyberColors.length];
    }

    // Default VGA Palette
    const vgaColors = [
      { base: "#E53935", highlight: "#FF6F60", shadow: "#AB000D" }, // Red
      { base: "#FB8C00", highlight: "#FFBD45", shadow: "#C25E00" }, // Orange
      { base: "#FDD835", highlight: "#FFFF72", shadow: "#C6A700" }, // Yellow
      { base: "#43A047", highlight: "#76D275", shadow: "#00701A" }, // Green
      { base: "#1E88E5", highlight: "#6AB7FF", shadow: "#005CB2" }, // Blue
      { base: "#8E24AA", highlight: "#C158DC", shadow: "#5C007A" }, // Purple
    ];
    return vgaColors[row % vgaColors.length];
  }

  // Primary Update Step with Sub-stepping for zero clipping
  public update(dtSeconds: number) {
    if (this.isPaused || this.isGameOver || this.isLevelWon) return;

    // Process player input
    const normalizedPaddleX = inputManager.getTargetPaddleX();
    const targetX = normalizedPaddleX * (this.width - this.paddle.width);
    const oldPaddleX = this.paddle.x;

    // Smooth paddle interpolation with low-latency responsiveness
    this.paddle.x += (targetX - this.paddle.x) * 0.45;
    this.paddle.x = Math.max(0, Math.min(this.width - this.paddle.width, this.paddle.x));
    this.paddleVx = this.paddle.x - oldPaddleX;

    // Send motion event to cognitive tracker to measure reaction latency
    if (Math.abs(this.paddle.x - oldPaddleX) > 1.5) {
      this.cognitiveTracker.onPaddleMotion(this.paddle.x);
    }

    // Process fire / launch request
    if (inputManager.consumeFire()) {
      if (this.isWaitingToLaunch) {
        this.launchBalls();
      } else if (this.paddle.hasLaser) {
        this.fireLasers();
      }
    }

    // Update active powerup timers
    this.updateActiveEffects(dtSeconds);

    // Update Lasers
    this.updateLasers();

    // Update PowerUp capsules
    this.updatePowerUps();

    // Update Balls & Physics
    this.updateBalls();

    // Update Debris Particles
    this.updateParticles();

    // Check Win Condition (no breakable bricks left)
    const breakableLeft = this.bricks.filter((b) => !b.isIndestructible && b.hp > 0).length;
    if (breakableLeft === 0 && !this.isLevelWon) {
      this.handleLevelWin();
    }
  }

  private launchBalls() {
    this.isWaitingToLaunch = false;
    for (const ball of this.balls) {
      if (ball.isStuckToPaddle) {
        ball.isStuckToPaddle = false;
        ball.consecutiveWallBounces = 0;
        const offset = (ball.stuckOffsetX || this.paddle.width / 2) - this.paddle.width / 2;
        const normalizedOffset = Math.max(-0.85, Math.min(0.85, offset / (this.paddle.width / 2)));
        // Upward angle between -35° and +35° from vertical (0 is straight UP, positive is RIGHT)
        // With spin/momentum from paddle movement
        const paddleSpin = Math.max(-0.25, Math.min(0.25, (this.paddleVx || 0) * 0.03));
        const launchAngle = normalizedOffset * 0.6 + paddleSpin + (Math.random() * 0.14 - 0.07);
        ball.vx = ball.speed * Math.sin(launchAngle);
        ball.vy = -ball.speed * Math.cos(launchAngle);
        // Guarantee upward launch velocity
        if (ball.vy >= -ball.speed * 0.5) {
          ball.vy = -ball.speed * 0.75;
          ball.vx = Math.sign(ball.vx || 1) * Math.sqrt(Math.max(1, ball.speed * ball.speed - ball.vy * ball.vy));
        }
      }
    }
    soundEngine.playPaddleBounce();
  }

  private fireLasers() {
    if (this.paddle.laserAmmo <= 0) {
      this.paddle.hasLaser = false;
      return;
    }
    this.paddle.laserAmmo--;
    soundEngine.playLaser();

    // Spawn 2 laser beams from left and right blasters
    this.lasers.push(
      {
        id: `laser-${Date.now()}-1`,
        x: this.paddle.x + 8,
        y: this.paddle.y - 12,
        vy: -12,
        width: 4,
        height: 14,
      },
      {
        id: `laser-${Date.now()}-2`,
        x: this.paddle.x + this.paddle.width - 12,
        y: this.paddle.y - 12,
        vy: -12,
        width: 4,
        height: 14,
      }
    );

    if (this.paddle.laserAmmo <= 0) {
      this.paddle.hasLaser = false;
    }
  }

  private updateActiveEffects(dt: number) {
    // Wide paddle timer
    if (this.paddle.activeEffects.wideTimer > 0) {
      this.paddle.activeEffects.wideTimer -= dt;
      if (this.paddle.activeEffects.wideTimer <= 0) {
        this.paddle.width = 100;
      }
    }

    // Laser timer
    if (this.paddle.activeEffects.laserTimer > 0) {
      this.paddle.activeEffects.laserTimer -= dt;
      if (this.paddle.activeEffects.laserTimer <= 0) {
        this.paddle.hasLaser = false;
      }
    }

    // Fireball timer
    if (this.paddle.activeEffects.fireballTimer > 0) {
      this.paddle.activeEffects.fireballTimer -= dt;
      if (this.paddle.activeEffects.fireballTimer <= 0) {
        for (const b of this.balls) b.isFireball = false;
      }
    }
  }

  private updateLasers() {
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      laser.y += laser.vy;

      // Check collision with bricks
      let hit = false;
      for (const brick of this.bricks) {
        if (brick.hp <= 0 && !brick.isIndestructible) continue;

        if (
          laser.x + laser.width >= brick.x &&
          laser.x <= brick.x + brick.width &&
          laser.y <= brick.y + brick.height &&
          laser.y + laser.height >= brick.y
        ) {
          hit = true;
          this.damageBrick(brick);
          break;
        }
      }

      if (hit || laser.y < -20) {
        this.lasers.splice(i, 1);
      }
    }
  }

  private updatePowerUps() {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];
      p.y += p.vy;

      // Check paddle catch
      if (
        p.x + p.width >= this.paddle.x &&
        p.x <= this.paddle.x + this.paddle.width &&
        p.y + p.height >= this.paddle.y &&
        p.y <= this.paddle.y + this.paddle.height
      ) {
        this.applyPowerUp(p.type);
        this.powerUps.splice(i, 1);
        continue;
      }

      // Fell off screen
      if (p.y > this.height + 20) {
        this.powerUps.splice(i, 1);
      }
    }
  }

  private applyPowerUp(type: PowerUpType) {
    soundEngine.playPowerUp();
    this.score += 150;

    switch (type) {
      case "multiball":
        if (this.balls.length > 0) {
          const base = this.balls[0];
          this.balls.push(
            {
              ...base,
              id: `ball-${Date.now()}-a`,
              vx: -base.speed * 0.7,
              vy: -Math.abs(base.vy),
              trail: [],
            },
            {
              ...base,
              id: `ball-${Date.now()}-b`,
              vx: base.speed * 0.7,
              vy: -Math.abs(base.vy),
              trail: [],
            }
          );
        }
        break;

      case "laser":
        this.paddle.hasLaser = true;
        this.paddle.laserAmmo = 16;
        this.paddle.activeEffects.laserTimer = 15;
        break;

      case "wide_paddle":
        this.paddle.width = 145;
        this.paddle.activeEffects.wideTimer = 18;
        break;

      case "fireball":
        for (const b of this.balls) b.isFireball = true;
        this.paddle.activeEffects.fireballTimer = 12;
        break;

      case "magnet":
        this.paddle.hasMagnet = true;
        break;

      case "slow_motion":
        for (const b of this.balls) {
          b.speed = Math.max(3.5, b.speed * 0.75);
          b.vx *= 0.75;
          b.vy *= 0.75;
        }
        break;

      case "extra_life":
        this.lives++;
        break;
    }
  }

  private handleWallBounce(ball: Ball, surface: "left" | "right" | "top") {
    ball.consecutiveWallBounces = (ball.consecutiveWallBounces || 0) + 1;
    soundEngine.playWallBounce();

    // Spawn contact sparks on wall
    this.spawnSparks(ball.x, ball.y, surface === "top" ? "#FFD600" : "#00E5FF", 4);

    // 1. Enforce Minimum Vertical Velocity (Crucial fix: prevents infinite horizontal bouncing!)
    const minVy = Math.max(1.8, ball.speed * 0.30);
    if (Math.abs(ball.vy) < minVy) {
      ball.vy = (ball.vy >= 0 ? 1 : -1) * minVy;
      const signX = Math.sign(ball.vx) || 1;
      ball.vx = signX * Math.sqrt(Math.max(1, ball.speed * ball.speed - ball.vy * ball.vy));
    }

    // 2. Dynamic Angle Variation (angles naturally evolve instead of robotic infinite loops)
    const angleJitter = (Math.random() * 0.08 - 0.04);
    let currentAngle = Math.atan2(ball.vy, ball.vx);
    currentAngle += angleJitter;
    ball.vx = Math.cos(currentAngle) * ball.speed;
    ball.vy = Math.sin(currentAngle) * ball.speed;

    // 3. Anti-Trap / Anti-Infinite-Loop Watchdog
    // If bouncing between walls repeatedly without hitting bricks or paddle:
    if (ball.consecutiveWallBounces >= 3) {
      // Gently tilt trajectory downwards towards the paddle
      if (ball.y < this.paddle.y - 80) {
        ball.vy += 0.5;
      }
    }

    if (ball.consecutiveWallBounces >= 5) {
      // Direct forceful deflection towards paddle so it NEVER gets stuck
      ball.vy = Math.abs(ball.vy) + 1.2;
    }

    // Re-normalize velocity to ball speed
    const currentSpeed = Math.hypot(ball.vx, ball.vy);
    if (currentSpeed > 0) {
      ball.vx = (ball.vx / currentSpeed) * ball.speed;
      ball.vy = (ball.vy / currentSpeed) * ball.speed;
    }
  }

  private updateBalls() {
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];

      if (ball.isStuckToPaddle) {
        ball.x = this.paddle.x + (ball.stuckOffsetX || this.paddle.width / 2);
        ball.y = this.paddle.y - ball.radius - 1;
        continue;
      }

      // Record trail for Vulkan/Metal shader rendering
      ball.trail.unshift({ x: ball.x, y: ball.y, alpha: 0.8 });
      if (ball.trail.length > 8) ball.trail.pop();

      // Motion step
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Left and Right Wall Collision
      if (ball.x - ball.radius <= 0) {
        ball.x = ball.radius;
        ball.vx = Math.abs(ball.vx);
        this.handleWallBounce(ball, "left");
      } else if (ball.x + ball.radius >= this.width) {
        ball.x = this.width - ball.radius;
        ball.vx = -Math.abs(ball.vx);
        this.handleWallBounce(ball, "right");
      }

      // Top Ceiling Collision
      if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.vy = Math.abs(ball.vy);
        this.handleWallBounce(ball, "top");
        // Descent event for cognitive reaction tracking
        this.cognitiveTracker.onBallDescentInitiated();
      }

      // Paddle Collision
      if (
        ball.vy > 0 &&
        ball.y + ball.radius >= this.paddle.y &&
        ball.y - ball.radius <= this.paddle.y + this.paddle.height &&
        ball.x >= this.paddle.x - ball.radius &&
        ball.x <= this.paddle.x + this.paddle.width + ball.radius
      ) {
        // Reset wall bounce loop counter on paddle contact
        ball.consecutiveWallBounces = 0;

        // Cognitive measurement of hand-eye precision
        this.cognitiveTracker.onPaddleImpact(
          ball.x,
          this.paddle.x,
          this.paddle.width,
          ball.speed,
          this.currentLevelNumber,
          ball.y,
          this.height
        );

        if (this.paddle.hasMagnet) {
          ball.isStuckToPaddle = true;
          ball.stuckOffsetX = ball.x - this.paddle.x;
          soundEngine.playPaddleBounce();
          continue;
        }

        // --- AUTHENTIC BREAKOUT & ARKANOID ANGULAR DEFLECTION ---
        // 1. Calculate hit offset from paddle center (-1.0 to +1.0)
        const paddleCenter = this.paddle.x + this.paddle.width / 2;
        const halfWidth = this.paddle.width / 2;
        const hitOffset = (ball.x - paddleCenter) / halfWidth;
        const clampedOffset = Math.max(-0.96, Math.min(0.96, hitOffset));

        // 2. Paddle Movement / Inertia Spin ("English")
        // Moving the paddle while hitting adds dynamic lateral momentum
        const paddleSpin = Math.max(-0.35, Math.min(0.35, (this.paddleVx || 0) * 0.045));

        // 3. Progressive angle curve:
        // Center: bounces steep (~75°-85° up), predictable and controlled.
        // Mid-section: medium deflection (~45°-60°).
        // Outer tips: extreme acute angles (up to 74° from vertical),
        // shooting fast diagonally across the screen to create authentic Breakout difficulty!
        const maxAngleRad = (74 * Math.PI) / 180;
        const curvedOffset = Math.sign(clampedOffset) * Math.pow(Math.abs(clampedOffset), 1.15);
        let bounceAngle = curvedOffset * maxAngleRad + paddleSpin;
        bounceAngle = Math.max(-maxAngleRad, Math.min(maxAngleRad, bounceAngle));

        // 4. Slight speed increase on each rally (up to max 12.0)
        ball.speed = Math.min(12, ball.speed + 0.1);

        ball.vx = ball.speed * Math.sin(bounceAngle);
        ball.vy = -ball.speed * Math.cos(bounceAngle);

        // 5. Enforce minimum vertical velocity so the ball NEVER shoots completely horizontal
        const minVy = ball.speed * 0.28;
        if (Math.abs(ball.vy) < minVy) {
          ball.vy = -minVy;
          ball.vx = Math.sign(ball.vx || 1) * Math.sqrt(Math.max(1, ball.speed * ball.speed - ball.vy * ball.vy));
        }

        // Place ball cleanly above paddle
        ball.y = this.paddle.y - ball.radius - 1;

        soundEngine.playPaddleBounce();
        this.spawnSparks(ball.x, this.paddle.y, "#00E5FF", 6);
      }

      // Brick Collisions
      this.checkBallBrickCollisions(ball);

      // Bottom Loss Check
      if (ball.y - ball.radius > this.height) {
        this.balls.splice(i, 1);
      }
    }

    // If all balls lost
    if (this.balls.length === 0) {
      this.handleLifeLost();
    }
  }

  private checkBallBrickCollisions(ball: Ball) {
    for (let i = 0; i < this.bricks.length; i++) {
      const brick = this.bricks[i];
      if (brick.hp <= 0 && !brick.isIndestructible) continue;

      // AABB check
      const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
      const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
      const distX = ball.x - closestX;
      const distY = ball.y - closestY;
      const distSquared = distX * distX + distY * distY;

      if (distSquared < ball.radius * ball.radius) {
        // Hit detected! Progress made, reset wall loop counter
        ball.consecutiveWallBounces = 0;
        this.damageBrick(brick);

        // If not fireball, reflect ball
        if (!ball.isFireball) {
          const overlapX = ball.radius - Math.abs(distX);
          const overlapY = ball.radius - Math.abs(distY);

          // Subtle angular jitter on brick impact (+/- 2 degrees) to prevent standing loops
          const jitter = (Math.random() * 0.06 - 0.03);

          if (overlapX < overlapY) {
            ball.vx = -ball.vx;
            ball.x += (distX > 0 ? 1 : -1) * (overlapX + 1);
          } else {
            ball.vy = -ball.vy;
            ball.y += (distY > 0 ? 1 : -1) * (overlapY + 1);
            if (ball.vy > 0) {
              // Ball descending towards paddle, trigger cognitive measurement
              this.cognitiveTracker.onBallDescentInitiated();
            }
          }

          // Enforce minimum vertical velocity after brick bounce
          const minVy = ball.speed * 0.25;
          if (Math.abs(ball.vy) < minVy) {
            ball.vy = (ball.vy >= 0 ? 1 : -1) * minVy;
            const signX = Math.sign(ball.vx) || 1;
            ball.vx = signX * Math.sqrt(Math.max(1, ball.speed * ball.speed - ball.vy * ball.vy));
          }

          // Apply micro angular perturbation
          const currentSpd = Math.hypot(ball.vx, ball.vy);
          if (currentSpd > 0) {
            const angle = Math.atan2(ball.vy, ball.vx) + jitter;
            ball.vx = Math.cos(angle) * ball.speed;
            ball.vy = Math.sin(angle) * ball.speed;
          }
        }

        break;
      }
    }
  }

  private damageBrick(brick: BrickEntity) {
    if (brick.isIndestructible) {
      soundEngine.playWallBounce();
      this.spawnSparks(brick.x + brick.width / 2, brick.y + brick.height / 2, "#90A4AE", 4);
      return;
    }

    brick.hp--;
    soundEngine.playBrickHit(brick.hp / brick.maxHp);

    if (brick.hp <= 0) {
      this.score += brick.points;

      // Spawn debris particles
      this.spawnDebris(
        brick.x + brick.width / 2,
        brick.y + brick.height / 2,
        brick.color,
        8
      );

      // Handle TNT explosion chain reaction
      if (brick.isExplosive) {
        soundEngine.playExplosion();
        this.triggerExplosion(brick);
      }

      // Spawn PowerUp capsule if configured
      if (brick.powerUpType || Math.random() < 0.16) {
        const type = brick.powerUpType || this.getRandomPowerUpType();
        this.spawnPowerUp(brick.x + brick.width / 2 - 12, brick.y, type);
      }
    }
  }

  private triggerExplosion(centerBrick: BrickEntity) {
    const explosionRadius = 80;
    const cx = centerBrick.x + centerBrick.width / 2;
    const cy = centerBrick.y + centerBrick.height / 2;

    this.spawnSparks(cx, cy, "#FF3D00", 25);

    for (const other of this.bricks) {
      if (other.hp <= 0 || other.isIndestructible) continue;
      const ocx = other.x + other.width / 2;
      const ocy = other.y + other.height / 2;
      const d = Math.hypot(ocx - cx, ocy - cy);

      if (d <= explosionRadius) {
        other.hp = 0;
        this.score += other.points;
        this.spawnDebris(ocx, ocy, other.color, 6);
      }
    }
  }

  private spawnPowerUp(x: number, y: number, type: PowerUpType) {
    const colorMap: Record<PowerUpType, string> = {
      multiball: "#00E5FF",
      laser: "#FF1744",
      wide_paddle: "#76FF03",
      shrink_paddle: "#FF9100",
      fireball: "#FF3D00",
      slow_motion: "#E040FB",
      magnet: "#FFD600",
      extra_life: "#00E676",
    };

    const iconMap: Record<PowerUpType, string> = {
      multiball: "3x",
      laser: "LZR",
      wide_paddle: "< >",
      shrink_paddle: "><",
      fireball: "FIRE",
      slow_motion: "SLOW",
      magnet: "MAG",
      extra_life: "+1UP",
    };

    this.powerUps.push({
      id: `pwr-${Date.now()}-${Math.random()}`,
      x,
      y,
      width: 28,
      height: 14,
      vy: 2.2,
      type,
      color: colorMap[type],
      icon: iconMap[type],
    });
  }

  private spawnDebris(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color,
        alpha: 1,
        life: 0,
        maxLife: 20 + Math.random() * 20,
      });
    }
  }

  private spawnSparks(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2;
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 2,
        color,
        alpha: 1,
        life: 0,
        maxLife: 15 + Math.random() * 15,
      });
    }
  }

  private updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12; // Gravity
      p.life++;
      p.alpha = 1 - p.life / p.maxLife;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  private handleLifeLost() {
    this.lives--;
    soundEngine.playLifeLost();

    if (this.lives <= 0) {
      this.isGameOver = true;
      if (this.onGameOverCallback) {
        this.onGameOverCallback(this.score, this.currentLevelNumber);
      }
    } else {
      this.isWaitingToLaunch = true;
      this.spawnBall(true);
    }
    if (this.onStateChange) this.onStateChange();
  }

  private handleLevelWin() {
    this.isLevelWon = true;
    soundEngine.playVictory();
    this.score += 1000 * this.currentLevelNumber;

    if (this.onLevelCompleteCallback) {
      this.onLevelCompleteCallback(this.currentLevelNumber, this.score);
    }
    if (this.onStateChange) this.onStateChange();
  }

  // Vulkan/Metal Multiplatform RHI Rendering Pass
  public render(rhi: VulkanMetalRHI) {
    rhi.beginFrame();

    // Pass 1: Background & MS-DOS Grid Clear
    rhi.beginRenderPass({
      name: "Pass_Background_MSDOS_Grid",
      clearColor: "#05070B",
    });

    // Sub-grid lines typical of MS-DOS CAD / games
    for (let gx = 0; gx < this.width; gx += 40) {
      rhi.drawRect(gx, 0, 1, this.height, "rgba(255,255,255,0.02)");
    }
    for (let gy = 0; gy < this.height; gy += 40) {
      rhi.drawRect(0, gy, this.width, 1, "rgba(255,255,255,0.02)");
    }
    rhi.endRenderPass();

    // Pass 2: Bricks Render Pass
    rhi.beginRenderPass({ name: "Pass_MSDOS_Bricks" });
    for (const brick of this.bricks) {
      if (brick.hp <= 0 && !brick.isIndestructible) continue;
      rhi.drawMSDOSBrick(
        brick.x,
        brick.y,
        brick.width,
        brick.height,
        brick.color,
        brick.highlightColor,
        brick.shadowColor,
        brick.hp,
        brick.isExplosive
      );
    }
    rhi.endRenderPass();

    // Pass 3: Lasers & PowerUp Drops
    rhi.beginRenderPass({ name: "Pass_Projectiles_Powerups" });
    // PowerUp capsules
    for (const p of this.powerUps) {
      rhi.drawRect(p.x, p.y, p.width, p.height, p.color, "#FFFFFF", 1.5);
    }
    // Lasers
    for (const l of this.lasers) {
      rhi.drawRect(l.x, l.y, l.width, l.height, "#FF1744", "#FFA8A8", 1);
    }
    rhi.endRenderPass();

    // Pass 4: Paddle & Balls
    rhi.beginRenderPass({ name: "Pass_Paddle_Ball_PBR" });

    // Paddle body (MS-DOS styled beveled bar)
    const paddleHighlight = this.paddle.hasLaser ? "#FF6666" : "#A3E5FF";
    const paddleBase = this.paddle.hasLaser ? "#D32F2F" : "#00B0FF";
    const paddleShadow = "#005580";

    rhi.drawMSDOSBrick(
      this.paddle.x,
      this.paddle.y,
      this.paddle.width,
      this.paddle.height,
      paddleBase,
      paddleHighlight,
      paddleShadow,
      3
    );

    // If Laser equipped, render blasters
    if (this.paddle.hasLaser) {
      rhi.drawRect(this.paddle.x + 4, this.paddle.y - 6, 6, 8, "#FF1744");
      rhi.drawRect(this.paddle.x + this.paddle.width - 10, this.paddle.y - 6, 6, 8, "#FF1744");
    }

    // Balls with dynamic trail
    for (const ball of this.balls) {
      // Trail
      for (const t of ball.trail) {
        rhi.drawRect(
          t.x - ball.radius * 0.75,
          t.y - ball.radius * 0.75,
          ball.radius * 1.5,
          ball.radius * 1.5,
          ball.isFireball
            ? `rgba(255, 61, 0, ${t.alpha * 0.5})`
            : `rgba(0, 229, 255, ${t.alpha * 0.4})`
        );
      }

      // Ball head
      const ballColor = ball.isFireball ? "#FF3D00" : "#FFFFFF";
      const ballBorder = ball.isFireball ? "#FFEA00" : "#00E5FF";
      rhi.drawRect(
        ball.x - ball.radius,
        ball.y - ball.radius,
        ball.radius * 2,
        ball.radius * 2,
        ballColor,
        ballBorder,
        1.5
      );
    }
    rhi.endRenderPass();

    // Pass 5: Particle Emitter Compute Pass
    rhi.beginRenderPass({ name: "Pass_Metal_Compute_Particles", enableBlending: true, blendMode: "lighter" });
    rhi.drawParticleBatch(this.particles);
    rhi.endRenderPass();

    // Pass 6: CRT Scanlines and Phosphor Bloom
    if (this.crtEnabled) {
      rhi.applyCRTPostProcessing();
    }
  }
}
