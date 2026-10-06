import React, { useRef, useState, useEffect } from "react";
import { inputManager } from "../input/inputManager";
import { Zap } from "lucide-react";

interface VirtualJoystickProps {
  onFire: () => void;
  hasLaser: boolean;
  isWaitingToLaunch: boolean;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onFire,
  hasLaser,
  isWaitingToLaunch,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [thumbX, setThumbX] = useState<number>(50); // percentage 0 to 100
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const updateFromClientX = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const clampedRatio = Math.max(0, Math.min(1, relativeX / rect.width));
    setThumbX(clampedRatio * 100);
    inputManager.handleJoystickValue(clampedRatio);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    if (e.touches.length > 0) {
      updateFromClientX(e.touches[0].clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      updateFromClientX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Also support direct pointer events for testing on desktop touch emulators
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updateFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      updateFromClientX(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  return (
    <div
      id="virtual-joystick-hud"
      className="w-full max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4 select-none touch-none"
    >
      {/* Joystick / Paddle Thumb Slider Track */}
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="flex justify-between items-center text-[11px] font-mono text-cyan-400/80 px-1">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            JOYSTICK TÁCTIL TRANSPARENTE
          </span>
          <span className="text-neutral-400 text-[10px]">
            {thumbX.toFixed(0)}%
          </span>
        </div>

        <div
          ref={trackRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`relative h-14 rounded-xl border border-cyan-500/30 bg-neutral-900/40 backdrop-blur-md cursor-grab active:cursor-grabbing transition-colors duration-150 ${
            isDragging ? "border-cyan-400/70 bg-cyan-950/20" : ""
          }`}
        >
          {/* Centered reference notch */}
          <div className="absolute left-1/2 top-2 bottom-2 w-0.5 bg-neutral-700/40 -translate-x-1/2 pointer-events-none" />

          {/* Sub-grid markings */}
          <div className="absolute inset-0 flex justify-between px-6 items-center pointer-events-none opacity-20">
            <div className="w-0.5 h-4 bg-cyan-400" />
            <div className="w-0.5 h-3 bg-cyan-400" />
            <div className="w-0.5 h-4 bg-cyan-400" />
            <div className="w-0.5 h-3 bg-cyan-400" />
            <div className="w-0.5 h-4 bg-cyan-400" />
          </div>

          {/* Luminous Thumb Slider Puck */}
          <div
            className={`absolute top-1 bottom-1 w-14 -ml-7 rounded-lg flex items-center justify-center transition-transform duration-75 shadow-lg ${
              isDragging
                ? "bg-gradient-to-b from-cyan-400 to-cyan-600 border border-cyan-200 text-neutral-950 shadow-cyan-500/50 scale-105"
                : "bg-gradient-to-b from-cyan-500/80 to-cyan-700/80 border border-cyan-400/50 text-neutral-900 shadow-cyan-900/40"
            }`}
            style={{ left: `${thumbX}%` }}
          >
            <div className="flex flex-col items-center gap-0.5 pointer-events-none">
              <div className="w-4 h-0.5 bg-neutral-950/70 rounded-full" />
              <div className="w-4 h-0.5 bg-neutral-950/70 rounded-full" />
              <div className="w-4 h-0.5 bg-neutral-950/70 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Touch Button: Fire / Launch */}
      <button
        id="btn-touch-action"
        onClick={() => {
          inputManager.requestFire();
          onFire();
        }}
        className={`w-20 h-14 rounded-xl flex flex-col items-center justify-center border font-mono text-[11px] font-bold tracking-wider active:scale-95 transition-all shadow-md ${
          hasLaser
            ? "bg-red-600/60 hover:bg-red-600/80 border-red-400 text-white shadow-red-500/40 animate-pulse"
            : isWaitingToLaunch
            ? "bg-emerald-600/60 hover:bg-emerald-600/80 border-emerald-400 text-white shadow-emerald-500/40"
            : "bg-cyan-600/40 hover:bg-cyan-600/60 border-cyan-400 text-cyan-200 shadow-cyan-500/20"
        }`}
      >
        <Zap className="w-5 h-5 mb-0.5" />
        <span>
          {hasLaser ? "LÁSER" : isWaitingToLaunch ? "SAQUE" : "GOLPE"}
        </span>
      </button>
    </div>
  );
};
