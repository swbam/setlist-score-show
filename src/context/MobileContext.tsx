
import React, { createContext, useContext } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileContextType {
  isMobile: boolean;
}

const MobileContext = createContext<MobileContextType>({ isMobile: false });

export const useMobile = () => useContext(MobileContext);

export const MobileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isMobile = useIsMobile();
  
  return (
    <MobileContext.Provider value={{ isMobile: !!isMobile }}>
      {children}
    </MobileContext.Provider>
  );
};
