import React from "react";
import { LEVELS } from "../game/levelData";
import { Lock, Play, X, CheckCircle, Shield } from "lucide-react";

interface LevelSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLevel: number;
  highestUnlocked: number;
  onSelectLevel: (lvl: number) => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  isOpen,
  onClose,
  currentLevel,
  highestUnlocked,
  onSelectLevel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="level-select-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-neutral-900 border border-neutral-700 rounded-2xl p-6 text-neutral-200 font-mono shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-5">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              SELECCIÓN DE NIVEL
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                24 NIVELES MS-DOS
              </span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Desafíos progresivos con evaluación de reflejos óculo-manuales en la nube
            </p>
          </div>
          <button
            id="btn-close-levels"
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 24-Level Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {LEVELS.map((lvl) => {
            const isUnlocked = lvl.levelNumber <= highestUnlocked;
            const isCurrent = lvl.levelNumber === currentLevel;
            const isCompleted = lvl.levelNumber < highestUnlocked;

            return (
              <button
                key={lvl.levelNumber}
                id={`btn-level-${lvl.levelNumber}`}
                disabled={!isUnlocked}
                onClick={() => {
                  onSelectLevel(lvl.levelNumber);
                  onClose();
                }}
                className={`relative p-3 rounded-xl border text-left flex flex-col justify-between h-28 transition-all ${
                  isCurrent
                    ? "border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-950/60 ring-2 ring-cyan-500/40"
                    : isCompleted
                    ? "border-emerald-500/40 bg-neutral-950/80 hover:border-emerald-400 hover:bg-neutral-900"
                    : isUnlocked
                    ? "border-neutral-700 bg-neutral-950/60 hover:border-neutral-500 hover:bg-neutral-900"
                    : "border-neutral-800/80 bg-neutral-950/30 opacity-40 cursor-not-allowed"
                }`}
              >
                {/* Level Tag & Status */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isCurrent
                        ? "bg-cyan-500 text-neutral-950"
                        : "bg-neutral-800 text-neutral-300"
                    }`}
                  >
                    #{lvl.levelNumber.toString().padStart(2, "0")}
                  </span>

                  {isCompleted ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  ) : !isUnlocked ? (
                    <Lock className="w-3.5 h-3.5 text-neutral-500" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                </div>

                {/* Level Title */}
                <div>
                  <div className="text-xs font-bold text-white truncate">
                    {lvl.name.split(": ")[1] || lvl.name}
                  </div>
                  <div className="text-[10px] text-neutral-500 truncate mt-0.5">
                    {lvl.targetReactionMs}ms meta
                  </div>
                </div>

                {/* Bottom indicators */}
                <div className="flex items-center justify-between text-[9px] text-neutral-400 pt-1 border-t border-neutral-800/60">
                  <span>Vel: {lvl.ballBaseSpeed}x</span>
                  <span>{lvl.targetAccuracy}% prec</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
