import { Button } from '@/components/ui/Button/index.js';
import { Card, CardContent } from '@/components/ui/Card/index.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs/index.js';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar/index.js';
import { Badge } from '@/components/ui/Badge/index.js';
import { Progress } from '@/components/ui/Loader/index.js';
import { 
  Mail, Phone, Edit, KeyRound, FileText, Upload, Sparkles, Loader2, Briefcase, Trash2, AlertCircle
} from 'lucide-react';
import { BACKEND_URL } from '@/app/providers/AuthProvider.js';

interface CandidateProfileCardProps {
  user: any;
  profile: any;
  profileLoading: boolean;
  onEditProfile: () => void;
  onChangePassword: () => void;
  onReplaceResume: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isReplacingCv: boolean;
  onUpgradeProfile: () => void;
  isUpgradingProfile: boolean;
  onDeleteAccount: () => void;
  expandedCategories: Record<string, boolean>;
  onToggleCategory: (category: string) => void;
  categorizeSkills: (skillRatings: any[]) => Record<string, any[]>;
}

export function CandidateProfileCard({
  user,
  profile,
  profileLoading,
  onEditProfile,
  onChangePassword,
  onReplaceResume,
  isReplacingCv,
  onUpgradeProfile,
  isUpgradingProfile,
  onDeleteAccount,
  expandedCategories,
  onToggleCategory,
  categorizeSkills,
}: CandidateProfileCardProps) {
  if (profileLoading) {
    return <Progress value={66} className="h-1.5" />;
  }

  if (!profile) return null;

  return (
    <Card className="overflow-hidden shadow-xl border-t-4 border-t-primary">
      <CardContent className="p-4 sm:p-6">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="profile" className="text-xs font-bold py-2">Profile</TabsTrigger>
            <TabsTrigger value="experience" className="text-xs font-bold py-2">Experience</TabsTrigger>
            <TabsTrigger value="skills" className="text-xs font-bold py-2">Skills</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="text-center">
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 border-2 border-primary/20 shadow-md">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl sm:text-3xl font-black">
                  {user?.fullName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">{user?.fullName}</h3>

              <div className="flex flex-col gap-2 mt-4 max-w-xs mx-auto">
                <div className="flex items-center gap-3 text-muted-foreground text-xs sm:text-sm font-medium bg-muted/30 px-3 py-2 rounded-lg border border-border/40 min-w-0">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground text-xs sm:text-sm font-medium bg-muted/30 px-3 py-2 rounded-lg border border-border/40 min-w-0">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <span className="truncate">{user?.phoneNumber || 'No phone number'}</span>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-6 pb-6 border-b border-border/40 max-w-xs mx-auto">
                <Button variant="outline" size="sm" onClick={onEditProfile} className="font-bold gap-1.5 hover:bg-muted/50 text-xs">
                  <Edit className="w-3.5 h-3.5" /> Edit Profile
                </Button>
                <Button variant="outline" size="sm" onClick={onChangePassword} className="font-bold gap-1.5 hover:bg-muted/50 text-xs">
                  <KeyRound className="w-3.5 h-3.5" /> Password
                </Button>
              </div>


              {/* Stored Resume File */}
              <div className="mt-6 max-w-xs mx-auto text-left space-y-3 pb-6 border-b border-border/40">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> Stored CV / Resume
                </h4>
                {profile?.resumes && profile.resumes.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-emerald-500/5 px-3 py-2 rounded-lg border border-emerald-500/20">
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[150px]">
                        {profile.resumes[0].fileName}
                      </span>
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">Active</Badge>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full font-bold text-xs gap-1.5"
                        onClick={() => {
                          const resume = profile.resumes[0];
                          if (resume.filePath.startsWith('http')) {
                            window.open(resume.filePath, '_blank');
                          } else {
                            window.open(`${BACKEND_URL}/uploads/${resume.filePath.replace(/\\/g, '/').split('/').pop()}`, '_blank');
                          }
                        }}
                      >
                        <FileText className="w-3.5 h-3.5" /> View CV File
                      </Button>
                      <input 
                        type="file" 
                        accept=".pdf,.doc,.docx" 
                        id="cv-replace-input" 
                        className="hidden" 
                        onChange={onReplaceResume} 
                        disabled={isReplacingCv}
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full font-bold text-xs gap-1.5"
                        disabled={isReplacingCv}
                        onClick={() => document.getElementById('cv-replace-input')?.click()}
                      >
                        {isReplacingCv ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" /> Replace CV File
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">No stored CV found.</p>
                    <input 
                      type="file" 
                      accept=".pdf,.doc,.docx" 
                      id="cv-upload-input" 
                      className="hidden" 
                      onChange={onReplaceResume} 
                      disabled={isReplacingCv}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full font-bold text-xs gap-1.5"
                      disabled={isReplacingCv}
                      onClick={() => document.getElementById('cv-upload-input')?.click()}
                    >
                      {isReplacingCv ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" /> Upload CV File
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Membership Status & Upgrade Option */}
              <div className="mt-4 max-w-xs mx-auto text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Membership Type</span>
                  <Badge className={profile.membershipType === 'Premium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 font-bold' : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20 font-bold'}>
                    {profile.membershipType}
                  </Badge>
                </div>
                {profile.membershipType !== 'Premium' && (
                  <Button 
                    size="sm" 
                    onClick={onUpgradeProfile} 
                    disabled={isUpgradingProfile}
                    className="w-full text-xs font-bold bg-yellow-500 hover:bg-yellow-600 text-zinc-950 gap-1 mt-1 shadow-md"
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    <span>{isUpgradingProfile ? 'Upgrading...' : 'Upgrade to Premium'}</span>
                  </Button>
                )}
              </div>

              {/* Permanent Account Deletion */}
              <div className="mt-6 pt-6 border-t border-border/40 max-w-xs mx-auto text-left space-y-3">
                <h4 className="text-xs font-bold text-destructive uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Danger Zone
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDeleteAccount}
                  className="w-full font-bold text-xs gap-1.5 border-destructive/30 hover:border-destructive hover:bg-destructive/10 text-destructive transition-all duration-300 hover:shadow-md hover:shadow-destructive/5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Account Permanently
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="experience" className="space-y-6">
            <div className="space-y-5">
              <div className="bg-muted/30 p-4 rounded-xl border border-border/40 space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-primary" /> AI Resume Insights
                </h4>

                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-background p-3 rounded-lg border border-border/20">
                    <span className="text-sm font-medium text-muted-foreground">Extracted Experience</span>
                    <span className="font-bold text-foreground">{profile.experienceYears || 0} Years</span>
                  </div>
                  <div className="flex justify-between items-center bg-background p-3 rounded-lg border border-border/20">
                    <span className="text-sm font-medium text-muted-foreground">Best Role Match</span>
                    <span className="font-bold text-primary">{profile.roleMatch || 'Pending'}</span>
                  </div>
                  <div className="bg-background p-3 rounded-lg border border-border/20 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">AI Confidence Score</span>
                      <span className="font-bold text-foreground">{profile.confidence || 0}%</span>
                    </div>
                    <Progress value={profile.confidence || 0} className="h-2 bg-muted/60" />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="skills" className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> Skill Ratings Matrix
                </h4>
              </div>

              {profile.skillRatings?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border/60">
                  <p className="text-sm">No skills rated yet.</p>
                  <p className="text-xs mt-1">Ratings will be generated upon application submission.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {Object.entries(categorizeSkills(profile.skillRatings)).map(([catName, skills]) => {
                    const limit = 4;
                    const isExpanded = expandedCategories[catName];
                    const visibleSkills = isExpanded ? skills : skills.slice(0, limit);

                    return (
                      <div key={catName} className="space-y-2 bg-muted/20 p-3 rounded-xl border border-border/30">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{catName}</span>
                          <span className="text-[10px] font-medium text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                            {skills.length} {skills.length === 1 ? 'skill' : 'skills'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                          {visibleSkills.map((sr: any) => {
                            const displayRating = sr.rating <= 5 ? sr.rating * 2 : sr.rating;
                            return (
                              <Badge
                                key={sr.id}
                                variant="outline"
                                className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all duration-300 hover:scale-105 ${displayRating >= 8
                                  ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 shadow-sm shadow-green-500/5'
                                  : displayRating >= 5
                                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 shadow-sm shadow-amber-500/5'
                                    : 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 shadow-sm shadow-red-500/5'
                                  }`}
                              >
                                <span>{sr.skill?.name || sr.skillName}</span>
                                <span className="opacity-40">•</span>
                                <span className="font-bold">{displayRating}/10</span>
                              </Badge>
                            );
                          })}
                          {skills.length > limit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onToggleCategory(catName)}
                              className="text-xs font-bold text-primary hover:text-primary/80 hover:bg-primary/5 transition-all cursor-pointer h-7 px-2"
                            >
                              {isExpanded ? 'View Less' : `+${skills.length - limit} More`}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default CandidateProfileCard;
