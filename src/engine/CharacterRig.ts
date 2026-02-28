import { TransformNode } from "./TransformNode";
import { RigTemplateJSON, RigNodeJSON } from "./schema";
import gsap from "gsap";

export class ShapeNode extends TransformNode {
  color: string;
  width: number;
  height: number;
  borderRadius: number;

  constructor(
    name: string,
    color: string,
    width: number,
    height: number,
    borderRadius: number = 0,
  ) {
    super(name);
    this.color = color;
    this.width = width;
    this.height = height;
    this.borderRadius = borderRadius;
  }

  renderSelf(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    if (this.borderRadius > 0) {
      ctx.beginPath();
      ctx.roundRect(0, 0, this.width, this.height, this.borderRadius);
      ctx.fill();
    } else {
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }
}

export class SvgNode extends TransformNode {
  path: Path2D;
  color: string;

  constructor(name: string, pathData: string, color: string) {
    super(name);
    this.path = new Path2D(pathData);
    this.color = color;
  }

  renderSelf(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.fill(this.path);
  }
}

export class CharacterRig {
  root: TransformNode;
  parts: Record<string, TransformNode> = {};

  constructor(id: string, colorTheme: string = "#FFB6C1", template?: RigTemplateJSON) {
    if (template) {
      this.buildFromTemplate(id, template);
    } else {
      this.buildDefaultRig(id, colorTheme);
    }
  }

  private buildFromTemplate(id: string, template: RigTemplateJSON) {
    const nodeMap: Record<string, TransformNode> = {};

    // First pass: instantiate nodes
    template.nodes.forEach(nodeData => {
      let node: TransformNode;
      if (nodeData.type === 'svg' && nodeData.path) {
        node = new SvgNode(`${id}_${nodeData.id}`, nodeData.path, nodeData.color || "#000");
      } else {
        node = new ShapeNode(
          `${id}_${nodeData.id}`,
          nodeData.color || "#000",
          nodeData.width || 10,
          nodeData.height || 10,
          nodeData.borderRadius || 0
        );
      }
      node.x = nodeData.x;
      node.y = nodeData.y;
      node.pivotX = nodeData.pivotX;
      node.pivotY = nodeData.pivotY;
      
      nodeMap[nodeData.id] = node;
      this.parts[nodeData.id] = node;
    });

    // Second pass: build hierarchy
    template.nodes.forEach(nodeData => {
      const node = nodeMap[nodeData.id];
      if (nodeData.parentId && nodeMap[nodeData.parentId]) {
        nodeMap[nodeData.parentId].addChild(node);
      } else {
        this.root = node; // Assume the first node without a parent is the root
      }
    });
  }

