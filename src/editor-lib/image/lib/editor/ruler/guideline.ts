/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Line, FabricObject, Point } from 'fabric';
import type { TEvent } from 'fabric';

export interface IGuideLineOptions {
  axis?: 'horizontal' | 'vertical';
  [key: string]: any;
}

// GuideLine class extending Line for Fabric.js v6
class GuideLine extends Line {
  public axis: 'horizontal' | 'vertical' = 'horizontal';
  public activeOn: 'down' | 'up' = 'up';

  constructor(points: number, options: IGuideLineOptions = {}) {
    // Ensure options is an object before accessing properties
    const optionsObj = options && typeof options === 'object' ? options : {};
    const isHorizontal = optionsObj.axis === 'horizontal';
    // Set new points for guide line
    const newPoints: [number, number, number, number] = isHorizontal
      ? [-999999, points, 999999, points]
      : [points, -999999, points, 999999];
    
    // Lock movement
    const lineOptions = {
      selectable: false,
      hasControls: false,
      hasBorders: false,
      stroke: '#4bec13',
      originX: 'center' as const,
      originY: 'center' as const,
      padding: 4,
      globalCompositeOperation: 'difference' as const,
      hoverCursor: isHorizontal ? 'ns-resize' : 'ew-resize',
      [isHorizontal ? 'lockMovementX' : 'lockMovementY']: true,
      ...optionsObj,
    };

    super(newPoints, lineOptions);
    // Set type in constructor (Fabric.js v6 uses accessor, so set via type assertion)
    (this as any).type = 'GuideLine';
    this.axis = (optionsObj && 'axis' in optionsObj && optionsObj.axis) || 'horizontal';

    // Bind events
    this.on('mousedown:before', (e: TEvent) => {
      if (this.activeOn === 'down') {
        // Set selectable:false so active object can move
        this.canvas && this.canvas.setActiveObject(this, e.e);
      }
    });

    this.on('moving', (e: TEvent) => {
      // Check if event is MouseEvent before calling isPointOnRuler
      const mouseEvent = 'button' in e.e ? e.e : null;
      if (this.canvas && (this.canvas as any).ruler?.options?.enabled && mouseEvent && this.isPointOnRuler(mouseEvent)) {
        this.moveCursor = 'not-allowed';
      } else {
        this.moveCursor = this.isHorizontal() ? 'ns-resize' : 'ew-resize';
      }
      this.canvas &&
        (this.canvas as any).fire('guideline:moving', {
          target: this,
          e: e.e,
        });
    });

    this.on('mouseup', (e: TEvent) => {
      // Remove guide line if moved to ruler
      // Check if event is MouseEvent before calling isPointOnRuler
      const mouseEvent = 'button' in e.e ? e.e : null;
      if (this.canvas && (this.canvas as any).ruler?.options?.enabled && mouseEvent && this.isPointOnRuler(mouseEvent)) {
        this.canvas.remove(this);
        return;
      }
      this.moveCursor = this.isHorizontal() ? 'ns-resize' : 'ew-resize';
      this.canvas &&
        (this.canvas as any).fire('guideline:mouseup', {
          target: this,
          e: e.e,
        });
    });

    this.on('removed', () => {
      this.off('removed');
      this.off('mousedown:before');
      this.off('moving');
      this.off('mouseup');
    });
  }

  getBoundingRect() {
    // In Fabric.js v6, use canvas.bringObjectToFront instead of object.bringToFront
    if (this.canvas) {
      this.canvas.bringObjectToFront(this);
    }

    const isHorizontal = this.isHorizontal();
    // In Fabric.js v6, getBoundingRect() doesn't accept arguments
    const rect = super.getBoundingRect();
    rect[isHorizontal ? 'top' : 'left'] += rect[isHorizontal ? 'height' : 'width'] / 2;
    rect[isHorizontal ? 'height' : 'width'] = 0;
    return rect;
  }

  isPointOnRuler(e: MouseEvent): 'horizontal' | 'vertical' | false {
    const isHorizontal = this.isHorizontal();
    const hoveredRuler =
      this.canvas &&
      (this.canvas as any).ruler?.isPointOnRuler(new Point(e.offsetX, e.offsetY));
    if (
      (isHorizontal && hoveredRuler === 'horizontal') ||
      (!isHorizontal && hoveredRuler === 'vertical')
    ) {
      return hoveredRuler;
    }
    return false;
  }

  isHorizontal(): boolean {
    return this.height === 0;
  }

  static async fromObject(object: any, options?: any): Promise<GuideLine> {
    // Clone object
    const clone = (obj: any, deep: boolean): any => {
      if (deep) {
        return JSON.parse(JSON.stringify(obj));
      }
      return { ...obj };
    };

    const clonedOptions = clone(object, true);
    const isHorizontal = clonedOptions.height === 0;

    clonedOptions.xy = isHorizontal ? clonedOptions.y1 : clonedOptions.x1;
    clonedOptions.axis = isHorizontal ? 'horizontal' : 'vertical';

    // Use Line's _fromObject for v6 (similar to Arrow and ThinTailArrow)
    // Note: _fromObject signature in v6 is (type, object, callback)
    return new Promise((resolve, reject) => {
      try {
        (Line as any)._fromObject('GuideLine', clonedOptions, (instance: any) => {
          if (instance) {
            // Set axis property
            (instance as any).axis = clonedOptions.axis || 'horizontal';
            delete (instance as any).xy;
            resolve(instance as GuideLine);
          } else {
            reject(new Error('Failed to create GuideLine from object'));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

// Global registry for GuideLine
let GuideLineClass: typeof GuideLine | null = null;

export function setupGuideLine() {
  if (GuideLineClass) {
    return GuideLineClass;
  }

  GuideLineClass = GuideLine;
  return GuideLineClass;
}

export default GuideLine;
