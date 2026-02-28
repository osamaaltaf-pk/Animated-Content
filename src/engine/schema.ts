export interface SceneJSON {
  scene_id: string | number;
  duration: number; // in seconds
  background: {
    type: string;
    layers?: {
      url: string;
      depth: number; // 0 is focal point, negative is background, positive is foreground
    }[];
    color?: string; // For multiply blend effects
  };
  camera: {
    zoom: number;
    pan: [number, number];
    drift: boolean;
    handheld?: boolean;
    focalDepth?: number;
  };
  lighting?: {
    color: string; // e.g., "rgba(0, 0, 50, 0.5)" for night
    blendMode: GlobalCompositeOperation; // e.g., "multiply", "overlay"
  };
  templates?: RigTemplateJSON[];
  characters: CharacterJSON[];
  audio?: {
    music?: string;
    sfx?: { url: string; startTime: number }[];
  };
}

export interface CharacterJSON {
  id: string;
  template?: string; // Reference to a rig template
  position: [number, number];
  scale: number;
  actions: ActionJSON[];
}

export interface ActionJSON {
  type: "walk" | "talk" | "idle" | "jump" | "wave" | "point" | "blink" | "setEmotion";
  direction?: "left" | "right";
  emotion?: "happy" | "sad" | "angry" | "neutral" | "surprised";
  duration: number;
  startTime?: number;
}

export interface RigNodeJSON {
  id: string;
  parentId?: string;
  type: 'shape' | 'svg';
  color?: string;
  width?: number;
  height?: number;
  borderRadius?: number;
  path?: string; // SVG path data
  x: number;
  y: number;
  pivotX: number;
  pivotY: number;
}

export interface RigTemplateJSON {
  id: string;
  nodes: RigNodeJSON[];
}
