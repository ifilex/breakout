import React from "react";
import { CognitiveMetrics } from "../types";
import { Brain, Target, Clock, Zap, X, Cloud, Award, TrendingUp } from "lucide-react";

interface CognitiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: CognitiveMetrics;
  userId: string;
}

export const CognitiveReportModal: React.FC<CognitiveReportModalProps> = ({
  isOpen,
  onClose,
  metrics,
  userId,
}) => {
  if (!isOpen) return null;

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "S+":
        return "text-yellow-300 border-yellow-400 bg-yellow-500/20";
      case "S":
        return "text-cyan-300 border-cyan-400 bg-cyan-500/20";
      case "A":
        return "text-emerald-300 border-emerald-400 bg-emerald-500/20";
      case "B":
        return "text-blue-300 border-blue-400 bg-blue-500/20";
      case "C":
        return "text-amber-300 border-amber-400 bg-amber-500/20";
      default:
        return "text-rose-300 border-rose-400 bg-rose-500/20";
    }
  };

  const getDiagnosticMessage = (grade: string, rt: number, acc: number) => {
    if (grade === "S+" || grade === "S") {
      return `Capacidad óculo-manual de nivel superior (${rt} ms). Muestras una anticipación neuromuscular sobresaliente y precisión angular de (${acc}%). Comparable a pilotos de combate y jugadores de deportes electrónicos de élite.`;
    }
    if (grade === "A") {
      return `Reflejos neuromotores óptimos (${rt} ms). Excelente coordinación mano-ojo con una tasa de impacto de precisión del (${acc}%). Tu velocidad de respuesta ante trayectorias complejas supera al 80% de la población.`;
    }
    if (grade === "B") {
      return `Tiempo de reacción ágil y dentro del rango promedio saludable (${rt} ms). La coordinación de seguimiento visual es constante (${acc}% de precisión). Puedes afinar la anticipación colocando la pala con mayor antelación.`;
    }
    return `Evaluación en fase de calibración (${rt} ms). Se detecta posible fatiga visual o retraso en la corrección de trayectoria. Recomendamos sesiones cortas para estimular la plasticidad psicomotriz.`;
  };

  return (
    <div
      id="cognitive-report-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-neutral-900 border border-purple-500/40 rounded-2xl p-6 text-neutral-200 font-mono shadow-2xl shadow-purple-950/60">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                INFORME DE EVALUACIÓN COGNITIVA
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  ÓCULO-MANUAL
                </span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Pruebas psicomotoras en tiempo real: precisión angular y tiempo de reacción
              </p>
            </div>
          </div>
          <button
            id="btn-close-cognitive"
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Grade Summary Hero */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-neutral-950 to-purple-950/40 border border-purple-500/30 mb-6 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div
              className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center shadow-lg ${getGradeColor(
                metrics.cognitiveGrade
              )}`}
            >
              <span className="text-3xl font-black">{metrics.cognitiveGrade}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5">
                RANGO
              </span>
            </div>
            <div>
              <div className="text-xs text-purple-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                Percentil de Reflejos
              </div>
              <div className="text-2xl font-bold text-white mt-0.5">
                Superior al {metrics.reactionPercentile}%
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                Total de impactos analizados:{" "}
                <span className="text-purple-300 font-semibold">{metrics.totalHits}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900/90 border border-neutral-800 text-[11px] text-neutral-400">
            <Cloud className="w-4 h-4 text-cyan-400" />
            <span>Perfil Nube: <strong className="text-white">{userId}</strong></span>
          </div>
        </div>

        {/* Detailed KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {/* Reaction Time */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>Tiempo de Reacción</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="my-2">
              <span className="text-2xl font-black text-cyan-400">
                {metrics.averageReactionTimeMs}
              </span>
              <span className="text-xs text-neutral-400 ml-1">ms</span>
            </div>
            <div className="text-[10px] text-neutral-500">
              Objetivo élite: &lt; 200 ms
            </div>
          </div>

          {/* Accuracy */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>Precisión Angular</span>
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="my-2">
              <span className="text-2xl font-black text-emerald-400">
                {metrics.accuracyPercentage}%
              </span>
            </div>
            <div className="text-[10px] text-neutral-500">
              Impactos perfectos: {metrics.perfectHits}
            </div>
          </div>

          {/* Anticipation */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-400 text-xs">
              <span>Anticipación Motriz</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div className="my-2">
              <span className="text-2xl font-black text-amber-400">
                {metrics.anticipationScore}%
              </span>
            </div>
            <div className="text-[10px] text-neutral-500">
              Pre-posicionamiento de pala
            </div>
          </div>
        </div>

        {/* Reaction Time History Sparkline / Bars */}
        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 mb-6">
          <div className="flex justify-between items-center text-xs text-neutral-400 mb-3">
            <span className="font-semibold text-neutral-300">
              Historial de Latencia Reaccional Reciente (ms)
            </span>
            <span className="text-[10px] text-cyan-400">Menos es más rápido</span>
          </div>

          <div className="h-20 flex items-end gap-1.5 px-2">
            {metrics.reactionTimeHistory.map((val, idx) => {
              // Scale from 100ms (tallest) to 400ms (shortest)
              const heightPercent = Math.max(15, Math.min(100, ((450 - val) / 350) * 100));
              const isFast = val < 210;
              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-1 group relative"
                >
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${
                      isFast ? "bg-cyan-400" : "bg-purple-500/70"
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[9px] text-neutral-500 opacity-60 group-hover:opacity-100">
                    {val}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Diagnostic Assessment Text */}
        <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs leading-relaxed text-purple-200">
          <div className="font-bold text-white mb-1 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-yellow-400" />
            Dictamen Neuro-Motor Personalizado
          </div>
          <p className="text-neutral-300 text-[11px]">
            {getDiagnosticMessage(
              metrics.cognitiveGrade,
              metrics.averageReactionTimeMs,
              metrics.accuracyPercentage
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
