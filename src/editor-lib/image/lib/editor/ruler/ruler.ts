/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Canvas } from 'fabric';
import { Color, Rect, FabricObject, Point } from 'fabric';
import { getGap, mergeLines, darwRect, darwText, darwLine, drawMask } from './utils';
import { throttle } from 'lodash-es';
import GuideLine, { setupGuideLine, type IGuideLineOptions } from './guideline';

/**
 */
export interface RulerOptions {
  /**
   * Canvas
   */
  canvas: Canvas;

  /**
   * @default 20
   */
  ruleSize?: number;

  /**
   * @default 10
   */
  fontSize?: number;

  /**
   * @default false
   */
  enabled?: boolean;

  /**
   */
  backgroundColor?: string;

  /**
   */
  textColor?: string;

  /**
   */
  borderColor?: string;

  /**
   */
  highlightColor?: string;
}

export type RectBounds = { left: number; top: number; width: number; height: number };

export type HighlightRect = {
  skip?: 'x' | 'y';
} & RectBounds;

class CanvasRuler {
  protected ctx: CanvasRenderingContext2D;

  /**
   */
  public options: Required<RulerOptions>;

  /**
   */
  public startCalibration: undefined | Point;

  private activeOn: 'down' | 'up' = 'up';

  /**
   */
  private objectRect:
    | undefined
    | {
        x: HighlightRect[];
        y: HighlightRect[];
      };

  /**
   */
  private eventHandler: Record<string, (...args: any) => void> = {
    // calcCalibration: this.calcCalibration.bind(this),
    calcObjectRect: throttle(this.calcObjectRect.bind(this), 15),
    clearStatus: this.clearStatus.bind(this),
    canvasMouseDown: this.canvasMouseDown.bind(this),
    canvasMouseMove: throttle(this.canvasMouseMove.bind(this), 15),
    canvasMouseUp: this.canvasMouseUp.bind(this),
    render: (e: any) => {
      if (!e.ctx) return;
      this.render();
    },
  };

  private lastAttr: {
    status: 'out' | 'horizontal' | 'vertical';
    cursor: string | undefined;
    selection: boolean | undefined;
  } = {
    status: 'out',
    cursor: undefined,
    selection: undefined,
  };

  private tempGuidelLine: GuideLine | undefined;

  constructor(_options: RulerOptions) {
    this.options = Object.assign(
      {
        ruleSize: 20,
        fontSize: 10,
        enabled: false,
        backgroundColor: '#fff',
        borderColor: '#ddd',
        highlightColor: '#007fff',
        textColor: '#888',
      },
      _options
    );

    this.ctx = this.options.canvas.getContext();

    // Extend canvas with ruler property (Fabric.js v6 compatible)
    (this.options.canvas as any).ruler = this;

    setupGuideLine();

    if (this.options.enabled) {
      this.enable();
    }
  }

  public destroy() {
    this.disable();
  }

  /**
   */
  public clearGuideline() {
    const objects = this.options.canvas.getObjects();
    const guidelineObjects = Array.isArray(objects) 
      ? objects.filter((obj: any) => obj.type === 'GuideLine')
      : [];
    if (guidelineObjects.length > 0) {
      this.options.canvas.remove(...guidelineObjects);
    }
  }

  /**
   */
  public showGuideline() {
    this?.options?.canvas?.getObjects().filter((obj: any) => obj.type === 'GuideLine').forEach((guideLine) => {
      guideLine.set('visible', true);
    });
    this?.options?.canvas?.renderAll();
  }

  /**
   */
  public hideGuideline() {
    this.options.canvas.getObjects().filter((obj: any) => obj.type === 'GuideLine').forEach((guideLine) => {
      guideLine.set('visible', false);
    });
    this.options.canvas.renderAll();
  }

  /**
   */
  public enable() {
    this.options.enabled = true;

    this.options.canvas.on('after:render', this.eventHandler.calcObjectRect);
    this.options.canvas.on('after:render', this.eventHandler.render);
    this.options.canvas.on('mouse:down', this.eventHandler.canvasMouseDown);
    this.options.canvas.on('mouse:move', this.eventHandler.canvasMouseMove);
    this.options.canvas.on('mouse:up', this.eventHandler.canvasMouseUp);
    this.options.canvas.on('selection:cleared', this.eventHandler.clearStatus);

    this.showGuideline();

    this.render();
  }