  private buildDefaultRig(id: string, colorTheme: string) {
    // Create parts
    const torso = new ShapeNode(`${id}_torso`, colorTheme, 60, 100, 20);
    torso.pivotX = 30;
    torso.pivotY = 50;
    this.root = torso;
    this.parts["torso"] = torso;

    const head = new ShapeNode(`${id}_head`, "#FFE4E1", 80, 80, 40);
    head.x = 30;
    head.y = -10;
    head.pivotX = 40;
    head.pivotY = 80;
    torso.addChild(head);
    this.parts["head"] = head;

    // Eyes
    const leftEye = new ShapeNode(`${id}_leftEye`, "#333", 10, 10, 5);
    leftEye.x = 25;
    leftEye.y = 30;
    head.addChild(leftEye);
    this.parts["leftEye"] = leftEye;

    const rightEye = new ShapeNode(`${id}_rightEye`, "#333", 10, 10, 5);
    rightEye.x = 55;
    rightEye.y = 30;
    head.addChild(rightEye);
    this.parts["rightEye"] = rightEye;

    // Eyebrows
    const leftEyebrow = new ShapeNode(`${id}_leftEyebrow`, "#222", 14, 4, 2);
    leftEyebrow.x = 23;
    leftEyebrow.y = 20;
    head.addChild(leftEyebrow);
    this.parts["leftEyebrow"] = leftEyebrow;

    const rightEyebrow = new ShapeNode(`${id}_rightEyebrow`, "#222", 14, 4, 2);
    rightEyebrow.x = 53;
    rightEyebrow.y = 20;
    head.addChild(rightEyebrow);
    this.parts["rightEyebrow"] = rightEyebrow;

    // Mouth
    const mouth = new ShapeNode(`${id}_mouth`, "#FF69B4", 20, 10, 5);
    mouth.x = 40;
    mouth.y = 60;
    mouth.pivotX = 10;
    head.addChild(mouth);
    this.parts["mouth"] = mouth;

    // Arms
    const leftUpperArm = new ShapeNode(
      `${id}_leftUpperArm`,
      colorTheme,
      20,
      50,
      10,
    );
    leftUpperArm.x = -10;
    leftUpperArm.y = 10;
    leftUpperArm.pivotX = 10;
    leftUpperArm.pivotY = 10;
    torso.addChild(leftUpperArm);
    this.parts["leftUpperArm"] = leftUpperArm;

    const leftLowerArm = new ShapeNode(
      `${id}_leftLowerArm`,
      "#FFE4E1",
      16,
      40,
      8,
    );
    leftLowerArm.x = 10;
    leftLowerArm.y = 45;
    leftLowerArm.pivotX = 8;
    leftLowerArm.pivotY = 5;
    leftUpperArm.addChild(leftLowerArm);
    this.parts["leftLowerArm"] = leftLowerArm;

    const rightUpperArm = new ShapeNode(
      `${id}_rightUpperArm`,
      colorTheme,
      20,
      50,
      10,
    );
    rightUpperArm.x = 70;
    rightUpperArm.y = 10;
    rightUpperArm.pivotX = 10;
    rightUpperArm.pivotY = 10;
    torso.addChild(rightUpperArm);
    this.parts["rightUpperArm"] = rightUpperArm;

    const rightLowerArm = new ShapeNode(
      `${id}_rightLowerArm`,
      "#FFE4E1",
      16,
      40,
      8,
    );
    rightLowerArm.x = 10;
    rightLowerArm.y = 45;
    rightLowerArm.pivotX = 8;
    rightLowerArm.pivotY = 5;
    rightUpperArm.addChild(rightLowerArm);
    this.parts["rightLowerArm"] = rightLowerArm;

    // Legs
    const leftUpperLeg = new ShapeNode(
      `${id}_leftUpperLeg`,
      "#87CEFA",
      24,
      60,
      12,
    );
    leftUpperLeg.x = 15;
    leftUpperLeg.y = 90;
    leftUpperLeg.pivotX = 12;
    leftUpperLeg.pivotY = 10;
    torso.addChild(leftUpperLeg);
    this.parts["leftUpperLeg"] = leftUpperLeg;

    const leftLowerLeg = new ShapeNode(
      `${id}_leftLowerLeg`,
      "#FFE4E1",
      20,
      50,
      10,
    );
    leftLowerLeg.x = 12;
    leftLowerLeg.y = 55;
    leftLowerLeg.pivotX = 10;
    leftLowerLeg.pivotY = 5;
    leftUpperLeg.addChild(leftLowerLeg);
    this.parts["leftLowerLeg"] = leftLowerLeg;

    const rightUpperLeg = new ShapeNode(
      `${id}_rightUpperLeg`,
      "#87CEFA",
      24,
      60,
      12,
    );
    rightUpperLeg.x = 45;
    rightUpperLeg.y = 90;
    rightUpperLeg.pivotX = 12;
    rightUpperLeg.pivotY = 10;
    torso.addChild(rightUpperLeg);
    this.parts["rightUpperLeg"] = rightUpperLeg;

    const rightLowerLeg = new ShapeNode(
      `${id}_rightLowerLeg`,
      "#FFE4E1",
      20,
      50,
      10,
    );
    rightLowerLeg.x = 12;
    rightLowerLeg.y = 55;
    rightLowerLeg.pivotX = 10;
    rightLowerLeg.pivotY = 5;
    rightUpperLeg.addChild(rightLowerLeg);
    this.parts["rightLowerLeg"] = rightLowerLeg;
  }

  idleBreathing(duration: number) {
    return gsap
      .timeline()
      .to(
        this.parts["torso"],
        {
          scaleY: 1.05,
          scaleX: 0.98,
          duration: 1,
          yoyo: true,
          repeat: Math.max(0, Math.floor(duration) - 1),
          ease: "sine.inOut",
        },
        0,
      )
      .to(
        this.parts["head"],
        {
          rotation: 2,
          duration: 2,
          yoyo: true,
          repeat: Math.max(0, Math.floor(duration / 2) - 1),
          ease: "sine.inOut",
        },
        0,
      )
      .to(
        this.parts["leftUpperArm"],
        {
          rotation: 5,
          duration: 1.5,
          yoyo: true,
          repeat: Math.max(0, Math.floor(duration / 1.5) - 1),
          ease: "sine.inOut",
        },
        0,
      )
      .to(
        this.parts["rightUpperArm"],
        {
          rotation: -5,
          duration: 1.5,
          yoyo: true,
          repeat: Math.max(0, Math.floor(duration / 1.5) - 1),
          ease: "sine.inOut",
        },
        0,
      );
  }

