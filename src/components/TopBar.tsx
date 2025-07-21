
import { Button } from "@/components/ui/button";
import { Brain, Menu } from "lucide-react";
import { Profile } from './Profile';
import { LogoutConfirmation } from './LogoutConfirmation';

interface TopBarProps {
  onSignOut: () => void;
  onToggleSidebar: () => void;
}

export const TopBar = ({ onSignOut, onToggleSidebar }: TopBarProps) => {
  return (
    <div className="h-14 border-b border-border bg-background/80 backdrop-blur-lg flex items-center justify-between px-4 sticky top-0 z-50">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-foreground">Mantrik AI</span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <Profile />
        <LogoutConfirmation onConfirm={onSignOut} />
      </div>
    </div>
  );
};
