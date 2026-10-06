import React, { useRef, useEffect } from "react";
import { BreakoutGame } from "../game/breakoutGame";
import { vulkanMetalRHI } from "../engine/vulkanMetalRHI";
import { inputManager } from "../input/inputManager";
import { EngineProfilerMetrics } from "../types";

interface GameCanvasProps {
  game: BreakoutGame;
  onMetricsUpdate: (metrics: EngineProfilerMetrics) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ game, onMetricsUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    vulkanMetalRHI.setContext(ctx, game.width, game.height);
    vulkanMetalRHI.setPalette(game.palette);

    const updateCanvasBounds = () => {
      if (canvas) {
        inputManager.updateCanvasRect(canvas.getBoundingClientRect());
      }
    };

    updateCanvasBounds();
    window.addEventListener("resize", updateCanvasBounds);

    // Frame Render Loop
    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      // Update game physics
      game.update(dt);

      // Render graphics pass
      game.render(vulkanMetalRHI);

      // End frame and collect profiler metrics
      const metrics = vulkanMetalRHI.endFrame(now, game.particles.length);
      onMetricsUpdate(metrics);

      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener("resize", updateCanvasBounds);
    };
  }, [game, onMetricsUpdate]);

  // Pointer move handlers (Mouse & direct touch on canvas)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    inputManager.handleMouseMove(e.clientX);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    inputManager.handleMouseMove(e.clientX);
    inputManager.requestFire();
  };

  return (
    <div
      ref={containerRef}
      id="game-canvas-container"
      className="relative w-full max-w-4xl aspect-[4/3] max-h-[68vh] mx-auto rounded-xl overflow-hidden border-2 border-neutral-800 bg-black shadow-2xl flex items-center justify-center select-none touch-none cursor-crosshair"
    >
      <canvas
        ref={canvasRef}
        id="game-viewport"
        width={game.width}
        height={game.height}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        className="w-full h-full object-contain block image-rendering-pixelated"
      />

      {/* Retro Top Level & Score HUD Overlay */}
      <div className="absolute top-2 left-3 right-3 flex justify-between items-center text-xs font-mono pointer-events-none drop-shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-cyan-400 font-bold tracking-wider">
            NIVEL {game.currentLevelNumber.toString().padStart(2, "0")}
          </span>
          <span className="text-neutral-400 hidden sm:inline">
            VIDAS:{" "}
            <span className="text-red-400 font-bold">
              {"♥ ".repeat(Math.max(0, game.lives))}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-amber-400 font-bold">
            PTS: {game.score.toString().padStart(6, "0")}
          </span>
        </div>
      </div>

      {/* Paused or Waiting to Launch Prompt */}
      {game.isWaitingToLaunch && !game.isGameOver && !game.isLevelWon && (
        <div className="absolute bottom-16 inset-x-0 flex justify-center pointer-events-none animate-pulse">
          <div className="px-4 py-1.5 rounded-lg bg-black/80 border border-cyan-400/50 text-cyan-300 text-xs font-mono tracking-wider shadow-lg">
            {inputManager.shouldShowVirtualJoystick()
              ? "TOCA EL BOTÓN 'SAQUE' O LA PANTALLA PARA LANZAR"
              : "PULSA [ESPACIO] O HAZ CLIC PARA LANZAR LA BOLA"}
          </div>
        </div>
      )}
    </div>
  );
};
