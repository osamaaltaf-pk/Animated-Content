/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Preview } from "./components/Preview";
import { SceneJSON } from "./engine/schema";
import { Code2, PlaySquare } from "lucide-react";

const DEFAULT_SCENE: SceneJSON = {
  scene_id: 1,
  duration: 5,
  background: {
    type: "forest_day",
    layers: [
      { url: "https://picsum.photos/seed/bg/1920/1080", depth: -2 },
      { url: "https://picsum.photos/seed/fg/1920/1080", depth: 1 }
    ]
  },
  camera: {
    zoom: 1.05,
    pan: [50, 0],
    drift: true,
    handheld: true,
    focalDepth: 0
  },
  lighting: {
    color: "rgba(255, 200, 100, 0.2)",
    blendMode: "multiply"
  },
  templates: [
    {
      id: "robot",
      nodes: [
        { id: "torso", type: "shape", color: "#888", width: 60, height: 100, borderRadius: 10, x: 0, y: 0, pivotX: 30, pivotY: 50 },
        { id: "head", parentId: "torso", type: "shape", color: "#aaa", width: 80, height: 80, borderRadius: 20, x: 30, y: -10, pivotX: 40, pivotY: 80 },
        { id: "leftEye", parentId: "head", type: "shape", color: "#0ff", width: 15, height: 15, borderRadius: 7.5, x: 20, y: 30, pivotX: 7.5, pivotY: 7.5 },
        { id: "rightEye", parentId: "head", type: "shape", color: "#0ff", width: 15, height: 15, borderRadius: 7.5, x: 60, y: 30, pivotX: 7.5, pivotY: 7.5 },
        { id: "mouth", parentId: "head", type: "shape", color: "#222", width: 30, height: 10, borderRadius: 5, x: 40, y: 60, pivotX: 15, pivotY: 5 },
        { id: "leftEyebrow", parentId: "head", type: "shape", color: "#333", width: 20, height: 5, borderRadius: 2, x: 20, y: 15, pivotX: 10, pivotY: 2.5 },
        { id: "rightEyebrow", parentId: "head", type: "shape", color: "#333", width: 20, height: 5, borderRadius: 2, x: 60, y: 15, pivotX: 10, pivotY: 2.5 },
        { id: "leftUpperArm", parentId: "torso", type: "shape", color: "#999", width: 20, height: 50, borderRadius: 10, x: -10, y: 10, pivotX: 10, pivotY: 10 },
        { id: "leftLowerArm", parentId: "leftUpperArm", type: "shape", color: "#bbb", width: 16, height: 40, borderRadius: 8, x: 10, y: 45, pivotX: 8, pivotY: 5 },
        { id: "rightUpperArm", parentId: "torso", type: "shape", color: "#999", width: 20, height: 50, borderRadius: 10, x: 70, y: 10, pivotX: 10, pivotY: 10 },
        { id: "rightLowerArm", parentId: "rightUpperArm", type: "shape", color: "#bbb", width: 16, height: 40, borderRadius: 8, x: 10, y: 45, pivotX: 8, pivotY: 5 },
        { id: "leftUpperLeg", parentId: "torso", type: "shape", color: "#777", width: 24, height: 60, borderRadius: 12, x: 15, y: 90, pivotX: 12, pivotY: 10 },
        { id: "leftLowerLeg", parentId: "leftUpperLeg", type: "shape", color: "#999", width: 20, height: 50, borderRadius: 10, x: 12, y: 55, pivotX: 10, pivotY: 5 },
        { id: "rightUpperLeg", parentId: "torso", type: "shape", color: "#777", width: 24, height: 60, borderRadius: 12, x: 45, y: 90, pivotX: 12, pivotY: 10 },
        { id: "rightLowerLeg", parentId: "rightUpperLeg", type: "shape", color: "#999", width: 20, height: 50, borderRadius: 10, x: 12, y: 55, pivotX: 10, pivotY: 5 }
      ]
    }
  ],
  characters: [
    {
      id: "rabbit",
      position: [-200, 100],
      scale: 1.5,
      actions: [
        { type: "walk", direction: "right", duration: 2 },
        { type: "setEmotion", emotion: "happy", duration: 2 },
        { type: "talk", emotion: "happy", duration: 2 },
        { type: "wave", duration: 1 },
      ],
    },
    {
      id: "bear",
      template: "robot",
      position: [300, 100],
      scale: 2,
      actions: [
        { type: "idle", duration: 2 },
        { type: "jump", duration: 1 },
        { type: "point", direction: "left", duration: 1 },
        { type: "idle", duration: 1 },
      ],
    },
  ],
};

export default function App() {
  const [jsonInput, setJsonInput] = useState(
    JSON.stringify(DEFAULT_SCENE, null, 2),
  );
  const [activeScene, setActiveScene] = useState<SceneJSON>(DEFAULT_SCENE);
  const [error, setError] = useState("");

  const handleApply = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setActiveScene(parsed);
      setError("");
    } catch (e) {
      setError("Invalid JSON format");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
      <header className="border-b border-white/10 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <PlaySquare className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-semibold tracking-tight">
              Procedural Animation Engine
            </h1>
          </div>
          <div className="text-xs font-mono text-zinc-500">v1.0.0-beta</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid lg:grid-cols-[400px_1fr] gap-8">
        {/* Editor Panel */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium flex items-center gap-2 text-zinc-400">
              <Code2 className="w-4 h-4" />
              Scene Definition (JSON)
            </h2>
            <button
              onClick={handleApply}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-xs font-medium transition-colors"
            >
              Apply Changes
            </button>
          </div>

          <div className="relative flex-1 min-h-[500px]">
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="absolute inset-0 w-full h-full bg-zinc-900 border border-white/10 rounded-xl p-4 font-mono text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 resize-none"
              spellCheck={false}
            />
          </div>
          {error && <div className="text-red-400 text-sm">{error}</div>}
        </div>

        {/* Preview Panel */}
        <div className="flex flex-col items-center justify-center bg-zinc-900/30 border border-white/5 rounded-2xl p-8">
          <Preview sceneData={activeScene} />
        </div>
      </main>
    </div>
  );
}
