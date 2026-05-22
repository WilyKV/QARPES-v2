import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Tags,
  FolderOpen,
  Users,
  Shield,
  UserCog,
  Settings,
  LogOut,
  FileText,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
  active: boolean;
  onClick: (path: string) => void;
}

function NavItem({ icon: Icon, label, path, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={() => onClick(path)}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150",
        active
          ? "bg-[hsl(var(--sidebar-primary)/.15)] text-[hsl(var(--sidebar-primary))] shadow-sm"
          : "text-[hsl(var(--sidebar-foreground)/.7)] hover:text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]"
      )}
    >
      <Icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-[hsl(var(--sidebar-primary))]")} />
      {label}
      {active && (
        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[hsl(var(--sidebar-primary))]" />
      )}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-5 pb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[hsl(var(--sidebar-muted))]">
      {children}
    </p>
  );
}

export function Sidebar() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout");
      if (response.ok) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navigate = (path: string) => setLocation(path);
  const isActive = (path: string) => location === path;

  return (
    <nav className="fixed left-0 top-0 w-64 h-screen flex flex-col z-50 shrink-0 bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))]">

      {/* ── Logo ── */}
      <div className="px-4 py-5 border-b border-[hsl(var(--sidebar-border))]">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 hover:opacity-90 transition-opacity w-full"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--sidebar-primary))] text-white font-bold text-lg shadow-lg shadow-[hsl(var(--sidebar-primary)/.3)]">
            R
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[hsl(var(--sidebar-foreground))]">
              ROVER
            </h1>
            <p className="text-[9px] tracking-[0.15em] uppercase text-[hsl(var(--sidebar-muted))] leading-tight">
              Release · Orchestration
              <br />
              Version · Engine · Review
            </p>
          </div>
        </button>
      </div>

      {/* ── Navigation ── */}
      <div className="flex-1 px-3 py-2 overflow-y-auto">

        {/* Dashboard — toujours visible, pas de label de section */}
        <div className="py-1">
          <NavItem icon={LayoutDashboard} label="Tableau de bord" path="/" active={isActive("/")} onClick={navigate} />
        </div>

        <SectionLabel>Gestion</SectionLabel>
        <div className="space-y-0.5">
          <NavItem icon={Tags} label="Releases" path="/releases" active={isActive("/releases")} onClick={navigate} />
          <NavItem icon={FolderOpen} label="Projets" path="/projects" active={isActive("/projects")} onClick={navigate} />
        </div>

        <SectionLabel>Organisation</SectionLabel>
        <div className="space-y-0.5">
          <NavItem icon={Users} label="Équipes" path="/teams" active={isActive("/teams")} onClick={navigate} />
          <NavItem icon={UserCog} label="Membres" path="/members" active={isActive("/members")} onClick={navigate} />
        </div>

        <SectionLabel>Architecture</SectionLabel>
        <div className="space-y-0.5">
          <NavItem icon={Shield} label="ARB" path="/arb" active={isActive("/arb")} onClick={navigate} />
          <NavItem icon={FileText} label="ADR" path="/adr" active={isActive("/adr")} onClick={navigate} />
        </div>

        <SectionLabel>Sécurité</SectionLabel>
        <div className="space-y-0.5">
          <NavItem icon={Megaphone} label="Annonces" path="/security/announcements" active={isActive("/security/announcements")} onClick={navigate} />
        </div>

        {user?.role === "admin" && (
          <>
            <SectionLabel>Administration</SectionLabel>
            <div className="space-y-0.5">
              <NavItem icon={UserCog} label="Utilisateurs" path="/admin/users" active={isActive("/admin/users")} onClick={navigate} />
              <NavItem icon={Settings} label="Paramètres" path="/admin/settings" active={isActive("/admin/settings")} onClick={navigate} />
            </div>
          </>
        )}
      </div>

      {/* ── Profil utilisateur ── */}
      <div className="px-3 py-3 border-t border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center gap-3 px-3 py-2 rounded-md">
          <Avatar className="h-8 w-8 ring-2 ring-[hsl(var(--sidebar-border))]">
            <AvatarImage src={user?.profileImageUrl ?? undefined} />
            <AvatarFallback className="bg-[hsl(var(--sidebar-primary))] text-white text-xs font-semibold">
              {getInitials(user?.firstName ?? undefined, user?.lastName ?? undefined)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-[hsl(var(--sidebar-foreground))]">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[11px] capitalize text-[hsl(var(--sidebar-muted))]">
              {user?.role || "viewer"}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 mt-1 text-sm text-[hsl(var(--sidebar-foreground)/.6)] hover:text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </nav>
  );
}
