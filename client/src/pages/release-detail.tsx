import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, CheckCircle, Clock, GitBranch } from "lucide-react";
import { Link } from "wouter";
import type { ReleaseWithProjects } from "@shared/schema";

const statusColors = {
  testing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  preproduction: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100", 
  production: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
};

const statusLabels = {
  testing: "Recette",
  preproduction: "Préprod",
  production: "Production",
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "Non définie";
  return new Date(dateString).toLocaleDateString('fr-FR');
};

export default function ReleaseDetail() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, params] = useRoute("/releases/:id");
  const releaseId = params?.id;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Non autorisé", 
        description: "Vous devez être connecté pour accéder aux détails de release. Redirection en cours...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: release, isLoading: isReleaseLoading } = useQuery({
    queryKey: [`/api/releases/${releaseId}`],
    enabled: !!releaseId && isAuthenticated,
    retry: false,
  });

  const { data: releaseProcedures, isLoading: isProceduresLoading } = useQuery({
    queryKey: [`/api/releases/${releaseId}/procedures`],
    enabled: !!releaseId && isAuthenticated,
    retry: false,
  });

  if (isLoading || isReleaseLoading) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-300 rounded w-1/3"></div>
              <div className="h-64 bg-gray-300 rounded"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!release) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Release non trouvée</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Cette release n'existe pas ou a été supprimée.</p>
              <Link href="/releases">
                <Button className="mt-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour aux releases
                </Button>
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const typedRelease = release as ReleaseWithProjects;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/releases">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Release {typedRelease.releaseId}
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400">{typedRelease.name}</p>
                </div>
              </div>
              <Badge className={statusColors[typedRelease.status as keyof typeof statusColors] || statusColors.testing}>
                {statusLabels[typedRelease.status as keyof typeof statusLabels] || typedRelease.status}
              </Badge>
            </div>

            {/* Release Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informations de la release</CardTitle>
                <CardDescription>{typedRelease.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Date de recette</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(typedRelease.recetteDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Date de préprod</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(typedRelease.preprodDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Date de production</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(typedRelease.productionDate)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Projects */}
            <Card>
              <CardHeader>
                <CardTitle>Projets inclus ({typedRelease.releaseProjects?.length || 0})</CardTitle>
                <CardDescription>Liste des projets associés à cette release</CardDescription>
              </CardHeader>
              <CardContent>
                {typedRelease.releaseProjects && typedRelease.releaseProjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {typedRelease.releaseProjects.map((rp) => (
                      <div key={rp.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{rp.project.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{rp.project.description}</p>
                        <div className="mt-3">
                          <Link href={`/projects/${rp.project.id}`}>
                            <Button variant="outline" size="sm">
                              Voir le projet
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">Aucun projet associé à cette release</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Procedures grouped by repository */}
            <Card>
              <CardHeader>
                <CardTitle>Procédures par repository</CardTitle>
                <CardDescription>Toutes les procédures des projets de cette release regroupées par repository</CardDescription>
              </CardHeader>
              <CardContent>
                {isProceduresLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                    <div className="h-32 bg-gray-300 rounded"></div>
                  </div>
                ) : releaseProcedures && releaseProcedures.projects?.length > 0 ? (
                  <div className="space-y-6">
                    {releaseProcedures.projects.map((project: any) => (
                      <div key={project.projectId} className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">{project.projectName}</h4>
                          <Badge variant="outline">{project.versions.length} version(s)</Badge>
                        </div>
                        {project.versions.map((version: any) => (
                          <div key={version.versionId} className="ml-4 space-y-3">
                            <h5 className="font-medium text-gray-700 dark:text-gray-300">Version {version.versionName}</h5>
                            {version.repositories.map((repo: any) => (
                              <div key={repo.repoId} className="ml-4 border rounded-lg p-4">
                                <div className="flex items-center space-x-2 mb-3">
                                  <GitBranch className="w-4 h-4 text-gray-500" />
                                  <h6 className="font-medium text-gray-900 dark:text-gray-100">{repo.repoName}</h6>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  {Object.entries(repo.procedures).map(([type, procedures]: [string, any]) => (
                                    <div key={type} className="space-y-2">
                                      <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                                        {type.replace('_', ' ')}
                                      </h6>
                                      {procedures.length > 0 ? (
                                        <div className="space-y-1">
                                          {procedures.map((procedure: any) => (
                                            <div key={procedure.id} className="flex items-center space-x-2 text-sm">
                                              {procedure.isCompleted ? (
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                              ) : (
                                                <Clock className="w-4 h-4 text-yellow-500" />
                                              )}
                                              <span className={procedure.isCompleted ? "text-green-700 dark:text-green-300" : "text-gray-600 dark:text-gray-400"}>
                                                {procedure.title}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-gray-400">Aucune procédure</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                        <Separator />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">Aucune procédure trouvée pour cette release</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}