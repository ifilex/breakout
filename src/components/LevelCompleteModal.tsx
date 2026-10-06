import React from "react";
import { Award, ArrowRight, Brain, Cloud, RotateCcw } from "lucide-react";
import { CognitiveMetrics } from "../types";

interface LevelCompleteModalProps {
  isOpen: boolean;
  levelNumber: number;
  score: number;
  cognitiveMetrics: CognitiveMetrics;
  onNextLevel: () => void;
  onReplayLevel: () => void;
  onOpenCognitive: () => void;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  isOpen,
  levelNumber,
  score,
  cognitiveMetrics,
  onNextLevel,
  onReplayLevel,
  onOpenCognitive,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="level-complete-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn font-mono"
    >
      <div className="relative w-full max-w-md bg-neutral-900 border-2 border-emerald-500/50 rounded-2xl p-6 text-neutral-200 text-center shadow-2xl shadow-emerald-950/50">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto mb-4">
          <Award className="w-9 h-9" />
        </div>

        <h2 className="text-xl font-black text-white tracking-wider">
          ¡NIVEL {levelNumber.toString().padStart(2, "0")} SUPERADO!
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Sector despejado. Progreso guardado automáticamente en la nube.
        </p>

        {/* Level Stats */}
        <div className="my-5 p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-neutral-400">Puntuación Acumulada:</span>
            <span className="text-amber-400 font-bold text-sm">{score} PTS</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-neutral-400">Tiempo de Reacción:</span>
            <span className="text-cyan-400 font-bold">
              {cognitiveMetrics.averageReactionTimeMs} ms
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-neutral-400">Precisión Óculo-Manual:</span>
            <span className="text-emerald-400 font-bold">
              {cognitiveMetrics.accuracyPercentage}%
            </span>
          </div>

          <div className="flex justify-between items-center text-xs pt-2 border-t border-neutral-800/80">
            <span className="text-neutral-400 flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-cyan-400" />
              Sincronización Nube:
            </span>
            <span className="text-emerald-400 text-[11px] font-bold">ACTUALIZADO</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2.5">
          <button
            id="btn-next-level"
            onClick={onNextLevel}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/40"
          >
            <span>SIGUIENTE NIVEL ({levelNumber + 1})</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              id="btn-open-cognitive-eval"
              onClick={onOpenCognitive}
              className="py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-purple-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Ver Informe</span>
            </button>

            <button
              id="btn-replay-level"
              onClick={onReplayLevel}
              className="py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reintentar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
