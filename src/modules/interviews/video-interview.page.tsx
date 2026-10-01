import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  VideoOff, Mic, Camera, ArrowRight, CheckCircle2, 
  Loader2, BrainCircuit, AlertCircle, Volume2, Code, FileText, Square
} from 'lucide-react';
import { Button } from '@/components/ui/Button/index.js';
import { Card, CardContent } from '@/components/ui/Card/index.js';
import { useAuth } from '@/app/providers/AuthProvider.js';
import axios from 'axios';

interface QuestionAnswer {
  questionText: string;
  answerText: string;
  mode: 'voice' | 'written';
}

export function VideoInterviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const applicationId = parseInt(id || '0', 10);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [permissionError, setPermissionError] = useState('');
  const [requesting, setRequesting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [started, setStarted] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);

  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  // Audio & Voice States
  const [micLevel, setMicLevel] = useState(0);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [responseMode, setResponseMode] = useState<'voice' | 'written'>('voice');

  // Hands-Free Auto-Advance States
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null);
  const [autoPaused, setAutoPaused] = useState(false);

  const [inactiveStatus, setInactiveStatus] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const responseModeRef = useRef<'voice' | 'written'>('voice');
  const nextQuestionRef = useRef<() => void>(() => {});
  const interviewOverRef = useRef(false);
  const committedAnswerRef = useRef('');  // Silence detection thresholds
  const SILENCE_MS = 3000;

  // Camera & Mic Permissions
  const requestPermissions = async () => {
    setRequesting(true);
    setPermissionError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 }, 
        audio: true 
      });
      setStream(mediaStream);
      setHasPermissions(true);
      toast.success('Camera and microphone access granted successfully!');
      
      setupAudioAnalyzer(mediaStream);
    } catch (err: any) {
      console.error(err);
      setHasPermissions(false);
      setPermissionError('Camera and microphone access are required for the AI voice interview. Please check your browser permission settings.');
      toast.error('Permissions rejected. Unable to initialize webcam.');
    } finally {
      setRequesting(false);
    }
  };

  const setupAudioAnalyzer = (mediaStream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      
      const audioContext = new AudioCtx();
      const source = audioContext.createMediaStreamSource(mediaStream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        setMicLevel(normalized);
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (err) {
      console.error('Audio analyzer setup error:', err);
    }
  };

  // Video Stream Sync
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, hasPermissions, started]);

  // Clean Up Media Tracks
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, [stream]);

  // Speech Recognition (Candidate Voice Input -> Text)
  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.warn('SpeechRecognition API is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript + ' ';
      }
      const base = committedAnswerRef.current ? committedAnswerRef.current.trim() : '';
      const addition = transcript.trim();
      setCurrentAnswer(base ? `${base} ${addition}` : addition);
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      // Auto restart if still in voice mode (refs avoid stale closure values)
      if (isListeningRef.current && responseModeRef.current === 'voice' && !window.speechSynthesis.speaking) {
        try { recognition.start(); } catch {}
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onend = null;
      try { recognition.stop(); } catch {}
    };
  }, []);

  // Keep refs in sync for use inside recognition/timer callbacks
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);
  useEffect(() => { responseModeRef.current = responseMode; }, [responseMode]);

  useEffect(() => {
    const checkInterviewStatus = async () => {
      setCheckingStatus(true);
      try {
        const res = await axios.get(`/interviews/session/${applicationId}?start=false`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        const status = res.data?.status;
        if (status === 'COMPLETED' || status === 'NOT_ATTENDED' || status === 'CANCELLED') {
          setInactiveStatus(status);
        } else if (status === 'IN_PROGRESS') {
          const loadedQuestions: string[] = res.data?.technicalQuestions || [];
          const loadedAnswers: QuestionAnswer[] = res.data?.answers || [];

          if (loadedQuestions.length > 0) {
            setQuestions(loadedQuestions);
            setAnswers(loadedAnswers);
            setStarted(true);

            const currentIdx = loadedAnswers.length;
            setCurrentIndex(currentIdx);

            const currentMode = detectMode(loadedQuestions[currentIdx]);
            setResponseMode(currentMode);
            responseModeRef.current = currentMode;

            setTimeout(() => {
              speakLines([loadedQuestions[currentIdx]]);
            }, 1500);
          }
        }
      } catch (err: any) {
        console.error('Failed to check interview status on mount:', err);
        const reason = err.response?.data?.error || err.response?.data?.message;
        if (err.response?.status === 403) {
          setPermissionError(reason || 'Access denied. The interview is not active.');
        }
      } finally {
        setCheckingStatus(false);
      }
    };

    if (applicationId) {
      checkInterviewStatus();
    }
  }, [applicationId, accessToken]);

  // Handle Start Voice Interview
  const handleStartInterview = async () => {
    if (!hasPermissions) {
      toast.warn('Please grant camera and microphone access first.');
      return;
    }

    setLoadingQuestions(true);
    try {
      const localHour = new Date().getHours();
      let timeGreeting = "Hello, Good Morning";
      if (localHour >= 12 && localHour < 17) {
        timeGreeting = "Hello, Good Afternoon";
      } else if (localHour >= 17 || localHour < 5) {
        timeGreeting = "Hello, Good Evening";
      }

      const res = await axios.get(`/interviews/session/${applicationId}?greeting=${encodeURIComponent(timeGreeting)}&start=true`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const loadedQuestions: string[] = res.data?.technicalQuestions || [];
      const loadedAnswers: QuestionAnswer[] = res.data?.answers || [];

      if (!Array.isArray(loadedQuestions) || loadedQuestions.length === 0) {
        throw new Error('No interview questions were generated for this application.');
      }

      setQuestions(loadedQuestions);
      setAnswers(loadedAnswers);
      setStarted(true);

      const currentIdx = loadedAnswers.length;
      setCurrentIndex(currentIdx);

      const currentMode = detectMode(loadedQuestions[currentIdx]);
      setResponseMode(currentMode);
      responseModeRef.current = currentMode;

      // Speak the first active question
      speakLines([loadedQuestions[currentIdx]]);
    } catch (err: any) {
      console.error('Failed to load AI interview questions:', err);
      const reason = err.response?.data?.error || err.response?.data?.message;
      setPermissionError(
        reason ||
        'Unable to generate your personalised interview questions right now. Please refresh and try again in a moment.'
      );
      toast.error(reason || 'Could not load your AI interview questions.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Known male voice names across Windows / macOS / Chrome
  const MALE_VOICE_NAMES = /guy|davis|andrew|brian|christopher|eric|roger|steffan|tony|jason|george|ryan|thomas|daniel|alex|fred|rishi|mark|david|james|william|liam|oliver/i;
  const FEMALE_VOICE_NAMES = /aria|jenny|zira|hazel|samantha|karen|moira|tessa|victoria|susan|linda|heather|emma|sonia|libby|michelle|ana|female/i;

  // Pick the most natural-sounding male English voice available
  const getNaturalVoice = (): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis?.getVoices?.() || [];
    if (voices.length === 0) return null;

    const english = voices.filter(v => v.lang?.toLowerCase().startsWith('en'));
    const pool = english.length > 0 ? english : voices;

    const isMale = (v: SpeechSynthesisVoice) =>
      /\bmale\b/i.test(v.name) || (MALE_VOICE_NAMES.test(v.name) && !FEMALE_VOICE_NAMES.test(v.name));
    const notFemale = (v: SpeechSynthesisVoice) => !FEMALE_VOICE_NAMES.test(v.name);

    // Best first: natural/neural male cloud voices, then known good local male voices
    const preferences = [
      (v: SpeechSynthesisVoice) => /guy|christopher|ryan|andrew|brian|eric/i.test(v.name) && /natural|online|neural/i.test(v.name),
      (v: SpeechSynthesisVoice) => /natural/i.test(v.name) && isMale(v),
      (v: SpeechSynthesisVoice) => /neural/i.test(v.name) && isMale(v),
      (v: SpeechSynthesisVoice) => /online/i.test(v.name) && isMale(v),
      (v: SpeechSynthesisVoice) => /google (uk|us) english male/i.test(v.name),
      (v: SpeechSynthesisVoice) => /^google/i.test(v.name) && isMale(v),
      (v: SpeechSynthesisVoice) => /daniel|alex|tom|oliver|rishi/i.test(v.name),
      isMale,
      // No male voice installed - fall back to the most natural voice we can find
      (v: SpeechSynthesisVoice) => /natural|neural/i.test(v.name) && notFemale(v),
      (v: SpeechSynthesisVoice) => /natural|neural/i.test(v.name),
      (v: SpeechSynthesisVoice) => v.localService === false,
    ];

    for (const matches of preferences) {
      const found = pool.find(matches);
      if (found) return found;
    }
    return pool[0] || null;
  };

  // Warm up the voice list (populated asynchronously in most browsers)
  useEffect(() => {
    if (!window.speechSynthesis) return;
    const load = () => { getNaturalVoice(); };
    load();
    window.speechSynthesis.addEventListener?.('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', load);
  }, []);

  // Coding / logic prompts are answered in written mode
  const detectMode = (question: string): 'voice' | 'written' => {
    const q = (question || '').toLowerCase();
    return /\b(write|code|snippet|formula|pseudo|query|implement)\b/.test(q) ? 'written' : 'voice';
  };

  // Make the written line sound like speech rather than a read-aloud document
  const humanize = (text: string) =>
    (text || '')
      .replace(/\s*[\/\\|*_#`>]+\s*/g, ' ')   // strip symbols that TTS reads out literally
      .replace(/\s*\(([^)]*)\)\s*/g, ', $1, ') // parentheses become a spoken aside
      .replace(/([,;:])\s+/g, '$1 ')
      .replace(/([.?!])\s+/g, '$1 ... ')       // beat between sentences
      .replace(/\s{2,}/g, ' ')
      .trim();

  // Speak one or more lines back to back, with a real breath between them
  const speakLines = (lines: string[]) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const parts = lines.filter(l => l && l.trim());
    if (parts.length === 0) return;

    setIsAiSpeaking(true);
    stopListening();

    const voice = getNaturalVoice();

    const finish = () => {
      setIsAiSpeaking(false);
      // Hand the floor back to the candidate
      if (!interviewOverRef.current && responseModeRef.current === 'voice') {
        startListening();
      }
    };

    parts.forEach((line, index) => {
      const utterance = new SpeechSynthesisUtterance(humanize(line));

      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }
      // Slightly slow and slightly low: an unhurried male conversational register
      utterance.rate = 0.94;
      utterance.pitch = 0.95;
      utterance.volume = 1;

      if (index === parts.length - 1) {
        utterance.onend = finish;
        utterance.onerror = finish;
      }

      window.speechSynthesis.speak(utterance);
    });
  };

  const speakQuestion = (questionText: string) => speakLines([questionText]);

  const startListening = () => {
    if (!recognitionRef.current) return;
    committedAnswerRef.current = currentAnswer;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {}
    setIsListening(false);
  };

  // Handle Question Navigation
  const handleNextQuestion = async () => {
    if (!currentAnswer.trim()) {
      return;
    }

    // Stop speaking, listening & any pending auto-advance
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    stopListening();
    setAutoCountdown(null);
    setAutoPaused(false);

    const newQa: QuestionAnswer = {
      questionText: questions[currentIndex],
      answerText: currentAnswer.trim(),
      mode: responseMode,
    };

    const updatedAnswers = [...answers, newQa];
    setAnswers(updatedAnswers);
    const candidateAnswer = currentAnswer.trim();
    setCurrentAnswer('');
    setSubmitting(true);

    try {
      const localHour = new Date().getHours();
      let timeGreeting = "Hello, Good Morning";
      if (localHour >= 12 && localHour < 17) {
        timeGreeting = "Hello, Good Afternoon";
      } else if (localHour >= 17 || localHour < 5) {
        timeGreeting = "Hello, Good Evening";
      }

      const nextRes = await axios.post('/interviews/next-question', {
        applicationId,
        answers: updatedAnswers,
        timeGreeting
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const { acknowledgement, nextQuestion, isFinished } = nextRes.data;

      if (isFinished) {
        interviewOverRef.current = true;
        speakLines([
          acknowledgement || "Got it, thanks for sharing that.",
          nextQuestion || "That's everything from my side. Thanks a lot for your time today."
        ]);
        await handleFinalSubmit(updatedAnswers);
      } else {
        const nextQuestions = [...questions, nextQuestion];
        setQuestions(nextQuestions);

        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);

        // Auto detect coding/formula question
        const nextMode = detectMode(nextQuestion);
        setResponseMode(nextMode);
        responseModeRef.current = nextMode;

        speakLines([
          acknowledgement || "Got it, thanks.",
          nextQuestion
        ]);
      }
    } catch (err: any) {
      console.error('Failed to progress to next question:', err);
      toast.error('Connection issue. Retrying answer submission...');
      // Revert state so candidate doesn't lose progress
      setAnswers(answers);
      setCurrentAnswer(candidateAnswer);
    } finally {
      setSubmitting(false);
    }
  };

  // Always expose the latest handler to the silence/countdown timers
  useEffect(() => { nextQuestionRef.current = handleNextQuestion; });

  // Inactivity/Silence detection: reset countdown on change, start countdown after silence duration
  useEffect(() => {
    setAutoCountdown(null);

    if (!started || finished || submitting || isAiSpeaking) return;
    if (autoPaused) return;

    const textLength = currentAnswer.trim().length;
    // Don't auto-advance on extremely brief text
    if (textLength < 5) return;

    const timer = setTimeout(() => {
      setAutoCountdown(3);
    }, SILENCE_MS);

    return () => clearTimeout(timer);
  }, [currentAnswer, started, finished, submitting, isAiSpeaking, autoPaused]);

  // Countdown timer: 3 -> 2 -> 1 -> trigger auto advance
  useEffect(() => {
    if (autoCountdown === null) return;

    if (autoCountdown <= 0) {
      setAutoCountdown(null);
      nextQuestionRef.current();
      return;
    }

    const timer = setTimeout(() => {
      setAutoCountdown(c => (c === null ? null : c - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoCountdown]);

  const handleSpeakMore = () => {
    setAutoCountdown(null);
    setAutoPaused(true);
    if (responseMode === 'voice') startListening();
  };

  const handleFinalSubmit = async (finalAnswers: QuestionAnswer[]) => {
    setSubmitting(true);
    try {
      // Save completed state on backend
      await axios.post(`/interviews/submit-session`, { applicationId, answers: finalAnswers }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      // Trigger AI evaluation report generation
      await axios.post(`/interviews/evaluate/${applicationId}`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      setFinished(true);
      toast.success('AI Voice Interview completed and evaluated successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || err.message || 'Error finalising interview. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (inactiveStatus) {
    const statusLabels: Record<string, string> = {
      COMPLETED: 'Completed',
      NOT_ATTENDED: 'Not Attended / Expired',
      CANCELLED: 'Cancelled',
    };
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4 font-sans">
        <Card className="max-w-md w-full bg-zinc-900 border-zinc-800 text-white text-center p-8 rounded-2xl shadow-2xl">
          <CardContent className="space-y-6 p-0">
            <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Interview Not Active</h2>
              <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                This interview session is no longer active. You cannot take or resume this interview.
              </p>
              <div className="mt-3">
                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-zinc-800 text-zinc-300">
                  Status: {statusLabels[inactiveStatus] || inactiveStatus}
                </span>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/candidate-dashboard')} 
              className="w-full font-bold bg-white text-zinc-900 hover:bg-zinc-200 py-3 rounded-xl"
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4 font-sans">
        <Card className="max-w-md w-full bg-zinc-900 border-zinc-800 text-white text-center p-8 rounded-2xl shadow-2xl">
          <CardContent className="space-y-6 p-0">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">AI Voice Interview Completed!</h2>
              <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
                Thank you for completing your dynamic AI voice interview. Your voice transcript and written solutions have been saved and successfully evaluated by HR.
              </p>
            </div>
            <Button 
              onClick={() => navigate('/candidate-dashboard')} 
              className="w-full font-bold bg-white text-zinc-900 hover:bg-zinc-200 py-3 rounded-xl"
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col font-sans">
      {/* Header Bar */}
      <nav className="h-16 border-b border-zinc-850 px-6 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md">
            <BrainCircuit className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-base tracking-tight">
            RecruitAI <span className="text-emerald-400 font-bold text-xs ml-1">Voice Interview</span>
          </span>
        </div>

        {started && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-zinc-400">
              Prompt {currentIndex + 1}
            </span>
          </div>
        )}
      </nav>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl flex flex-col justify-center">
        {!started ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
                <Volume2 className="w-3.5 h-3.5" /> Two-Way AI Voice Communication
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                AI Interactive Voice Interview
              </h1>
              <p className="text-zinc-400 text-sm leading-relaxed">
                The AI interviewer will ask questions out loud using speech synthesis. Respond by speaking naturally into your microphone. For coding or mathematical questions, you can switch to Written/Code mode.
              </p>

              {permissionError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{permissionError}</span>
                </div>
              )}

              <div className="space-y-3 pt-2">
                {permissionError && (permissionError.includes('scheduled') || permissionError.includes('time slot') || permissionError.includes('accessible')) ? (
                  <Button 
                    onClick={() => navigate('/candidate-dashboard')} 
                    className="w-full py-3.5 font-bold bg-white text-zinc-900 hover:bg-zinc-200 rounded-xl shadow-lg flex items-center justify-center gap-2"
                  >
                    Return to Dashboard
                  </Button>
                ) : !hasPermissions ? (
                  <Button 
                    onClick={requestPermissions} 
                    disabled={requesting}
                    className="w-full py-3.5 font-bold bg-white text-zinc-900 hover:bg-zinc-200 rounded-xl shadow-lg flex items-center justify-center gap-2"
                  >
                    {requesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    Enable Camera & Microphone
                  </Button>
                ) : (
                  <Button 
                    onClick={handleStartInterview}
                    disabled={loadingQuestions}
                    className="w-full py-3.5 font-bold bg-emerald-500 text-zinc-950 hover:bg-emerald-400 rounded-xl shadow-lg flex items-center justify-center gap-2"
                  >
                    {loadingQuestions ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    Start Voice Interview Now
                  </Button>
                )}
              </div>
            </div>

            {/* Camera & Mic Preview Box */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl">
              {stream ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover transform -scale-x-100" 
                />
              ) : (
                <div className="text-center p-6 space-y-3">
                  <VideoOff className="w-12 h-12 text-zinc-600 mx-auto" />
                  <p className="text-xs text-zinc-500 font-medium">Camera Preview Unavailable</p>
                </div>
              )}

              {hasPermissions && (
                <div className="absolute bottom-4 left-4 right-4 bg-zinc-950/80 backdrop-blur-md p-3 rounded-xl border border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-zinc-300">Mic Level</span>
                  </div>
                  <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-75" 
                      style={{ width: `${micLevel}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Video Feed & Real-Time Voice Waveform */}
            <div className="lg:col-span-6 space-y-4">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover transform -scale-x-100" 
                />

                {/* AI Speaking Indicator Badge */}
                {isAiSpeaking && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-blue-500/20 border border-blue-500/40 px-3 py-1.5 rounded-full backdrop-blur-md">
                    <Volume2 className="w-4 h-4 text-blue-400 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-blue-400">Interviewer Speaking...</span>
                  </div>
                )}

                {/* Candidate Voice Active Indicator Badge */}
                {!isAiSpeaking && isListening && responseMode === 'voice' && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 rounded-full backdrop-blur-md">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Speak Now (Listening)</span>
                  </div>
                )}

                {/* Written Code Mode Indicator Badge */}
                {responseMode === 'written' && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-purple-500/20 border border-purple-500/40 px-3 py-1.5 rounded-full backdrop-blur-md">
                    <Code className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-purple-400">Code / Written Mode</span>
                  </div>
                )}

                {/* Mic Volume Level Bar */}
                <div className="absolute bottom-4 left-4 right-4 bg-zinc-950/80 backdrop-blur-md p-3 rounded-xl border border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className={`w-4 h-4 ${micLevel > 15 ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`} />
                    <span className="text-xs font-bold text-zinc-300">Your Voice Input</span>
                  </div>
                  <div className="w-36 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-75" 
                      style={{ width: `${micLevel}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Question Card, Voice Transcript & Code Mode Switcher */}
            <div className="lg:col-span-6 space-y-6">
              <Card className="bg-zinc-900 border-zinc-800 text-white rounded-2xl p-6 space-y-5 shadow-xl">
                <CardContent className="p-0 space-y-5">
                  {/* Current Question & AI Replay */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <BrainCircuit className="w-4 h-4" /> Current Prompt ({currentIndex + 1})
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => speakQuestion(questions[currentIndex])}
                        disabled={isAiSpeaking}
                        className="h-7 text-[11px] font-bold text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-2.5 gap-1 border border-blue-500/20 rounded-lg"
                      >
                        <Volume2 className="w-3.5 h-3.5" /> Repeat Question
                      </Button>
                    </div>

                    <h3 className="text-lg font-extrabold leading-snug text-zinc-100">
                      {questions[currentIndex]}
                    </h3>
                  </div>

                  {/* Mode Switcher Tabs (Voice Response vs Written/Code Mode) */}
                  <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                    <button
                      onClick={() => {
                        setResponseMode('voice');
                        startListening();
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        responseMode === 'voice'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5" /> Voice Answer Mode
                    </button>

                    <button
                      onClick={() => {
                        setResponseMode('written');
                        stopListening();
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        responseMode === 'written'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" /> Code / Written Mode
                    </button>
                  </div>

                  {/* Response Input Area */}
                  {responseMode === 'voice' ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-zinc-400 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-emerald-400" /> Speech-to-Text Live Transcript
                        </label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (isListening) stopListening();
                            else startListening();
                          }}
                          className="h-6 text-[10px] font-bold text-zinc-400 hover:text-zinc-200"
                        >
                          {isListening ? <Square className="w-3 h-3 text-red-400 mr-1 inline" /> : <Mic className="w-3 h-3 text-emerald-400 mr-1 inline" />}
                          {isListening ? 'Pause Mic' : 'Start Mic'}
                        </Button>
                      </div>

                      <textarea 
                        value={currentAnswer}
                        onChange={(e) => {
                          setCurrentAnswer(e.target.value);
                          if (isListening) stopListening(); // Stop mic when they type/edit
                        }}
                        onFocus={() => {
                          if (isListening) stopListening(); // Pause mic while reviewing/editing
                        }}
                        placeholder="Speak into your microphone naturally... your spoken response will be transcribed here automatically in real-time. You can manually edit this text at any time."
                        rows={5}
                        className="w-full p-3.5 rounded-xl border border-zinc-800 bg-zinc-950 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500/50 resize-none font-medium"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5" /> Code Snippet / Written Solution
                      </label>
                      <textarea 
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        placeholder="// Type your code, formula, logic, or detailed solution here..."
                        rows={6}
                        className="w-full p-3.5 rounded-xl border border-zinc-800 bg-zinc-950 text-sm text-purple-200 font-mono focus:outline-none focus:border-purple-500/50 resize-none"
                      />
                    </div>
                  )}

                  {/* Hands-Free Auto-Advance / Status Indicators */}
                  {submitting && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                      <span className="text-xs font-bold text-emerald-300">
                        AI Interviewer is processing your response...
                      </span>
                    </div>
                  )}

                  {!submitting && autoCountdown !== null && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 animate-pulse">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-xs font-bold text-amber-300 truncate">
                          Response recorded. Auto-advancing in {autoCountdown}s...
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSpeakMore}
                        className="h-7 shrink-0 text-[11px] font-bold text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 px-2.5 border border-amber-500/30 rounded-lg"
                      >
                        Pause to Edit
                      </Button>
                    </div>
                  )}

                  {!submitting && autoPaused && (
                    <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertCircle className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="text-xs font-bold text-purple-300 truncate">
                          Auto-advance is paused for manual review/editing.
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAutoPaused(false);
                          }}
                          className="h-7 shrink-0 text-[11px] font-bold text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 px-2.5 border border-purple-500/30 rounded-lg"
                        >
                          Resume
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setAutoPaused(false);
                            handleNextQuestion();
                          }}
                          className="h-7 shrink-0 text-[11px] font-bold bg-purple-500 hover:bg-purple-400 text-zinc-950 px-2.5 rounded-lg"
                        >
                          Send Answer
                        </Button>
                      </div>
                    </div>
                  )}

                  {autoCountdown === null && !autoPaused && !isAiSpeaking && !submitting && started && (
                    <p className="text-[11px] font-semibold text-zinc-500 text-center">
                      Auto-advance active: stop speaking or typing for 3 seconds to send response.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default VideoInterviewPage;
