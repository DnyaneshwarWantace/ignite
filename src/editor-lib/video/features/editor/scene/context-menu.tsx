"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import useStore from "../store/use-store";
import { dispatch } from "@designcombo/events";
import { EDIT_OBJECT, LAYER_DELETE } from "@designcombo/state";

interface ContextMenuItem {
  text: string;
  hotkey?: string;
  handler: () => void;
  disabled?: boolean;
  submenu?: ContextMenuItem[];
}

interface ContextMenuSeparator {
  separator: true;
}

type MenuItem = ContextMenuItem | ContextMenuSeparator;

export function VideoContextMenu() {
  const { activeIds, trackItemsMap } = useStore();
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [items, setItems] = useState<MenuItem[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const showContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const menuItems: MenuItem[] = [];

      // Only show menu if something is selected
      if (activeIds.length > 0) {

        // Flip operations
        menuItems.push({
          text: "Flip Horizontal",
          handler: () => {
            activeIds.forEach((id) => {
              const item = trackItemsMap[id];
              if (item) {
                const currentFlipX = item.details.flipX || false;
                dispatch(EDIT_OBJECT, {
                  payload: {
                    [id]: {
                      details: {
                        flipX: !currentFlipX,
                      },
                    },
                  },
                });
              }
            });
            setVisible(false);
          },
        });

        menuItems.push({
          text: "Flip Vertical",
          handler: () => {
            activeIds.forEach((id) => {
              const item = trackItemsMap[id];
              if (item) {
                const currentFlipY = item.details.flipY || false;
                dispatch(EDIT_OBJECT, {
                  payload: {
                    [id]: {
                      details: {
                        flipY: !currentFlipY,
                      },
                    },
                  },
                });
              }
            });
            setVisible(false);
          },
        });

        menuItems.push({ separator: true });

        // Lock/Unlock
        const isLocked = activeIds.some((id) => {
          const item = trackItemsMap[id];
          return item?.details?.locked;
        });

        menuItems.push({
          text: isLocked ? "Unlock" : "Lock",
          handler: () => {
            activeIds.forEach((id) => {
              const item = trackItemsMap[id];
              if (item) {
                dispatch(EDIT_OBJECT, {
                  payload: {
                    [id]: {
                      details: {
                        locked: !isLocked,
                      },
                    },
                  },
                });
              }
            });
            setVisible(false);
          },
        });

        menuItems.push({ separator: true });

        // Delete
        menuItems.push({
          text: "Delete",
          hotkey: "Delete",
          handler: () => {
            dispatch(LAYER_DELETE);
            setVisible(false);
          },
        });
      }

      setItems(menuItems);

      // Position at cursor
      let x = e.clientX;
      let y = e.clientY;
      const menuWidth = 270;
      const menuHeight = menuItems.length * 35;
      if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 5;
      if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 5;
      if (x < 5) x = 5;
      if (y < 5) y = 5;
      setPosition({ x, y });
      setVisible(true);
    };

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVisible(false);
    };

    // Right-click listener
    const onContextMenu = (e: Event) => {
      const target = e.target as HTMLElement;
      const isOnScene =
        target?.classList.contains("designcombo-scene-item") ||
        target?.closest?.(".designcombo-scene-item") != null ||
        target?.classList.contains("player-container") ||
        target?.closest?.(".player-container") != null;

      if (isOnScene) {
        showContextMenu(e as MouseEvent);
      }
    };

    document.addEventListener("contextmenu", onContextMenu, { capture: true });
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu, { capture: true });
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIds, trackItemsMap]);

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
        if ("separator" in item && item.separator) {
          return (
            <div
              key={`separator-${index}`}
              className="my-1 h-0 border-t border-[#454545]"
            />
          );
        }

        const menuItem = item as ContextMenuItem;
        const hasSubmenu = menuItem.submenu && menuItem.submenu.length > 0;

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
              onClick={(e) => {
                e.stopPropagation();
                menuItem.handler();
              }}
              disabled={menuItem.disabled}
              className={`w-full text-left px-[19px] py-1 cursor-default hover:bg-[#2777ff] transition-colors flex items-center justify-between ${
                menuItem.disabled ? "text-[#878b90] hover:bg-transparent" : ""
              } ${hoveredIndex === index ? "bg-[#2777ff]" : ""}`}
            >
              <span>{menuItem.text}</span>
              <div className="flex items-center gap-2">
                {menuItem.hotkey && (
                  <span
                    className={`text-[#878b90] ${hoveredIndex === index ? "text-white" : ""}`}
                  >
                    {menuItem.hotkey}
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
                {menuItem.submenu!.map((subItem, subIndex) => (
                  <button
                    key={subIndex}
                    onClick={subItem.handler}
                    disabled={subItem.disabled}
                    className={`w-full text-left px-[19px] py-1 cursor-default hover:bg-[#2777ff] transition-colors ${
                      subItem.disabled ? "text-[#878b90] hover:bg-transparent" : ""
                    }`}
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