  walk(duration: number, direction: "left" | "right") {
    const tl = gsap.timeline();
    const cycles = Math.max(1, Math.floor(duration * 2));
    const stepDuration = 0.5;

    const distance = direction === "right" ? 200 : -200;
    tl.to(
      this.root,
      { x: `+=${distance * (duration / 2)}`, duration: duration, ease: "none" },
      0,
    );

    for (let i = 0; i < cycles; i++) {
      const startTime = i * stepDuration;

      tl.to(
        this.parts["leftUpperLeg"],
        {
          rotation: 30,
          duration: stepDuration / 2,
          yoyo: true,
          repeat: 1,
          ease: "sine.inOut",
        },
        startTime,
      )
        .to(
          this.parts["leftLowerLeg"],
          {
            rotation: -20,
            duration: stepDuration / 2,
            yoyo: true,
            repeat: 1,
            ease: "sine.inOut",
          },
          startTime,
        )
        .to(
          this.parts["rightUpperLeg"],
          {
            rotation: -30,
            duration: stepDuration / 2,
            yoyo: true,
            repeat: 1,
            ease: "sine.inOut",
          },
          startTime,
        )
        .to(
          this.parts["rightLowerLeg"],
          {
            rotation: 10,
            duration: stepDuration / 2,
            yoyo: true,
            repeat: 1,
            ease: "sine.inOut",
          },
          startTime,
        );

      tl.to(
        this.parts["leftUpperArm"],
        {
          rotation: -30,
          duration: stepDuration / 2,
          yoyo: true,
          repeat: 1,
          ease: "sine.inOut",
        },
        startTime,
      ).to(
        this.parts["rightUpperArm"],
        {
          rotation: 30,
          duration: stepDuration / 2,
          yoyo: true,
          repeat: 1,
          ease: "sine.inOut",
        },
        startTime,
      );

      tl.to(
        this.root,
        {
          y: "-=10",
          duration: stepDuration / 2,
          yoyo: true,
          repeat: 1,
          ease: "sine.inOut",
        },
        startTime,
      );
    }
    return tl;
  }

  talk(duration: number, emotion: string) {
    const tl = gsap.timeline();
    const cycles = Math.max(1, Math.floor(duration * 4));

    for (let i = 0; i < cycles; i++) {
      tl.to(
        this.parts["mouth"],
        {
          scaleY: Math.random() * 1.5 + 0.5,
          scaleX: Math.random() * 0.5 + 0.8,
          duration: 0.1,
          yoyo: true,
          repeat: 1,
        },
        i * 0.25,
      );
    }

    tl.to(
      this.parts["head"],
      {
        rotation: 5,
        duration: 0.5,
        yoyo: true,
        repeat: Math.max(0, Math.floor(duration * 2) - 1),
        ease: "sine.inOut",
      },
      0,
    );

    return tl;
  }

  wave(duration: number) {
    const tl = gsap.timeline();
    tl.to(
      this.parts["rightUpperArm"],
      { rotation: -120, duration: 0.5, ease: "power1.inOut" },
      0,
    ).to(
      this.parts["rightLowerArm"],
      { rotation: -40, duration: 0.5, ease: "power1.inOut" },
      0,
    );

    const waveCycles = Math.max(1, Math.floor((duration - 1) * 2));
    for (let i = 0; i < waveCycles; i++) {
      tl.to(
        this.parts["rightLowerArm"],
        {
          rotation: 20,
          duration: 0.25,
          yoyo: true,
          repeat: 1,
          ease: "sine.inOut",
        },
        0.5 + i * 0.5,
      );
    }

    tl.to(
      this.parts["rightUpperArm"],
      { rotation: 0, duration: 0.5, ease: "power1.inOut" },
      duration - 0.5,
    ).to(
      this.parts["rightLowerArm"],
      { rotation: 0, duration: 0.5, ease: "power1.inOut" },
      duration - 0.5,
    );

    return tl;
  }

