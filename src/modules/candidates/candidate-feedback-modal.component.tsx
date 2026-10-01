import { Button } from '@/components/ui/Button/index.js';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Modal/index.js';
import { Progress } from '@/components/ui/Loader/index.js';
import { Sparkles } from 'lucide-react';

interface CandidateFeedbackModalProps {
  feedbackApp: any;
  onClose: () => void;
  loadingFeedback: boolean;
  rejectionFeedback: string;
}

export function CandidateFeedbackModal({
  feedbackApp,
  onClose,
  loadingFeedback,
  rejectionFeedback,
}: CandidateFeedbackModalProps) {
  const renderRejectionFeedback = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return (
      <div className="space-y-4 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('## ') || trimmed.startsWith('##')) {
            const title = trimmed.replace(/^##\s*/, '');
            return <h3 key={idx} className="text-base font-bold text-foreground mt-6 border-b pb-2">{title}</h3>;
          }
          if (trimmed.startsWith('# ') || trimmed.startsWith('#')) {
            const title = trimmed.replace(/^#\s*/, '');
            return <h2 key={idx} className="text-lg font-black text-primary mt-6">{title}</h2>;
          }
          if (trimmed.startsWith('1. ') || trimmed.startsWith('2. ') || trimmed.startsWith('3. ') || trimmed.startsWith('4. ')) {
            const content = trimmed.replace(/^\d+\.\s*/, '');
            return <h3 key={idx} className="text-base font-bold text-foreground mt-6 border-b pb-2">{content}</h3>;
          }
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const bullet = trimmed.replace(/^[-*]\s*/, '');
            const parts = bullet.split('->');
            if (parts.length === 2) {
              return (
                <div key={idx} className="flex flex-col gap-1 ml-2 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-primary shrink-0">•</span>
                    <span className="text-sm font-bold text-foreground">{parts[0].trim()}</span>
                  </div>
                  <div className="pl-4">
                    <span className="text-sm text-muted-foreground font-normal">{parts[1].trim()}</span>
                  </div>
                </div>
              );
            }
            return (
              <div key={idx} className="flex items-start gap-2 ml-2 py-1">
                <span className="text-primary mt-1 shrink-0">•</span>
                <span className="text-muted-foreground">{bullet}</span>
              </div>
            );
          }
          if (trimmed === '') {
            return null;
          }
          return <p key={idx} className="text-muted-foreground">{trimmed}</p>;
        })}
      </div>
    );
  };

  return (
    <Dialog open={!!feedbackApp} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Career Feedback & Guidance
          </DialogTitle>
          <DialogDescription className="font-semibold text-muted-foreground">
            Personalized evaluation report for your application to <span className="text-foreground font-bold">{feedbackApp?.job?.title}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loadingFeedback ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Progress value={50} className="w-64 animate-pulse" />
              <p className="text-sm font-bold text-muted-foreground">Analyzing application & generating feedback report...</p>
            </div>
          ) : (
            <div className="bg-muted/20 border rounded-xl p-6">
              {renderRejectionFeedback(rejectionFeedback)}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="font-bold">
            Close Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CandidateFeedbackModal;
