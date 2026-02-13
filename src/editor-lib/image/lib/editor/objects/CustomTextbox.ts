/*
 * Custom Textbox with modified justify alignment logic
 * Converted to Fabric.js v6
 * Prevents word breaking - ensures words stay together when wrapping
 */
import { Textbox, FabricObject } from 'fabric';

class CustomTextbox extends Textbox {
  constructor(options?: any) {
    super(options);
    (this as any).type = 'textbox';
    // Ensure splitByGrapheme is false to prevent character-level splitting
    // This helps prevent words from breaking in the middle
    if (options?.splitByGrapheme === undefined) {
      (this as any).splitByGrapheme = false;
    }
  }

  /**
   * Override set method to ensure splitByGrapheme is false when text is set
   * This prevents words from breaking in the middle
   */
  set(key: string | any, value?: any): this {
    if (key === 'text' || (typeof key === 'object' && key.text !== undefined)) {
      // Ensure splitByGrapheme is false to prevent word breaking
      if (typeof key === 'object') {
        key.splitByGrapheme = false;
      } else {
        // If setting text property directly, also ensure splitByGrapheme is false
        (this as any).splitByGrapheme = false;
      }
    }
    return super.set(key as any, value);
  }

  /**
   * Override the method that handles text wrapping to prevent word breaking
   * This ensures words stay together when text wraps
   * Note: This method may not exist in all Fabric.js versions, so we use a try-catch
   */
  _wrapText(text: any, maxWidth: any): any {
    try {
      if (!text || !maxWidth) {
        return super._wrapText(text, maxWidth);
      }

      const canvas = (this as any).canvas;
      if (!canvas) {
        return super._wrapText(text, maxWidth);
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return super._wrapText(text, maxWidth);
      }
      
      // Set font properties for accurate measurement
      const fontSize = this.fontSize || 20;
      const fontFamily = this.fontFamily || 'Arial';
      const fontWeight = this.fontWeight || 'normal';
      const fontStyle = this.fontStyle || 'normal';
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
      
      // Split text into words (including spaces and punctuation as separate tokens)
      // This regex preserves spaces and splits on word boundaries
      const tokens = text.match(/\S+|\s+/g) || [text];
      const lines: string[] = [];
      let currentLine = '';
      
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const testLine = currentLine + token;
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        // If adding this token would exceed the width and we have content, start new line
        if (testWidth > maxWidth && currentLine.trim().length > 0) {
          // Only break if current line has content (prevents breaking on first word)
          lines.push(currentLine.trim());
          // If the token itself is too wide, we have to break it (rare case)
          if (ctx.measureText(token).width > maxWidth) {
            // Token is too wide - fall back to character-level breaking for this token only
            currentLine = token;
          } else {
            currentLine = token;
          }
        } else {
          currentLine = testLine;
        }
      }
      
      // Add the last line if it has content
      if (currentLine.trim().length > 0) {
        lines.push(currentLine.trim());
      }
      
      return lines.length > 0 ? lines : [''];
    } catch (error) {
      return super._wrapText(text, maxWidth);
    }
  }

  _renderChars(
    method: 'fillText' | 'strokeText',
    ctx: CanvasRenderingContext2D,
    line: any[],
    left: number,
    top: number,
    lineIndex: number
  ) {
    // Set proper line offset
    const isJustify = this.textAlign?.indexOf('justify') !== -1;
    let actualStyle: any;
    let nextStyle: any;
    let charsToRender = '';
    let charBox: any;
    let boxWidth = 0;
    let timeToRender: boolean;
    const path = this.path;
    const shortCut =
      !isJustify &&
      this.charSpacing === 0 &&
      this.isEmptyStyles(lineIndex) &&
      !path;
    const isLtr = this.direction === 'ltr';
    const sign = this.direction === 'ltr' ? 1 : -1;
    let drawingLeft: number;
    const currentDirection = ctx.canvas.getAttribute('dir');

    ctx.save();
    if (currentDirection !== this.direction) {
      ctx.canvas.setAttribute('dir', isLtr ? 'ltr' : 'rtl');
      (ctx as any).direction = isLtr ? 'ltr' : 'rtl';
      ctx.textAlign = isLtr ? 'left' : 'right';
    }

    // Check if style changed (simplified for v6)
    const hasStyleChanged = (actual: any, next: any) => {
      if (!actual || !next) return true;
      return (
        actual.fontSize !== next.fontSize ||
        actual.fontFamily !== next.fontFamily ||
        actual.fontWeight !== next.fontWeight ||
        actual.fontStyle !== next.fontStyle ||
        actual.fill !== next.fill
      );
    };

    const lineHeight = this.getHeightOfLine(lineIndex);
    top -= (lineHeight * (this as any)._fontSizeFraction) / this.lineHeight;
    
    if (shortCut) {
      // Shortcut rendering
      (this as any)._renderChar(method, ctx, lineIndex, 0, line.join(''), left, top, lineHeight);
    } else {
      // Full rendering with style support
      for (let i = 0; i < line.length; i++) {
        actualStyle = this._getStyleDeclaration(lineIndex, i);
        nextStyle = this._getStyleDeclaration(lineIndex, i + 1);
        timeToRender = hasStyleChanged(actualStyle, nextStyle);

        if (timeToRender) {
          charsToRender += line[i];
          charBox = (this as any).__charBounds?.[lineIndex]?.[i] || { width: 0, kernedWidth: 0 };
          boxWidth = charBox.width || 0;

          if (isJustify && i < line.length - 1) {
            const charSpacing = this._getWidthOfCharSpacing();
            boxWidth += charSpacing;
          }

          drawingLeft = left + (isLtr ? 0 : -boxWidth);
          (this as any)._renderChar(method, ctx, lineIndex, i, charsToRender, drawingLeft, top, lineHeight);
          left += sign * boxWidth;
          charsToRender = '';
        } else {
          charsToRender += line[i];
        }
      }
    }

    ctx.restore();
  }

  static fromObject(object: any, options?: any): Promise<any> {
    return new Promise((resolve) => {
      (FabricObject as any)._fromObject('Textbox', object, (instance: CustomTextbox) => {
        resolve(instance);
      });
    });
  }
}

export default CustomTextbox;

