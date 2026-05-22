import { Bell } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-[hsl(var(--navy-grad-from))] to-[hsl(var(--navy-grad-to))] border-b border-[hsl(var(--sidebar-border))]">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[hsl(var(--header-foreground))]">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-[hsl(var(--header-foreground)/.6)] mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <button className="relative p-2 rounded-md hover:bg-white/10 transition-colors">
              <Bell className="h-4 w-4 text-[hsl(var(--header-foreground)/.7)]" />
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold">
                3
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