  /**
   */
  public disable() {
    this.options.canvas.off('after:render', this.eventHandler.calcObjectRect);
    this.options.canvas.off('after:render', this.eventHandler.render);
    this.options.canvas.off('mouse:down', this.eventHandler.canvasMouseDown);
    this.options.canvas.off('mouse:move', this.eventHandler.canvasMouseMove);
    this.options.canvas.off('mouse:up', this.eventHandler.canvasMouseUp);
    this.options.canvas.off('selection:cleared', this.eventHandler.clearStatus);

    this.hideGuideline();

    this.options.enabled = false;
  }

  /**
   */
  public render() {
    // if (!this.options.enabled) return;
    const vpt = this.options.canvas.viewportTransform;
    if (!vpt) return;
    this.draw({
      isHorizontal: true,
      rulerLength: this.getSize().width,
      // startCalibration: -(vpt[4] / vpt[0]),
      startCalibration: this.startCalibration?.x ? this.startCalibration.x : -(vpt[4] / vpt[0]),
    });
    this.draw({
      isHorizontal: false,
      rulerLength: this.getSize().height,
      // startCalibration: -(vpt[5] / vpt[3]),
      startCalibration: this.startCalibration?.y ? this.startCalibration.y : -(vpt[5] / vpt[3]),
    });
    drawMask(this.ctx, {
      isHorizontal: true,
      left: -10,
      top: -10,
      width: this.options.ruleSize * 2 + 10,
      height: this.options.ruleSize + 10,
      backgroundColor: this.options.backgroundColor,
    });
    drawMask(this.ctx, {
      isHorizontal: false,
      left: -10,
      top: -10,
      width: this.options.ruleSize + 10,
      height: this.options.ruleSize * 2 + 10,
      backgroundColor: this.options.backgroundColor,
    });
  }

  /**
   */
  private getSize() {
    return {
      width: this.options.canvas.width ?? 0,
      height: this.options.canvas.height ?? 0,
    };
  }

  private getZoom() {
    return this.options.canvas.getZoom();
  }

  private draw(opt: { isHorizontal: boolean; rulerLength: number; startCalibration: number }) {
    const { isHorizontal, rulerLength, startCalibration } = opt;
    const zoom = this.getZoom();

    const gap = getGap(zoom);
    const unitLength = rulerLength / zoom;
    const startValue = Math[startCalibration > 0 ? 'floor' : 'ceil'](startCalibration / gap) * gap;
    const startOffset = startValue - startCalibration;

    const canvasSize = this.getSize();
    darwRect(this.ctx, {
      left: 0,
      top: 0,
      width: isHorizontal ? canvasSize.width : this.options.ruleSize,
      height: isHorizontal ? this.options.ruleSize : canvasSize.height,
      fill: this.options.backgroundColor,
      stroke: this.options.borderColor,
    });

    const textColor = new Color(this.options.textColor);
    for (let i = 0; i + startOffset <= Math.ceil(unitLength); i += gap) {
      const position = (startOffset + i) * zoom;
      const textValue = startValue + i + '';
      const textLength = (10 * textValue.length) / 4;
      const textX = isHorizontal
        ? position - textLength - 1
        : this.options.ruleSize / 2 - this.options.fontSize / 2 - 4;
      const textY = isHorizontal
        ? this.options.ruleSize / 2 - this.options.fontSize / 2 - 4
        : position + textLength;
      darwText(this.ctx, {
        text: textValue,
        left: textX,
        top: textY,
        fill: textColor.toRgb(),
        angle: isHorizontal ? 0 : -90,
      });
    }

    for (let j = 0; j + startOffset <= Math.ceil(unitLength); j += gap) {
      const position = Math.round((startOffset + j) * zoom);
      const left = isHorizontal ? position : this.options.ruleSize - 8;
      const top = isHorizontal ? this.options.ruleSize - 8 : position;
      const width = isHorizontal ? 0 : 8;
      const height = isHorizontal ? 8 : 0;
      darwLine(this.ctx, {
        left,
        top,
        width,
        height,
        stroke: textColor.toRgb(),
      });
    }

    if (this.objectRect) {
      const axis = isHorizontal ? 'x' : 'y';
      this.objectRect[axis].forEach((rect) => {
        if (rect.skip === axis) {
          return;
        }

        const roundFactor = (x: number) => Math.round(x / zoom + startCalibration) + '';
        const leftTextVal = roundFactor(isHorizontal ? rect.left : rect.top);
        const rightTextVal = roundFactor(
          isHorizontal ? rect.left + rect.width : rect.top + rect.height
        );

        const isSameText = leftTextVal === rightTextVal;

        const maskOpt = {
          isHorizontal,
          width: isHorizontal ? 160 : this.options.ruleSize - 8,
          height: isHorizontal ? this.options.ruleSize - 8 : 160,
          backgroundColor: this.options.backgroundColor,
        };
        drawMask(this.ctx, {
          ...maskOpt,
          left: isHorizontal ? rect.left - 80 : 0,
          top: isHorizontal ? 0 : rect.top - 80,
        });
        if (!isSameText) {
          drawMask(this.ctx, {
            ...maskOpt,
            left: isHorizontal ? rect.width + rect.left - 80 : 0,
            top: isHorizontal ? 0 : rect.height + rect.top - 80,
          });
        }

        const highlightColor = new Color(this.options.highlightColor);

        highlightColor.setAlpha(0.5);
        darwRect(this.ctx, {
          left: isHorizontal ? rect.left : this.options.ruleSize - 8,
          top: isHorizontal ? this.options.ruleSize - 8 : rect.top,
          width: isHorizontal ? rect.width : 8,
          height: isHorizontal ? 8 : rect.height,
          fill: highlightColor.toRgba(),
        });

        const pad = this.options.ruleSize / 2 - this.options.fontSize / 2 - 4;

        const textOpt = {
          fill: highlightColor.toRgba(),
          angle: isHorizontal ? 0 : -90,
        };

        darwText(this.ctx, {
          ...textOpt,
          text: leftTextVal,
          left: isHorizontal ? rect.left - 2 : pad,
          top: isHorizontal ? pad : rect.top - 2,
          align: isSameText ? 'center' : isHorizontal ? 'right' : 'left',
        });

        if (!isSameText) {
          darwText(this.ctx, {
            ...textOpt,
            text: rightTextVal,
            left: isHorizontal ? rect.left + rect.width + 2 : pad,
            top: isHorizontal ? pad : rect.top + rect.height + 2,
            align: isHorizontal ? 'left' : 'right',
          });
        }

        const lineSize = isSameText ? 8 : 14;

        highlightColor.setAlpha(1);

        const lineOpt = {
          width: isHorizontal ? 0 : lineSize,
          height: isHorizontal ? lineSize : 0,
          stroke: highlightColor.toRgba(),
        };

        darwLine(this.ctx, {
          ...lineOpt,
          left: isHorizontal ? rect.left : this.options.ruleSize - lineSize,
          top: isHorizontal ? this.options.ruleSize - lineSize : rect.top,
        });

        if (!isSameText) {
          darwLine(this.ctx, {
            ...lineOpt,
            left: isHorizontal ? rect.left + rect.width : this.options.ruleSize - lineSize,
            top: isHorizontal ? this.options.ruleSize - lineSize : rect.top + rect.height,
          });
        }
      });
    }
    // draw end
  }

