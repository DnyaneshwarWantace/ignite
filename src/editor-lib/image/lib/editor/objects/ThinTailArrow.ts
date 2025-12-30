/*
 * Thin tail arrow with support for control bar dragging without deformation
 * Converted to Fabric.js v6
 */
import { Line } from 'fabric';

class ThinTailArrow extends Line {
  public superType = 'drawing' as const;

  constructor(points?: number[], options?: any) {
    if (!points) {
      const { x1, x2, y1, y2 } = options || {};
      points = [x1, y1, x2, y2] as [number, number, number, number];
    }
    options = options || {};
    super(points as [number, number, number, number], options);
    (this as any).type = 'thinTailArrow';
  }

  _render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    // Scale to compensate for element scaling so arrow doesn't deform
    ctx.scale(1 / (this.scaleX || 1), 1 / (this.scaleY || 1));
    const xDiff = ((this.x2 || 0) - (this.x1 || 0)) * (this.scaleX || 1);
    const yDiff = ((this.y2 || 0) - (this.y1 || 0)) * (this.scaleY || 1);
    ctx.translate(-xDiff / 2, -yDiff / 2);
    // Arrow direction angle
    const angle = Math.atan2(yDiff, xDiff);
    ctx.rotate(angle);

    // Draw thin tail arrow
    const arrowLength = 20;
    const arrowWidth = 8;
    const tailWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-arrowLength, -arrowWidth);
    ctx.lineTo(-arrowLength, arrowWidth);
    ctx.closePath();
    ctx.fillStyle = (this.stroke as string) || '#000';
    ctx.fill();

    // Draw thin tail
    ctx.beginPath();
    ctx.moveTo(-arrowLength, 0);
    ctx.lineTo(-xDiff / 2, -tailWidth);
    ctx.lineTo(-xDiff / 2, tailWidth);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Render line
    super._render(ctx);
  }

  static fromObject(object: any): Promise<ThinTailArrow> {
    return new Promise((resolve) => {
      (Line as any)._fromObject('ThinTailArrow', object, (instance: ThinTailArrow) => {
        resolve(instance);
      });
    });
  }
}

export default ThinTailArrow;

