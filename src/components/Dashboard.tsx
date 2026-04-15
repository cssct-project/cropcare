import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, limit, startAfter, DocumentData, QueryDocumentSnapshot, deleteDoc } from 'firebase/firestore';
import { Leaf, LogOut, X, Camera, Upload, User, ChevronRight, Activity, MapPin, Calendar, Edit2, Check, Loader2, Volume2, Square, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VoiceAssistant from './VoiceAssistant';
import CameraModal from './CameraModal';
import Footer from './Footer';
import { GoogleGenAI, Type } from "@google/genai";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  country: string;
  state: string;
}

interface Diagnosis {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  country?: string;
  state?: string;
  cropImage: string;
  diseaseName: string;
  date: any;
  location: string;
  details: string;
  source?: 'Camera Capture' | 'Image Upload';
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<Diagnosis | null>(null);
  const [diagnosisToDelete, setDiagnosisToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState<UserProfile | null>(null);
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // Audio state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Preload voices
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Pagination state
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData, DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const DIAGNOSES_PER_PAGE = 10;

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // Fetch User Profile
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as UserProfile;
          setUserData(data);
          setEditFormData(data);
        }

        // Fetch Diagnoses
        const q = query(
          collection(db, 'diagnoses'),
          where('userId', '==', user.uid),
          orderBy('date', 'desc'),
          limit(DIAGNOSES_PER_PAGE)
        );
        const querySnapshot = await getDocs(q);
        
        const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        setLastVisible(lastVisibleDoc || null);
        setHasMore(querySnapshot.docs.length === DIAGNOSES_PER_PAGE);

