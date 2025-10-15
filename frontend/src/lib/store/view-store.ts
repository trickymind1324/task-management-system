// ABOUTME: Zustand store for UI view state management
// ABOUTME: Handles current view mode (list/board/calendar) and modals

import { create } from 'zustand';

export type ViewMode = 'list' | 'board' | 'calendar';

interface ViewState {
  viewMode: ViewMode;
  showCreateTaskModal: boolean;
  setViewMode: (mode: ViewMode) => void;
  setShowCreateTaskModal: (show: boolean) => void;
}

export const useViewStore = create<ViewState>((set) => ({
  viewMode: 'list',
  showCreateTaskModal: false,
  setViewMode: (mode) => set({ viewMode: mode }),
  setShowCreateTaskModal: (show) => set({ showCreateTaskModal: show }),
}));
