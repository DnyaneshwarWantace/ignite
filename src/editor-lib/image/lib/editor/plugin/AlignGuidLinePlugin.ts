/*
 * Alignment guide line plugin
 * Provides alignment guides when moving objects
 */
import { Canvas, FabricObject, Point } from 'fabric';
import type { IEditor, IPluginTempl } from '../interface/Editor';
import GuideLine from '../ruler/guideline';

declare interface VerticalLine {
  x: number;
  y1: number;
  y2: number;
}

declare interface HorizontalLine {
  x1: number;
  x2: number;
  y: number;
}

class AlignGuidLinePlugin implements IPluginTempl {
  defautOption = {
    color: 'rgba(255,95,95,1)',
    width: 1,
  };
  static pluginName = 'AlignGuidLinePlugin';
  dragMode = false;
  constructor(public canvas: Canvas, public editor: IEditor) {
    this.dragMode = false;
    this.init();
  }
  init() {
    const { canvas } = this;
    const ctx = canvas.getSelectionContext();
    const aligningLineOffset = 5;
    const aligningLineMargin = 4;
    const This = this;
    let viewportTransform: number[] | undefined;
    let zoom = 1;
    let activeWidth = 0;
    let activeHeight = 0;
    let activeLeft = 0;
    let activeTop = 0;

    function drawVerticalLine(coords: VerticalLine) {
      drawLine(
        coords.x + 0.5,
        coords.y1 > coords.y2 ? coords.y2 : coords.y1,
        coords.x + 0.5,
        coords.y2 > coords.y1 ? coords.y2 : coords.y1
      );
    }

    function drawHorizontalLine(coords: HorizontalLine) {
      drawLine(
        coords.x1 > coords.x2 ? coords.x2 : coords.x1,
        coords.y + 0.5,
        coords.x2 > coords.x1 ? coords.x2 : coords.x1,
        coords.y + 0.5
      );
    }

    function drawLine(x1: number, y1: number, x2: number, y2: number) {
      if (viewportTransform == null) return;

      ctx.moveTo(x1 * zoom + viewportTransform[4], y1 * zoom + viewportTransform[5]);
      ctx.lineTo(x2 * zoom + viewportTransform[4], y2 * zoom + viewportTransform[5]);
    }

    function isInRange(value1: number, value2: number) {
      value1 = Math.round(value1);
      value2 = Math.round(value2);
      for (let i = value1 - aligningLineMargin, len = value1 + aligningLineMargin; i <= len; i++) {
        if (i === value2) {
          return true;
        }
      }
      return false;
    }

    let verticalLines: VerticalLine[] = [];
    let horizontalLines: HorizontalLine[] = [];

    canvas.on('mouse:down', (e) => {
      viewportTransform = canvas.viewportTransform || undefined;
      zoom = canvas.getZoom();
      try {
        if (e.e && e.target) {
          activeLeft = (e.target as FabricObject).left || 0;
          activeTop = (e.target as FabricObject).top || 0;
          activeWidth = (e.target as FabricObject).getScaledWidth();
          activeHeight = (e.target as FabricObject).getScaledHeight();
        }
      } catch (e) {}
    });

    canvas.on('object:moving', (e) => {
      if (viewportTransform === undefined || e.target === undefined) return;

      const activeObject = e.target as FabricObject;
      const canvasObjects = canvas.getObjects();
      const activeObjectCenter = activeObject.getCenterPoint();
      const activeObjectLeft = activeObjectCenter.x;
      const activeObjectTop = activeObjectCenter.y;
      const activeObjectBoundingRect = activeObject.getBoundingRect();
      const activeObjectHeight = activeObject.getScaledHeight();
      const activeObjectWidth = activeObject.getScaledWidth();
      let horizontalInTheRange = false;
      let verticalInTheRange = false;
      const transform = (canvas as any)._currentTransform;

      // Reach position
      let reachLeft = false; // Left
      let reachTop = false; // Top

      // Distance
      let _elReachLeft = 0; // Left distance
      let _elReachTop = 0; // Top distance

      activeObject.set('hasControls', false);

      if (!transform) return;

      for (let i = canvasObjects.length; i--; ) {
        // eslint-disable-next-line no-continue
        if (canvasObjects[i] === activeObject) continue;

        // Exclude guide lines
        if (
          activeObject instanceof GuideLine &&
          canvasObjects[i] instanceof GuideLine
        ) {
          continue;
        }

        const objectCenter = canvasObjects[i].getCenterPoint();
        const objectLeft = objectCenter.x;
        const objectTop = objectCenter.y;
        const objectBoundingRect = canvasObjects[i].getBoundingRect();
        const objectHeight = objectBoundingRect.height / viewportTransform[3];
        const objectWidth = objectBoundingRect.width / viewportTransform[0];

        // Snap by the horizontal center line
        // Horizontal center line
        if (isInRange(objectLeft, activeObjectLeft)) {
          verticalInTheRange = true;
          verticalLines = [];
          verticalLines.push({
            x: objectLeft,
            y1:
              objectTop < activeObjectTop
                ? objectTop - objectHeight / 2 - aligningLineOffset
                : objectTop + objectHeight / 2 + aligningLineOffset,
            y2:
              activeObjectTop > objectTop
                ? activeObjectTop + activeObjectHeight / 2 + aligningLineOffset
                : activeObjectTop - activeObjectHeight / 2 - aligningLineOffset,
          });
          activeObject.setPositionByOrigin(
            new Point(objectLeft, activeObjectTop),
            'center',
            'center'
          );
        }

        // Snap by the vertical center line
        // Vertical center line
        if (isInRange(objectTop, activeObjectTop)) {
          horizontalInTheRange = true;
          horizontalLines = [];
          horizontalLines.push({
            y: objectTop,
            x1:
              objectLeft < activeObjectLeft
                ? objectLeft - objectWidth / 2 - aligningLineOffset
                : objectLeft + objectWidth / 2 + aligningLineOffset,
            x2:
              activeObjectLeft > objectLeft
                ? activeObjectLeft + activeObjectWidth / 2 + aligningLineOffset
                : activeObjectLeft - activeObjectWidth / 2 - aligningLineOffset,
          });
          activeObject.setPositionByOrigin(
            new Point(activeObjectLeft, objectTop),
            'center',
            'center'
          );
        }
        // Snap by the left edge
        // Left edge
        if (isInRange(objectLeft - objectWidth / 2, activeObjectLeft - activeObjectWidth / 2)) {
          verticalInTheRange = true;
          verticalLines = [];
          reachLeft = true;
          verticalLines.push({
            x: objectLeft - objectWidth / 2,
            y1:
              objectTop < activeObjectTop
                ? objectTop - objectHeight / 2 - aligningLineOffset
                : objectTop + objectHeight / 2 + aligningLineOffset,
            y2:
              activeObjectTop > objectTop
                ? activeObjectTop + activeObjectHeight / 2 + aligningLineOffset
                : activeObjectTop - activeObjectHeight / 2 - aligningLineOffset,
          });
          _elReachLeft = objectLeft - objectWidth / 2 + activeObjectWidth / 2;
          let x = objectLeft - objectWidth / 2 + activeObjectWidth / 2;
          let y = reachTop ? _elReachTop : activeObjectTop;

          activeObject.setPositionByOrigin(new Point(x, y), 'center', 'center');
        }

        // Snap by the right edge
        // Right edge
        if (isInRange(objectLeft + objectWidth / 2, activeObjectLeft + activeObjectWidth / 2)) {
          reachLeft = true;
          verticalInTheRange = true;
          verticalLines = [];
          verticalLines.push({
            x: objectLeft + objectWidth / 2,
            y1:
              objectTop < activeObjectTop
                ? objectTop - objectHeight / 2 - aligningLineOffset
                : objectTop + objectHeight / 2 + aligningLineOffset,
            y2:
              activeObjectTop > objectTop
                ? activeObjectTop + activeObjectHeight / 2 + aligningLineOffset
                : activeObjectTop - activeObjectHeight / 2 - aligningLineOffset,
          });
          _elReachLeft = objectLeft + objectWidth / 2 - activeObjectWidth / 2;
          let x = objectLeft + objectWidth / 2 - activeObjectWidth / 2;
          let y = reachTop ? _elReachTop : activeObjectTop;
          activeObject.setPositionByOrigin(new Point(x, y), 'center', 'center');
        }

        // Snap by the top edge
        // Top edge
        if (isInRange(objectTop - objectHeight / 2, activeObjectTop - activeObjectHeight / 2)) {
          reachTop = true;
          horizontalInTheRange = true;
          horizontalLines = [];
          horizontalLines.push({
            y: objectTop - objectHeight / 2,
            x1:
              objectLeft < activeObjectLeft
                ? objectLeft - objectWidth / 2 - aligningLineOffset
                : objectLeft + objectWidth / 2 + aligningLineOffset,
            x2:
              activeObjectLeft > objectLeft
                ? activeObjectLeft + activeObjectWidth / 2 + aligningLineOffset
                : activeObjectLeft - activeObjectWidth / 2 - aligningLineOffset,
          });
          _elReachTop = objectTop - objectHeight / 2 + activeObjectHeight / 2;
          let x = reachLeft ? _elReachLeft : activeObjectLeft;
          let y = objectTop - objectHeight / 2 + activeObjectHeight / 2;
          activeObject.setPositionByOrigin(new Point(x, y), 'center', 'center');
        }

        // Snap by the bottom edge
        // Bottom edge
        if (isInRange(objectTop + objectHeight / 2, activeObjectTop + activeObjectHeight / 2)) {
          reachTop = true;

          horizontalInTheRange = true;
          horizontalLines = [];
          horizontalLines.push({
            y: objectTop + objectHeight / 2,
            x1:
              objectLeft < activeObjectLeft
                ? objectLeft - objectWidth / 2 - aligningLineOffset
                : objectLeft + objectWidth / 2 + aligningLineOffset,
            x2:
              activeObjectLeft > objectLeft
                ? activeObjectLeft + activeObjectWidth / 2 + aligningLineOffset
                : activeObjectLeft - activeObjectWidth / 2 - aligningLineOffset,
          });
          _elReachTop = objectTop + objectHeight / 2 - activeObjectHeight / 2;
          let x = reachLeft ? _elReachLeft : activeObjectLeft;
          let y = objectTop + objectHeight / 2 - activeObjectHeight / 2;
          activeObject.setPositionByOrigin(new Point(x, y), 'center', 'center');
        }

        // Left edge and right edge
        if (isInRange(objectLeft - objectWidth / 2, activeObjectLeft + activeObjectWidth / 2)) {
          reachLeft = true;
          verticalInTheRange = true;
          verticalLines.push({
            x: objectLeft - objectWidth / 2,
            y1:
              objectTop < activeObjectTop
                ? objectTop - objectHeight / 2 - aligningLineOffset
                : objectTop + objectHeight / 2 + aligningLineOffset,
            y2:
              activeObjectTop > objectTop
                ? activeObjectTop + activeObjectHeight / 2 + aligningLineOffset
                : activeObjectTop - activeObjectHeight / 2 - aligningLineOffset,
          });

          _elReachLeft = objectLeft - objectWidth / 2 - activeObjectWidth / 2;
          let x = objectLeft - objectWidth / 2 - activeObjectWidth / 2;
          let y = activeObjectTop;

          activeObject.setPositionByOrigin(new Point(x, y), 'center', 'center');
        }
        // Right edge and left edge
        if (isInRange(objectLeft + objectWidth / 2, activeObjectLeft - activeObjectWidth / 2)) {
          reachLeft = true;
          verticalInTheRange = true;
          verticalLines.push({
            x: objectLeft + objectWidth / 2,
            y1:
              objectTop < activeObjectTop
                ? objectTop - objectHeight / 2 - aligningLineOffset
                : objectTop + objectHeight / 2 + aligningLineOffset,
            y2:
              activeObjectTop > objectTop
                ? activeObjectTop + activeObjectHeight / 2 + aligningLineOffset
                : activeObjectTop - activeObjectHeight / 2 - aligningLineOffset,
          });
          _elReachLeft = objectLeft + objectWidth / 2 + activeObjectWidth / 2;

          let x = objectLeft + objectWidth / 2 + activeObjectWidth / 2;
          let y = activeObjectTop;

          activeObject.setPositionByOrigin(new Point(x, y), 'center', 'center');
        }
        // Top edge and bottom edge
        if (isInRange(objectTop - objectHeight / 2, activeObjectTop + activeObjectHeight / 2)) {
          reachTop = true;
          horizontalInTheRange = true;
          horizontalLines = [];
          horizontalLines.push({
            y: objectTop - objectHeight / 2,
            x1:
              objectLeft < activeObjectLeft
                ? objectLeft - objectWidth / 2 - aligningLineOffset
                : objectLeft + objectWidth / 2 + aligningLineOffset,
            x2:
              activeObjectLeft > objectLeft
                ? activeObjectLeft + activeObjectWidth / 2 + aligningLineOffset
                : activeObjectLeft - activeObjectWidth / 2 - aligningLineOffset,
          });
          _elReachTop = objectTop - objectHeight / 2 - activeObjectHeight / 2;

          let x = reachLeft ? _elReachLeft : activeObjectLeft;
          let y = objectTop - objectHeight / 2 - activeObjectHeight / 2;
          activeObject.setPositionByOrigin(new Point(x, y), 'center', 'center');
        }
        // Bottom edge and top edge
        if (isInRange(objectTop + objectHeight / 2, activeObjectTop - activeObjectHeight / 2)) {
          reachTop = true;
          horizontalInTheRange = true;
          horizontalLines = [];
          horizontalLines.push({
            y: objectTop + objectHeight / 2,
            x1:
              objectLeft < activeObjectLeft
                ? objectLeft - objectWidth / 2 - aligningLineOffset
                : objectLeft + objectWidth / 2 + aligningLineOffset,
            x2:
              activeObjectLeft > objectLeft
                ? activeObjectLeft + activeObjectWidth / 2 + aligningLineOffset
                : activeObjectLeft - activeObjectWidth / 2 - aligningLineOffset,
          });
          _elReachTop = objectTop + objectHeight / 2 + activeObjectHeight / 2;
          let x = reachLeft ? _elReachLeft : activeObjectLeft;
          let y = objectTop + objectHeight / 2 + activeObjectHeight / 2;
          activeObject.setPositionByOrigin(new Point(x, y), 'center', 'center');
        }
      }

      if (!horizontalInTheRange) {
        horizontalLines.length = 0;
      }

      if (!verticalInTheRange) {
        verticalLines.length = 0;
      }
    });

    canvas.on('before:render', () => {
      // Fix: prevent error when saving image
      if (canvas.contextTop === null) {
        return;
      }
      try {
        canvas.clearContext(canvas.contextTop);
      } catch (error) {
        console.log(error);
      }
    });

    canvas.on('object:scaling', (e) => {
      if (viewportTransform === undefined || e.target === undefined) return;

      const activeObject = e.target as FabricObject;
      const canvasObjects = canvas.getObjects();
      const activeObjectCenter = activeObject.getCenterPoint();
      const activeObjectLeft = activeObjectCenter.x;
      const activeObjectTop = activeObjectCenter.y;
      const activeObjectBoundingRect = activeObject.getBoundingRect();
      const activeObjectHeight = activeObject.getScaledHeight();
      const activeObjectWidth = activeObject.getScaledWidth();
      let horizontalInTheRange = false;
      let verticalInTheRange = false;
      const transform = (canvas as any)._currentTransform;

      activeObject.set('hasControls', false);
      if (!transform) return;

      for (let i = canvasObjects.length; i--; ) {
        // eslint-disable-next-line no-continue
        if (canvasObjects[i] === activeObject) continue;

        // Exclude guide lines
        if (
          activeObject instanceof GuideLine &&
          canvasObjects[i] instanceof GuideLine
        ) {
          continue;
        }

        const objectCenter = canvasObjects[i].getCenterPoint();
        const objectLeft = objectCenter.x;
        const objectTop = objectCenter.y;
        const objectBoundingRect = canvasObjects[i].getBoundingRect();
        const objectHeight = objectBoundingRect.height / viewportTransform[3];
        const objectWidth = objectBoundingRect.width / viewportTransform[0];

        // Snap by the horizontal center line
        // Horizontal center line
        if (isInRange(objectLeft, activeObjectLeft)) {
          verticalInTheRange = true;
          verticalLines = [];
          verticalLines.push({
            x: objectLeft,
            y1:
              objectTop < activeObjectTop
                ? objectTop - objectHeight / 2 - aligningLineOffset
                : objectTop + objectHeight / 2 + aligningLineOffset,
            y2:
              activeObjectTop > objectTop
                ? activeObjectTop + activeObjectHeight / 2 + aligningLineOffset
                : activeObjectTop - activeObjectHeight / 2 - aligningLineOffset,
          });
        }

        // Snap by the left edge
        // Left edge
        if (isInRange(objectLeft - objectWidth / 2, activeObjectLeft - activeObjectWidth / 2)) {
          verticalInTheRange = true;
          verticalLines = [];
          verticalLines.push({
            x: objectLeft - objectWidth / 2,
            y1:
              objectTop < activeObjectTop
                ? objectTop - objectHeight / 2 - aligningLineOffset
                : objectTop + objectHeight / 2 + aligningLineOffset,
            y2:
              activeObjectTop > objectTop
                ? activeObjectTop + activeObjectHeight / 2 + aligningLineOffset
                : activeObjectTop - activeObjectHeight / 2 - aligningLineOffset,
          });

          let leftRight = new Map([
            ['bl', 1],
            ['ml', 1],
            ['tl', 1],
          ]);
          if (leftRight.get((e.transform as any).corner)) {
            activeObject.setPositionByOrigin(
              new Point(
                objectLeft - objectWidth / 2 + activeObjectWidth / 2,
                activeObjectTop
              ),
              'center',
              'center'
            );

            activeObject.set(
              'scaleX',
              ((activeLeft - (objectLeft - objectWidth / 2) + activeWidth) * (activeObject.scaleX || 1)) /
              activeObject.getScaledWidth()
            );
            break;
          }
        }

        // Snap by the right edge
        // Right edge
        if (isInRange(objectLeft + objectWidth / 2, activeObjectLeft + activeObjectWidth / 2)) {
          verticalInTheRange = true;
          verticalLines = [];
          verticalLines.push({
            x: objectLeft + objectWidth / 2,
            y1:
              objectTop < activeObjectTop
                ? objectTop - objectHeight / 2 - aligningLineOffset
                : objectTop + objectHeight / 2 + aligningLineOffset,
            y2:
              activeObjectTop > objectTop
                ? activeObjectTop + activeObjectHeight / 2 + aligningLineOffset
                : activeObjectTop - activeObjectHeight / 2 - aligningLineOffset,
          });

          let Right = new Map([
            ['mr', 1],
            ['tr', 1],
            ['br', 1],
          ]);

          if (Right.get((e.transform as any).corner)) {
            activeObject.set(
              'scaleX',
              ((objectLeft + objectWidth / 2 - (activeLeft + activeWidth) + activeWidth) *
                (activeObject.scaleX || 1)) /
              activeObject.getScaledWidth()
            );
            break;
          }
        }

        // Snap by the vertical center line
        // Vertical center line
        if (isInRange(objectTop, activeObjectTop)) {
          horizontalInTheRange = true;
          horizontalLines = [];
          horizontalLines.push({
            y: objectTop,
            x1:
              objectLeft < activeObjectLeft
                ? objectLeft - objectWidth / 2 - aligningLineOffset
                : objectLeft + objectWidth / 2 + aligningLineOffset,
            x2:
              activeObjectLeft > objectLeft
                ? activeObjectLeft + activeObjectWidth / 2 + aligningLineOffset
                : activeObjectLeft - activeObjectWidth / 2 - aligningLineOffset,
          });
        }

        // Snap by the top edge
        if (isInRange(objectTop - objectHeight / 2, activeObjectTop - activeObjectHeight / 2)) {
          horizontalInTheRange = true;
          horizontalLines = [];
          horizontalLines.push({
            y: objectTop - objectHeight / 2,
            x1:
              objectLeft < activeObjectLeft
                ? objectLeft - objectWidth / 2 - aligningLineOffset
                : objectLeft + objectWidth / 2 + aligningLineOffset,
            x2:
              activeObjectLeft > objectLeft
                ? activeObjectLeft + activeObjectWidth / 2 + aligningLineOffset
                : activeObjectLeft - activeObjectWidth / 2 - aligningLineOffset,
          });

          let bottomRight = new Map([
            ['tr', 1],
            ['tl', 1],
            ['mt', 1],
          ]);

          if (bottomRight.get((e.transform as any).corner)) {
            activeObject.setPositionByOrigin(
              new Point(
                activeObjectLeft,
                objectTop - objectHeight / 2 + activeObjectHeight / 2
              ),
              'center',
              'center'
            );

            activeObject.set(
              'scaleY',
              ((activeTop + activeHeight - (objectTop - objectHeight / 2)) * (activeObject.scaleY || 1)) /
              activeObject.getScaledHeight()
            );
            break;
          }
        }

        // Snap by the bottom edge
        if (isInRange(objectTop + objectHeight / 2, activeObjectTop + activeObjectHeight / 2)) {
          horizontalInTheRange = true;
          horizontalLines = [];
          horizontalLines.push({
            y: objectTop + objectHeight / 2,
            x1:
              objectLeft < activeObjectLeft
                ? objectLeft - objectWidth / 2 - aligningLineOffset
                : objectLeft + objectWidth / 2 + aligningLineOffset,
            x2:
              activeObjectLeft > objectLeft
                ? activeObjectLeft + activeObjectWidth / 2 + aligningLineOffset
                : activeObjectLeft - activeObjectWidth / 2 - aligningLineOffset,
          });

          let bottom = new Map([
            ['mb', 1],
            ['bl', 1],
            ['br', 1],
          ]);
          if (bottom.get((e.transform as any).corner)) {
            activeObject.set(
              'scaleY',
              ((objectTop + objectHeight / 2 - (activeTop + activeHeight) + activeHeight) *
                (activeObject.scaleY || 1)) /
              activeObject.getScaledHeight()
            );
            break;
          }
        }

        // Left edge and right edge
        if (isInRange(objectLeft - objectWidth / 2, activeObjectLeft + activeObjectWidth / 2)) {
          verticalInTheRange = true;
          verticalLines = [];
          verticalLines.push({
            x: objectLeft - objectWidth / 2,
            y1:
              objectTop < activeObjectTop
                ? objectTop - objectHeight / 2 - aligningLineOffset
                : objectTop + objectHeight / 2 + aligningLineOffset,
            y2:
              activeObjectTop > objectTop
                ? activeObjectTop + activeObjectHeight / 2 + aligningLineOffset
                : activeObjectTop - activeObjectHeight / 2 - aligningLineOffset,
          });

          let right = new Map([
            ['mr', 1],
            ['tr', 1],
            ['br', 1],
          ]);
          if (right.get((e.transform as any).corner)) {
            activeObject.set(
              'scaleX',
              ((objectLeft - objectWidth / 2 - (activeObject.left || 0)) * (activeObject.scaleX || 1)) /
              activeObject.getScaledWidth()
            );
            break;
          }
        }
        // Right edge and left edge
        if (isInRange(objectLeft + objectWidth / 2, activeObjectLeft - activeObjectWidth / 2)) {
          verticalInTheRange = true;
          verticalLines = [];
          verticalLines.push({
            x: objectLeft + objectWidth / 2,
            y1:
              objectTop < activeObjectTop
                ? objectTop - objectHeight / 2 - aligningLineOffset
                : objectTop + objectHeight / 2 + aligningLineOffset,
            y2:
              activeObjectTop > objectTop
                ? activeObjectTop + activeObjectHeight / 2 + aligningLineOffset
                : activeObjectTop - activeObjectHeight / 2 - aligningLineOffset,
          });

          let leftRight = new Map([
            ['bl', 1],
            ['ml', 1],
            ['tl', 1],
          ]);
          if (leftRight.get((e.transform as any).corner)) {
            activeObject.setPositionByOrigin(
              new Point(
                objectLeft + objectWidth / 2 + activeObjectWidth / 2,
                activeObjectTop
              ),
              'center',
              'center'
            );

            activeObject.set(
              'scaleX',
              ((activeLeft + activeWidth - (objectLeft + objectWidth / 2)) * (activeObject.scaleX || 1)) /
              activeObject.getScaledWidth()
            );
            break;
          }
        }
        // Top edge and bottom edge
        if (isInRange(objectTop - objectHeight / 2, activeObjectTop + activeObjectHeight / 2)) {
          horizontalInTheRange = true;
          horizontalLines = [];
          horizontalLines.push({
            y: objectTop - objectHeight / 2,
            x1:
              objectLeft < activeObjectLeft
                ? objectLeft - objectWidth / 2 - aligningLineOffset
                : objectLeft + objectWidth / 2 + aligningLineOffset,
            x2:
              activeObjectLeft > objectLeft
                ? activeObjectLeft + activeObjectWidth / 2 + aligningLineOffset
                : activeObjectLeft - activeObjectWidth / 2 - aligningLineOffset,
          });

          let bottom = new Map([
            ['mb', 1],
            ['bl', 1],
            ['br', 1],
          ]);
          if (bottom.get((e.transform as any).corner)) {
            activeObject.set(
              'scaleY',
              ((objectTop - objectHeight / 2 - (activeObject.top || 0)) * (activeObject.scaleY || 1)) /
              activeObject.getScaledHeight()
            );
            break;
          }
        }
        // Bottom edge and top edge
        if (isInRange(objectTop + objectHeight / 2, activeObjectTop - activeObjectHeight / 2)) {
          horizontalInTheRange = true;
          horizontalLines = [];
          horizontalLines.push({
            y: objectTop + objectHeight / 2,
            x1:
              objectLeft < activeObjectLeft
                ? objectLeft - objectWidth / 2 - aligningLineOffset
                : objectLeft + objectWidth / 2 + aligningLineOffset,
            x2:
              activeObjectLeft > objectLeft
                ? activeObjectLeft + activeObjectWidth / 2 + aligningLineOffset
                : activeObjectLeft - activeObjectWidth / 2 - aligningLineOffset,
          });

          let bottomRight = new Map([
            ['tr', 1],
            ['tl', 1],
            ['mt', 1],
          ]);

          if (bottomRight.get((e.transform as any).corner)) {
            activeObject.setPositionByOrigin(
              new Point(
                activeObjectLeft,
                objectTop + objectHeight / 2 + activeObjectHeight / 2
              ),
              'center',
              'center'
            );

            activeObject.set(
              'scaleY',
              ((activeTop + activeHeight - (objectTop + objectHeight / 2)) * (activeObject.scaleY || 1)) /
              activeObject.getScaledHeight()
            );

            break;
          }
        }
      }

      if (!horizontalInTheRange) {
        horizontalLines.length = 0;
      }

      if (!verticalInTheRange) {
        verticalLines.length = 0;
      }
    });
    canvas.on('after:render', () => {
      ctx.save();
      ctx.beginPath();
      ctx.lineWidth = This.defautOption.width;
      ctx.strokeStyle = This.defautOption.color;

      for (let i = verticalLines.length; i--; ) {
        if (verticalLines[i]) {
          drawVerticalLine(verticalLines[i]);
        }
      }
      for (let j = horizontalLines.length; j--; ) {
        if (horizontalLines[j]) {
          drawHorizontalLine(horizontalLines[j]);
        }
      }
      ctx.stroke();
      ctx.restore();

      // noinspection NestedAssignmentJS
      verticalLines.length = 0;
      horizontalLines.length = 0;
    });

    canvas.on('mouse:up', (e) => {
      const activeObject = e.target;
      if (activeObject && (activeObject as FabricObject).selectable && !(activeObject as FabricObject).lockRotation) {
        activeObject.set('hasControls', true);
      }
      verticalLines.length = 0;
      horizontalLines.length = 0;
      canvas.requestRenderAll();
    });
  }

  destroy() {
    console.log('pluginDestroy');
  }
}

export default AlignGuidLinePlugin;
