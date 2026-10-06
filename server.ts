import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

interface CloudGameProgress {
  userId: string;
  userName: string;
  currentLevel: number;
  highestLevelUnlocked: number;
  score: number;
  lives: number;
  highScore: number;
  cognitiveMetrics: {
    averageReactionTimeMs: number;
    reactionTimeHistory: number[];
    accuracyPercentage: number;
    anticipationScore: number;
    totalHits: number;
    perfectHits: number;
    cognitiveGrade: string;
    evaluatedSessions: number;
  };
  lastSavedAt: string;
}

// In-memory cloud storage with persistence across API calls
const cloudDatabase = new Map<string, CloudGameProgress>();

// Pre-seed a few demo high scores for the cloud leaderboard
cloudDatabase.set("VULKAN-PILOT-01", {
  userId: "VULKAN-PILOT-01",
  userName: "CyberAce_99",
  currentLevel: 18,
  highestLevelUnlocked: 24,
  score: 42800,
  lives: 3,
  highScore: 42800,
  cognitiveMetrics: {
    averageReactionTimeMs: 178,
    reactionTimeHistory: [195, 182, 175, 168, 172],
    accuracyPercentage: 91.4,
    anticipationScore: 88.0,
    totalHits: 412,
    perfectHits: 376,
    cognitiveGrade: "S",
    evaluatedSessions: 12,
  },
  lastSavedAt: new Date(Date.now() - 3600000).toISOString(),
});

cloudDatabase.set("METAL-REFLEX-02", {
  userId: "METAL-REFLEX-02",
  userName: "RetroVector",
  currentLevel: 14,
  highestLevelUnlocked: 16,
  score: 29500,
  lives: 2,
  highScore: 29500,
  cognitiveMetrics: {
    averageReactionTimeMs: 215,
    reactionTimeHistory: [230, 220, 210, 205],
    accuracyPercentage: 84.2,
    anticipationScore: 79.5,
    totalHits: 290,
    perfectHits: 244,
    cognitiveGrade: "A",
    evaluatedSessions: 8,
  },
  lastSavedAt: new Date(Date.now() - 7200000).toISOString(),
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "2mb" }));

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      engine: "VulkanDOS-Engine-v2.4",
      renderer: "Metal/Vulkan Multiplatform RHI",
      timestamp: new Date().toISOString(),
    });
  });

  // Cloud Save endpoint
  app.post("/api/cloud-save", (req, res) => {
    try {
      const body = req.body as Partial<CloudGameProgress>;
      if (!body.userId) {
        res.status(400).json({ error: "userId is required for cloud sync" });
        return;
      }

      const existing = cloudDatabase.get(body.userId);
      const updated: CloudGameProgress = {
        userId: body.userId,
        userName: body.userName || existing?.userName || "Jugador",
        currentLevel: typeof body.currentLevel === "number" ? body.currentLevel : existing?.currentLevel || 1,
        highestLevelUnlocked: Math.max(body.highestLevelUnlocked || 1, existing?.highestLevelUnlocked || 1),
        score: typeof body.score === "number" ? body.score : existing?.score || 0,
        lives: typeof body.lives === "number" ? body.lives : existing?.lives || 3,
        highScore: Math.max(body.highScore || 0, body.score || 0, existing?.highScore || 0),
        cognitiveMetrics: body.cognitiveMetrics || existing?.cognitiveMetrics || {
          averageReactionTimeMs: 220,
          reactionTimeHistory: [],
          accuracyPercentage: 80,
          anticipationScore: 75,
          totalHits: 0,
          perfectHits: 0,
          cognitiveGrade: "B",
          evaluatedSessions: 1,
        },
        lastSavedAt: new Date().toISOString(),
      };

      cloudDatabase.set(body.userId, updated);
      res.json({
        success: true,
        message: "Progreso sincronizado en la nube exitosamente",
        data: updated,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to save cloud data" });
    }
  });

  // Cloud Load endpoint
  app.get("/api/cloud-load/:userId", (req, res) => {
    const { userId } = req.params;
    const progress = cloudDatabase.get(userId);
    if (!progress) {
      res.status(404).json({
        found: false,
        message: "No se encontró registro previo en la nube para este ID",
      });
      return;
    }
    res.json({
      found: true,
      data: progress,
    });
  });

  // Cloud Leaderboard & Cognitive Rankings
  app.get("/api/cloud-leaderboard", (_req, res) => {
    const list = Array.from(cloudDatabase.values())
      .map((item) => ({
        userId: item.userId,
        userName: item.userName,
        highestLevelUnlocked: item.highestLevelUnlocked,
        highScore: item.highScore,
        averageReactionTimeMs: item.cognitiveMetrics.averageReactionTimeMs,
        accuracyPercentage: item.cognitiveMetrics.accuracyPercentage,
        cognitiveGrade: item.cognitiveMetrics.cognitiveGrade,
        lastSavedAt: item.lastSavedAt,
      }))
      .sort((a, b) => b.highScore - a.highScore)
      .slice(0, 20);

    res.json({ leaderboard: list });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VulkanDOS Game Engine Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Error starting server:", err);
  process.exit(1);
});
