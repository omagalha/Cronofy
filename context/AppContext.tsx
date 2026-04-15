import React, { createContext, ReactNode, useContext, useState } from 'react';

// Definindo a interface para o contexto da IA
interface AIContextType {
  isAIEnabled: boolean;
  toggleAI: () => void;
  aiModel: string;
  setAIModel: (model: string) => void;
  userData: any; // Pode ser mais específico dependendo do tipo de dado
  setUserData: (data: any) => void;
  aiResponseHistory: { query: string; response: string; timestamp: Date }[];
  addAIResponse: (query: string, response: string) => void;
  isLoadingAI: boolean;
  setLoadingAI: (loading: boolean) => void;
  errorAI: string | null;
  setErrorAI: (error: string | null) => void;
}

// Criando o contexto
const AIContext = createContext<AIContextType | undefined>(undefined);

// Provedor do contexto
export const AIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAIEnabled, setIsAIEnabled] = useState<boolean>(true);
  const [aiModel, setAIModel] = useState<string>('default');
  const [userData, setUserData] = useState<any>(null); // Exemplo: dados do usuário para personalização da IA
  const [aiResponseHistory, setAIResponseHistory] = useState<
    { query: string; response: string; timestamp: Date }[]
  >([]);
  const [isLoadingAI, setLoadingAI] = useState<boolean>(false);
  const [errorAI, setErrorAI] = useState<string | null>(null);

  const toggleAI = () => {
    setIsAIEnabled((prev) => !prev);
  };

  const addAIResponse = (query: string, response: string) => {
    setAIResponseHistory((prev) => [...prev, { query, response, timestamp: new Date() }]);
  };

  return (
    <AIContext.Provider
      value={{
        isAIEnabled,
        toggleAI,
        aiModel,
        setAIModel,
        userData,
        setUserData,
        aiResponseHistory,
        addAIResponse,
        isLoadingAI,
        setLoadingAI,
        errorAI,
        setErrorAI,
      }}
    >
      {children}
    </AIContext.Provider>
  );
};

// Hook personalizado para usar o contexto
export const useAI = () => {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};