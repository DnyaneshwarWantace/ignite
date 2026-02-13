/*
 * React/TypeScript version of useSelect hook
 * Converted from Vue to React
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useCanvasContext } from '@/editor-lib/image/providers/canvas-provider';
import Editor, { EventType } from '@/editor-lib/image/lib/editor';
const { SelectMode, SelectEvent } = EventType;
import type { FabricObject } from 'fabric';

interface UseSelectOptions {
  matchType?: string[];
}

export function useSelect(options?: UseSelectOptions) {
  const { canvas, editor } = useCanvasContext();
  const [selectMode, setSelectMode] = useState<string>(SelectMode.EMPTY);
  const [selectOneType, setSelectOneType] = useState<string>('');
  const [selectId, setSelectId] = useState<string | null>(null);
  const [selectIds, setSelectIds] = useState<string[]>([]);
  const [selectActive, setSelectActive] = useState<FabricObject[]>([]);

  const selectOne = useCallback((arr: FabricObject[]) => {
    setSelectMode(SelectMode.ONE);
    const [item] = arr;
    if (item) {
      setSelectActive([item]);
      setSelectId((item as any).id as string);
      setSelectOneType(item.type || '');
      setSelectIds([(item as any).id as string]);
    }
  }, []);

  const selectMulti = useCallback((arr: FabricObject[]) => {
    setSelectMode(SelectMode.MULTI);
    setSelectId(null);
    setSelectIds(arr.map((item) => (item as any).id as string));
  }, []);

  const selectCancel = useCallback(() => {
    setSelectId(null);
    setSelectIds([]);
    setSelectMode(SelectMode.EMPTY);
    setSelectOneType('');
  }, []);

  useEffect(() => {
    if (!editor) return;

    editor.on(SelectEvent.ONE, selectOne);
    editor.on(SelectEvent.MULTI, selectMulti);
    editor.on(SelectEvent.CANCEL, selectCancel);

    return () => {
      editor.off(SelectEvent.ONE, selectOne);
      editor.off(SelectEvent.MULTI, selectMulti);
      editor.off(SelectEvent.CANCEL, selectCancel);
    };
  }, [editor, selectOne, selectMulti, selectCancel]);

  const isMatchType = useMemo(() => {
    if (!options?.matchType) return false;
    return options.matchType.includes(selectOneType);
  }, [options?.matchType, selectOneType]);

  const isOne = useMemo(() => selectMode === 'one', [selectMode]);
  const isMultiple = useMemo(() => selectMode === 'multiple', [selectMode]);
  const isGroup = useMemo(
    () => selectMode === 'one' && selectOneType === 'group',
    [selectMode, selectOneType]
  );

  const matchTypeHandler = useCallback(
    (types: string[]) => {
      return types.includes(selectOneType);
    },
    [selectOneType]
  );

  return {
    canvas,
    editor,
    selectMode,
    selectType: selectOneType,
    selectId,
    selectIds,
    selectActive,
    isSelect: selectMode,
    isGroup,
    isOne,
    isMultiple,
    isMatchType,
    matchTypeHandler,
  };
}
