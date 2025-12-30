/*
 * Arrow element
 * Converted to Fabric.js v6
 */
import { Line } from 'fabric';

class Arrow extends Line {
  public superType = 'drawing' as const;

  constructor(points?: [number, number, number, number], options?: any) {
    if (!points) {
      const { x1, x2, y1, y2 } = options || {};
      points = [x1 || 0, y1 || 0, x2 || 0, y2 || 0];
    }
    options = options || {};
    super(points, options);
    (this as any).type = 'arrow';
  }

  _render(ctx: CanvasRenderingContext2D) {
    super._render(ctx);
    ctx.save();
    // Scale to compensate for element scaling so arrow doesn't deform
    ctx.scale(1 / (this.scaleX || 1), 1 / (this.scaleY || 1));
    const xDiff = ((this.x2 || 0) - (this.x1 || 0)) * (this.scaleX || 1);
    const yDiff = ((this.y2 || 0) - (this.y1 || 0)) * (this.scaleY || 1);
    const angle = Math.atan2(yDiff, xDiff);
    ctx.translate(
      (((this.x2 || 0) - (this.x1 || 0)) / 2) * (this.scaleX || 1),
      (((this.y2 || 0) - (this.y1 || 0)) / 2) * (this.scaleY || 1)
    );
    ctx.rotate(angle);

    // Draw arrow head
    const arrowLength = 20;
    const arrowWidth = 10;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-arrowLength, -arrowWidth);
    ctx.lineTo(-arrowLength, arrowWidth);
    ctx.closePath();
    const strokeColor = typeof this.stroke === 'string' ? this.stroke : '#000';
    ctx.fillStyle = strokeColor;
    ctx.fill();
    ctx.restore();
  }

  static fromObject(object: any): Promise<Arrow> {
    return new Promise((resolve) => {
      (Line as any)._fromObject('Arrow', object, (instance: Arrow) => {
        resolve(instance);
      });
    });
  }
}

export default Arrow;

