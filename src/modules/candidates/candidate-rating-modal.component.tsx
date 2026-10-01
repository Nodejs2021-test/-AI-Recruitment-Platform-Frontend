import { Button } from '@/components/ui/Button/index.js';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Modal/index.js';
import { Input } from '@/components/ui/Input/index.js';
import { Badge } from '@/components/ui/Badge/index.js';
import { Sparkles, Plus, Star, Trash2 } from 'lucide-react';

interface CandidateRatingModalProps {
  ratingApp: any;
  onClose: () => void;
  ratings: Record<string, number>;
  newSkill: string;
  onNewSkillChange: (val: string) => void;
  onAddSkill: () => void;
  onRatingChange: (skill: string, value: number) => void;
  onRemoveSkill: (skill: string) => void;
  onSaveRatings: () => void;
  isPending: boolean;
}

const StarRating = ({ value, onChange }: { value: number; onChange: (rating: number) => void }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none transition-transform active:scale-95 cursor-pointer"
        >
          <Star 
            className={`w-6 h-6 transition-colors ${
              star <= value 
                ? 'text-yellow-500 fill-yellow-500' 
                : 'text-muted-foreground/30 hover:text-yellow-500/50'
            }`} 
          />
        </button>
      ))}
    </div>
  );
};

export function CandidateRatingModal({
  ratingApp,
  onClose,
  ratings,
  newSkill,
  onNewSkillChange,
  onAddSkill,
  onRatingChange,
  onRemoveSkill,
  onSaveRatings,
  isPending,
}: CandidateRatingModalProps) {
  return (
    <Dialog open={!!ratingApp} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-card border border-border shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" /> Calibrate Your Assessment
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-medium">
            We extracted these skills from your uploaded CV. Please rate your proficiency for each (1 to 5 stars) to calibrate the difficulty of your adaptive AI test.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          <div className="flex gap-2">
            <Input
              placeholder="Add custom skill (e.g. Docker, TypeScript...)"
              value={newSkill}
              onChange={(e) => onNewSkillChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onAddSkill()}
              className="rounded-xl border-muted-foreground/20 focus-visible:ring-primary"
            />
            <Button onClick={onAddSkill} type="button" className="rounded-xl bg-primary text-white font-bold flex items-center gap-1.5 px-4">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>

          {Object.keys(ratings).length > 0 ? (
            <div className="grid grid-cols-1 gap-4 max-h-[350px] overflow-y-auto pr-2">
              {Object.keys(ratings).map((skill) => {
                const rating = ratings[skill];
                return (
                  <div key={skill} className="bg-muted/20 p-4 rounded-xl border border-border/80 shadow-sm flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-sm block truncate text-foreground mb-1.5">{skill}</span>
                      <StarRating value={rating} onChange={(val) => onRatingChange(skill, val)} />
                    </div>
                    <div className="flex items-center gap-3">
                      {rating > 0 && (
                        <Badge variant="outline" className={`font-black uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-full border ${
                          rating <= 2 ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                          rating <= 4 ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                          'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          {rating <= 2 ? 'Easy' : rating <= 4 ? 'Medium' : 'Hard'}
                        </Badge>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0" 
                        onClick={() => onRemoveSkill(skill)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border/80">
              <p className="font-bold text-sm">No skills listed yet.</p>
              <p className="text-xs text-muted-foreground/80 mt-1">Upload a CV or manually add custom skills above.</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 border-t pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isPending} className="rounded-xl font-bold">
            Cancel
          </Button>
          <Button 
            onClick={onSaveRatings} 
            disabled={isPending || !Object.values(ratings).some(r => r > 0)} 
            className="font-bold rounded-xl px-6 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
          >
            {isPending ? (
              <><Sparkles className="w-4 h-4 mr-2 animate-spin" /> Calibrating...</>
            ) : (
              'Start Assessment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CandidateRatingModal;
