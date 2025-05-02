import  { createContext, useState, ReactNode, useContext } from 'react';

type BuilderSettingsContextType = {
  loginWithAuthToken: boolean;
  setLoginWithAuthToken: (value: boolean) => void;
};

const BuilderSettingsContext = createContext<BuilderSettingsContextType | undefined>(undefined);

export const BuilderSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [loginWithAuthToken, setLoginWithAuthToken] = useState(false);

  return (
    <BuilderSettingsContext.Provider value={{ loginWithAuthToken, setLoginWithAuthToken }}>
      {children}
    </BuilderSettingsContext.Provider>
  );
};

export const useBuilderSettings = () => {
  const context = useContext(BuilderSettingsContext);
  if (!context) {
    throw new Error('useBuilderSettings must be used within a BuilderSettingsProvider');
  }
  return context;
};
 