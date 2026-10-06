import React, { useState, useEffect } from "react";
import { cloudService } from "../cloud/cloudService";
import { GameSaveState } from "../types";
import { Cloud, Copy, Check, RefreshCw, Trophy, X, ShieldAlert } from "lucide-react";

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  saveState: GameSaveState;
  onLoadSave: (newState: GameSaveState) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  saveState,
  onLoadSave,
}) => {
  if (!isOpen) return null;

  const [inputUserId, setInputUserId] = useState<string>(saveState.userId);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    cloudService.fetchLeaderboard().then(setLeaderboard);
  }, []);

  const handleCopyId = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(saveState.userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncStatusMsg("Sincronizando con la nube...");
    const res = await cloudService.saveState(saveState);
    setIsSyncing(false);
    if (res.cloudSynced) {
      setSyncStatusMsg("¡Guardado y sincronizado en la nube exitosamente!");
    } else {
      setSyncStatusMsg("Guardado en almacenamiento local (servidor desconectado)");
    }
    setTimeout(() => setSyncStatusMsg(""), 3500);
  };

  const handleLoadFromId = async () => {
    if (!inputUserId.trim()) return;
    setIsSyncing(true);
    cloudService.setUserId(inputUserId.trim());
    const loaded = await cloudService.loadSaveState();
    setIsSyncing(false);
    onLoadSave(loaded);
    setSyncStatusMsg(`Progreso cargado para ${loaded.userId} (Nivel ${loaded.currentLevel})`);
    setTimeout(() => {
      setSyncStatusMsg("");
      onClose();
    }, 1500);
  };

  return (
    <div
      id="cloud-sync-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-neutral-900 border border-cyan-500/40 rounded-2xl p-6 text-neutral-200 font-mono shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                SINCRONIZACIÓN EN LA NUBE
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Continúa siempre tu partida desde donde la dejaste en cualquier dispositivo
              </p>
            </div>
          </div>
          <button
            id="btn-close-cloud"
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Cloud Profile Box */}
        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 mb-6 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-neutral-400">Tu Identificador de Guardado en la Nube:</span>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Sincronización Automática Activa
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white font-bold text-sm tracking-wider">
              {saveState.userId}
            </div>
            <button
              id="btn-copy-cloud-id"
              onClick={handleCopyId}
              className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copiado" : "Copiar"}</span>
            </button>
            <button
              id="btn-sync-now"
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
              <span>Guardar</span>
            </button>
          </div>

          {syncStatusMsg && (
            <div className="text-xs text-cyan-300 bg-cyan-950/40 p-2 rounded border border-cyan-800/60">
              {syncStatusMsg}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 text-xs pt-1">
            <div className="p-2 rounded bg-neutral-900/60 text-center">
              <div className="text-neutral-400 text-[10px]">Nivel Actual</div>
              <div className="text-white font-bold">{saveState.currentLevel} / 24</div>
            </div>
            <div className="p-2 rounded bg-neutral-900/60 text-center">
              <div className="text-neutral-400 text-[10px]">Desbloqueado</div>
              <div className="text-emerald-400 font-bold">Nivel {saveState.highestLevelUnlocked}</div>
            </div>
            <div className="p-2 rounded bg-neutral-900/60 text-center">
              <div className="text-neutral-400 text-[10px]">Puntuación Máx</div>
              <div className="text-amber-400 font-bold">{saveState.highScore}</div>
            </div>
          </div>
        </div>

        {/* Load From Another Device Code */}
        <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 mb-6">
          <div className="text-xs font-bold text-neutral-300 mb-2">
            ¿Quieres transferir o continuar una partida de otro móvil o PC?
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputUserId}
              onChange={(e) => setInputUserId(e.target.value)}
              placeholder="Ingresa el ID de la nube (ej. PILOT-DOS-1234)"
              className="flex-1 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs focus:outline-none focus:border-cyan-400"
            />
            <button
              id="btn-load-cloud-progress"
              onClick={handleLoadFromId}
              disabled={isSyncing}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors"
            >
              Cargar Partida
            </button>
          </div>
        </div>

        {/* Global Leaderboard */}
        <div>
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            Tabla de Clasificación en la Nube
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs">
            {leaderboard.length === 0 ? (
              <div className="text-center py-4 text-neutral-500">Cargando clasificación...</div>
            ) : (
              leaderboard.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-neutral-950 border border-neutral-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        idx === 0
                          ? "bg-amber-500 text-black"
                          : idx === 1
                          ? "bg-neutral-300 text-black"
                          : idx === 2
                          ? "bg-amber-700 text-white"
                          : "bg-neutral-800 text-neutral-400"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-white font-medium">{item.userName}</span>
                    <span className="text-[10px] text-neutral-500">({item.userId})</span>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <span className="text-cyan-400 font-mono text-[11px]">
                      {item.averageReactionTimeMs}ms
                    </span>
                    <span className="text-amber-400 font-bold font-mono">
                      {item.highScore} pts
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
