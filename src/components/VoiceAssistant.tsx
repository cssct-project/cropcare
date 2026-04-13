import React, { useState, useEffect } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import { useVoiceAssistant } from '../contexts/VoiceAssistantContext';
import { useNavigate } from 'react-router-dom';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function VoiceAssistant() {
  const { history, setHistory, registrationData, setRegistrationData, setIsOpen, pendingSystemMessage, setPendingSystemMessage } = useVoiceAssistant();
  const navigate = useNavigate();
  
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');

  useEffect(() => {
    if (pendingSystemMessage) {
      const messageToProcess = pendingSystemMessage;
      setPendingSystemMessage(null);
      processVoiceInput(messageToProcess);
    }
  }, [pendingSystemMessage]);

  const playRawPCM = (base64Data: string) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const float32Data = new Float32Array(bytes.length / 2);
      const dataView = new DataView(bytes.buffer);
      for (let i = 0; i < float32Data.length; i++) {
        float32Data[i] = dataView.getInt16(i * 2, true) / 32768.0;
      }

      const audioBuffer = audioCtx.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start();
    } catch (err) {
      console.error("Error playing audio:", err);
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      setResponse('');
    };

    recognition.onresult = async (event: any) => {
      const speechResult = event.results[0][0].transcript;
      setTranscript(speechResult);
      setIsListening(false);
      await processVoiceInput(speechResult);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      setResponse("Microphone error. Please ensure permissions are granted.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const processVoiceInput = async (text: string) => {
    setIsProcessing(true);
    setResponse('');
    
    try {
      const newHistory = [...history, { role: 'user' as const, content: text }];
      setHistory(newHistory);

      const systemInstruction = `You are an AI Voice Assistant for CropCare, a crop disease detection platform for African farmers. Keep your answer brief (under 3 sentences), conversational, and helpful. 
      
      APP INFORMATION: You can provide information about the CropCare app. 
      - Email: info@edutech.com.ng
      - WhatsApp / Contact Number: +2348051555130
      - Purpose: Empowering African farmers with AI-driven crop disease detection.
      
      LANGUAGE RULE: You must be able to understand and respond fluently in the language the user speaks. You must support English, Arabic, French, Hausa, Igbo, Yoruba, and other African languages. Always reply in the same language the user used to speak to you.
      
      CRITICAL RULE: If the visitor asks anything that is NOT within the context of crop care, crop diseases, farming, or using/contacting this app (like registration, login, or contact details), you MUST politely decline. Tell the visitor "No, I can only help with crop care and diseases" and guide them back to the app's purpose. Always restrict your responses to this domain.

      If the visitor says he wants to get started, first take the following actions:
      1. Ask the visitor to provide the registration details and take them one after the other (firstName, lastName, email, phoneNumber, country, state, password).
      2. Once you have gotten all the required information, call the 'navigate_to_signup' tool to take the provided details to the registration form and ask the visitor to confirm the details and click on Sign up if everything is okay.
      3. If the user says they have signed up or if you receive a SYSTEM message that registration is successful, return a congratulations message telling the visitor that Registration is successful. Then call 'navigate_to_login' to return to the Sign in page and ask the visitor whether he wants to help him sign in.
      4. If the visitor says YES to signing in, call 'submit_login' to use his details to sign him in.`;

      const tools = [{
        functionDeclarations: [
          {
            name: "navigate_to_signup",
            description: "Navigates to the registration form and pre-fills the collected details.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                firstName: { type: Type.STRING },
                lastName: { type: Type.STRING },
                email: { type: Type.STRING },
                phoneNumber: { type: Type.STRING },
                country: { type: Type.STRING },
                state: { type: Type.STRING },
                password: { type: Type.STRING }
              }
            }
          },
          {
            name: "navigate_to_login",
            description: "Navigates to the login page.",
            parameters: {
              type: Type.OBJECT,
              properties: {}
            }
          },
          {
            name: "submit_login",
            description: "Submits the login form using the collected details.",
            parameters: {
              type: Type.OBJECT,
              properties: {}
            }
          }
        ]
      }];

      const contents = newHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }));

      const chatResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          tools: tools
        }
      });
      
      let replyText = "";
      let functionCall = chatResponse.functionCalls?.[0];

      if (functionCall) {
        if (functionCall.name === "navigate_to_signup") {
          const args = functionCall.args as any;
          setRegistrationData(args);
          setIsOpen(true);
          navigate('/signup');
          replyText = "I have filled out the registration form with your details. Please confirm them and click Sign up if everything is okay.";
        } else if (functionCall.name === "navigate_to_login") {
          setIsOpen(true);
          navigate('/login');
          replyText = "Congratulations! Registration is successful. We are now on the Sign in page. Would you like me to help you sign in?";
        } else if (functionCall.name === "submit_login") {
          window.dispatchEvent(new CustomEvent('trigger-login'));
          replyText = "Signing you in now.";
        }
        
        // Add the function call response to history
        newHistory.push({ role: 'model', content: replyText });
        setHistory(newHistory);
      } else {
        replyText = chatResponse.text || "I'm sorry, I couldn't process that.";
        newHistory.push({ role: 'model', content: replyText });
        setHistory(newHistory);
      }

      // 2. Get TTS audio from Gemini
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: replyText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      
      setResponse(replyText);
      setIsProcessing(false);

      if (base64Audio) {
        playRawPCM(base64Audio);
      }
    } catch (error) {
      console.error("Error processing voice input:", error);
      setResponse("Sorry, I encountered an error connecting to the AI. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden w-full">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-green-600"></div>
      
      <div 
        className={`flex items-center justify-center h-48 bg-green-50 rounded-2xl mb-6 relative cursor-pointer transition-all hover:bg-green-100 ${isListening ? 'ring-4 ring-green-300' : ''}`}
        onClick={!isListening && !isProcessing ? startListening : undefined}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {(isListening || isProcessing) && (
            <>
              <div className="w-24 h-24 bg-green-200 rounded-full animate-ping opacity-40"></div>
              <div className="w-32 h-32 bg-green-100 rounded-full animate-ping opacity-20 absolute"></div>
            </>
          )}
        </div>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center z-10 shadow-lg transition-colors ${isListening ? 'bg-red-500 shadow-red-200' : 'bg-green-600 shadow-green-200'}`}>
          {isProcessing ? (
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          ) : isListening ? (
            <Mic className="h-8 w-8 text-white animate-pulse" />
          ) : (
          <Mic className="h-8 w-8 text-white" />
          )}
        </div>
      </div>
      
      <div className="text-center min-h-[80px] flex flex-col justify-center">
        {transcript && (
          <p className="text-gray-500 italic mb-3 text-sm">You: "{transcript}"</p>
        )}
        {isListening && (
          <p className="text-red-500 font-medium animate-pulse">Listening...</p>
        )}
        {isProcessing && (
          <p className="text-green-600 font-medium animate-pulse">Thinking...</p>
        )}
        {!isProcessing && response && (
          <p className="text-gray-800 font-medium text-sm leading-relaxed">{response}</p>
        )}
        {!transcript && !response && !isListening && !isProcessing && (
          <p className="text-gray-500 italic">Tap the microphone to ask a question...</p>
        )}
      </div>
    </div>
  );
}
