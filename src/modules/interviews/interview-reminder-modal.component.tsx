import { Button } from '@/components/ui/Button/index.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Modal/index.js';
import { Input } from '@/components/ui/Input/index.js';
import { Label } from '@/components/ui/Label/index.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select/index.js';
import { Badge } from '@/components/ui/Badge/index.js';
import { CalendarDays, Mail, Info } from 'lucide-react';

interface InterviewReminderModalProps {
  isDetailsModalOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedInterview: any;
  reminderForm: any;
  setReminderForm: (form: any) => void;
  onSendReminder: () => void;
  isSendingReminder: boolean;
  reminderLogs: any[];
}

export function InterviewReminderModal({
  isDetailsModalOpen,
  onOpenChange,
  selectedInterview,
  reminderForm,
  setReminderForm,
  onSendReminder,
  isSendingReminder,
  reminderLogs,
}: InterviewReminderModalProps) {
  return (
    <Dialog open={isDetailsModalOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" /> Interview Details & Reminder Logs
          </DialogTitle>
        </DialogHeader>

        {selectedInterview && (
          <div className="space-y-6 py-2">
            <div className="bg-muted/30 p-4 rounded-xl border space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-base">{selectedInterview.application?.candidate?.user?.fullName}</h3>
                  <p className="text-xs text-muted-foreground">{selectedInterview.application?.candidate?.user?.email}</p>
                </div>
                <Badge className={`
                  font-bold
                  ${selectedInterview.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                    selectedInterview.status === 'IN_PROGRESS' ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20 animate-pulse' : 
                    selectedInterview.status === 'NOT_ATTENDED' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                    selectedInterview.status === 'CANCELLED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'}
                `} variant="outline">
                  {selectedInterview.status === 'SCHEDULED' ? 'Scheduled' :
                   selectedInterview.status === 'IN_PROGRESS' ? 'In Progress' :
                   selectedInterview.status === 'COMPLETED' ? 'Completed' :
                   selectedInterview.status === 'NOT_ATTENDED' ? 'Not Attended' :
                   selectedInterview.status === 'CANCELLED' ? 'Cancelled' : selectedInterview.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t text-muted-foreground">
                <div><span className="font-bold text-foreground">Date:</span> {new Date(selectedInterview.date).toLocaleDateString()}</div>
                <div><span className="font-bold text-foreground">Time Slot:</span> {selectedInterview.timeSlot}</div>
                <div><span className="font-bold text-foreground">Interviewer:</span> {selectedInterview.interviewerName || 'Assigned HR'}</div>
                <div><span className="font-bold text-foreground">Round:</span> {selectedInterview.interviewRound || 'Technical Interview'}</div>
              </div>
            </div>

            {/* Send Reminder Form */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" /> Send Automated Reminder
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Interview Date</Label>
                  <Input 
                    type="date" 
                    value={reminderForm.date} 
                    onChange={(e) => setReminderForm({ ...reminderForm, date: e.target.value })} 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Time Slot</Label>
                  <Input 
                    value={reminderForm.timeSlot} 
                    onChange={(e) => setReminderForm({ ...reminderForm, timeSlot: e.target.value })} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Interview Round</Label>
                  <Input 
                    value={reminderForm.interviewRound} 
                    onChange={(e) => setReminderForm({ ...reminderForm, interviewRound: e.target.value })} 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Mode</Label>
                  <Select value={reminderForm.interviewMode} onValueChange={(val) => setReminderForm({ ...reminderForm, interviewMode: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Online">Online</SelectItem>
                      <SelectItem value="Offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Location / Meeting Link</Label>
                <Input 
                  value={reminderForm.location} 
                  onChange={(e) => setReminderForm({ ...reminderForm, location: e.target.value })} 
                  placeholder="https://meet.google.com/..."
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Custom Instructions</Label>
                <textarea 
                  value={reminderForm.customMessage} 
                  onChange={(e) => setReminderForm({ ...reminderForm, customMessage: e.target.value })} 
                  rows={3}
                  className="w-full p-2.5 rounded-md border border-input bg-background text-xs"
                />
              </div>

              <Button 
                onClick={onSendReminder} 
                disabled={isSendingReminder}
                className="w-full font-bold"
              >
                {isSendingReminder ? 'Sending Reminder...' : 'Dispatch Email Reminder'}
              </Button>
            </div>

            {/* Log Audit History */}
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" /> Reminder Activity Log
              </h4>
              {reminderLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No reminder emails dispatched yet.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {reminderLogs.map((log: any) => (
                    <div key={log.id} className="p-2.5 rounded-lg border bg-muted/20 text-xs flex justify-between items-center">
                      <div>
                        <p className="font-bold">{log.subject}</p>
                        <p className="text-muted-foreground text-[10px]">{new Date(log.sentAt).toLocaleString()}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {log.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default InterviewReminderModal;
