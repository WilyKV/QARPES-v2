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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <Header 
          title="Dashboard" 
          subtitle="Vue d'ensemble des releases et projets"
          actions={
            <Button 
              onClick={() => setIsReleaseModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Release
            </Button>
          }
        />

        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <Rocket className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Releases Actives</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {statsLoading ? <Skeleton className="h-8 w-8" /> : stats?.activeReleases || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <FolderOpen className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Projets</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {statsLoading ? <Skeleton className="h-8 w-8" /> : stats?.totalProjects || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Équipes</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {statsLoading ? <Skeleton className="h-8 w-8" /> : stats?.totalTeams || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">ARB Actifs</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Releases Récentes</CardTitle>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                  Voir tout
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Statut des Projets</CardTitle>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                  Voir tout
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
                    {projectsByStatus.map((statusData) => (
                      <div key={statusData.status}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              statusData.status === "production" ? "bg-green-500" :
                              statusData.status === "preproduction" ? "bg-blue-500" :
                              statusData.status === "testing" ? "bg-yellow-500" :
                              "bg-gray-500"
                            }`}></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {getStatusText(statusData.status)}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {statusData.count} projets
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              statusData.status === "production" ? "bg-green-500" :
                              statusData.status === "preproduction" ? "bg-blue-500" :
                              statusData.status === "testing" ? "bg-yellow-500" :
                              "bg-gray-500"
                            }`}
                            style={{ width: `${getProgressWidth(statusData.count, totalProjects)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                    {projectsByStatus.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        Aucun projet trouvé
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Activité Récente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flow-root">
                <ul className="-mb-8">
                  <li>
                    <div className="relative pb-8">
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"></span>
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-900">
                            <Check className="h-4 w-4 text-white" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Système initialisé avec succès
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
