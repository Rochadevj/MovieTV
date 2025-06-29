import React, { createContext, useRef } from 'react';
import { FlatList } from 'react-native';

type TabsContextType = {
  homeListRef: React.RefObject<FlatList<any> | null>;
};

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export const TabsProvider = ({ children }: { children: React.ReactNode }) => {
  const homeListRef = useRef<FlatList<any> | null>(null);

  return (
    <TabsContext.Provider value={{ homeListRef }}>
      {children}
    </TabsContext.Provider>
  );
};