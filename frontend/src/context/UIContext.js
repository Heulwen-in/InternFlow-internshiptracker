import { createContext, useContext } from "react";

export const UIContext = createContext({
  refreshKey: 0,
  refresh: () => {},
  openApp: () => {},
  closeApp: () => {},
  openNew: () => {},
  openEdit: () => {},
  closeForm: () => {},
});

export const useUI = () => useContext(UIContext);
