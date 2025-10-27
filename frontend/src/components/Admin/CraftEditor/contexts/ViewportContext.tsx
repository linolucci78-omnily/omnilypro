import React, { createContext, useContext, type ReactNode } from 'react';
import type { DeviceType } from '../utils/responsive';

interface ViewportContextType {
  viewportMode: DeviceType;
}

const ViewportContext = createContext<ViewportContextType>({
  viewportMode: 'desktop'
});

export const useViewport = () => {
  return useContext(ViewportContext);
};

interface ViewportProviderProps {
  children: ReactNode;
  viewportMode: DeviceType;
}

export const ViewportProvider: React.FC<ViewportProviderProps> = ({ children, viewportMode }) => {
  return (
    <ViewportContext.Provider value={{ viewportMode }}>
      {children}
    </ViewportContext.Provider>
  );
};
