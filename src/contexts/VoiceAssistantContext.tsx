import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface RegistrationData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  country?: string;
  state?: string;
  password?: string;
}

interface VoiceAssistantContextType {
  history: Message[];
  setHistory: React.Dispatch<React.SetStateAction<Message[]>>;
  registrationData: RegistrationData;
  setRegistrationData: React.Dispatch<React.SetStateAction<RegistrationData>>;
  currentFlow: 'none' | 'registration' | 'login';
  setCurrentFlow: React.Dispatch<React.SetStateAction<'none' | 'registration' | 'login'>>;
  flowStep: number;
  setFlowStep: React.Dispatch<React.SetStateAction<number>>;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  pendingSystemMessage: string | null;
  setPendingSystemMessage: React.Dispatch<React.SetStateAction<string | null>>;
}

const VoiceAssistantContext = createContext<VoiceAssistantContextType | undefined>(undefined);

export function VoiceAssistantProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<Message[]>([]);
  const [registrationData, setRegistrationData] = useState<RegistrationData>({});
  const [currentFlow, setCurrentFlow] = useState<'none' | 'registration' | 'login'>('none');
  const [flowStep, setFlowStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [pendingSystemMessage, setPendingSystemMessage] = useState<string | null>(null);

  return (
    <VoiceAssistantContext.Provider value={{
      history, setHistory,
      registrationData, setRegistrationData,
      currentFlow, setCurrentFlow,
      flowStep, setFlowStep,
      isOpen, setIsOpen,
      pendingSystemMessage, setPendingSystemMessage
    }}>
      {children}
    </VoiceAssistantContext.Provider>
  );
}

export function useVoiceAssistant() {
  const context = useContext(VoiceAssistantContext);
  if (context === undefined) {
    throw new Error('useVoiceAssistant must be used within a VoiceAssistantProvider');
  }
  return context;
}
