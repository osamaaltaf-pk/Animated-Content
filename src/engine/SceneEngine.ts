import { SceneJSON } from "./schema";
import { CharacterRig } from "./CharacterRig";
import gsap from "gsap";

export class SceneEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  sceneData: SceneJSON | null = null;
  characters: CharacterRig[] = [];
  masterTimeline: gsap.core.Timeline;

  // Camera
  camera = { x: 0, y: 0, zoom: 1 };

  // Background
  bgGradient: CanvasGradient | null = null;
  bgImages: { img: HTMLImageElement; depth: number }[] = [];
  
  // Audio
  audioElements: HTMLAudioElement[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.masterTimeline = gsap.timeline({
      paused: true,
      onUpdate: () => this.render(),
    });

    // Start render loop
    gsap.ticker.add(() => this.render());
  }

  async preloadAssets(json: SceneJSON): Promise<void> {
    const promises: Promise<void>[] = [];

    if (json.background.layers) {
      json.background.layers.forEach(layer => {
        promises.push(new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Resolve anyway to not block
          img.src = layer.url;
        }));
      });
    }

    if (json.audio?.music) {
      promises.push(new Promise((resolve) => {
        const audio = new Audio();
        audio.oncanplaythrough = () => resolve();
        audio.onerror = () => resolve();
        audio.src = json.audio!.music!;
      }));
    }

    if (json.audio?.sfx) {
      json.audio.sfx.forEach(sfx => {
        promises.push(new Promise((resolve) => {
          const audio = new Audio();
          audio.oncanplaythrough = () => resolve();
          audio.onerror = () => resolve();
          audio.src = sfx.url;
        }));
      });
    }

    await Promise.all(promises);
  }

  loadScene(json: SceneJSON) {
    this.sceneData = json;
    this.characters = [];
    this.bgImages = [];
    this.audioElements.forEach(a => { a.pause(); a.src = ''; });
    this.audioElements = [];
    this.masterTimeline.clear();

    // Setup background
    this.bgGradient = this.ctx.createLinearGradient(
      0,
      0,
      0,
      this.canvas.height,
    );
    if (json.background.type === "forest_day") {
      this.bgGradient.addColorStop(0, "#87CEEB"); // Sky blue
      this.bgGradient.addColorStop(1, "#90EE90"); // Light green
    } else {
      this.bgGradient.addColorStop(0, "#2c3e50");
      this.bgGradient.addColorStop(1, "#3498db");
    }

    if (json.background.layers) {
      json.background.layers.forEach(layer => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = layer.url;
        this.bgImages.push({ img, depth: layer.depth });
      });
      this.bgImages.sort((a, b) => a.depth - b.depth);
    }

    // Setup Audio
    if (json.audio?.music) {
      const music = new Audio(json.audio.music);
      music.loop = true;
      this.audioElements.push(music);
      this.masterTimeline.call(() => music.play(), [], 0);
    }
    if (json.audio?.sfx) {
      json.audio.sfx.forEach(sfx => {
        const audio = new Audio(sfx.url);
        this.audioElements.push(audio);
        this.masterTimeline.call(() => {
          audio.currentTime = 0;
          audio.play();
        }, [], sfx.startTime);
      });
    }

    // Setup Camera
    this.camera = { x: 0, y: 0, zoom: 1 };
    if (json.camera) {
      this.masterTimeline.to(
        this.camera,
        {
          zoom: json.camera.zoom,
          x: json.camera.pan[0],
          y: json.camera.pan[1],
          duration: json.duration,
          ease: "power1.inOut",
        },
        0,
      );

      if (json.camera.drift) {
        this.masterTimeline.to(
          this.camera,
          {
            x: "+=20",
            y: "+=10",
            duration: json.duration,
            ease: "sine.inOut",
            yoyo: true,
            repeat: 1,
          },
          0,
        );
      }
      
      if (json.camera.handheld) {
        // High frequency, low amplitude noise
        const shakes = Math.floor(json.duration * 10);
        for(let i=0; i<shakes; i++) {
          this.masterTimeline.to(this.camera, {
            x: `+=${Math.random() * 4 - 2}`,
            y: `+=${Math.random() * 4 - 2}`,
            duration: 0.1,
            ease: "none"
          }, i * 0.1);
        }
      }
    }

    // Setup Characters
    json.characters.forEach((charData) => {
      const template = json.templates?.find(t => t.id === charData.template);
      const char = new CharacterRig(
        charData.id,
        charData.id === "rabbit" ? "#FFB6C1" : "#FFDAB9",
        template
      );
      char.root.x = charData.position[0];
      char.root.y = charData.position[1];
      char.root.scaleX = charData.scale;
      char.root.scaleY = charData.scale;
      this.characters.push(char);

      let currentTime = 0;
      charData.actions.forEach((action) => {
        const startTime =
          action.startTime !== undefined ? action.startTime : currentTime;
        let actionTl;

        switch (action.type) {
          case "walk":
            actionTl = char.walk(action.duration, action.direction || "right");
            break;
          case "talk":
            actionTl = char.talk(action.duration, action.emotion || "neutral");
            break;
          case "wave":
            actionTl = char.wave(action.duration);
            break;
          case "jump":
            actionTl = char.jump(action.duration);
            break;
          case "point":
            actionTl = char.point(action.duration, action.direction || "right");
            break;
          case "blink":
            actionTl = char.blink(action.duration);
            break;
          case "setEmotion":
            actionTl = char.setEmotion(action.emotion || "neutral", action.duration);
            break;
          case "idle":
          default:
            actionTl = char.idleBreathing(action.duration);
            break;
        }

        this.masterTimeline.add(actionTl, startTime);
        if (action.startTime === undefined) {
          // Blend overlap: start the next animation 0.2s before this one ends
          currentTime += Math.max(0, action.duration - 0.2);
        }
      });
    });
  }

  play() {
    this.masterTimeline.play(0);
  }

  pause() {
    this.masterTimeline.pause();
    this.audioElements.forEach(a => a.pause());
  }

  render() {
    // Clear
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Background Gradient
    if (this.bgGradient) {
      this.ctx.fillStyle = this.bgGradient;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Draw Background Layers (Negative Depth)
    this.ctx.save();
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    
    for (const layer of this.bgImages) {
      if (layer.depth >= 0) continue;
      if (!layer.img.complete || layer.img.naturalWidth === 0) continue;
      
      this.ctx.save();
      // Parallax effect: further away (more negative) moves less
      const parallaxFactor = 1 / (1 - layer.depth);
      this.ctx.translate(
        -this.canvas.width / 2 - this.camera.x * parallaxFactor,
        -this.canvas.height / 2 - this.camera.y * parallaxFactor
      );
      
      // Blur based on focal depth
      const focalDepth = this.sceneData?.camera?.focalDepth || 0;
      const blurAmount = Math.abs(layer.depth - focalDepth) * 2;
      if (blurAmount > 0) {
        this.ctx.filter = `blur(${blurAmount}px)`;
      }
      
      this.ctx.drawImage(layer.img, 0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
    }
    this.ctx.restore();

    // Apply Camera for focal plane (depth 0)
    this.ctx.save();
    // Center camera on canvas center
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    this.ctx.translate(
      -this.canvas.width / 2 - this.camera.x,
      -this.canvas.height / 2 - this.camera.y,
    );

    // Draw Characters
    // Sort by Y position for simple depth
    this.characters.sort((a, b) => a.root.y - b.root.y);

    for (const char of this.characters) {
      // Draw gentle shadow
      this.ctx.save();
      this.ctx.translate(char.root.x, char.root.y + 100);
      this.ctx.scale(1, 0.3);
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 40 * char.root.scaleX, 0, Math.PI * 2);
      this.ctx.fillStyle = "rgba(0,0,0,0.15)";
      this.ctx.fill();
      this.ctx.restore();

      char.root.draw(this.ctx);
    }

    this.ctx.restore();

    // Draw Foreground Layers (Positive Depth)
    this.ctx.save();
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    
    for (const layer of this.bgImages) {
      if (layer.depth < 0) continue;
      if (!layer.img.complete || layer.img.naturalWidth === 0) continue;
      
      this.ctx.save();
      // Parallax effect: closer (more positive) moves more
      const parallaxFactor = 1 + layer.depth;
      this.ctx.translate(
        -this.canvas.width / 2 - this.camera.x * parallaxFactor,
        -this.canvas.height / 2 - this.camera.y * parallaxFactor
      );
      
      // Blur based on focal depth
      const focalDepth = this.sceneData?.camera?.focalDepth || 0;
      const blurAmount = Math.abs(layer.depth - focalDepth) * 2;
      if (blurAmount > 0) {
        this.ctx.filter = `blur(${blurAmount}px)`;
      }
      
      this.ctx.drawImage(layer.img, 0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
    }
    this.ctx.restore();

    // Vignette overlay
    const gradient = this.ctx.createRadialGradient(
      this.canvas.width / 2,
      this.canvas.height / 2,
      this.canvas.width / 4,
      this.canvas.width / 2,
      this.canvas.height / 2,
      this.canvas.width,
    );
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.3)");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Dynamic Lighting Overlay
    if (this.sceneData?.lighting) {
      this.ctx.save();
      this.ctx.globalCompositeOperation = this.sceneData.lighting.blendMode;
      this.ctx.fillStyle = this.sceneData.lighting.color;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
    }
  }
}
