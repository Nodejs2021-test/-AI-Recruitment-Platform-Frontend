import { Button } from '@/components/ui/Button/index.js';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Modal/index.js';
import { Input } from '@/components/ui/Input/index.js';

interface ProfileModalsProps {
  user: any;
  isEditProfileOpen: boolean;
  onEditProfileClose: () => void;
  registerProfile: any;
  handleProfileSubmit: any;
  onProfileSubmit: (data: any) => void;
  profileErrors: any;
  isProfileSubmitting: boolean;
  isUpdatingProfile: boolean;

  isChangePasswordOpen: boolean;
  onChangePasswordClose: () => void;
  registerPassword: any;
  handlePasswordSubmit: any;
  onPasswordSubmit: (data: any) => void;
  passwordErrors: any;
  isPasswordSubmitting: boolean;
  isChangingPassword: boolean;

  isDeleteAccountOpen: boolean;
  onDeleteAccountClose: () => void;
  onDeleteAccountConfirm: () => void;
  isDeletingAccount: boolean;
}

export function CandidateProfileModals({
  user,
  isEditProfileOpen,
  onEditProfileClose,
  registerProfile,
  handleProfileSubmit,
  onProfileSubmit,
  profileErrors,
  isProfileSubmitting,
  isUpdatingProfile,

  isChangePasswordOpen,
  onChangePasswordClose,
  registerPassword,
  handlePasswordSubmit,
  onPasswordSubmit,
  passwordErrors,
  isPasswordSubmitting,
  isChangingPassword,

  isDeleteAccountOpen,
  onDeleteAccountClose,
  onDeleteAccountConfirm,
  isDeletingAccount,
}: ProfileModalsProps) {
  return (
    <>
      {/* Edit Profile Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={onEditProfileClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your personal information. Email cannot be changed.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProfileSubmit(onProfileSubmit)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input {...registerProfile('fullName')} />
                {profileErrors.fullName && (
                  <p className="text-sm font-medium text-destructive">{profileErrors.fullName.message as string}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={user?.email || ''} disabled className="bg-muted opacity-50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input {...registerProfile('phoneNumber')} />
                {profileErrors.phoneNumber && (
                  <p className="text-sm font-medium text-destructive">{profileErrors.phoneNumber.message as string}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onEditProfileClose}>Cancel</Button>
              <Button type="submit" disabled={isProfileSubmitting || isUpdatingProfile}>Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordOpen} onOpenChange={onChangePasswordClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter a new password for your account.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input type="password" {...registerPassword('newPassword')} />
                {passwordErrors.newPassword && (
                  <p className="text-sm font-medium text-destructive">{passwordErrors.newPassword.message as string}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm New Password</label>
                <Input type="password" {...registerPassword('confirmPassword')} />
                {passwordErrors.confirmPassword && (
                  <p className="text-sm font-medium text-destructive">{passwordErrors.confirmPassword.message as string}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onChangePasswordClose}>Cancel</Button>
              <Button type="submit" disabled={isPasswordSubmitting || isChangingPassword}>Update Password</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={isDeleteAccountOpen} onOpenChange={onDeleteAccountClose}>
        <DialogContent className="sm:max-w-md border border-destructive/20 shadow-2xl shadow-destructive/5">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2 text-xl font-bold">
              Permanently Delete Account?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-2 leading-relaxed">
              This action is <strong className="text-foreground font-semibold">irreversible</strong>. 
              All your applications, interviews, results, and uploaded resumes will be deleted permanently. 
              You will not be able to reuse this account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-destructive/5 border border-destructive/10 rounded-lg p-3.5 space-y-1.5 text-xs text-destructive-foreground/80 dark:text-red-300">
              <p className="font-semibold text-destructive">Warning:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>All active applications will be withdrawn.</li>
                <li>Your scheduled interviews will be cancelled.</li>
                <li>Your profile and parsed CV records will be wiped.</li>
              </ul>
            </div>
            <p className="text-sm font-medium text-foreground">
              Are you sure you want to permanently delete your account?
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={onDeleteAccountClose}>
              No, Keep Account
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onDeleteAccountConfirm}
              disabled={isDeletingAccount}
              className="font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-1.5"
            >
              {isDeletingAccount ? 'Deleting Account...' : 'Yes, Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CandidateProfileModals;