        const diagnosesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Diagnosis[];
        setDiagnoses(diagnosesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const loadMoreDiagnoses = async () => {
    if (!user || !lastVisible || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const q = query(
        collection(db, 'diagnoses'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc'),
        startAfter(lastVisible),
        limit(DIAGNOSES_PER_PAGE)
      );
      const querySnapshot = await getDocs(q);
      
      const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastVisible(lastVisibleDoc || null);
      setHasMore(querySnapshot.docs.length === DIAGNOSES_PER_PAGE);

      const newDiagnoses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Diagnosis[];
      
      setDiagnoses(prev => [...prev, ...newDiagnoses]);
    } catch (error) {
      console.error("Error loading more diagnoses:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDeleteDiagnosis = async () => {
    if (!diagnosisToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'diagnoses', diagnosisToDelete));
      setDiagnoses(diagnoses.filter(d => d.id !== diagnosisToDelete));
      setDiagnosisToDelete(null);
    } catch (error) {
      console.error("Error deleting diagnosis:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editFormData) return;
    setProfileUpdateLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...editFormData
      });
      setUserData(editFormData);
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setProfileUpdateLoading(false);
    }
  };

  const isProfileComplete = () => {
    return userData?.firstName && userData?.lastName && userData?.email && userData?.country && userData?.state;
  };

  const requireProfile = (callback: () => void) => {
    if (!isProfileComplete()) {
      alert("Please update your profile with your name, email, country, and state before diagnosing a crop.");
      setShowProfileModal(true);
      setIsEditingProfile(true);
    } else {
      callback();
    }
  };

  const processDiagnosis = async (file: File, source: 'Camera Capture' | 'Image Upload') => {
    if (!user) return;
    setIsUploading(true);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Image = reader.result as string;
        
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          const base64Data = base64Image.split(',')[1];
          const mimeType = base64Image.split(';')[0].split(':')[1];

          const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType
                }
              },
              "Analyze the provided image. First, determine if the image contains a crop leaf. If it does NOT contain a crop leaf, set isLeaf to false. If it DOES contain a crop leaf, set isLeaf to true, identify any diseases present, and provide details. If it's a healthy crop leaf, set diseaseName to 'Healthy Crop'."
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  isLeaf: { type: Type.BOOLEAN, description: "True if the image contains a crop leaf, false otherwise." },
                  diseaseName: { type: Type.STRING, description: "Name of the disease, or 'Healthy Crop' if no disease is found. Empty if not a leaf." },
                  details: { type: Type.STRING, description: "Detailed recommendation and analysis. Empty if not a leaf." }
                },
                required: ["isLeaf", "diseaseName", "details"]
              }
            }
          });

          const text = response.text;
          if (!text) throw new Error("No response from AI");
          
          const aiResult = JSON.parse(text);
          
          if (!aiResult.isLeaf) {
            alert("Only crop leaf that can be diagnosed. Please place a valid crop leaf in the camera.");
            setIsUploading(false);
            return;
          }

          const newDiagnosis = {
            userId: user.uid,
            userName: `${userData?.firstName} ${userData?.lastName}`,
            userEmail: userData?.email,
            country: userData?.country,
            state: userData?.state,
            cropImage: base64Image,
            diseaseName: aiResult.diseaseName,
            location: userData?.state ? `${userData.state}, ${userData.country}` : "Unknown Location",
            details: aiResult.details,
            date: serverTimestamp(),
            source: source
          };

          const docRef = await addDoc(collection(db, 'diagnoses'), newDiagnosis);
          
          // Update local state
          setDiagnoses([{
            id: docRef.id,
            ...newDiagnosis,
            date: { toDate: () => new Date() } // Mock timestamp for immediate UI update
          }, ...diagnoses]);
          
          setIsUploading(false);
          setShowCamera(false);
        } catch (aiError) {
          console.error("AI Processing Error:", aiError);
          alert("Failed to analyze image. Please try again.");
          setIsUploading(false);
        }
      };
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Failed to process image.");
      setIsUploading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processDiagnosis(e.target.files[0], 'Image Upload');
    }
  };

  const handleUploadClick = (e: React.MouseEvent<HTMLInputElement>) => {
    if (!isProfileComplete()) {
      e.preventDefault();
      requireProfile(() => {});
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  };

  const toggleAudio = (text: string, id: string) => {
    if (playingAudioId === id) {
      window.speechSynthesis.cancel();
      setPlayingAudioId(null);
    } else {
      window.speechSynthesis.cancel(); // Stop any currently playing audio
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to find a clear feminine voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoices = [
        'Google UK English Female',
        'Google US English',
        'Samantha',
        'Victoria',
        'Karen',
        'Tessa',
        'Microsoft Zira'
      ];
      
      let selectedVoice = null;
      for (const name of preferredVoices) {
        selectedVoice = voices.find(v => v.name.includes(name));
        if (selectedVoice) break;
      }
      
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.name.toLowerCase().includes('female') || v.voiceURI.toLowerCase().includes('female'));
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      // Adjust for clarity
      utterance.pitch = 1.1; // Slightly higher pitch
      utterance.rate = 0.95; // Slightly slower for better comprehension

      utterance.onend = () => setPlayingAudioId(null);
      utterance.onerror = () => setPlayingAudioId(null);
      window.speechSynthesis.speak(utterance);
      setPlayingAudioId(id);
    }
  };

  const closeDiagnosisModal = () => {
    if (playingAudioId) {
      window.speechSynthesis.cancel();
      setPlayingAudioId(null);
    }
    setSelectedDiagnosis(null);
  };

  const filteredDiagnoses = diagnoses.filter(diagnosis => {
    const query = searchQuery.toLowerCase();
    const dateStr = formatDate(diagnosis.date).toLowerCase();
    return (
      diagnosis.diseaseName.toLowerCase().includes(query) ||
      diagnosis.location.toLowerCase().includes(query) ||
      dateStr.includes(query)
    );
  });

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20 md:pb-0">
      {/* Navbar */}
      <nav className="bg-white border-b border-green-100 px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center space-x-2">
          <Leaf className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
          <span className="text-xl md:text-2xl font-bold text-green-800">CropCare</span>
        </div>
        <div className="flex items-center space-x-3 md:space-x-4">
          <button 
            onClick={() => setShowProfileModal(true)}
            className="flex items-center justify-center h-10 w-10 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
          >
            <User className="h-5 w-5" />
          </button>
          <button onClick={handleLogout} className="hidden md:flex items-center text-red-600 hover:text-red-700 font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors">
            <LogOut className="h-5 w-5 mr-1" /> Logout
          </button>
        </div>
      </nav>

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-10 max-w-5xl">
        
        {/* Welcome & Summary Section */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Hello, {userData?.firstName || 'Farmer'}! 👋</h1>
          <p className="text-gray-600">Let's check on your crops today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Action Cards */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <button 
              onClick={() => requireProfile(() => setShowCamera(true))}
              disabled={isUploading}
              className="bg-green-600 hover:bg-green-700 transition-colors rounded-2xl p-6 flex flex-col items-center justify-center text-white cursor-pointer shadow-md shadow-green-200 disabled:opacity-70"
            >
              {isUploading ? <Loader2 className="h-10 w-10 mb-3 animate-spin" /> : <Camera className="h-10 w-10 mb-3" />}
              <span className="font-bold text-lg text-center">Take Photo</span>
              <span className="text-green-100 text-sm text-center mt-1">Use camera</span>
            </button>
            
            <label className="bg-white hover:bg-gray-50 transition-colors rounded-2xl p-6 flex flex-col items-center justify-center text-green-700 border-2 border-green-600 cursor-pointer shadow-sm">
              {isUploading ? <Loader2 className="h-10 w-10 mb-3 animate-spin" /> : <Upload className="h-10 w-10 mb-3" />}
              <span className="font-bold text-lg text-center">Upload Image</span>
              <span className="text-green-600/70 text-sm text-center mt-1">From gallery</span>
              <input type="file" accept="image/*" className="hidden" onClick={handleUploadClick} onChange={handleImageUpload} disabled={isUploading} />
            </label>
          </div>

          {/* Summary Card */}
          <div className="bg-white rounded-2xl shadow-sm border-2 border-green-600 p-6 flex flex-col justify-center items-center text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Activity className="h-7 w-7 text-green-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{diagnoses.length}</h3>
            <p className="text-gray-500 font-medium">Total Diagnoses</p>
          </div>
        </div>

        {/* Diagnosis History */}
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Diagnoses</h2>
            <div className="relative w-full md:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by disease, location, or date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>
          
          {filteredDiagnoses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
              <Leaf className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No matching diagnoses found' : 'No diagnoses yet'}
              </h3>
              <p className="text-gray-500">
                {searchQuery ? 'Try adjusting your search terms.' : 'Take a photo of a crop leaf to get started.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDiagnoses.map((diagnosis) => (
                <div 
                  key={diagnosis.id} 
                  onClick={() => setSelectedDiagnosis(diagnosis)}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <div className="h-48 overflow-hidden bg-gray-100 relative">
                    <img 
                      src={diagnosis.cropImage} 
                      alt={diagnosis.diseaseName} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm">
                      {formatDate(diagnosis.date)}
                    </div>
                    {diagnosis.source && (
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-white shadow-sm flex items-center">
                        {diagnosis.source === 'Camera Capture' ? <Camera className="h-3 w-3 mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                        {diagnosis.source}
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 mb-2 truncate">{diagnosis.diseaseName}</h3>
                    <div className="flex items-center text-gray-500 text-sm mb-4">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="truncate">{diagnosis.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-green-600 font-medium text-sm">
                        View Details <ChevronRight className="h-4 w-4 ml-1" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAudio(`Disease detected: ${diagnosis.diseaseName}. Analysis and recommendation: ${diagnosis.details}`, diagnosis.id);
                          }}
                          className={`flex items-center px-3 py-1.5 rounded-full transition-colors font-medium text-sm ${playingAudioId === diagnosis.id ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                          title={playingAudioId === diagnosis.id ? "Stop Audio" : "Play Audio"}
                        >
                          <span className="mr-1.5">{playingAudioId === diagnosis.id ? 'Stop' : 'Listen'}</span>
                          {playingAudioId === diagnosis.id ? <Square className="h-4 w-4 fill-current" /> : <Volume2 className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDiagnosisToDelete(diagnosis.id);
                          }}
                          className="flex items-center justify-center h-8 w-8 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                          title="Delete Diagnosis"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {hasMore && filteredDiagnoses.length > 0 && !searchQuery && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={loadMoreDiagnoses}
                disabled={loadingMore}
                className="px-6 py-3 bg-white border border-green-200 text-green-700 font-bold rounded-xl hover:bg-green-50 transition-colors flex items-center shadow-sm disabled:opacity-70"
              >
                {loadingMore ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {diagnosisToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => !isDeleting && setDiagnosisToDelete(null)}>
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Diagnosis?</h3>
            <p className="text-gray-500 mb-6">This action cannot be undone. Are you sure you want to delete this record?</p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setDiagnosisToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-3 bg-gray-100 text-gray-800 font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteDiagnosis}
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Voice Assistant Button (Mobile) */}
      <button 
        onClick={() => setShowVoiceAssistant(true)}
        className="fixed bottom-6 right-6 h-14 w-14 bg-purple-600 text-white rounded-full shadow-lg shadow-purple-200 flex items-center justify-center hover:bg-purple-700 transition-colors z-20"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>

      {/* Diagnosis Details Modal */}
      {selectedDiagnosis && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeDiagnosisModal}>
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="relative h-72 bg-black flex items-center justify-center rounded-t-3xl overflow-hidden">
              <img src={selectedDiagnosis.cropImage} alt={selectedDiagnosis.diseaseName} className="w-full h-full object-contain" />
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-white shadow-sm">
                Analyzed Image
              </div>
              <button 
                onClick={closeDiagnosisModal}
                className="absolute top-4 right-4 h-8 w-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 md:p-8">
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-3 flex-wrap gap-y-2">
                <span className="flex items-center"><Calendar className="h-4 w-4 mr-1" /> {formatDate(selectedDiagnosis.date)}</span>
                <span>•</span>
                <span className="flex items-center"><MapPin className="h-4 w-4 mr-1" /> {selectedDiagnosis.location}</span>
                {selectedDiagnosis.source && (
                  <>
                    <span>•</span>
                    <span className="flex items-center">
                      {selectedDiagnosis.source === 'Camera Capture' ? <Camera className="h-4 w-4 mr-1" /> : <Upload className="h-4 w-4 mr-1" />} 
                      {selectedDiagnosis.source}
                    </span>
                  </>
                )}
              </div>
              
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedDiagnosis.diseaseName}</h2>
                <button 
                  onClick={() => toggleAudio(`Disease detected: ${selectedDiagnosis.diseaseName}. Analysis and recommendation: ${selectedDiagnosis.details}`, selectedDiagnosis.id)}
                  className={`flex items-center px-4 py-2 rounded-full transition-colors font-medium ${playingAudioId === selectedDiagnosis.id ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                  title={playingAudioId === selectedDiagnosis.id ? "Stop Audio" : "Play Audio"}
                >
                  <span className="mr-2">{playingAudioId === selectedDiagnosis.id ? 'Stop' : 'Listen'}</span>
                  {playingAudioId === selectedDiagnosis.id ? <Square className="h-5 w-5 fill-current" /> : <Volume2 className="h-5 w-5" />}
                </button>
              </div>
              
              <div className="bg-green-50 border border-green-100 rounded-xl p-5 mb-6">
                <h4 className="font-bold text-green-800 mb-2">AI Analysis & Recommendation</h4>
                <p className="text-green-700 leading-relaxed text-sm md:text-base">
                  {selectedDiagnosis.details}
                </p>
              </div>
              
              <button 
                onClick={closeDiagnosisModal}
                className="w-full py-3 bg-gray-100 text-gray-800 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Management Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setShowProfileModal(false); setIsEditingProfile(false); }}>
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-md z-10 rounded-t-3xl">
              <h2 className="text-xl font-bold text-gray-900">Your Profile</h2>
              <button onClick={() => { setShowProfileModal(false); setIsEditingProfile(false); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex justify-center mb-6">
                <div className="h-24 w-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl font-bold">
                  {userData?.firstName?.charAt(0)}{userData?.lastName?.charAt(0)}
                </div>
              </div>

              {!isEditingProfile ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Full Name</p>
                    <p className="text-gray-900 font-medium">{userData?.firstName} {userData?.lastName}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Email</p>
                    <p className="text-gray-900 font-medium">{userData?.email}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Phone Number</p>
                    <p className="text-gray-900 font-medium">{userData?.phoneNumber || 'Not provided'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Location</p>
                    <p className="text-gray-900 font-medium">{userData?.state}, {userData?.country}</p>
                  </div>
                  
                  <div className="pt-4 flex flex-col space-y-3">
                    <button 
                      onClick={() => setIsEditingProfile(true)}
                      className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <Edit2 className="h-4 w-4 mr-2" /> Edit Profile
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center md:hidden"
                    >
                      <LogOut className="h-4 w-4 mr-2" /> Logout
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">First Name</label>
                      <input type="text" required value={editFormData?.firstName || ''} onChange={e => setEditFormData(prev => prev ? {...prev, firstName: e.target.value} : null)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Last Name</label>
                      <input type="text" required value={editFormData?.lastName || ''} onChange={e => setEditFormData(prev => prev ? {...prev, lastName: e.target.value} : null)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Phone Number</label>
                    <input type="tel" value={editFormData?.phoneNumber || ''} onChange={e => setEditFormData(prev => prev ? {...prev, phoneNumber: e.target.value} : null)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Country</label>
                      <input type="text" required value={editFormData?.country || ''} onChange={e => setEditFormData(prev => prev ? {...prev, country: e.target.value} : null)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">State</label>
                      <input type="text" required value={editFormData?.state || ''} onChange={e => setEditFormData(prev => prev ? {...prev, state: e.target.value} : null)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500" />
                    </div>
                  </div>
                  
                  <div className="pt-4 flex space-x-3">
                    <button 
                      type="button"
                      onClick={() => { setIsEditingProfile(false); setEditFormData(userData); }}
                      className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={profileUpdateLoading}
                      className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                      {profileUpdateLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Check className="h-4 w-4 mr-2" /> Save</>}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Voice Assistant Modal */}
      {showVoiceAssistant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowVoiceAssistant(false)}>
          <div className="bg-white rounded-3xl max-w-md w-full relative" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setShowVoiceAssistant(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10 bg-gray-100 rounded-full p-1"
            >
              <X className="h-5 w-5" />
            </button>
            <VoiceAssistant />
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <CameraModal 
          onCapture={(file) => processDiagnosis(file, 'Camera Capture')} 
          onClose={() => setShowCamera(false)} 
          isProcessing={isUploading} 
        />
      )}

      <Footer />
    </div>
  );
}
