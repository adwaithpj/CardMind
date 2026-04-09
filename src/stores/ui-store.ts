import { create } from "zustand";

/**
 * Global UI state (sidebar + mobile nav). See Zustand introduction:
 * https://zustand.docs.pmnd.rs/learn/getting-started/introduction
 */
type UiState = {
  isExpanded: boolean;
  isMobileMenuOpen: boolean;
  toggle: () => void;
  setIsExpanded: (v: boolean) => void;
  setMobileMenuOpen: (v: boolean) => void;
  toggleMobileMenu: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  isExpanded: true,
  isMobileMenuOpen: false,
  toggle: () => set((s) => ({ isExpanded: !s.isExpanded })),
  setIsExpanded: (isExpanded) => set({ isExpanded }),
  setMobileMenuOpen: (isMobileMenuOpen) => set({ isMobileMenuOpen }),
  toggleMobileMenu: () => set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
}));
