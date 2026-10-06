import React from "react";
import { EngineProfilerMetrics } from "../types";
import { vulkanMetalRHI } from "../engine/vulkanMetalRHI";
import { Cpu, Layers, Activity, Zap, X, ShieldCheck } from "lucide-react";

interface EngineProfilerModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: EngineProfilerMetrics;
}

export const EngineProfilerModal: React.FC<EngineProfilerModalProps> = ({
  isOpen,
  onClose,
  metrics,
}) => {
  if (!isOpen) return null;

  const deviceInfo = vulkanMetalRHI.getDeviceInfo();

  return (
    <div
      id="engine-profiler-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-neutral-900 border border-cyan-500/40 rounded-2xl p-6 text-neutral-200 font-mono shadow-2xl shadow-cyan-950/60">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                ARQUITECTURA DEL MOTOR VULKAN & METAL
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  RHI v2.4
                </span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Pipeline gráfico multiplataforma de mínima latencia y gestión de sombreadores
              </p>
            </div>
          </div>
          <button
            id="btn-close-profiler"
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time Hardware Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col">
            <span className="text-[11px] text-neutral-400">FPS / Tasa Cuadros</span>
            <span className="text-xl font-bold text-emerald-400 mt-1">
              {metrics.fps}{" "}
              <span className="text-xs text-neutral-500 font-normal">Hz</span>
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col">
            <span className="text-[11px] text-neutral-400">Tiempo de Cuadro</span>
            <span className="text-xl font-bold text-cyan-400 mt-1">
              {metrics.frameTimeMs}{" "}
              <span className="text-xs text-neutral-500 font-normal">ms</span>
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col">
            <span className="text-[11px] text-neutral-400">Llamadas Draw Call</span>
            <span className="text-xl font-bold text-amber-400 mt-1">
              {metrics.drawCalls}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col">
            <span className="text-[11px] text-neutral-400">Memoria Gráfica</span>
            <span className="text-xl font-bold text-purple-400 mt-1">
              {metrics.gpuMemoryEstKb}{" "}
              <span className="text-xs text-neutral-500 font-normal">KB</span>
            </span>
          </div>
        </div>

        {/* Backend & Hardware Abstraction Layer */}
        <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 mb-6">
          <h3 className="text-xs font-bold text-cyan-400 tracking-wider uppercase mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Capa de Abstracción de Hardware (RHI)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-neutral-800/60">
              <span className="text-neutral-400">Backend Activo:</span>
              <span className="text-cyan-300 font-semibold">{deviceInfo.architecture}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-neutral-800/60">
              <span className="text-neutral-400">Plataforma Detectada:</span>
              <span className="text-emerald-300 font-semibold">{deviceInfo.platformBackend}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-neutral-800/60">
              <span className="text-neutral-400">Lenguaje Sombreador:</span>
              <span className="text-amber-300 font-semibold">{deviceInfo.shaderLanguage}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-neutral-800/60">
              <span className="text-neutral-400">Latencia de Despacho:</span>
              <span className="text-purple-300 font-semibold">
                {metrics.subMillisecondLatency} ms (Sub-ms)
              </span>
            </div>
          </div>
        </div>

        {/* Render Passes Architecture */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-cyan-400 tracking-wider uppercase mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Cadena de Renderizado (Render Pipeline Passes)
          </h3>
          <div className="space-y-2 text-xs">
            {[
              {
                pass: "Pass 01",
                name: "Pass_Background_MSDOS_Grid",
                desc: "Limpieza de búfer de color + rasterizado de rejilla retro MS-DOS",
                tech: "Vulkan Clear Attachment / Metal LoadActionClear",
              },
              {
                pass: "Pass 02",
                name: "Pass_MSDOS_Bricks",
                desc: "Sombreador de ladrillos PBR con biseles 3D, fisuras de impacto y TNT",
                tech: "Dynamic Batching / Instanced Quad Draw",
              },
              {
                pass: "Pass 03",
                name: "Pass_Projectiles_Powerups",
                desc: "Cápsulas de poder y rayos láser balísticos con colisión AABB",
                tech: "Sub-stepping Physics Interpolation",
              },
              {
                pass: "Pass 04",
                name: "Pass_Paddle_Ball_PBR",
                desc: "Paleta MS-DOS con deflectores angulares y estela de partículas",
                tech: "Zero-GC Vertex Buffer Allocation",
              },
              {
                pass: "Pass 05",
                name: "Pass_Metal_Compute_Particles",
                desc: "Emisor de chispas y esquirlas con mezcla aditiva y decaimiento alpha",
                tech: "Additive Blend Compute Emulation",
              },
              {
                pass: "Pass 06",
                name: "Pass_CRT_Scanlines_PostProcess",
                desc: "Filtro analógico de líneas de exploración, curvatura y resplandor de fósforo",
                tech: "Full-screen Fragment Shader Pass",
              },
            ].map((p, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-neutral-950 border border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-cyan-300">
                    {p.pass}
                  </span>
                  <div>
                    <div className="text-white font-semibold">{p.name}</div>
                    <div className="text-neutral-400 text-[11px]">{p.desc}</div>
                  </div>
                </div>
                <span className="text-[10px] text-neutral-500 font-mono sm:text-right">
                  {p.tech}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Asset & Shader Management info */}
        <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-start gap-3 text-xs">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-cyan-200 font-semibold">
              Carga Dinámica de Assets y Mínima Latencia
            </span>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              El motor preasigna las estructuras de memoria y compila previamente los pipelines de
              renderizado. La detección de entrada opera a 1000Hz para asegurar una respuesta
              instantánea tanto con ratón de alta precisión como con el joystick virtual de pantalla
              táctil.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
