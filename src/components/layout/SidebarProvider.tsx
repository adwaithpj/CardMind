"use client";

import { useUiStore } from "@/stores/ui-store";

/** @deprecated Prefer `useUiStore` from `@/stores/ui-store` — kept for incremental migration. */
export function useSidebar() {
  const isExpanded = useUiStore((s) => s.isExpanded);
  const toggle = useUiStore((s) => s.toggle);
  const setIsExpanded = useUiStore((s) => s.setIsExpanded);
  const isMobileMenuOpen = useUiStore((s) => s.isMobileMenuOpen);
  const setMobileMenuOpen = useUiStore((s) => s.setMobileMenuOpen);
  return { isExpanded, toggle, setIsExpanded, isMobileMenuOpen, setMobileMenuOpen };
}

/** No-op wrapper — layout can omit this; Zustand needs no provider. */
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
