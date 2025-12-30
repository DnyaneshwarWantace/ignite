/*
 * React/TypeScript version of useSelectListen hook
 * Converted from Vue to React
 */

import { useState, useEffect, useCallback } from 'react';
import Editor, { EventType } from '@/editor-lib/image/lib/editor';
import { get } from 'lodash-es';
import type { FabricObject } from 'fabric';

const { SelectEvent, SelectMode } = EventType;

export interface Selector {
  mSelectMode: (typeof SelectMode)[keyof typeof SelectMode];
  mSelectOneType: string | undefined;
  mSelectId: string | undefined;
  mSelectIds: (string | undefined)[];
  mSelectActive: FabricObject[];
}

export function useSelectListen(canvasEditor: Editor | null) {
  const [state, setState] = useState<Selector>({
    mSelectMode: SelectMode.EMPTY,
    mSelectOneType: '',
    mSelectId: undefined,
    mSelectIds: [],
    mSelectActive: [],
  });

  const selectOne = useCallback((e: FabricObject[]) => {
    setState((prev) => {
      const newState = { ...prev };
      newState.mSelectMode = SelectMode.ONE;
      newState.mSelectActive = e;

      if (e[0] && get(e[0], 'clip')) {
        // Handle clipped objects
        return {
          ...newState,
          mSelectMode: SelectMode.EMPTY,
          mSelectId: undefined,
          mSelectOneType: undefined,
          mSelectIds: [],
        };
      }

      if (e[0]) {
        newState.mSelectId = (e[0] as any).id as string;
        newState.mSelectOneType = e[0].type;
        newState.mSelectIds = e.map((item) => (item as any).id as string);
      }

      return newState;
    });
  }, []);

  const selectMulti = useCallback((e: FabricObject[]) => {
    setState((prev) => ({
      ...prev,
      mSelectMode: SelectMode.MULTI,
      mSelectId: undefined,
      mSelectIds: e.map((item) => (item as any).id as string),
    }));
  }, []);

  const selectCancel = useCallback(() => {
    setState((prev) => ({
      ...prev,
      mSelectId: undefined,
      mSelectIds: [],
      mSelectMode: SelectMode.EMPTY,
      mSelectOneType: undefined,
    }));
  }, []);

  useEffect(() => {
    if (!canvasEditor) return;

    canvasEditor.on(SelectEvent.ONE, selectOne);
    canvasEditor.on(SelectEvent.MULTI, selectMulti);
    canvasEditor.on(SelectEvent.CANCEL, selectCancel);

    return () => {
      canvasEditor.off(SelectEvent.ONE, selectOne);
      canvasEditor.off(SelectEvent.MULTI, selectMulti);
      canvasEditor.off(SelectEvent.CANCEL, selectCancel);
    };
  }, [canvasEditor, selectOne, selectMulti, selectCancel]);

  return {
    mixinState: state,
  };
}
