import { create } from "zustand";
import { persist } from "zustand/middleware";

// User state
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

// Action state
interface Action {
  id: string;
  type: string;
  status: "pending" | "approved" | "rejected" | "completed";
  title: string;
  description: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

// App state
interface AppState {
  // User
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;

  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Actions
  pendingActions: Action[];
  setPendingActions: (actions: Action[]) => void;
  addPendingAction: (action: Action) => void;
  removePendingAction: (actionId: string) => void;

  // UI State
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // User
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),

      // Theme
      isDarkMode: false,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      // Actions
      pendingActions: [],
      setPendingActions: (actions) => set({ pendingActions: actions }),
      addPendingAction: (action) =>
        set((state) => ({ pendingActions: [...state.pendingActions, action] })),
      removePendingAction: (actionId) =>
        set((state) => ({
          pendingActions: state.pendingActions.filter((a) => a.id !== actionId),
        })),

      // UI State
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: "quinn-storage",
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);

export default useStore;