  /**
   */
  // private calcCalibration() {
  //   if (this.startCalibration) return;
  //   // console.log('calcCalibration');
  //   const workspace = this.options.canvas.getObjects().find((item: any) => {
  //     return item.id === 'workspace';
  //   });
  //   if (!workspace) return;
  //   const rect = workspace.getBoundingRect(false);
  //   this.startCalibration = new fabric.Point(-rect.left, -rect.top).divide(this.getZoom());
  // }

  private calcObjectRect() {
    const activeObjects = this.options.canvas.getActiveObjects();
    if (activeObjects.length === 0) return;
    const allRect = activeObjects.reduce((rects, obj) => {
      // In Fabric.js v6, getBoundingRect() doesn't accept arguments
      const rect: HighlightRect = obj.getBoundingRect();
      if (obj.group) {
        // Use obj.group properties with defaults for missing values
        const groupObj = obj.group as any;
        const group = {
          top: groupObj.top ?? 0,
          left: groupObj.left ?? 0,
          width: groupObj.width ?? 0,
          height: groupObj.height ?? 0,
          scaleX: groupObj.scaleX ?? 1,
          scaleY: groupObj.scaleY ?? 1,
        };
        rect.width *= group.scaleX;
        rect.height *= group.scaleY;
        const groupCenterX = group.width / 2 + group.left;
        const objectOffsetFromCenterX = (group.width / 2 + (obj.left ?? 0)) * (1 - group.scaleX);
        rect.left += (groupCenterX - objectOffsetFromCenterX) * this.getZoom();
        const groupCenterY = group.height / 2 + group.top;
        const objectOffsetFromCenterY = (group.height / 2 + (obj.top ?? 0)) * (1 - group.scaleY);
        rect.top += (groupCenterY - objectOffsetFromCenterY) * this.getZoom();
      }
      if (obj.type === 'GuideLine') {
        // Type assertion needed since isHorizontal() is a GuideLine-specific method
        const guideLine = obj as any;
        // Use isHorizontal() method if available, otherwise check height === 0
        rect.skip = (typeof guideLine.isHorizontal === 'function' && guideLine.isHorizontal()) || guideLine.height === 0 ? 'x' : 'y';
      }
      rects.push(rect);
      return rects;
    }, [] as HighlightRect[]);
    if (allRect.length === 0) return;
    this.objectRect = {
      x: mergeLines(allRect, true),
      y: mergeLines(allRect, false),
    };
  }

