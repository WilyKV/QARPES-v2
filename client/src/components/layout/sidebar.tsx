import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Rocket, 
  LayoutDashboard, 
  Tags, 
  FolderOpen, 
  Users, 
  Shield, 
  UserCog, 
  Settings, 
  LogOut,
  CheckCircle,
  GitBranch,
  Lock,
  BoxIcon,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function Sidebar() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionTitle)) {
        next.delete(sectionTitle);
      } else {
        next.add(sectionTitle);
      }
      return next;
    });
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout");
      if (response.ok) {
        // Forcer le rechargement de la page pour vider le cache et rediriger vers login
        window.location.href = "/";
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const menuSections = [
    {
      title: "Qualité",
      icon: CheckCircle,
      items: []
    },
    {
      title: "Architecture",
      icon: BoxIcon,
      items: [
        {
          name: "ARB",
          href: "/arb",
          icon: Shield,
          current: location === "/arb",
        },
        {
          name: "ADR",
          href: "/adr",
          icon: BoxIcon,
          current: location === "/adr",
        }
      ]
    },
    {
      title: "Release",
      icon: GitBranch,
      items: [
        {
          name: "Liste des releases",
          href: "/releases",
          icon: Tags,
          current: location === "/releases",
        }
      ]
    },
    {
      title: "Projet",
      icon: FolderOpen,
      items: [
        {
          name: "Liste des projets",
          href: "/projects",
          icon: FolderOpen,
          current: location === "/projects",
        }
      ]
    },
    {
      title: "Equipe",
      icon: Users,
      items: [
        {
          name: "Liste des équipes",
          href: "/teams",
          icon: Users,
          current: location === "/teams",
        },
        {
          name: "Liste des membres",
          href: "/members",
          icon: UserCog,
          current: location === "/members",
        }
      ]
    },
    {
      title: "Sécurité",
      icon: Lock,
      items: []
    }
  ];

  const adminItems = user?.role === "admin" ? [
    {
      name: "Utilisateurs",
      href: "/admin/users",
      icon: UserCog,
      current: location === "/admin/users",
    }
  ] : [];

  const allSections = user?.role === "admin" 
    ? [...menuSections, { title: "Administration", icon: Settings, items: adminItems }]
    : menuSections;

  return (
  <nav className="fixed left-0 top-0 w-64 h-screen bg-gradient-to-b from-[hsl(var(--navy-grad-from))] to-[hsl(var(--navy-grad-to))] text-[hsl(var(--sidebar-foreground))] shadow-sm flex flex-col z-50 shrink-0">
      {/* Logo cliquable */}
  <div className="px-6 py-4 border-b border-[hsl(var(--sidebar-border))]">
        <button 
          onClick={() => setLocation("/")}
          className="text-xl font-bold flex items-center hover:opacity-80 transition-opacity w-full"
        >
          <Rocket className="h-5 w-5 text-[hsl(var(--sidebar-primary))] mr-2" />
          QARPES v2
        </button>
      </div>

      {/* User Profile */}
  <div className="px-6 py-4 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profileImageUrl ?? undefined} />
    <AvatarFallback className="bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] text-sm font-medium">
              {getInitials(user?.firstName ?? undefined, user?.lastName ?? undefined)}
            </AvatarFallback>
          </Avatar>
          <div>
    <p className="text-sm font-medium">
              {user?.firstName} {user?.lastName}
            </p>
    <p className="text-xs opacity-80 capitalize">
              {user?.role || "viewer"}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        <nav className="space-y-6">
          {allSections.map((section) => {
            const isCollapsed = collapsedSections.has(section.title);
            return (
              <div key={section.title}>
                {/* Section Header - Cliquable pour replier */}
                <button
                  onClick={() => toggleSection(section.title)}
                  className="flex items-center justify-between w-full px-2 mb-2 hover:opacity-100 opacity-90 transition-opacity"
                >
                  <div className="flex items-center">
                    <section.icon className="h-4 w-4 mr-2 opacity-60" />
                    <h3 className="text-xs font-semibold opacity-70 uppercase tracking-wider">
                      {section.title}
                    </h3>
                  </div>
                  {section.items.length > 0 && (
                    isCollapsed ? (
                      <ChevronRight className="h-3 w-3 opacity-60" />
                    ) : (
                      <ChevronDown className="h-3 w-3 opacity-60" />
                    )
                  )}
                </button>
                
                {/* Section Items - Affichés si non replié */}
                {!isCollapsed && (
                  section.items.length > 0 ? (
                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.name}
                            onClick={() => setLocation(item.href)}
                            className={cn(
                              "w-full text-left group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                              item.current
                                ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))]"
                                : "hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))] opacity-90"
                            )}
                          >
                            <Icon
                              className={cn(
                                "mr-3 h-4 w-4",
                                item.current
                                  ? "text-[hsl(var(--sidebar-primary))]"
                                  : "opacity-70 group-hover:opacity-100"
                              )}
                            />
                            {item.name}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="px-2 text-xs opacity-50 italic">Prochainement</p>
                  )
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Logout Button */}
    <div className="px-4 py-4 border-t border-[hsl(var(--sidebar-border))]">
        <Button
          variant="ghost"
          onClick={handleLogout}
      className="w-full justify-start opacity-80 hover:opacity-100 hover:bg-[hsl(var(--sidebar-accent))]"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </nav>
  );
}
