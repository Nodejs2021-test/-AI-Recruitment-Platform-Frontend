import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/Button/index.js';
import { Card, CardContent } from '@/components/ui/Card/index.js';
import { Progress } from '@/components/ui/Loader/index.js';
import { Badge } from '@/components/ui/Badge/index.js';
import { Alert, AlertDescription } from '@/components/ui/Alert/index.js';
import { 
  Timer, CheckCircle2, ArrowRight, ArrowLeft, BrainCircuit, AlertCircle, HelpCircle
} from 'lucide-react';
import {
  useStartAssessmentMutation,
  useSaveAnswerMutation,
  useSubmitAssessmentMutation,
  useLazyGetAssessmentQuestionsQuery,
} from './assessment.api.js';
import { Whiteboard } from './whiteboard.component.js';

interface Question {
  id: number;
  questionText: string;
  options: string[];
  skill: string;
  difficulty: string;
  isLogical?: boolean;
  timeLimitSeconds?: number;
  requiresWhiteboard?: boolean;
}

export function AssessmentPage() {
  const { id: routeApplicationId } = useParams();
  const navigate = useNavigate();

  const applicationId = routeApplicationId ? parseInt(routeApplicationId, 10) : null;
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [whiteboardData, setWhiteboardData] = useState<Record<number, { drawingDataUrl: string; explanationText: string }>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [_results, setResults] = useState<{
    finalScore: number;
    recommendation: 'SHORTLIST' | 'REVIEW' | 'REJECT';
    skillScores: Record<string, number>;
  } | null>(null);

  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60);

  const [logicalTimer, setLogicalTimer] = useState<number>(120);

  const [isStarted, setIsStarted] = useState(false);
  
  const isStartedRef = useRef(false);
  const finishedRef = useRef(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    isStartedRef.current = isStarted;
  }, [isStarted]);

  useEffect(() => {
    finishedRef.current = finished;
  }, [finished]);

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  const [startAssessment] = useStartAssessmentMutation();
  const [saveAnswer] = useSaveAnswerMutation();
  const [submitAssessment] = useSubmitAssessmentMutation();
  const [getAssessmentQuestions] = useLazyGetAssessmentQuestionsQuery();

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchExam = async () => {
      try {
        if (!applicationId) {
          setErrorMsg('No application ID provided');
          setLoading(false);
          return;
        }

        const data = await startAssessment(applicationId).unwrap();
        setQuestions(data.questions || []);
        setStartTime(data.startTime);
        setAssessmentId(data.assessmentId);
        if (data.durationMinutes) {
          setDurationMinutes(data.durationMinutes);
          setTimeLeft(data.durationMinutes * 60);
        }

        const saved = data.savedAnswers || [];
        const ansObj: Record<number, string> = {};
        saved.forEach((a: any) => {
          ansObj[a.questionId] = a.selectedOption;
        });
        setAnswers(ansObj);

        setLoading(false);
        setIsStarted(true);
        toast.success('Your assessment has started. Please answer all questions carefully.');
      } catch (err: any) {
        console.error(err);
        toast.error('Unable to generate assessment at this time. Please try again later.');
        setErrorMsg(err.data?.error || err.error || 'Failed to load assessment. Verify you are logged in.');
        setLoading(false);
      }
    };

    fetchExam();
  }, [applicationId]);

  // BACKGROUND PREFETCH EFFECT FOR QUESTIONS 2 TO 10
  useEffect(() => {
    if (!assessmentId || finished || questions.length >= 10) return;

    const interval = setInterval(async () => {
      try {
        const res = await getAssessmentQuestions(assessmentId).unwrap();
        if (res && res.questions && res.questions.length > questions.length) {
          setQuestions(res.questions);
        }
        if (res?.questions?.length >= 10) {
          clearInterval(interval);
        }
      } catch (e) {
        console.error('Background question prefetch error:', e);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [assessmentId, finished, questions.length, getAssessmentQuestions]);


  // Overall Exam Timer
  useEffect(() => {
    if (loading || finished || !startTime) return;

    const startMs = new Date(startTime).getTime();
    const timerInterval = setInterval(() => {
      const elapsedSecs = Math.floor((Date.now() - startMs) / 1000);
      const remaining = durationMinutes * 60 - elapsedSecs;

      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(timerInterval);
        handleAutoSubmit();
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [loading, finished, startTime, durationMinutes]);

  // Dedicated Logical Question Timer
  useEffect(() => {
    const currentQ = questions[currentIndex];
    if (!currentQ || !(currentQ.isLogical || currentQ.requiresWhiteboard)) return;

    setLogicalTimer(currentQ.timeLimitSeconds || 120);
    const interval = setInterval(() => {
      setLogicalTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentIndex, questions]);

  const handleSelectOption = async (option: string) => {
    if (!questions[currentIndex]) return;
    const questionId = questions[currentIndex].id;
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: option,
    }));

    try {
      await saveAnswer({
        assessmentId: assessmentId!,
        questionId,
        selectedOption: option,
        timeSpent: 0,
      }).unwrap();
    } catch (err) {
      console.warn('Autosave failed:', err);
    }
  };

  const handleWhiteboardChange = (data: { drawingDataUrl: string; explanationText: string }) => {
    if (!questions[currentIndex]) return;
    const questionId = questions[currentIndex].id;
    setWhiteboardData(prev => ({
      ...prev,
      [questionId]: data
    }));
  };

  const handleAutoSubmit = async () => {
    toast.error('The assessment time has expired. Your answers have been submitted automatically.');
    submitExam(true);
  };

  const submitExam = async (force = false) => {
    if (finishedRef.current || submittingRef.current) return;

    // Explicitly ensure the 10th (last) question answer is saved before grading
    const currentQ = questions[currentIndex];
    if (currentQ) {
      const qId = currentQ.id;
      const curOpt = answers[qId];
      if (curOpt && assessmentId) {
        try {
          await saveAnswer({
            assessmentId,
            questionId: qId,
            selectedOption: curOpt,
            timeSpent: 0,
          }).unwrap();
        } catch (e) {
          console.warn('Final question answer save fallback failed:', e);
        }
      }
    }

    if (!force) {
      const unanswered = questions.length - Object.keys(answers).length;
      if (unanswered > 0) {
        const confirm = window.confirm(`You have ${unanswered} unanswered questions. Are you sure you want to submit?`);
        if (!confirm) return;
      }
    }

    setSubmitting(true);
    try {
      const data = await submitAssessment({ assessmentId: assessmentId! }).unwrap();
      setResults(data);
      setFinished(true);
      toast.success('Assessment submitted successfully.');
    } catch (err: any) {
      toast.error('Failed to submit assessment');
      setErrorMsg(err.data?.error || err.error || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <BrainCircuit className="w-16 h-16 text-primary animate-pulse" />
          <h2 className="text-xl font-bold text-muted-foreground">Configuring adaptive AI questionnaire...</h2>
          <Progress value={66} className="w-64" />
        </div>
      </div>
    );
  }

  if (errorMsg && !finished) {
    return (
      <div className="min-h-screen p-8 bg-background">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
          <Button className="mt-4 font-bold" onClick={() => navigate('/candidate-dashboard')}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Candidate Completion Screen (Exclusive clean view: NO Score/Pass-Fail banner)
  if (finished) {
    return (
      <div className="min-h-screen h-screen bg-background flex items-center justify-center p-4 overflow-hidden">
        <div className="w-full max-w-2xl">
          <Card className="relative overflow-hidden border-none shadow-2xl p-8 text-center bg-card">
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px] opacity-20 pointer-events-none bg-primary" />

            <div className="py-8 px-6 text-center border-b relative z-10 shrink-0 mb-6">
              <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4 animate-bounce" />
              <h1 className="text-3xl font-black tracking-tight mb-3">Test Completed Successfully</h1>
              <p className="text-base md:text-lg text-muted-foreground font-semibold max-w-md mx-auto leading-relaxed">
                Thank you for completing the test. HR will get back to you as soon as possible.
              </p>
            </div>

            <CardContent className="p-4 relative z-10 text-center">
              <p className="text-sm text-muted-foreground mb-8">
                Your assessment responses have been recorded and sent to the recruitment team for review.
              </p>
              <Button size="lg" onClick={() => navigate('/candidate-dashboard')} className="font-bold px-8 shadow-md">
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const selectedOption = answers[currentQuestion?.id] || '';
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;
  const isLogicalQuestion = !!(currentQuestion?.isLogical || currentQuestion?.requiresWhiteboard);

  const rawOptions: string[] = typeof currentQuestion?.options === 'string' 
    ? JSON.parse(currentQuestion.options) 
    : currentQuestion?.options || [];

  return (
    <div className="min-h-screen bg-background text-foreground pb-16 relative font-sans">
      {/* Top Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border mb-8">
        <Progress value={progressPercent} className="h-1 rounded-none bg-muted" />
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center max-w-4xl gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-primary/10 text-primary p-2 sm:p-2.5 rounded-xl border border-primary/20 shrink-0">
              <BrainCircuit className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm sm:text-lg text-foreground leading-tight">AI Assessment</h1>
              <p className="text-[10px] sm:text-xs font-bold text-muted-foreground">Q {currentIndex + 1} of {questions.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Logical Question Dedicated Timer */}
            {isLogicalQuestion && (
              <div className="flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-600 font-mono font-bold text-[10px] sm:text-xs md:text-sm">
                <Timer className="w-3.5 h-3.5 mr-1 text-purple-600 animate-pulse" />
                <span className="hidden sm:inline">Logical: </span>{formatTime(logicalTimer)}
              </div>
            )}

            {/* General Assessment Timer */}
            <div className="flex items-center px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-border bg-muted/40 text-foreground font-mono font-bold text-xs sm:text-sm md:text-base shadow-xs">
              <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-primary" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>


      {/* Main Question Body */}
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="grid grid-cols-1 gap-6">
          <Card className="border shadow-sm p-6 md:p-8">
            <div className="mb-6 flex items-center gap-2 flex-wrap">
              <Badge variant="default" className="bg-primary text-primary-foreground font-bold text-[11px] tracking-wide border-none uppercase px-3 py-1">
                {currentQuestion?.skill}
              </Badge>
              <Badge variant="outline" className="border-border text-muted-foreground font-medium text-[11px] tracking-wide bg-transparent px-3 py-1">
                Lvl: {currentQuestion?.difficulty}
              </Badge>

              {/* Logical Question Badge / Tab (Shown ONLY when isLogical is true) */}
              {isLogicalQuestion && (
                <Badge className="bg-purple-600 text-white font-bold text-[11px] uppercase tracking-wide border-none px-3 py-1 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" /> Logical Problem Solving
                </Badge>
              )}
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-8 leading-snug">
              {currentQuestion?.questionText}
            </h2>

            {/* Options List */}
            <div className="space-y-3.5 mb-8">
              {rawOptions.map((option, index) => {
                const isSelected = selectedOption.trim() === option.trim();
                return (
                  <div
                    key={index}
                    onClick={() => handleSelectOption(option)}
                    className={`
                      py-4 px-6 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center select-none
                      ${isSelected 
                        ? 'border-primary bg-primary/10 shadow-md ring-2 ring-primary/20 font-bold text-foreground' 
                        : 'border-border/80 hover:border-primary/50 bg-card hover:bg-muted/20 text-foreground'}
                    `}
                  >
                    <div className={`
                      w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center shrink-0 transition-colors
                      ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40 bg-background'}
                    `}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm md:text-base font-medium">
                      {option}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Interactive Whiteboard Canvas & Solution Workspace (Shown ONLY for Logical Questions) */}
            {isLogicalQuestion && (
              <Whiteboard
                initialText={whiteboardData[currentQuestion.id]?.explanationText || ''}
                initialDrawing={whiteboardData[currentQuestion.id]?.drawingDataUrl}
                onChange={handleWhiteboardChange}
              />
            )}

            <div className="border-t border-border my-6" />

            {/* Navigation Footer (Previous & Confirm/Next/Submit) */}
            <div className="flex justify-between items-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="font-bold rounded-xl px-6 gap-2 text-sm border-border hover:bg-muted/50"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </Button>

              {currentIndex === questions.length - 1 ? (
                <Button
                  size="lg"
                  onClick={() => submitExam()}
                  disabled={submitting}
                  className="font-bold rounded-xl px-8 bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 text-sm shadow-md"
                >
                  {submitting ? 'Evaluating...' : 'Submit Assessment'} <CheckCircle2 className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  disabled={!selectedOption}
                  className="font-bold rounded-xl px-8 bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 text-sm shadow-md disabled:opacity-50"
                >
                  Confirm & Next <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default AssessmentPage;
