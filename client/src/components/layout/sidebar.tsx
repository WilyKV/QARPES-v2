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
  LogOut 
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      current: location === "/",
    },
    {
      name: "Releases",
      href: "/releases",
      icon: Tags,
      current: location === "/releases",
    },
    {
      name: "Projets",
      href: "/projects",
      icon: FolderOpen,
      current: location === "/projects",
    },
    {
      name: "Équipes",
      href: "/teams",
      icon: Users,
      current: location === "/teams",
    },
    {
      name: "Membres",
      href: "/members",
      icon: UserCog,
      current: location === "/members",
    },
    {
      name: "ARB",
      href: "/arb",
      icon: Shield,
      current: location === "/arb",
    },
  ];

  const adminItems = [
    {
      name: "Utilisateurs",
      href: "/users",
      icon: UserCog,
      current: location === "/users",
      roleRequired: "admin",
    },
    {
      name: "Paramètres",
      href: "/settings",
      icon: Settings,
      current: location === "/settings",
      roleRequired: "admin",
    },
  ];

  return (
  <nav className="fixed left-0 top-0 w-64 h-screen bg-[hsl(var(--navy-grad-from))] text-[hsl(var(--sidebar-foreground))] shadow-sm flex flex-col z-50 shrink-0">
      {/* Logo */}
  <div className="px-6 py-4 border-b border-[hsl(var(--sidebar-border))]">
        <h1 className="text-xl font-bold flex items-center">
          <Rocket className="h-5 w-5 text-[hsl(var(--sidebar-primary))] mr-2" />
          Release Manager
        </h1>
      </div>

      {/* User Profile */}
  <div className="px-6 py-4 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profileImageUrl} />
    <AvatarFallback className="bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] text-sm font-medium">
              {getInitials(user?.firstName, user?.lastName)}
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

      {/* Navigation */}
      <div className="flex-1 px-4 py-4">
        <nav className="space-y-1">
          {navigationItems.map((item) => {
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
        </nav>

        {/* Admin Section */}
        {user?.role === "admin" && (
          <div className="mt-8">
            <h3 className="px-2 text-xs font-semibold opacity-70 uppercase tracking-wider">
              Administration
            </h3>
            <nav className="mt-2 space-y-1">
              {adminItems.map((item) => {
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
            </nav>
          </div>
        )}
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
