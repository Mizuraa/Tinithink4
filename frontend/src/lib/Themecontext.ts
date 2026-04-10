import { createContext, useContext } from "react";

export const ThemeCtx = createContext<boolean>(false);

export function useLightMode(): boolean {
  return useContext(ThemeCtx);
}
