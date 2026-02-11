import { useEffect, useRef, useState } from "react";
import { Selection, Moveable } from "@interactify/toolkit";
import { getIdFromClassName } from "../utils/scene";
import { dispatch } from "@designcombo/events";
import { EDIT_OBJECT } from "@designcombo/state";
import {
	SelectionInfo,
	emptySelection,
	getSelectionByIds,
	getTargetById,
} from "../utils/target";
import useStore from "../store/use-store";
import StateManager from "@designcombo/state";
import { getCurrentTime } from "../utils/time";

let holdGroupPosition: Record<string, any> | null = null;
let dragStartEnd = false;

interface SceneInteractionsProps {
	stateManager: StateManager;
	containerRef: React.RefObject<HTMLDivElement>;
	zoom: number;
	size: { width: number; height: number };
}
export function SceneInteractions({
	stateManager,
	containerRef,
	zoom,
}: SceneInteractionsProps) {
	const [targets, setTargets] = useState<HTMLDivElement[]>([]);
	const [selection, setSelection] = useState<Selection>();
	const { activeIds, setState, trackItemsMap, playerRef, setSceneMoveableRef } =
		useStore();
	const moveableRef = useRef<Moveable>(null);
	const [selectionInfo, setSelectionInfo] =
		useState<SelectionInfo>(emptySelection);

	useEffect(() => {
		const updateTargets = (time?: number) => {
			const currentTime = time || getCurrentTime();
			const { trackItemsMap } = useStore.getState();
			const targetIds = activeIds.filter((id) => {
				return (
					trackItemsMap[id]?.display.from <= currentTime &&
					trackItemsMap[id]?.display.to >= currentTime
				);
			});
			const targets = targetIds.map(
				(id) => getTargetById(id) as HTMLDivElement,
			);
			selection?.setSelectedTargets(targets);
			const selInfo = getSelectionByIds(targetIds);
			setSelectionInfo(selInfo);
			setTargets(selInfo.targets as HTMLDivElement[]);
			
			// Force update moveable to ensure controls are properly updated
			setTimeout(() => {
				moveableRef.current?.moveable.updateRect();
			}, 100);
		};
		const timer = setTimeout(() => {
			updateTargets();
		});

		const onSeeked = (v: any) => {
			setTimeout(() => {
				const { fps } = useStore.getState();
				const seekedTime = (v.detail.frame / fps) * 1000;
				updateTargets(seekedTime);
			});
		};
		playerRef?.current?.addEventListener("seeked", onSeeked);

		return () => {
			playerRef?.current?.removeEventListener("seeked", onSeeked);
			clearTimeout(timer);
		};
	}, [activeIds, playerRef, trackItemsMap]);

	useEffect(() => {
		const selection = new Selection({
			container: containerRef.current,
			boundContainer: true,
			hitRate: 0,
			selectableTargets: [".designcombo-scene-item"],
			selectFromInside: false,
			selectByClick: true,
			toggleContinueSelect: "shift",
		})
			.on("select", (e) => {
				// Filter out audio items from selection
				const filteredSelected = e.selected.filter(
					(el) => !el.className.includes("designcombo-scene-item-type-audio"),
				);

				const ids = filteredSelected.map((el) =>
					getIdFromClassName(el.className),
				);

				setTargets(filteredSelected as HTMLDivElement[]);

				stateManager.updateState(
					{
						activeIds: ids,
					},
					{
						updateHistory: false,
						kind: "layer:selection",
					},
				);
			})
			.on("dragStart", (e) => {
				const target = e.inputEvent.target as HTMLDivElement;
				dragStartEnd = false;

				if (targets.includes(target)) {
					e.stop();
				}
				if (
					target &&
					moveableRef?.current?.moveable.isMoveableElement(target)
				) {
					e.stop();
				}
			})
			.on("dragEnd", () => {
				dragStartEnd = true;
			})
			.on("selectEnd", (e) => {
				const moveable = moveableRef.current;
				if (e.isDragStart) {
					e.inputEvent.preventDefault();
					setTimeout(() => {
						if (!dragStartEnd) {
							moveable?.moveable.dragStart(e.inputEvent);
						}
					});
				} else {
					// Filter out audio items from selection
					const filteredSelected = e.selected.filter(
						(el) => !el.className.includes("designcombo-scene-item-type-audio"),
					) as HTMLDivElement[];

					const ids = filteredSelected.map((el) =>
						getIdFromClassName(el.className),
					);

					stateManager.updateState(
						{
							activeIds: ids,
						},
						{
							updateHistory: false,
							kind: "layer:selection",
						},
					);

					setTargets(filteredSelected);
				}
			});
		setSelection(selection);
		return () => {
			selection.destroy();
		};
	}, []);

	useEffect(() => {
		const activeSelectionSubscription = stateManager.subscribeToActiveIds(
			(newState) => {
				setState(newState);
			},
		);

		return () => {
			activeSelectionSubscription.unsubscribe();
		};
	}, []);

	useEffect(() => {
		moveableRef.current?.moveable.updateRect();
	}, [trackItemsMap]);

	useEffect(() => {
		setSceneMoveableRef(moveableRef as React.RefObject<Moveable>);
	}, [moveableRef]);
	return (
		<Moveable
			ref={moveableRef}
			rotationPosition={"top"}
			renderDirections={selectionInfo.controls}
			resizable={selectionInfo.ables.resizable}
			scalable={selectionInfo.ables.scalable}
			rotatable={selectionInfo.ables.rotatable}
			draggable={selectionInfo.ables.draggable}
			snappable={selectionInfo.ables.snappable}
			origin={false}
			target={targets}
			zoom={1 / zoom}
			className="designcombo-scene-moveable"
			keepRatio={false}
			onResizeStart={({ setOrigin, dragStart }) => {
				// Set origin based on which handle is being dragged to keep opposite corner fixed
				setOrigin(["%", "%"]);
				if (dragStart) {
					dragStart.set([0, 0]);
				}
			}}
			onDrag={({ target, top, left }) => {
				target.style.top = `${top}px`;
				target.style.left = `${left}px`;
			}}
			onDragEnd={({ target, isDrag }) => {
				if (!isDrag) return;
				const targetId = getIdFromClassName(target.className) as string;

				dispatch(EDIT_OBJECT, {
					payload: {
						[targetId]: {
							details: {
								left: target.style.left,
								top: target.style.top,
							},
						},
					},
				});
			}}
			onRotate={({ target, transform }) => {
				target.style.transform = transform;
			}}
			onRotateEnd={({ target }) => {
				const targetId = getIdFromClassName(target.className) as string;

				// Save the full transform including rotation
				const transform = target.style.transform;

				dispatch(EDIT_OBJECT, {
					payload: {
						[targetId]: {
							details: {
								transform: transform,
							},
						},
					},
				});
			}}
			onResizeEnd={({ target }) => {
				const targetId = getIdFromClassName(target.className) as string;
				const textDiv = target.firstElementChild?.firstElementChild
					?.firstElementChild as HTMLDivElement;

				// Clear the stored original dimensions after resize is complete
				delete target.dataset.originalHeight;
				delete target.dataset.originalFontSize;

				// Check if textDiv exists before accessing its style
				if (!textDiv) {
					// If no textDiv found, just update width, height, and position
					dispatch(EDIT_OBJECT, {
						payload: {
							[targetId]: {
								details: {
									width: Number.parseFloat(target.style.width),
									height: Number.parseFloat(target.style.height),
									left: target.style.left,
									top: target.style.top,
								},
							},
						},
					});
					return;
				}

				dispatch(EDIT_OBJECT, {
					payload: {
						[targetId]: {
							details: {
								width: Number.parseFloat(target.style.width),
								height: Number.parseFloat(target.style.height),
								fontSize: Number.parseFloat(textDiv.style.fontSize),
								left: target.style.left,
								top: target.style.top,
							},
						},
					},
				});
			}}
			onDragGroup={({ events }) => {
				holdGroupPosition = {};
				for (let i = 0; i < events.length; i++) {
					const event = events[i];
					const id = getIdFromClassName(event.target.className);
					const trackItem = trackItemsMap[id];
					const left =
						Number.parseFloat(trackItem?.details.left as string) +
						event.beforeTranslate[0];
					const top =
						Number.parseFloat(trackItem?.details.top as string) +
						event.beforeTranslate[1];
					event.target.style.left = `${left}px`;
					event.target.style.top = `${top}px`;
					holdGroupPosition[id] = {
						left: left,
						top: top,
					};
				}
			}}
			onResize={({
				target,
				width: nextWidth,
				height: nextHeight,
				drag,
			}) => {
				// Update position to keep opposite corner fixed when resizing from top/left
				if (drag) {
					target.style.left = `${drag.beforeTranslate[0]}px`;
					target.style.top = `${drag.beforeTranslate[1]}px`;
				}

				// Update dimensions
				target.style.width = `${nextWidth}px`;
				target.style.height = `${nextHeight}px`;

				// Safely access nested elements
				const animationDiv = target.firstElementChild
					?.firstElementChild as HTMLDivElement | null;
				if (animationDiv) {
					animationDiv.style.width = `${nextWidth}px`;
					animationDiv.style.height = `${nextHeight}px`;

					const textDiv =
						animationDiv.firstElementChild as HTMLDivElement | null;
					if (textDiv) {
						// Scale font size proportionally when resizing
						const originalHeight = Number.parseFloat(target.dataset.originalHeight || `${nextHeight}`);
						if (!target.dataset.originalHeight) {
							target.dataset.originalHeight = `${nextHeight}`;
							target.dataset.originalFontSize = getComputedStyle(textDiv).fontSize;
						}
						const originalFontSize = Number.parseFloat(target.dataset.originalFontSize || getComputedStyle(textDiv).fontSize);
						const scale = nextHeight / originalHeight;
						textDiv.style.fontSize = `${originalFontSize * scale}px`;
						textDiv.style.width = `${nextWidth}px`;
						textDiv.style.height = `${nextHeight}px`;
					}
				}
			}}
			onDragGroupEnd={() => {
				if (holdGroupPosition) {
					const payload: Record<string, Partial<any>> = {};
					for (const id of Object.keys(holdGroupPosition)) {
						const left = holdGroupPosition[id].left;
						const top = holdGroupPosition[id].top;
						payload[id] = {
							details: {
								top: `${top}px`,
								left: `${left}px`,
							},
						};
					}
					dispatch(EDIT_OBJECT, {
						payload: payload,
					});
					holdGroupPosition = null;
				}
			}}
		/>
	);
}
