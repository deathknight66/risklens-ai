import { useState, useEffect, useRef } from "react";
import { Play, Pause, FastForward, SkipBack, Clock, AlertTriangle, ShieldAlert, Activity, CheckCircle2, Rewind } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CinematicReplay({ incidentId }: { incidentId: string }) {
  const [frames, setFrames] = useState<any[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchReplayData();
    return () => stopPlayback();
  }, [incidentId]);

  const fetchReplayData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/replay`);
      const data = await res.json();
      if (data.success && data.data.frames) {
        setFrames(data.data.frames);
        setCurrentFrameIndex(0);
      }
    } catch (e) {
      console.error("Failed to fetch replay data", e);
    }
    setLoading(false);
  };

  const stopPlayback = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentFrameIndex((prev) => {
          if (prev >= frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500 / speed);
    } else {
      stopPlayback();
    }
    return () => stopPlayback();
  }, [isPlaying, speed, frames.length]);

  const togglePlay = () => {
    if (currentFrameIndex >= frames.length - 1) {
      setCurrentFrameIndex(0); // Restart if at end
    }
    setIsPlaying(!isPlaying);
  };

  if (loading) {
    return <div className="text-sm text-slate-400 p-4">Loading Replay Engine...</div>;
  }

  if (frames.length === 0) {
    return null;
  }

  const visibleFrames = frames.slice(0, currentFrameIndex + 1);
  const progress = (currentFrameIndex / Math.max(1, frames.length - 1)) * 100;

  return (
    <div className="glass rounded-xl p-6 border border-indigo-500/30 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-purple-900/10 pointer-events-none" />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" /> Cinematic Replay
          </h3>
          <p className="text-xs text-slate-400 mt-1">Autonomous Cyber Battlefield Playback</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
          <button onClick={() => setCurrentFrameIndex(0)} className="p-1.5 text-slate-400 hover:text-white transition">
            <Rewind size={16} />
          </button>
          <button 
            onClick={togglePlay} 
            className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded text-white shadow-[0_0_10px_rgba(79,70,229,0.4)] transition"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button 
            onClick={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 4 : 1)} 
            className="p-1.5 text-slate-400 hover:text-white transition flex items-center gap-1 text-xs font-mono"
          >
            <FastForward size={16} /> x{speed}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-1.5 bg-slate-800 rounded-full overflow-hidden mb-6 z-10">
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Frame Viewer */}
      <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-4 h-[300px] overflow-y-auto font-mono text-sm space-y-3 relative z-10 scroll-smooth">
        {visibleFrames.map((frame, i) => {
          let icon = <Clock className="w-4 h-4 text-slate-500" />;
          let colorClass = "text-slate-300";
          
          if (frame.type === 'INIT') { colorClass = "text-slate-400"; }
          if (frame.type === 'ALERT') { icon = <AlertTriangle className="w-4 h-4 text-orange-400" />; colorClass = "text-orange-400"; }
          if (frame.type === 'ANALYSIS_COMPLETE') { icon = <Activity className="w-4 h-4 text-cyan-400" />; colorClass = "text-cyan-400"; }
          if (frame.type === 'ACTION_PROPOSED') { icon = <ShieldAlert className="w-4 h-4 text-yellow-400" />; colorClass = "text-yellow-400"; }
          if (frame.type === 'ACTION_EXECUTED') { icon = <CheckCircle2 className="w-4 h-4 text-emerald-400" />; colorClass = "text-emerald-400"; }

          const timeStr = new Date(frame.timestamp).toLocaleTimeString('en-US', { hour12: false });

          return (
            <div key={i} className="flex gap-3 animate-fade-in items-start">
              <span className="text-slate-500 shrink-0">{timeStr}</span>
              <span className="shrink-0 mt-0.5">{icon}</span>
              <div className="flex-1">
                <span className={cn("font-semibold", colorClass)}>{frame.message}</span>
                {frame.metadata && Object.keys(frame.metadata).length > 0 && (
                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-2">
                    {Object.entries(frame.metadata).map(([k, v]) => (
                      <span key={k} className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
