import { ControlMode } from "../types";

export class InputManager {
  private isTouchDevice: boolean = false;
  private currentMode: ControlMode = "auto";
  private paddleTargetXNormalized: number = 0.5; // 0.0 (left) to 1.0 (right)
  private fireRequested: boolean = false;
  private pauseRequested: boolean = false;
  private canvasRect: DOMRect | null = null;

  // Active keyboard state
  private keysDown: Set<string> = new Set();
  private keyMovementStep: number = 0.022;

  constructor() {
    this.detectPlatform();
    this.attachDesktopListeners();
  }

  public detectPlatform(): boolean {
    if (typeof window === "undefined") return false;

    const hasTouchPoints = typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
    const hasCoarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    this.isTouchDevice = hasTouchPoints || hasCoarsePointer || isMobileUA;
    return this.isTouchDevice;
  }

  public setControlMode(mode: ControlMode) {
    this.currentMode = mode;
  }

  public getControlMode(): ControlMode {
    return this.currentMode;
  }

  // Returns whether the virtual joystick should be rendered
  public shouldShowVirtualJoystick(): boolean {
    if (this.currentMode === "touch") return true;
    if (this.currentMode === "mouse_keyboard") return false;
    // 'auto' mode: only show if portable/touch detected
    return this.isTouchDevice;
  }

  public isPortableDetected(): boolean {
    return this.isTouchDevice;
  }

  public updateCanvasRect(rect: DOMRect) {
    this.canvasRect = rect;
  }

  // Desktop Mouse Movement
  public handleMouseMove(clientX: number) {
    if (!this.canvasRect) return;
    const relativeX = clientX - this.canvasRect.left;
    const normalized = relativeX / this.canvasRect.width;
    this.paddleTargetXNormalized = Math.max(0, Math.min(1, normalized));
  }

  // Virtual Joystick / Touch Slider delta or absolute value
  public handleJoystickValue(normalizedX: number) {
    this.paddleTargetXNormalized = Math.max(0, Math.min(1, normalizedX));
  }

  public requestFire() {
    this.fireRequested = true;
  }

  public consumeFire(): boolean {
    const val = this.fireRequested;
    this.fireRequested = false;
    return val;
  }

  public requestPauseToggle() {
    this.pauseRequested = true;
  }

  public consumePause(): boolean {
    const val = this.pauseRequested;
    this.pauseRequested = false;
    return val;
  }

  public getTargetPaddleX(): number {
    // Process keyboard continuous holding
    if (this.keysDown.has("ArrowLeft") || this.keysDown.has("KeyA") || this.keysDown.has("a")) {
      this.paddleTargetXNormalized = Math.max(0, this.paddleTargetXNormalized - this.keyMovementStep);
    }
    if (this.keysDown.has("ArrowRight") || this.keysDown.has("KeyD") || this.keysDown.has("d")) {
      this.paddleTargetXNormalized = Math.min(1, this.paddleTargetXNormalized + this.keyMovementStep);
    }

    return this.paddleTargetXNormalized;
  }

  private attachDesktopListeners() {
    if (typeof window === "undefined") return;

    window.addEventListener("keydown", (e) => {
      this.keysDown.add(e.code);
      this.keysDown.add(e.key);

      if (e.code === "Space") {
        e.preventDefault();
        this.fireRequested = true;
      }
      if (e.code === "KeyP" || e.key === "p" || e.key === "P") {
        this.pauseRequested = true;
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keysDown.delete(e.code);
      this.keysDown.delete(e.key);
    });
  }
}

export const inputManager = new InputManager();
