import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Rocket, 
  FolderOpen, 
  Users, 
  Shield, 
  Check, 
  Edit, 
  Plus, 
  AlertTriangle,
  ChevronRight 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { ReleaseModal } from "@/components/modals/release-modal";
import { useState } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Non autorisé",
        description: "Vous devez être connecté pour accéder au tableau de bord. Redirection en cours...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: releases, isLoading: releasesLoading } = useQuery({
    queryKey: ["/api/releases"],
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "production": return "bg-green-100 text-green-800";
      case "preproduction": return "bg-blue-100 text-blue-800";
      case "testing": return "bg-yellow-100 text-yellow-800";
      case "development": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "production": return "Production";
      case "preproduction": return "Pré-production";
      case "testing": return "Recette";
      case "development": return "Développement";
      default: return status;
    }
  };

  const recentReleases = releases?.slice(0, 3) || [];
  const projectsByStatus = stats?.projectsByStatus || [];

  const getProgressWidth = (count: number, total: number) => {
    return total > 0 ? (count / total) * 100 : 0;
  };

  const totalProjects = projectsByStatus.reduce((sum, p) => sum + p.count, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <Header 
          title="Dashboard" 
          subtitle="Vue d'ensemble des releases et projets"
          actions={
            <Button 
              onClick={() => setIsReleaseModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Release
            </Button>
          }
        />

        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg">
                      <Rocket className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Releases Actives</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                      {statsLoading ? <Skeleton className="h-8 w-8" /> : stats?.activeReleases || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center shadow-lg">
                      <FolderOpen className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Projets</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                      {statsLoading ? <Skeleton className="h-8 w-8" /> : stats?.totalProjects || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center shadow-lg">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Équipes</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                      {statsLoading ? <Skeleton className="h-8 w-8" /> : stats?.totalTeams || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 hover:shadow-xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg flex items-center justify-center shadow-lg">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">ARB Actifs</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                      {statsLoading ? <Skeleton className="h-8 w-8" /> : stats?.activeArb || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Releases */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                  Releases Récentes
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  Voir tout
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {releasesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                ) : recentReleases.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Aucune release trouvée
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentReleases.map((release: any) => (
                      <div key={release.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div className="flex items-center space-x-4">
                          <Badge variant="outline" className="font-mono">
                            {release.releaseId}
                          </Badge>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {release.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {release.team?.name || "Aucune équipe"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(release.status)}>
                            {getStatusText(release.status)}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Project Status */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                  Statut des Projets
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  Voir tout
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-2 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projectsByStatus.map((statusData: any) => (
                      <div key={statusData.status}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              statusData.status === "production" ? "bg-gradient-to-r from-green-500 to-emerald-500" :
                              statusData.status === "preproduction" ? "bg-gradient-to-r from-blue-500 to-indigo-500" :
                              statusData.status === "testing" ? "bg-gradient-to-r from-amber-500 to-yellow-500" :
                              "bg-gradient-to-r from-gray-500 to-slate-500"
                            }`}></div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {getStatusText(statusData.status)}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {statusData.count} projet{statusData.count > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-300 ${
                              statusData.status === "production" ? "bg-gradient-to-r from-green-500 to-emerald-500" :
                              statusData.status === "preproduction" ? "bg-gradient-to-r from-blue-500 to-indigo-500" :
                              statusData.status === "testing" ? "bg-gradient-to-r from-amber-500 to-yellow-500" :
                              "bg-gradient-to-r from-gray-500 to-slate-500"
                            }`}
                            style={{ width: `${getProgressWidth(statusData.count, totalProjects)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                    {projectsByStatus.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FolderOpen className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-sm">Aucun projet trouvé</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="mt-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Activité Récente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flow-root">
                <ul className="-mb-8">
                  <li>
                    <div className="relative pb-8">
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gradient-to-b from-green-500 to-emerald-500"></span>
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-900 shadow-lg">
                            <Check className="h-4 w-4 text-white" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              Système initialisé avec succès
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Toutes les fonctionnalités sont opérationnelles
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                            Maintenant
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <ReleaseModal 
        open={isReleaseModalOpen} 
        onOpenChange={setIsReleaseModalOpen}
      />
    </div>
  );
}
