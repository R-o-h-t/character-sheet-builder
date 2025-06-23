// context/dndType.context.ts
import { createContext, useContext, useState } from 'react';



const DndTypeContext = createContext<{
  type: string;
  setType: (type: string) => void;
}>({ type: 'default', setType: () => { } });

export const DndTypeProvider = ({ children }: { children: React.ReactNode }) => {
  const [type, setType] = useState('default');
  return (
    <DndTypeContext.Provider value={{ type, setType }}>
      {children}
    </DndTypeContext.Provider>
  );
};

export const useDnd = () => useContext(DndTypeContext);
