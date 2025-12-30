"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useCanvasContext } from "@/editor-lib/image/providers/canvas-provider";
import { cn } from "@/editor-lib/image/lib/utils";

interface ContextMenuItem {
  text?: string;
  hotkey?: string;
  handler?: () => void;
  disabled?: boolean;
  separator?: boolean;
  submenu?: ContextMenuItem[];
}

export function ContextMenu() {
  const { canvas, editor } = useCanvasContext();
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [items, setItems] = useState<ContextMenuItem[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvas) return;

    const handleRightClick = (opt: any) => {
      if (opt.e && 'button' in opt.e && opt.e.button === 2) {
        // Prevent default context menu
        opt.e.preventDefault();

        // Right mouse button (button 2 is right-click)
        const menuItems: ContextMenuItem[] = [];

        // Collect menu items from plugins
        // Copy/Paste
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          menuItems.push({
            text: "Copy",
            hotkey: "Ctrl+C",
            handler: () => {
              (editor as any)?.clone?.(activeObject);
              setVisible(false);
            },
          });
        }

        // Paste (handled by CopyPlugin's pasteListener)
        menuItems.push({
          text: "Paste",
          hotkey: "Ctrl+V",
          handler: () => {
            // Paste is handled automatically by CopyPlugin's pasteListener
            // User can use Ctrl+V to paste
            setVisible(false);
          },
        });

        // Separator
        if (activeObject) {
          menuItems.push({ separator: true });

          // Layer operations - with submenu
          menuItems.push({
            text: "Layer Management",
            hotkey: "❯",
            submenu: [
              {
                text: "Bring Forward",
                handler: () => {
                  editor?.up?.();
                  setVisible(false);
                },
              },
              {
                text: "Send Backward",
                handler: () => {
                  editor?.down?.();
                  setVisible(false);
                },
              },
              {
                text: "Bring to Front",
                handler: () => {
                  (editor as any)?.toFront?.();
                  setVisible(false);
                },
              },
              {
                text: "Send to Back",
                handler: () => {
                  (editor as any)?.toBack?.();
                  setVisible(false);
                },
              },
            ],
          });

          menuItems.push({ separator: true });

          // Group operations
          const activeObjects = canvas.getActiveObjects();
          if (activeObjects.length > 1) {
            menuItems.push({
              text: "Group",
              hotkey: "Ctrl+G",
              handler: () => {
                editor?.group?.();
                setVisible(false);
              },
            });
          }

          if (activeObject.type === "group" || activeObject.type === "activeSelection") {
            menuItems.push({
              text: "Ungroup",
              hotkey: "Ctrl+Shift+G",
              handler: () => {
                editor?.unGroup?.();
                setVisible(false);
              },
            });
          }

          // Center align
          menuItems.push({
            text: "Center Horizontally & Vertically",
            handler: () => {
              (editor as any)?.position?.('center');
              setVisible(false);
            },
          });

          menuItems.push({ separator: true });

          // Flip
          menuItems.push({
            text: "Flip Horizontal",
            handler: () => {
              const obj = canvas.getActiveObject();
              if (obj) {
                obj.set("flipX", !obj.flipX).setCoords();
                canvas.requestRenderAll();
              }
              setVisible(false);
            },
          });
          menuItems.push({
            text: "Flip Vertical",
            handler: () => {
              const obj = canvas.getActiveObject();
              if (obj) {
                obj.set("flipY", !obj.flipY).setCoords();
                canvas.requestRenderAll();
              }
              setVisible(false);
            },
          });

          menuItems.push({ separator: true });

          // Lock
          menuItems.push({
            text: activeObject.lockMovementX ? "Unlock" : "Lock",
            handler: () => {
              const obj = canvas.getActiveObject();
              if (obj) {
                if (obj.lockMovementX) {
                  (editor as any)?.unlock?.();
                } else {
                  (editor as any)?.lock?.();
                }
                canvas.requestRenderAll();
              }
              setVisible(false);
            },
          });

          menuItems.push({ separator: true });

          // Delete
          menuItems.push({
            text: "Delete",
            hotkey: "Delete",
            handler: () => {
              const objects = canvas.getActiveObjects();
              objects.forEach((obj) => canvas.remove(obj));
              canvas.discardActiveObject();
              canvas.requestRenderAll();
              setVisible(false);
            },
          });
        }

        setItems(menuItems);

        // Get the actual mouse position from the event
        const e = opt.e as MouseEvent;
        let x = e.clientX;
        let y = e.clientY;

        // Estimate menu size
        const menuWidth = 270;
        const menuHeight = menuItems.length * 35;

        // Keep menu within viewport
        if (x + menuWidth > window.innerWidth) {
          x = window.innerWidth - menuWidth - 5;
        }
        if (y + menuHeight > window.innerHeight) {
          y = window.innerHeight - menuHeight - 5;
        }
        if (x < 5) x = 5;
        if (y < 5) y = 5;

        setPosition({ x, y });
        setVisible(true);
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setVisible(false);
      }
    };

    canvas.on("mouse:down", handleRightClick);
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      canvas.off("mouse:down", handleRightClick);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [canvas, editor]);

  if (!visible || items.length === 0) return null;

  const menuContent = (
    <div
        ref={menuRef}
        className="fixed z-[9999] min-w-[270px] bg-[#262933] text-white text-[9pt] border border-[#333333] rounded-md shadow-lg py-1"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        {items.map((item, index) => {
          if (item.separator) {
            return (
              <div
                key={`separator-${index}`}
                className="my-1 h-0 border-t border-[#454545]"
              />
            );
          }

          const hasSubmenu = item.submenu && item.submenu.length > 0;

          return (
            <div
              key={index}
              className="relative"
              onMouseEnter={() => {
                if (hasSubmenu) {
                  setHoveredIndex(index);
                  const button = document.querySelector(`[data-menu-index="${index}"]`) as HTMLElement;
                  if (button) {
                    const rect = button.getBoundingClientRect();
                    setSubmenuPosition({
                      x: rect.right + 5,
                      y: rect.top,
                    });
                  }
                }
              }}
              onMouseLeave={() => {
                if (hasSubmenu) {
                  setHoveredIndex(null);
                  setSubmenuPosition(null);
                }
              }}
            >
              <button
                data-menu-index={index}
                onClick={item.handler}
                disabled={item.disabled}
                className={cn(
                  "w-full text-left px-[19px] py-1 cursor-default hover:bg-[#2777ff] transition-colors flex items-center justify-between",
                  item.disabled && "text-[#878b90] hover:bg-transparent",
                  hoveredIndex === index && "bg-[#2777ff]"
                )}
              >
                <span>{item.text}</span>
                <div className="flex items-center gap-2">
                  {item.hotkey && (
                    <span
                      className={cn(
                        "text-[#878b90]",
                        hoveredIndex === index && "text-white"
                      )}
                    >
                      {item.hotkey}
                    </span>
                  )}
                  {hasSubmenu && (
                    <span className="text-[#878b90]">❯</span>
                  )}
                </div>
              </button>

              {/* Submenu */}
              {hasSubmenu && hoveredIndex === index && submenuPosition && (
                <div
                  className="fixed z-[10000] min-w-[270px] bg-[#262933] text-white text-[9pt] border border-[#333333] rounded-md shadow-lg py-1"
                  style={{
                    left: `${submenuPosition.x}px`,
                    top: `${submenuPosition.y}px`,
                  }}
                >
                  {item.submenu!.map((subItem, subIndex) => (
                    <button
                      key={subIndex}
                      onClick={subItem.handler}
                      disabled={subItem.disabled}
                      className={cn(
                        "w-full text-left px-[19px] py-1 cursor-default hover:bg-[#2777ff] transition-colors",
                        subItem.disabled && "text-[#878b90] hover:bg-transparent"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span>{subItem.text}</span>
                        {subItem.hotkey && (
                          <span className="text-[#878b90] ml-4">
                            {subItem.hotkey}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
  );

  return createPortal(menuContent, document.body);
}

