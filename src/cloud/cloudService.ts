import { GameSaveState, CognitiveMetrics } from "../types";

const LOCAL_STORAGE_KEY = "vulkandos_breakout_save_v1";

const DEFAULT_COGNITIVE: CognitiveMetrics = {
  averageReactionTimeMs: 220,
  reactionTimeHistory: [240, 225, 215],
  accuracyPercentage: 82,
  anticipationScore: 78,
  totalHits: 0,
  perfectHits: 0,
  angularControlScore: 80,
  cognitiveGrade: "A",
  evaluatedSessions: 1,
  reactionPercentile: 80,
  lastEvaluationTimestamp: Date.now(),
};

export class CloudService {
  private static instance: CloudService;
  private currentUserId: string = "";

  private constructor() {
    this.currentUserId = this.getOrCreateUserId();
  }

  public static getInstance(): CloudService {
    if (!CloudService.instance) {
      CloudService.instance = new CloudService();
    }
    return CloudService.instance;
  }

  public getOrCreateUserId(): string {
    if (typeof window === "undefined") return "PILOT-DEFAULT";
    let stored = localStorage.getItem("vulkandos_userId");
    if (!stored) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      stored = `PILOT-DOS-${rand}`;
      localStorage.setItem("vulkandos_userId", stored);
    }
    this.currentUserId = stored;
    return stored;
  }

  public setUserId(newId: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("vulkandos_userId", newId);
    }
    this.currentUserId = newId;
  }

  public getUserId(): string {
    return this.currentUserId;
  }

  // Load from local storage immediately, then reconcile with cloud server
  public async loadSaveState(): Promise<GameSaveState> {
    const userId = this.getOrCreateUserId();
    let localData: GameSaveState | null = null;

    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        try {
          localData = JSON.parse(raw);
        } catch {
          // ignore corrupted local state
        }
      }
    }

    // Attempt to load latest from Cloud Server
    try {
      const res = await fetch(`/api/cloud-load/${encodeURIComponent(userId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.found && json.data) {
          const cloudData: GameSaveState = {
            userId: json.data.userId,
            userName: json.data.userName || "Piloto MS-DOS",
            currentLevel: json.data.currentLevel || 1,
            highestLevelUnlocked: json.data.highestLevelUnlocked || 1,
            score: json.data.score || 0,
            lives: json.data.lives || 3,
            highScore: json.data.highScore || 0,
            soundEnabled: localData?.soundEnabled ?? true,
            crtFilterEnabled: localData?.crtFilterEnabled ?? true,
            palette: localData?.palette ?? "vga",
            controlMode: localData?.controlMode ?? "auto",
            cognitiveMetrics: json.data.cognitiveMetrics || DEFAULT_COGNITIVE,
            lastSavedAt: json.data.lastSavedAt || new Date().toISOString(),
          };

          // Cache locally
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cloudData));
          }
          return cloudData;
        }
      }
    } catch {
      // Offline fallback
    }

    // Return local data if cloud fetch failed or didn't exist yet
    if (localData) {
      return localData;
    }

    // Default initial save
    const defaultState: GameSaveState = {
      userId,
      userName: "Piloto MS-DOS",
      currentLevel: 1,
      highestLevelUnlocked: 1,
      score: 0,
      lives: 3,
      highScore: 0,
      soundEnabled: true,
      crtFilterEnabled: true,
      palette: "vga",
      controlMode: "auto",
      cognitiveMetrics: DEFAULT_COGNITIVE,
      lastSavedAt: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultState));
    }
    return defaultState;
  }

  // Save to both LocalStorage mirror and Cloud REST API
  public async saveState(state: GameSaveState): Promise<{ success: boolean; cloudSynced: boolean }> {
    state.lastSavedAt = new Date().toISOString();

    // 1. Mirror locally instantly
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    }

    // 2. Transmit to Cloud Server
    let cloudSynced = false;
    try {
      const res = await fetch("/api/cloud-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      if (res.ok) {
        cloudSynced = true;
      }
    } catch {
      cloudSynced = false;
    }

    return { success: true, cloudSynced };
  }

  // Fetch Cloud Leaderboard
  public async fetchLeaderboard(): Promise<any[]> {
    try {
      const res = await fetch("/api/cloud-leaderboard");
      if (res.ok) {
        const data = await res.json();
        return data.leaderboard || [];
      }
    } catch {
      // offline fallback
    }
    return [];
  }
}

export const cloudService = CloudService.getInstance();
