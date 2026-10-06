import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { BreakoutGame } from "./game/breakoutGame";
import { GameCanvas } from "./components/GameCanvas";
import { VirtualJoystick } from "./components/VirtualJoystick";
import { EngineProfilerModal } from "./components/EngineProfilerModal";
import { CognitiveReportModal } from "./components/CognitiveReportModal";
import { LevelSelectModal } from "./components/LevelSelectModal";
import { CloudSyncModal } from "./components/CloudSyncModal";
import { SettingsModal } from "./components/SettingsModal";
import { LevelCompleteModal } from "./components/LevelCompleteModal";
import { GameOverModal } from "./components/GameOverModal";
import { cloudService } from "./cloud/cloudService";
import { inputManager } from "./input/inputManager";
import { soundEngine } from "./engine/soundEngine";
import {
  GameSaveState,
  EngineProfilerMetrics,
  ColorPalette,
  ControlMode,
} from "./types";
import {
  Brain,
  Cpu,
  Cloud,
  Settings,
  Layers,
  Play,
  RotateCcw,
  Zap,
} from "lucide-react";

export default function App() {
  // Cloud Save State
  const [saveState, setSaveState] = useState<GameSaveState | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Modals state
  const [showProfiler, setShowProfiler] = useState<boolean>(false);
  const [showCognitive, setShowCognitive] = useState<boolean>(false);
  const [showLevels, setShowLevels] = useState<boolean>(false);
  const [showCloud, setShowCloud] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showLevelComplete, setShowLevelComplete] = useState<boolean>(false);
  const [showGameOver, setShowGameOver] = useState<boolean>(false);

  // Real-time metrics
  const [profilerMetrics, setProfilerMetrics] = useState<EngineProfilerMetrics>({
    fps: 60,
    frameTimeMs: 16.6,
    renderPassCount: 6,
    commandBuffersRecorded: 1,
    drawCalls: 45,
    particleCount: 0,
    activeShaders: ["vs_msdos_quad.spv", "fs_brick_pbr_vulkan.spv"],
    backendApi: "Vulkan RHI (Emulated WebGL2/Direct2D)",
    gpuMemoryEstKb: 1420,
    subMillisecondLatency: 0.28,
  });

  // Game Engine Instance
  const gameRef = useRef<BreakoutGame | null>(null);
  const [, setTick] = useState<number>(0);
  const forceUpdate = useCallback(() => setTick((t) => t + 1), []);

  // Initialize Cloud Save & Load
  useEffect(() => {
    let isMounted = true;
    cloudService.loadSaveState().then((state) => {
      if (!isMounted) return;
      setSaveState(state);

      // Apply initial settings
      soundEngine.setEnabled(state.soundEnabled);
      inputManager.setControlMode(state.controlMode);

      // Create Breakout game instance resuming from saved level
      const game = new BreakoutGame(state.currentLevel);
      game.score = state.score;
      game.lives = Math.max(3, state.lives);
      game.palette = state.palette;
      game.crtEnabled = state.crtFilterEnabled;

      // Register game callbacks
      game.onStateChange = forceUpdate;

      game.onLevelCompleteCallback = (completedLevel, finalScore) => {
        const nextLevel = completedLevel + 1;
        const newHighest = Math.max(state.highestLevelUnlocked, nextLevel);
        const cog = game.cognitiveTracker.getMetrics();

        const updatedState: GameSaveState = {
          ...state,
          currentLevel: Math.min(24, nextLevel),
          highestLevelUnlocked: Math.min(24, newHighest),
          score: finalScore,
          lives: game.lives,
          highScore: Math.max(state.highScore, finalScore),
          cognitiveMetrics: cog,
          lastSavedAt: new Date().toISOString(),
        };

        setSaveState(updatedState);
        cloudService.saveState(updatedState);
        setShowLevelComplete(true);
      };

      game.onGameOverCallback = (finalScore, levelNum) => {
        const cog = game.cognitiveTracker.getMetrics();
        const updatedState: GameSaveState = {
          ...state,
          currentLevel: levelNum,
          score: finalScore,
          highScore: Math.max(state.highScore, finalScore),
          cognitiveMetrics: cog,
          lastSavedAt: new Date().toISOString(),
        };

        setSaveState(updatedState);
        cloudService.saveState(updatedState);
        setShowGameOver(true);
      };

      gameRef.current = game;
      setIsLoaded(true);
      forceUpdate();
    });

    return () => {
      isMounted = false;
    };
  }, [forceUpdate]);

  const game = gameRef.current;

  // Actions
  const handleStartOrLaunch = () => {
    if (!game) return;
    inputManager.requestFire();
  };

  const handleNextLevel = () => {
    if (!game || !saveState) return;
    setShowLevelComplete(false);
    const next = Math.min(24, game.currentLevelNumber + 1);
    game.initLevel(next);
    forceUpdate();
  };

  const handleReplayLevel = () => {
    if (!game) return;
    setShowLevelComplete(false);
    setShowGameOver(false);
    game.lives = 3;
    game.initLevel(game.currentLevelNumber);
    forceUpdate();
  };

  const handleSelectLevel = (lvl: number) => {
    if (!game || !saveState) return;
    game.lives = 3;
    game.initLevel(lvl);
    const updated: GameSaveState = {
      ...saveState,
      currentLevel: lvl,
    };
    setSaveState(updated);
    cloudService.saveState(updated);
    forceUpdate();
  };

  const handlePaletteChange = (p: ColorPalette) => {
    if (!game || !saveState) return;
    game.palette = p;
    const updated: GameSaveState = { ...saveState, palette: p };
    setSaveState(updated);
    cloudService.saveState(updated);
    forceUpdate();
  };

  const handleCrtToggle = (enabled: boolean) => {
    if (!game || !saveState) return;
    game.crtEnabled = enabled;
    const updated: GameSaveState = { ...saveState, crtFilterEnabled: enabled };
    setSaveState(updated);
    cloudService.saveState(updated);
    forceUpdate();
  };

  const handleSoundToggle = (enabled: boolean) => {
    if (!saveState) return;
    soundEngine.setEnabled(enabled);
    const updated: GameSaveState = { ...saveState, soundEnabled: enabled };
    setSaveState(updated);
    cloudService.saveState(updated);
    forceUpdate();
  };

  const handleControlModeChange = (mode: ControlMode) => {
    if (!saveState) return;
    inputManager.setControlMode(mode);
    const updated: GameSaveState = { ...saveState, controlMode: mode };
    setSaveState(updated);
    cloudService.saveState(updated);
    forceUpdate();
  };

  const handleLoadSavedCloud = (newState: GameSaveState) => {
    setSaveState(newState);
    if (game) {
      game.currentLevelNumber = newState.currentLevel;
      game.score = newState.score;
      game.lives = Math.max(3, newState.lives);
      game.palette = newState.palette;
      game.crtEnabled = newState.crtFilterEnabled;
      game.initLevel(newState.currentLevel);
      forceUpdate();
    }
  };

  const isPortable = useMemo(() => inputManager.isPortableDetected(), []);
  const shouldShowJoystick = game ? inputManager.shouldShowVirtualJoystick() : false;
  const currentCognitive = game ? game.cognitiveTracker.getMetrics() : (saveState?.cognitiveMetrics || {
    averageReactionTimeMs: 220,
    reactionTimeHistory: [240, 225, 215],
    accuracyPercentage: 82,
    anticipationScore: 78,
    totalHits: 0,
    perfectHits: 0,
    angularControlScore: 80,
    cognitiveGrade: "A" as const,
    evaluatedSessions: 1,
    reactionPercentile: 80,
    lastEvaluationTimestamp: Date.now(),
  });

  return (
    <div
      id="app-root"
      className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between font-mono select-none overflow-x-hidden"
    >
      {/* Top Header / Status Bar */}
      <header
        id="app-header"
        className="w-full border-b border-neutral-800/80 bg-neutral-900/60 backdrop-blur-md px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 text-xs z-30"
      >
        {/* Brand & Engine Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-cyan-400 text-neutral-950 flex items-center justify-center font-black text-sm shadow-md shadow-cyan-950">
            V
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-white tracking-wide">
              <span>VULKAN/METAL BREAKOUT</span>
              <span className="hidden md:inline-block text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                MS-DOS 24-LVL
              </span>
            </div>
            <div className="text-[10px] text-neutral-400 hidden sm:flex items-center gap-2">
              <span className="text-emerald-400">● {profilerMetrics.fps} FPS</span>
              <span>·</span>
              <span>Latencia: {profilerMetrics.frameTimeMs}ms</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Hub */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Level Selector */}
          <button
            id="btn-nav-levels"
            onClick={() => setShowLevels(true)}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 flex items-center gap-1.5 transition-colors"
            title="Seleccionar de entre los 24 niveles"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Nivel</span>
            <strong className="text-cyan-300">
              {game?.currentLevelNumber || saveState?.currentLevel || 1}
            </strong>
          </button>

          {/* Cognitive Evaluation Badge */}
          <button
            id="btn-nav-cognitive"
            onClick={() => setShowCognitive(true)}
            className="px-2.5 py-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 flex items-center gap-1.5 transition-colors"
            title="Evaluación Cognitiva de Reflejos y Precisión Mano-Ojo"
          >
            <Brain className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Reflejos:</span>
            <span className="font-bold text-white">
              {currentCognitive.averageReactionTimeMs}ms
            </span>
            <span className="px-1 rounded bg-purple-500/30 text-[10px] font-black text-yellow-300">
              {currentCognitive.cognitiveGrade}
            </span>
          </button>

          {/* Engine Profiler HUD */}
          <button
            id="btn-nav-profiler"
            onClick={() => setShowProfiler(true)}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hidden sm:flex items-center gap-1.5 transition-colors"
            title="Telemetría de la Arquitectura Gráfica Vulkan / Metal"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">RHI</span>
          </button>

          {/* Cloud Sync */}
          <button
            id="btn-nav-cloud"
            onClick={() => setShowCloud(true)}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 flex items-center gap-1.5 transition-colors"
            title="Progreso en la Nube y Continuación de Partida"
          >
            <Cloud className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Nube</span>
          </button>

          {/* Settings */}
          <button
            id="btn-nav-settings"
            onClick={() => setShowSettings(true)}
            className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white transition-colors"
            title="Configuración"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Game Stage Area */}
      <main
        id="game-main-area"
        className="flex-1 w-full max-w-6xl mx-auto px-2 sm:px-4 py-2 flex flex-col items-center justify-center relative"
      >
        {!isLoaded || !game ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-neutral-400">
            <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-xs">
              Inicializando motor gráfico Vulkan/Metal y cargando progreso en la nube...
            </span>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-2">
            {/* Breakout Canvas Viewport */}
            <GameCanvas
              game={game}
              onMetricsUpdate={setProfilerMetrics}
            />

            {/* Adaptive Input System: Joystick if Portable, or Desktop helper note */}
            {shouldShowJoystick ? (
              <VirtualJoystick
                onFire={handleStartOrLaunch}
                hasLaser={game.paddle.hasLaser}
                isWaitingToLaunch={game.isWaitingToLaunch}
              />
            ) : (
              <div className="w-full max-w-4xl px-4 py-1.5 flex flex-wrap items-center justify-between text-[11px] text-neutral-400 bg-neutral-900/40 border border-neutral-800/60 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-cyan-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    Modo PC / Ratón activo
                  </span>
                  <span>Mueve el ratón para guiar la pala</span>
                  <span className="hidden md:inline">· [A]/[D] o [←]/[→] Teclado</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>[Espacio] o Clic para lanzar / disparar</span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Cognitive & Level Status Ticker */}
      <footer
        id="app-footer"
        className="w-full border-t border-neutral-900 bg-neutral-950/80 px-4 py-2 text-[11px] text-neutral-400 flex flex-wrap items-center justify-between gap-2 font-mono"
      >
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold">Nube:</span>
          <span>{saveState?.userId || "Sincronizando..."}</span>
          <span className="text-neutral-500">|</span>
          <span className="text-emerald-400">
            Nivel {game?.currentLevelNumber || 1} de 24
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            id="btn-footer-quick-cognitive"
            onClick={() => setShowCognitive(true)}
            className="hover:text-purple-300 flex items-center gap-1 transition-colors"
          >
            <Brain className="w-3.5 h-3.5 text-purple-400" />
            <span>Precisión: {currentCognitive.accuracyPercentage}%</span>
          </button>

          <span className="text-neutral-500">|</span>

          <span className="text-neutral-400">
            {isPortable ? "Táctil portátil" : "Escritorio / Ratón"}
          </span>
        </div>
      </footer>

      {/* Modals & Overlays */}
      <EngineProfilerModal
        isOpen={showProfiler}
        onClose={() => setShowProfiler(false)}
        metrics={profilerMetrics}
      />

      {saveState && (
        <CognitiveReportModal
          isOpen={showCognitive}
          onClose={() => setShowCognitive(false)}
          metrics={currentCognitive}
          userId={saveState.userId}
        />
      )}

      {saveState && (
        <LevelSelectModal
          isOpen={showLevels}
          onClose={() => setShowLevels(false)}
          currentLevel={game?.currentLevelNumber || saveState.currentLevel}
          highestUnlocked={saveState.highestLevelUnlocked}
          onSelectLevel={handleSelectLevel}
        />
      )}

      {saveState && (
        <CloudSyncModal
          isOpen={showCloud}
          onClose={() => setShowCloud(false)}
          saveState={saveState}
          onLoadSave={handleLoadSavedCloud}
        />
      )}

      {saveState && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          palette={game?.palette || saveState.palette}
          onPaletteChange={handlePaletteChange}
          crtEnabled={game?.crtEnabled ?? saveState.crtFilterEnabled}
          onCrtToggle={handleCrtToggle}
          soundEnabled={saveState.soundEnabled}
          onSoundToggle={handleSoundToggle}
          controlMode={saveState.controlMode}
          onControlModeChange={handleControlModeChange}
          isPortableDetected={isPortable}
        />
      )}

      {game && (
        <LevelCompleteModal
          isOpen={showLevelComplete}
          levelNumber={game.currentLevelNumber}
          score={game.score}
          cognitiveMetrics={currentCognitive}
          onNextLevel={handleNextLevel}
          onReplayLevel={handleReplayLevel}
          onOpenCognitive={() => {
            setShowLevelComplete(false);
            setShowCognitive(true);
          }}
        />
      )}

      {game && (
        <GameOverModal
          isOpen={showGameOver}
          score={game.score}
          levelNumber={game.currentLevelNumber}
          cognitiveMetrics={currentCognitive}
          onRetry={handleReplayLevel}
          onOpenCognitive={() => {
            setShowGameOver(false);
            setShowCognitive(true);
          }}
        />
      )}
    </div>
  );
}
