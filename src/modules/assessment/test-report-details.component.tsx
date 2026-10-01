import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card/index.js';
import { Badge } from '@/components/ui/Badge/index.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs/index.js';
import { Button } from '@/components/ui/Button/index.js';
import {
  CheckCircle2, XCircle, HelpCircle, Check, X,
  ShieldAlert, Lightbulb, TrendingUp, BrainCircuit, Filter,
  ArrowLeft, ArrowRight
} from 'lucide-react';

interface TestReportDetailsProps {
  report: any;
}

export function TestReportDetails({ report = {} }: TestReportDetailsProps) {
  const summary = report?.summary || {
    passFailStatus: (report?.finalScore ?? 0) >= 50 ? 'QUALIFIED' : 'DISQUALIFIED',
    testDate: report?.createdAt || new Date().toISOString(),
    score: report?.finalScore ?? 0,
    timeTaken: '15 mins',
  };

  const stats = report?.stats || {
    totalQuestions: report?.totalQuestions || report?.questions?.length || 0,
    correctAnswers: report?.correctCount || 0,
    incorrectAnswers: report?.incorrectCount || 0,
    unansweredQuestions: report?.unansweredCount || 0,
    marksObtained: report?.marksObtained || 0,
    accuracyPercentage: report?.accuracyPercentage || 0,
  };

  const job = report?.job || {
    title: report?.jobTitle || 'Role Assessment',
  };

  const candidate = report?.candidate || {
    name: report?.candidateName || 'Candidate',
    email: report?.candidateEmail || '',
  };

  const aiSkillAnalysis = report?.aiSkillAnalysis || {
    strengths: report?.strengths || [],
    areasForImprovement: report?.areasForImprovement || [],
    detailedFeedback: report?.detailedFeedback || '',
  };

  const questions = report?.questions || [];

  const isQualified = summary.passFailStatus === 'QUALIFIED';
  const [questionFilter, setQuestionFilter] = useState<'all' | 'correct' | 'incorrect' | 'unanswered'>('all');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  const filteredQuestions = questions.filter((q: any) => {
    if (questionFilter === 'correct') return q.isCorrect;
    if (questionFilter === 'incorrect') return !q.isCorrect && !q.isUnanswered;
    if (questionFilter === 'unanswered') return q.isUnanswered;
    return true;
  });

  // Ensure active index is within bounds of filtered questions
  const safeActiveIndex = Math.min(activeQuestionIndex, Math.max(0, filteredQuestions.length - 1));
  const currentQuestion = filteredQuestions[safeActiveIndex];

  return (
    <div className="space-y-5 font-sans">
      {/* 1. Compact Header Bar (Pinned Top Summary) */}
      <Card className="overflow-hidden shadow-xs border-border/60">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <h2 className="text-xl font-black tracking-tight text-foreground">{job.title}</h2>
              <p className="text-xs text-muted-foreground font-medium">
                {candidate.name} • {candidate.email} • Tested on{' '}
                {new Date(summary.testDate).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                className={`font-black uppercase tracking-wider text-xs px-3 py-1 ${
                  isQualified
                    ? 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30'
                    : 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'
                }`}
              >
                {isQualified ? (
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 mr-1 inline" />
                )}
                {summary.passFailStatus}
              </Badge>

              <div className="text-right">
                <span className="text-2xl font-black text-primary leading-none block">
                  {summary.score}%
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {summary.timeTaken}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Key Metrics Overview (6 Compact Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <MetricCard label="Total Questions" value={stats.totalQuestions} />
        <MetricCard label="Correct" value={stats.correctAnswers} variant="green" />
        <MetricCard label="Incorrect" value={stats.incorrectAnswers} variant="red" />
        <MetricCard label="Unanswered" value={stats.unansweredQuestions} variant="amber" />
        <MetricCard label="Marks" value={`${stats.marksObtained}/100`} />
        <MetricCard label="Accuracy" value={`${stats.accuracyPercentage}%`} variant="primary" />
      </div>

      {/* 3. Sub-Tabs Navigation (Zero Long Scrolling) */}
      <Tabs defaultValue="questions" className="w-full">
        <TabsList className="grid grid-cols-2 w-full bg-muted/30 p-1 rounded-xl">
          <TabsTrigger value="questions" className="font-bold text-xs py-2 gap-1.5">
            <HelpCircle className="w-4 h-4 text-primary" /> Question Review ({questions.length})
          </TabsTrigger>
          <TabsTrigger value="skills" className="font-bold text-xs py-2 gap-1.5">
            <BrainCircuit className="w-4 h-4 text-primary" /> AI Skill Matrix
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Question Review with Single Question Pagination */}
        <TabsContent value="questions" className="space-y-4 pt-3 mt-0">
          {/* Quick Filter & Question Quick-Jump Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/20 p-2.5 rounded-xl border border-border/40 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-muted-foreground flex items-center gap-1.5 pl-1">
                <Filter className="w-3.5 h-3.5 text-primary" /> Filter:
              </span>
              <Button
                variant={questionFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setQuestionFilter('all'); setActiveQuestionIndex(0); }}
                className="h-7 text-xs font-bold px-2.5"
              >
                All ({questions.length})
              </Button>
              <Button
                variant={questionFilter === 'correct' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setQuestionFilter('correct'); setActiveQuestionIndex(0); }}
                className="h-7 text-xs font-bold px-2.5 text-green-600 border-green-500/30 hover:bg-green-500/10"
              >
                Correct ({stats.correctAnswers})
              </Button>
              <Button
                variant={questionFilter === 'incorrect' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setQuestionFilter('incorrect'); setActiveQuestionIndex(0); }}
                className="h-7 text-xs font-bold px-2.5 text-red-600 border-red-500/30 hover:bg-red-500/10"
              >
                Incorrect ({stats.incorrectAnswers})
              </Button>
              {stats.unansweredQuestions > 0 && (
                <Button
                  variant={questionFilter === 'unanswered' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setQuestionFilter('unanswered'); setActiveQuestionIndex(0); }}
                  className="h-7 text-xs font-bold px-2.5 text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                >
                  Unanswered ({stats.unansweredQuestions})
                </Button>
              )}
            </div>

            {/* Quick-Jump Pills */}
            <div className="flex items-center gap-1 flex-wrap">
              {filteredQuestions.map((q: any, idx: number) => {
                const origIndex = questions.findIndex((orig: any) => orig.id === q.id) + 1;
                const isActive = idx === safeActiveIndex;

                let pillColor = 'border-border/60 text-muted-foreground';
                if (isActive) {
                  pillColor = 'bg-primary text-primary-foreground font-black border-primary shadow-xs';
                } else if (q.isCorrect) {
                  pillColor = 'bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20';
                } else if (q.isUnanswered) {
                  pillColor = 'bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20';
                } else {
                  pillColor = 'bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20';
                }

                return (
                  <button
                    key={q.id || idx}
                    onClick={() => setActiveQuestionIndex(idx)}
                    className={`h-7 px-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${pillColor}`}
                  >
                    Q{origIndex}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Single Question Display (Zero Scroll) */}
          {!currentQuestion ? (
            <div className="py-8 text-center text-xs font-semibold text-muted-foreground bg-muted/10 rounded-xl border">
              No questions found matching the selected filter.
            </div>
          ) : (
            <Card className="overflow-hidden shadow-xs border">
              <CardContent className="p-4 sm:p-5 space-y-4">
                {/* Question Header */}
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-muted-foreground">
                        Question {safeActiveIndex + 1} of {filteredQuestions.length}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold px-2 py-0.5"
                      >
                        {currentQuestion.skill}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-medium text-muted-foreground px-2 py-0.5"
                      >
                        Lvl: {currentQuestion.difficulty}
                      </Badge>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-foreground leading-snug">
                      {currentQuestion.questionText}
                    </p>
                  </div>

                  <Badge
                    className={`font-bold uppercase tracking-wider text-[10px] shrink-0 ${
                      currentQuestion.isCorrect
                        ? 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30'
                        : currentQuestion.isUnanswered
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'
                    }`}
                  >
                    {currentQuestion.isCorrect ? 'Correct' : currentQuestion.isUnanswered ? 'Unanswered' : 'Incorrect'}
                  </Badge>
                </div>

                {/* All 4 Options (Test Screen Layout) */}
                <div className="space-y-2">
                  {(typeof currentQuestion.options === 'string'
                    ? JSON.parse(currentQuestion.options)
                    : currentQuestion.options || []
                  ).map((option: string, optIdx: number) => {
                    const isCorrectOption =
                      option.trim().toLowerCase() === currentQuestion.correctAnswer?.trim().toLowerCase();
                    const isSelectedOption =
                      option.trim().toLowerCase() === currentQuestion.selectedAnswer?.trim().toLowerCase();
                    const isWrongSelection = isSelectedOption && !isCorrectOption;

                    let borderClass = 'border-border/60';
                    let bgClass = 'bg-transparent';
                    let textClass = 'text-foreground';

                    if (isCorrectOption) {
                      borderClass = 'border-green-500/60';
                      bgClass = 'bg-green-500/5';
                      textClass = 'text-green-700 dark:text-green-400 font-bold';
                    } else if (isWrongSelection) {
                      borderClass = 'border-red-500/60';
                      bgClass = 'bg-red-500/5';
                      textClass = 'text-red-700 dark:text-red-400 font-bold';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`py-2.5 px-3.5 rounded-xl border transition-all flex items-center ${borderClass} ${bgClass}`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center shrink-0 ${
                            isCorrectOption
                              ? 'border-green-500 bg-green-500'
                              : isWrongSelection
                              ? 'border-red-500 bg-red-500'
                              : isSelectedOption
                              ? 'border-muted-foreground bg-muted-foreground'
                              : 'border-muted-foreground/40'
                          }`}
                        >
                          {isCorrectOption && (
                            <Check className="w-2.5 h-2.5 text-white" />
                          )}
                          {isWrongSelection && (
                            <X className="w-2.5 h-2.5 text-white" />
                          )}
                        </div>

                        <span className={`text-xs sm:text-sm font-medium flex-1 ${textClass}`}>
                          {option}
                        </span>

                        {isCorrectOption && (
                          <span className="text-[10px] font-extrabold text-green-600 dark:text-green-400 ml-2">
                            Correct Answer
                          </span>
                        )}
                        {isWrongSelection && (
                          <span className="text-[10px] font-extrabold text-red-600 dark:text-red-400 ml-2">
                            Your Answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {currentQuestion.explanation && (
                  <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 text-xs space-y-1">
                    <span className="font-extrabold text-primary flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5" /> Explanation
                    </span>
                    <p className="text-muted-foreground leading-relaxed font-medium">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                )}

                {/* Card Footer Step Navigation Controls */}
                <div className="flex justify-between items-center pt-3 border-t border-border/60">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveQuestionIndex(prev => Math.max(0, prev - 1))}
                    disabled={safeActiveIndex === 0}
                    className="font-bold text-xs gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Previous Question
                  </Button>

                  <span className="text-xs font-semibold text-muted-foreground">
                    {safeActiveIndex + 1} / {filteredQuestions.length}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveQuestionIndex(prev => Math.min(filteredQuestions.length - 1, prev + 1))}
                    disabled={safeActiveIndex === filteredQuestions.length - 1}
                    className="font-bold text-xs gap-1.5"
                  >
                    Next Question <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 2: AI Skill Matrix (Zero Skill Table) */}
        <TabsContent value="skills" className="space-y-4 pt-3 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="p-4 sm:p-5 space-y-3">
                <h4 className="text-sm font-bold text-green-700 dark:text-green-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Technical Strengths
                </h4>
                <ul className="space-y-1.5 text-xs sm:text-sm">
                  {aiSkillAnalysis?.strengths?.length > 0 ? (
                    aiSkillAnalysis.strengths.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 font-medium text-foreground">
                        <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-muted-foreground">General technical competency displayed.</li>
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-red-500/5 border-red-500/20">
              <CardContent className="p-4 sm:p-5 space-y-3">
                <h4 className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Areas for Improvement
                </h4>
                <ul className="space-y-1.5 text-xs sm:text-sm">
                  {aiSkillAnalysis?.areasForImprovement?.length > 0 ? (
                    aiSkillAnalysis.areasForImprovement.map((w: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 font-medium text-foreground">
                        <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <span>{w}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-muted-foreground">No critical weakness identified.</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Metric Card Helper ─────────────────────────────────────── */

function MetricCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: string | number;
  variant?: 'green' | 'red' | 'amber' | 'primary';
}) {
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    green: {
      bg: 'bg-green-500/5',
      border: 'border-green-500/20',
      text: 'text-green-600 dark:text-green-400',
    },
    red: {
      bg: 'bg-red-500/5',
      border: 'border-red-500/20',
      text: 'text-red-600 dark:text-red-400',
    },
    amber: {
      bg: 'bg-amber-500/5',
      border: 'border-amber-500/20',
      text: 'text-amber-600 dark:text-amber-400',
    },
    primary: {
      bg: 'bg-primary/5',
      border: 'border-primary/20',
      text: 'text-primary',
    },
  };

  const colors = variant ? colorMap[variant] : { bg: 'bg-muted/20', border: 'border-border/40', text: 'text-foreground' };

  return (
    <Card className={`${colors.bg} ${colors.border}`}>
      <CardContent className="p-2 text-center">
        <span className={`text-[9px] font-extrabold uppercase tracking-wider block ${variant ? colors.text : 'text-muted-foreground'}`}>
          {label}
        </span>
        <span className={`text-base sm:text-lg font-black mt-0.5 block ${colors.text}`}>{value}</span>
      </CardContent>
    </Card>
  );
}

export default TestReportDetails;
