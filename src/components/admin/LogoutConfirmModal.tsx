import React from 'react';
import { X, LogOut, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const LogoutConfirmModal: React.FC<Props> = ({
  open,
  onOpenChange,
  onConfirm,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md border-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 shadow-2xl rounded-lg p-6">
      <DialogHeader className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center border-4 border-red-200/50 dark:border-red-800/50">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        
        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-200 dark:to-white bg-clip-text text-transparent text-center">
          Confirm Logout
        </DialogTitle>
        
        <DialogDescription className="text-slate-600 dark:text-slate-400 text-base leading-relaxed px-4">
          You're about to sign out of your account. Any unsaved changes will be lost.
        </DialogDescription>
      </DialogHeader>

      <div className="py-4 px-4">
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg">
          <LogOut className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            You'll need to sign in again to access your account.
          </p>
        </div>
      </div>
      
      <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4 px-4">
        <Button 
          variant="outline" 
          onClick={() => onOpenChange(false)}
          className="flex-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600 transition-all duration-200 hover:shadow-md rounded-lg flex items-center justify-center"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button 
          variant="destructive" 
          onClick={onConfirm}
          className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] rounded-lg flex items-center justify-center"
        >
          <LogOut className="w-4 h-4 mr-2" />
          <span className="text-center">Sign Out</span>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);