  jump(duration: number) {
    const tl = gsap.timeline();
    tl.to(
      this.root,
      { scaleY: 0.8, scaleX: 1.1, y: "+=20", duration: 0.2, ease: "power1.in" },
      0,
    )
      .to(this.parts["leftUpperLeg"], { rotation: -40, duration: 0.2 }, 0)
      .to(this.parts["rightUpperLeg"], { rotation: -40, duration: 0.2 }, 0)
      .to(this.parts["leftLowerLeg"], { rotation: 80, duration: 0.2 }, 0)
      .to(this.parts["rightLowerLeg"], { rotation: 80, duration: 0.2 }, 0);

    tl.to(
      this.root,
      {
        scaleY: 1.1,
        scaleX: 0.9,
        y: "-=150",
        duration: 0.4,
        ease: "power1.out",
      },
      0.2,
    )
      .to(this.parts["leftUpperLeg"], { rotation: 10, duration: 0.4 }, 0.2)
      .to(this.parts["rightUpperLeg"], { rotation: 10, duration: 0.4 }, 0.2)
      .to(this.parts["leftLowerLeg"], { rotation: 0, duration: 0.4 }, 0.2)
      .to(this.parts["rightLowerLeg"], { rotation: 0, duration: 0.4 }, 0.2);

    tl.to(
      this.root,
      { scaleY: 1, scaleX: 1, y: "+=150", duration: 0.3, ease: "power1.in" },
      0.6,
    );

    tl.to(
      this.root,
      {
        scaleY: 0.8,
        scaleX: 1.1,
        y: "+=20",
        duration: 0.1,
        ease: "power1.out",
      },
      0.9,
    )
      .to(this.parts["leftUpperLeg"], { rotation: -40, duration: 0.1 }, 0.9)
      .to(this.parts["rightUpperLeg"], { rotation: -40, duration: 0.1 }, 0.9)
      .to(this.parts["leftLowerLeg"], { rotation: 80, duration: 0.1 }, 0.9)
      .to(this.parts["rightLowerLeg"], { rotation: 80, duration: 0.1 }, 0.9);

    tl.to(
      this.root,
      { scaleY: 1, scaleX: 1, y: "-=20", duration: 0.2, ease: "power1.inOut" },
      1.0,
    )
      .to(this.parts["leftUpperLeg"], { rotation: 0, duration: 0.2 }, 1.0)
      .to(this.parts["rightUpperLeg"], { rotation: 0, duration: 0.2 }, 1.0)
      .to(this.parts["leftLowerLeg"], { rotation: 0, duration: 0.2 }, 1.0)
      .to(this.parts["rightLowerLeg"], { rotation: 0, duration: 0.2 }, 1.0);

    return tl;
  }

  blink(duration: number) {
    const tl = gsap.timeline();
    const blinks = Math.max(1, Math.floor(duration / 3)); // Blink every ~3 seconds
    for (let i = 0; i < blinks; i++) {
      const time = i * 3 + Math.random();
      tl.to([this.parts["leftEye"], this.parts["rightEye"]], {
        scaleY: 0.1,
        duration: 0.1,
        yoyo: true,
        repeat: 1
      }, time);
    }
    return tl;
  }

  point(duration: number, direction: "left" | "right" = "right") {
    const tl = gsap.timeline();
    const arm = direction === "right" ? this.parts["rightUpperArm"] : this.parts["leftUpperArm"];
    const lowerArm = direction === "right" ? this.parts["rightLowerArm"] : this.parts["leftLowerArm"];
    const rot = direction === "right" ? -90 : 90;

    tl.to(arm, { rotation: rot, duration: 0.5, ease: "power1.inOut" }, 0)
      .to(lowerArm, { rotation: 0, duration: 0.5, ease: "power1.inOut" }, 0);
      
    tl.to(arm, { rotation: 0, duration: 0.5, ease: "power1.inOut" }, duration - 0.5)
      .to(lowerArm, { rotation: 0, duration: 0.5, ease: "power1.inOut" }, duration - 0.5);

    return tl;
  }

  setEmotion(emotion: string, duration: number) {
    const tl = gsap.timeline();
    let leftEyebrowRot = 0;
    let rightEyebrowRot = 0;
    let mouthScaleY = 1;
    let mouthScaleX = 1;

    switch (emotion) {
      case "happy":
        leftEyebrowRot = -10;
        rightEyebrowRot = 10;
        mouthScaleY = 1.5;
        mouthScaleX = 1.2;
        break;
      case "sad":
        leftEyebrowRot = 15;
        rightEyebrowRot = -15;
        mouthScaleY = 0.5;
        mouthScaleX = 0.8;
        break;
      case "angry":
        leftEyebrowRot = 20;
        rightEyebrowRot = -20;
        mouthScaleY = 0.2;
        mouthScaleX = 1.2;
        break;
      case "surprised":
        leftEyebrowRot = -20;
        rightEyebrowRot = 20;
        mouthScaleY = 2;
        mouthScaleX = 0.8;
        break;
      case "neutral":
      default:
        leftEyebrowRot = 0;
        rightEyebrowRot = 0;
        mouthScaleY = 1;
        mouthScaleX = 1;
        break;
    }

    tl.to(this.parts["leftEyebrow"], { rotation: leftEyebrowRot, duration: 0.3 }, 0)
      .to(this.parts["rightEyebrow"], { rotation: rightEyebrowRot, duration: 0.3 }, 0)
      .to(this.parts["mouth"], { scaleY: mouthScaleY, scaleX: mouthScaleX, duration: 0.3 }, 0);

    // Revert at the end of duration
    tl.to(this.parts["leftEyebrow"], { rotation: 0, duration: 0.3 }, duration - 0.3)
      .to(this.parts["rightEyebrow"], { rotation: 0, duration: 0.3 }, duration - 0.3)
      .to(this.parts["mouth"], { scaleY: 1, scaleX: 1, duration: 0.3 }, duration - 0.3);

    return tl;
  }
}
