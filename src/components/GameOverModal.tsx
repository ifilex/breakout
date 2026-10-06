import React from "react";
import { RotateCcw, Brain, Cloud, AlertCircle } from "lucide-react";
import { CognitiveMetrics } from "../types";

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  levelNumber: number;
  cognitiveMetrics: CognitiveMetrics;
  onRetry: () => void;
  onOpenCognitive: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  score,
  levelNumber,
  cognitiveMetrics,
  onRetry,
  onOpenCognitive,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="game-over-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn font-mono"
    >
      <div className="relative w-full max-w-md bg-neutral-900 border-2 border-red-500/50 rounded-2xl p-6 text-neutral-200 text-center shadow-2xl shadow-red-950/60">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500 text-red-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <AlertCircle className="w-9 h-9" />
        </div>

        <h2 className="text-2xl font-black text-red-500 tracking-wider">
          GAME OVER
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Sin vidas restantes en el Nivel {levelNumber.toString().padStart(2, "0")}.
        </p>

        <div className="my-5 p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-neutral-400">Puntuación Final:</span>
            <span className="text-amber-400 font-bold text-sm">{score} PTS</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-neutral-400">Reflejos Medidos:</span>
            <span className="text-cyan-400 font-bold">
              {cognitiveMetrics.averageReactionTimeMs} ms
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-neutral-400">Rango Cognitivo:</span>
            <span className="text-purple-400 font-bold text-sm">
              CLASE {cognitiveMetrics.cognitiveGrade}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs pt-2 border-t border-neutral-800/80">
            <span className="text-neutral-400 flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-cyan-400" />
              Punto de Control en la Nube:
            </span>
            <span className="text-cyan-300 text-[11px] font-semibold">GUARDADO</span>
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            id="btn-retry-game"
            onClick={onRetry}
            className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-neutral-950 font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-900/40"
          >
            <RotateCcw className="w-4 h-4" />
            <span>CONTINUAR / REINTENTAR NIVEL {levelNumber}</span>
          </button>

          <button
            id="btn-game-over-cognitive"
            onClick={onOpenCognitive}
            className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-purple-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Brain className="w-4 h-4" />
            <span>Ver Diagnóstico Psicomotor Completo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
