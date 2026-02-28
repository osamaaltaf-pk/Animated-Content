import React, { useEffect, useRef, useState } from "react";
import { SceneEngine } from "../engine/SceneEngine";
import { Exporter } from "../engine/Exporter";
import { SceneJSON } from "../engine/schema";
import { Play, Pause, Download, RefreshCw } from "lucide-react";

interface PreviewProps {
  sceneData: SceneJSON;
}

export function Preview({ sceneData }: PreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SceneEngine | null>(null);
  const exporterRef = useRef<Exporter | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new SceneEngine(canvasRef.current);
      exporterRef.current = new Exporter(canvasRef.current);
    }

    if (engineRef.current && sceneData) {
      engineRef.current.preloadAssets(sceneData).then(() => {
        engineRef.current!.loadScene(sceneData);
        engineRef.current!.render();
        setIsPlaying(false);
      });
    }
  }, [sceneData]);

  const handlePlay = () => {
    if (engineRef.current) {
      engineRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.masterTimeline.pause(0);
      setIsPlaying(false);
    }
  };

  const handleExport = async (format: 'webm' | 'mp4' = 'webm') => {
    if (!engineRef.current || !exporterRef.current) return;

    setIsExporting(true);
    handleReset();

    exporterRef.current.startRecording();
    engineRef.current.play();

    // Wait for duration
    setTimeout(async () => {
      engineRef.current?.pause();
      const blob = await exporterRef.current!.stopRecording();
      
      if (format === 'mp4') {
        try {
          const mp4Blob = await exporterRef.current!.convertToMP4(blob);
          exporterRef.current!.download(mp4Blob, `scene_${sceneData.scene_id}.mp4`);
        } catch (e) {
          console.error("MP4 conversion failed, falling back to WebM", e);
          exporterRef.current!.download(blob, `scene_${sceneData.scene_id}.webm`);
        }
      } else {
        exporterRef.current!.download(blob, `scene_${sceneData.scene_id}.webm`);
      }
      
      setIsExporting(false);
      setIsPlaying(false);
    }, sceneData.duration * 1000);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black">
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          className="w-full max-w-4xl aspect-video"
        />
        {isExporting && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <div className="text-white flex flex-col items-center gap-2">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <span className="font-mono">Rendering...</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/10">
        {!isPlaying ? (
          <button
            onClick={handlePlay}
            className="p-3 hover:bg-white/10 rounded-lg transition-colors text-emerald-400"
          >
            <Play className="w-6 h-6 fill-current" />
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="p-3 hover:bg-white/10 rounded-lg transition-colors text-amber-400"
          >
            <Pause className="w-6 h-6 fill-current" />
          </button>
        )}

        <button
          onClick={handleReset}
          className="p-3 hover:bg-white/10 rounded-lg transition-colors text-zinc-400"
        >
          <RefreshCw className="w-5 h-5" />
        </button>

        <div className="w-px h-8 bg-white/10 mx-2" />

        <button
          onClick={() => handleExport('webm')}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg transition-colors font-medium text-sm"
        >
          <Download className="w-4 h-4" />
          Export WebM
        </button>
        
        <button
          onClick={() => handleExport('mp4')}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg transition-colors font-medium text-sm"
        >
          <Download className="w-4 h-4" />
          Export MP4
        </button>
      </div>
    </div>
  );
}
