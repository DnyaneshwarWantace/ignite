/*
 * @Author: AI Image Editor
 * @Date: 2024-04-10 14:00:05
 * @LastEditors: AI Image Editor
 * @LastEditTime: 2024-04-10 14:01:39
 */
export enum SelectMode {
  EMPTY = '',
  ONE = 'one',
  MULTI = 'multiple',
}

export enum SelectEvent {
  ONE = 'selectOne',
  MULTI = 'selectMultiple',
  CANCEL = 'selectCancel',
}

export default { SelectMode, SelectEvent };
