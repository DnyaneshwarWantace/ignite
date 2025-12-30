/*
 * Custom Rect element with rounded corners that adapt to scaling
 * Converted to Fabric.js v6
 */
import { Rect, FabricObject } from 'fabric';

class CustomRect extends Rect {
  public roundValue: number = 0;

  constructor(options?: any) {
    super(options);
    this.roundValue = options?.roundValue || 0;
    (this as any).type = 'rect';
  }

  _render(ctx: CanvasRenderingContext2D) {
    const roundValue = this.roundValue || 0;
    this.rx = (1 / (this.scaleX || 1)) * roundValue;
    this.ry = (1 / (this.scaleY || 1)) * roundValue;
    super._render(ctx);
  }

  static fromObject(object: any, options?: any): Promise<CustomRect> {
    return new Promise((resolve) => {
      (FabricObject as any)._fromObject('Rect', object, (instance: CustomRect) => {
        resolve(instance);
      });
    });
  }
}

export default CustomRect;