  /**
   */
  private clearStatus() {
    // this.startCalibration = undefined;
    this.objectRect = undefined;
  }

  /**
    判断鼠标是否在标尺上
   * @param point 
   * @returns "vertical" | "horizontal" | false
   */
  public isPointOnRuler(point: Point) {
    if (
      new Rect({
        left: 0,
        top: 0,
        width: this.options.ruleSize,
        height: this.options.canvas.height,
      }).containsPoint(point)
    ) {
      return 'vertical';
    } else if (
      new Rect({
        left: 0,
        top: 0,
        width: this.options.canvas.width,
        height: this.options.ruleSize,
      }).containsPoint(point)
    ) {
      return 'horizontal';
    }
    return false;
  }

  private canvasMouseDown(e: any) {
    if (!e.pointer || !e.absolutePointer) return;
    const hoveredRuler = this.isPointOnRuler(e.pointer);
    if (hoveredRuler && this.activeOn === 'up') {
      this.lastAttr.selection = this.options.canvas.selection;
      this.options.canvas.selection = false;
      this.activeOn = 'down';

      this.tempGuidelLine = new GuideLine(
        hoveredRuler === 'horizontal' ? e.absolutePointer.y : e.absolutePointer.x,
        {
          axis: hoveredRuler,
          visible: false,
        }
      );

      this.options.canvas.add(this.tempGuidelLine);
      this.options.canvas.setActiveObject(this.tempGuidelLine);

      this.options.canvas._setupCurrentTransform(e.e, this.tempGuidelLine, true);

      // Use type assertion since 'down' is a custom event for GuideLine
      (this.tempGuidelLine as any).fire('down', this.getCommonEventInfo(e));
    }
  }

  private getCommonEventInfo = (e: any) => {
    if (!this.tempGuidelLine || !e.absolutePointer) return;
    // Create a Point object for the pointer property to match Fabric.js v6 types
    const pointer = new Point(e.absolutePointer.x, e.absolutePointer.y);
    return {
      e: e.e,
      transform: this.tempGuidelLine.get('transform'),
      pointer: pointer,
      target: this.tempGuidelLine,
    };
  };

  private canvasMouseMove(e: any) {
    if (!e.pointer) return;

    if (this.tempGuidelLine && e.absolutePointer) {
      const pos: Partial<IGuideLineOptions> = {};
      if (this.tempGuidelLine.axis === 'horizontal') {
        pos.top = e.absolutePointer.y;
      } else {
        pos.left = e.absolutePointer.x;
      }
      // Ensure pos is an object before spreading
      const posObj = pos && typeof pos === 'object' ? pos : {};
      this.tempGuidelLine.set({ ...posObj, visible: true });

      this.options.canvas.requestRenderAll();

      const event = this.getCommonEventInfo(e);
      // Use type assertions for custom events
      if (event) {
        (this.options.canvas as any).fire('object:moving', event);
        (this.tempGuidelLine as any).fire('moving', event);
      }
    }

    const hoveredRuler = this.isPointOnRuler(e.pointer);
    if (!hoveredRuler) {
      if (this.lastAttr.status !== 'out') {
        this.options.canvas.defaultCursor = this.lastAttr.cursor ?? 'default';
        this.lastAttr.status = 'out';
      }
      return;
    }
    // const activeObjects = this.options.canvas.getActiveObjects();
    // if (activeObjects.length === 1 && activeObjects[0] instanceof fabric.GuideLine) {
    //   return;
    // }
    if (this.lastAttr.status === 'out' || hoveredRuler !== this.lastAttr.status) {
      this.lastAttr.cursor = this.options.canvas.defaultCursor;
      this.options.canvas.defaultCursor = hoveredRuler === 'horizontal' ? 'ns-resize' : 'ew-resize';
      this.lastAttr.status = hoveredRuler;
    }
  }

  private canvasMouseUp(e: any) {
    if (this.activeOn !== 'down') return;

    this.options.canvas.selection = this.lastAttr.selection ?? true;
    this.activeOn = 'up';

    // Use type assertion since 'up' is a custom event for GuideLine
    (this.tempGuidelLine as any)?.fire('up', this.getCommonEventInfo(e));

    this.tempGuidelLine = undefined;
  }
}

export default CanvasRuler;
