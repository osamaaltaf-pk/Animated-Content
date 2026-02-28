export class TransformNode {
  name: string;
  x: number = 0;
  y: number = 0;
  rotation: number = 0; // degrees
  scaleX: number = 1;
  scaleY: number = 1;
  pivotX: number = 0;
  pivotY: number = 0;
  alpha: number = 1;
  children: TransformNode[] = [];
  parent: TransformNode | null = null;

  constructor(name: string) {
    this.name = name;
  }

  addChild(child: TransformNode) {
    child.parent = this;
    this.children.push(child);
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.alpha <= 0) return;

    ctx.save();

    // Apply transforms
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.scale(this.scaleX, this.scaleY);

    // Apply pivot
    ctx.translate(-this.pivotX, -this.pivotY);

    // Apply alpha
    ctx.globalAlpha *= this.alpha;

    this.renderSelf(ctx);

    // Draw children
    for (const child of this.children) {
      child.draw(ctx);
    }

    ctx.restore();
  }

  // Override in subclasses
  renderSelf(ctx: CanvasRenderingContext2D) {}
}
