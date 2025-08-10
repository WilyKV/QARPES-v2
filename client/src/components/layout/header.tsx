import { Bell, Paintbrush } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/hooks/useTheme";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const { cycle, theme } = useTheme();
  return (
  <header className="text-[hsl(var(--header-foreground))] shadow-sm border-b border-[hsl(var(--border))] bg-gradient-to-r from-[hsl(var(--navy-grad-from))] to-[hsl(var(--navy-grad-to))]">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm opacity-80 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {/* Notification Bell */}
            <Button variant="ghost" size="sm" className="relative p-2">
              <Bell className="h-4 w-4 opacity-70" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-white text-[10px] leading-none">
                3
              </Badge>
            </Button>

            {/* Theme toggle */}
            <Button variant="ghost" size="sm" className="p-2" onClick={cycle} title={`Thème: ${theme}`}>
              <Paintbrush className="h-4 w-4 text-[hsl(var(--primary))]" />
            </Button>
            
            {/* Action Buttons */}
            {actions}
          </div>
        </div>
      </div>
    </header>
  );
}
