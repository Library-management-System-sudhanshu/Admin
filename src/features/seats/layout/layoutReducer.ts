import type { Position, LayoutSpacer, LayoutGroup } from '../types';

export interface LayoutEditorState {
  tempLayout: Record<string, Position>;
  spacers: LayoutSpacer[];
  selectedArrangeIds: string[];
  history: Array<{
    tempLayout: Record<string, Position>;
    spacers: LayoutSpacer[];
  }>;
}

export type LayoutReducerAction =
  | { type: 'SET_LAYOUT'; layout: Record<string, Position> }
  | { type: 'MOVE_ITEMS'; positions: Record<string, Position> }
  | { type: 'ADD_SPACER'; spacer: LayoutSpacer }
  | { type: 'REMOVE_SPACER'; id: string }
  | { type: 'RESIZE_SPACER'; id: string; w: number; h: number }
  | { type: 'SET_SELECTION'; ids: string[] }
  | { type: 'GROUP_SELECTION' }
  | { type: 'UNGROUP_SELECTION' }
  | { type: 'TOGGLE_GROUP_LOCK'; lock: boolean }
  | { type: 'ROTATE_SELECTION'; seatIds: string[] }
  | { type: 'PUSH_HISTORY' }
  | { type: 'UNDO' }
  | {
      type: 'RESET';
      payload: {
        tempLayout: Record<string, Position>;
        spacers: LayoutSpacer[];
      };
    };

export const initialLayoutState: LayoutEditorState = {
  tempLayout: {},
  spacers: [],
  selectedArrangeIds: [],
  history: [],
};

export function layoutReducer(state: LayoutEditorState, action: LayoutReducerAction): LayoutEditorState {
  switch (action.type) {
    case 'PUSH_HISTORY': {
      return {
        ...state,
        history: [
          ...state.history,
          {
            tempLayout: { ...state.tempLayout },
            spacers: JSON.parse(JSON.stringify(state.spacers)),
          },
        ],
      };
    }

    case 'UNDO': {
      if (state.history.length === 0) return state;
      const historyCopy = [...state.history];
      const previous = historyCopy.pop();
      if (!previous) return state;
      return {
        ...state,
        tempLayout: previous.tempLayout,
        spacers: previous.spacers,
        history: historyCopy,
      };
    }

    case 'SET_LAYOUT': {
      return {
        ...state,
        tempLayout: action.layout,
      };
    }

    case 'MOVE_ITEMS': {
      return {
        ...state,
        tempLayout: {
          ...state.tempLayout,
          ...action.positions,
        },
      };
    }

    case 'ADD_SPACER': {
      return {
        ...state,
        spacers: [...state.spacers, action.spacer],
      };
    }

    case 'REMOVE_SPACER': {
      return {
        ...state,
        spacers: state.spacers.filter((s) => s.id !== action.id),
        selectedArrangeIds: state.selectedArrangeIds.filter((id) => id !== action.id),
      };
    }

    case 'RESIZE_SPACER': {
      return {
        ...state,
        spacers: state.spacers.map((s) => (s.id === action.id ? { ...s, w: action.w, h: action.h } : s)),
      };
    }

    case 'SET_SELECTION': {
      return {
        ...state,
        selectedArrangeIds: action.ids,
      };
    }

    case 'GROUP_SELECTION': {
      if (state.selectedArrangeIds.length < 2) return state;
      const newGroup: LayoutGroup = {
        id: `group-${Math.random().toString(36).substring(2, 9)}`,
        locked: true,
        memberIds: [...state.selectedArrangeIds],
      };

      const groupMetaIdx = state.spacers.findIndex((s) => s.type === 'group_metadata');
      const nextSpacers = [...state.spacers];

      if (groupMetaIdx > -1) {
        const existingMeta = state.spacers[groupMetaIdx];
        const existingGroups = existingMeta.groups || [];
        const cleanedGroups = existingGroups
          .map((g: LayoutGroup) => ({
            ...g,
            memberIds: g.memberIds.filter((id: string) => !state.selectedArrangeIds.includes(id)),
          }))
          .filter((g: LayoutGroup) => g.memberIds.length >= 2);

        cleanedGroups.push(newGroup);
        nextSpacers[groupMetaIdx] = {
          ...existingMeta,
          groups: cleanedGroups,
        };
      } else {
        nextSpacers.push({
          id: 'room_groups_metadata',
          x: 0,
          y: 0,
          type: 'group_metadata',
          groups: [newGroup],
        });
      }

      return {
        ...state,
        spacers: nextSpacers,
      };
    }

    case 'UNGROUP_SELECTION': {
      const groupMetaIdx = state.spacers.findIndex((s) => s.type === 'group_metadata');
      if (groupMetaIdx === -1) return state;

      const nextSpacers = [...state.spacers];
      const existingMeta = state.spacers[groupMetaIdx];
      const existingGroups = existingMeta.groups || [];

      const remainingGroups = existingGroups.filter(
        (g: LayoutGroup) => !g.memberIds.some((id: string) => state.selectedArrangeIds.includes(id))
      );

      nextSpacers[groupMetaIdx] = {
        ...existingMeta,
        groups: remainingGroups,
      };

      return {
        ...state,
        spacers: nextSpacers,
      };
    }

    case 'TOGGLE_GROUP_LOCK': {
      const groupMetaIdx = state.spacers.findIndex((s) => s.type === 'group_metadata');
      if (groupMetaIdx === -1) return state;

      const nextSpacers = [...state.spacers];
      const existingMeta = state.spacers[groupMetaIdx];
      const existingGroups = existingMeta.groups || [];

      const updatedGroups = existingGroups.map((g: LayoutGroup) => {
        const hasOverlap = g.memberIds.some((id: string) => state.selectedArrangeIds.includes(id));
        return hasOverlap ? { ...g, locked: action.lock } : g;
      });

      nextSpacers[groupMetaIdx] = {
        ...existingMeta,
        groups: updatedGroups,
      };

      return {
        ...state,
        spacers: nextSpacers,
      };
    }

    case 'ROTATE_SELECTION': {
      const nextTemp = { ...state.tempLayout };
      action.seatIds.forEach((id) => {
        const currentRotation = nextTemp[id]?.rotation || 0;
        const nextRotation = (currentRotation + 90) % 360;
        if (nextTemp[id]) {
          nextTemp[id] = { ...nextTemp[id], rotation: nextRotation };
        }
      });
      return {
        ...state,
        tempLayout: nextTemp,
      };
    }

    case 'RESET': {
      return {
        tempLayout: action.payload.tempLayout,
        spacers: action.payload.spacers,
        selectedArrangeIds: [],
        history: [],
      };
    }

    default:
      return state;
  }
}
