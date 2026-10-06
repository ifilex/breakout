import React from "react";
import { ColorPalette, ControlMode } from "../types";
import { Settings, Volume2, VolumeX, Monitor, Sliders, X, Check } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  palette: ColorPalette;
  onPaletteChange: (p: ColorPalette) => void;
  crtEnabled: boolean;
  onCrtToggle: (enabled: boolean) => void;
  soundEnabled: boolean;
  onSoundToggle: (enabled: boolean) => void;
  controlMode: ControlMode;
  onControlModeChange: (m: ControlMode) => void;
  isPortableDetected: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  palette,
  onPaletteChange,
  crtEnabled,
  onCrtToggle,
  soundEnabled,
  onSoundToggle,
  controlMode,
  onControlModeChange,
  isPortableDetected,
}) => {
  if (!isOpen) return null;

  const palettes: Array<{ id: ColorPalette; name: string; desc: string }> = [
    { id: "vga", name: "MS-DOS VGA 256", desc: "Paleta clásica de 256 colores saturados" },
    { id: "cga", name: "MS-DOS CGA Modo 1", desc: "Cyan, Magenta, Blanco y Negro retro 1981" },
    { id: "vulkan_metal", name: "Vulkan & Metal PBR", desc: "Naranja magma, cian metálico y cromo" },
    { id: "neon_cyber", name: "Cyberpunk Synthwave", desc: "Luminiscencia fluorescente de alto contraste" },
  ];

  return (
    <div
      id="settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-neutral-900 border border-neutral-700 rounded-2xl p-6 text-neutral-200 font-mono shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-neutral-800 text-cyan-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">CONFIGURACIÓN</h2>
              <p className="text-xs text-neutral-400">Motor gráfico, controles y audio MS-DOS</p>
            </div>
          </div>
          <button
            id="btn-close-settings"
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 text-xs">
          {/* Controls Mode Selection */}
          <div>
            <div className="text-neutral-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Adaptación de Control ({isPortableDetected ? "Portátil Detectado" : "PC / Ratón Detectado"})
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "auto", label: "Automático", note: "Auto-detectar táctil" },
                { id: "touch", label: "Joystick Táctil", note: "Siempre visible" },
                { id: "mouse_keyboard", label: "Ratón / Teclado", note: "Ocultar joystick" },
              ].map((item) => (
                <button
                  key={item.id}
                  id={`btn-control-${item.id}`}
                  onClick={() => onControlModeChange(item.id as ControlMode)}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    controlMode === item.id
                      ? "border-cyan-400 bg-cyan-950/40 text-cyan-200 ring-1 ring-cyan-400"
                      : "border-neutral-800 bg-neutral-950 hover:border-neutral-700 text-neutral-400"
                  }`}
                >
                  <span className="font-bold text-white">{item.label}</span>
                  <span className="text-[10px] text-neutral-500 mt-1">{item.note}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Palette */}
          <div>
            <div className="text-neutral-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Monitor className="w-4 h-4 text-emerald-400" />
              Paleta Cromática de Renderizado
            </div>
            <div className="space-y-2">
              {palettes.map((p) => (
                <button
                  key={p.id}
                  id={`btn-palette-${p.id}`}
                  onClick={() => onPaletteChange(p.id)}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                    palette === p.id
                      ? "border-emerald-400 bg-emerald-950/30 text-emerald-200"
                      : "border-neutral-800 bg-neutral-950 hover:border-neutral-700 text-neutral-400"
                  }`}
                >
                  <div>
                    <div className="font-bold text-white">{p.name}</div>
                    <div className="text-[11px] text-neutral-500">{p.desc}</div>
                  </div>
                  {palette === p.id && <Check className="w-4 h-4 text-emerald-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-3">
            {/* CRT Toggle */}
            <button
              id="btn-toggle-crt"
              onClick={() => onCrtToggle(!crtEnabled)}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                crtEnabled
                  ? "border-cyan-500/60 bg-cyan-950/30 text-cyan-300"
                  : "border-neutral-800 bg-neutral-950 text-neutral-500"
              }`}
            >
              <div className="text-left">
                <div className="font-bold text-white">Efecto CRT MS-DOS</div>
                <div className="text-[10px] text-neutral-400">Scanlines & Fósforo</div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border ${
                  crtEnabled ? "bg-cyan-400 border-cyan-300" : "bg-neutral-800 border-neutral-700"
                }`}
              />
            </button>

            {/* Audio Toggle */}
            <button
              id="btn-toggle-sound"
              onClick={() => onSoundToggle(!soundEnabled)}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                soundEnabled
                  ? "border-emerald-500/60 bg-emerald-950/30 text-emerald-300"
                  : "border-neutral-800 bg-neutral-950 text-neutral-500"
              }`}
            >
              <div className="text-left">
                <div className="font-bold text-white">Sonido PC Speaker</div>
                <div className="text-[10px] text-neutral-400">Sintetizador 8-bit</div>
              </div>
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-neutral-600" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
