import React from 'react';
import { Play, Pause, FastForward, Rewind } from 'lucide-react';
import { cn } from '../lib/utils';

interface ReplayControlsProps {
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  speed: number;
  setSpeed: (speed: number) => void;
  onJump: (seconds: number) => void;
}

export const ReplayControls: React.FC<ReplayControlsProps> = ({
  isPlaying,
  setIsPlaying,
  speed,
  setSpeed,
  onJump
}) => {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 p-2 rounded-xl shadow-2xl flex items-center gap-4 z-50">
      <div className="flex items-center gap-1">
        <button 
          onClick={() => onJump(-60)}
          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
          title="Rewind 1m"
        >
          <Rewind size={18} />
        </button>
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-10 h-10 bg-yellow-500 hover:bg-yellow-400 rounded-lg flex items-center justify-center text-black shadow-lg shadow-yellow-500/10 transition-all active:scale-90"
        >
          {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
        </button>
        <button 
          onClick={() => onJump(60)}
          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
          title="Fast Forward 1m"
        >
          <FastForward size={18} />
        </button>
      </div>
      
      <div className="h-6 w-px bg-zinc-800" />
      
      <div className="flex items-center gap-2 pr-2">
        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Speed</span>
        <div className="flex gap-1">
          {[1, 2, 5, 10].map(s => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={cn(
                "w-7 h-7 rounded text-[10px] font-bold transition-all",
                speed === s ? "bg-zinc-800 text-yellow-500" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
