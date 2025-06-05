import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, GitCommit, FileText, CheckCircle, Clock, AlertCircle, Settings, Database, Terminal, Upload, GitBranch, Users, Plus, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { formatDate } from "@/lib/constants";
import { VersionModal } from "@/components/modals/version-modal";
import { VersionReleaseModal } from "@/components/modals/version-release-modal";
import type { 
  ProjectWithTeam, 
  ProjectVersionWithDetails, 
  GitRepoWithDetails, 
  CabWithDetails, 
  ProceduresByType,
  Procedure 
} from "@shared/schema";

const procedureTypeIcons = {
  environment_variables: Settings,
  service_verification: CheckCircle,
  command_execution: Terminal,
  data_import: Upload,
};

const procedureTypeLabels = {
  environment_variables: "Variables d'environnement",
  service_verification: "Vérification des services",
  command_execution: "Exécution des commandes",
  data_import: "Import des données",
};

const statusColors = {
  development: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  testing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  preproduction: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  production: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
};

const statusLabels = {
  development: "Développement",
  testing: "Recette",
  preproduction: "Pré-production",
  production: "Production",
  open: "Ouvert",
  in_progress: "En cours",
  approved: "Approuvé",
  rejected: "Rejeté",
  closed: "Fermé",
  // Version statuses
  en_cours_arb: "En cours d'ARB",
  en_developpement: "En développement",
  a_deployer_recette: "À déployer Recette",
  recette_en_cours: "Recette en cours",
  a_deployer_preprod: "À déployer Préprod",
  preprod_en_cours: "Préprod en cours",
  a_deployer_production: "À déployer en production",
  merge_git_a_faire: "Merge git à faire",
  annule: "Annulé",
  hotfix_a_prevoir: "Hotfix à prévoir",
  termine: "Terminé",
};

const priorityColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

function ProcedureCard({ procedure, repoName }: { procedure: Procedure; repoName: string }) {
  const Icon = procedureTypeIcons[procedure.type as keyof typeof procedureTypeIcons];
  
  return (
    <Card className={`border-l-4 ${procedure.isCompleted ? 'border-l-green-500 bg-green-50 dark:bg-green-950' : 'border-l-blue-500'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            <CardTitle className="text-sm">{procedure.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {repoName}
            </Badge>
            {procedure.isCompleted ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <Clock className="w-4 h-4 text-yellow-600" />
            )}
          </div>
        </div>
      </CardHeader>
      {procedure.description && (
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-300">{procedure.description}</p>
        </CardContent>
      )}
    </Card>
  );
}

function GitRepoSection({ repo }: { repo: GitRepoWithDetails }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <Card>
      <CardHeader 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            <CardTitle className="text-lg">{repo.name}</CardTitle>
            <Badge variant="secondary">{repo.branch}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="p-1">
              {isExpanded ? (
                <ArrowLeft className="w-4 h-4 rotate-90" />
              ) : (
                <ArrowLeft className="w-4 h-4 -rotate-90" />
              )}
            </Button>
          </div>
        </div>
        {repo.url && (
          <CardDescription>
            <a 
              href={repo.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              onClick={(e) => e.stopPropagation()}
            >
              {repo.url}
            </a>
          </CardDescription>
        )}
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <Tabs defaultValue="commits" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="commits">Commits</TabsTrigger>
            <TabsTrigger value="environment_variables">Variables env.</TabsTrigger>
            <TabsTrigger value="service_verification">Services</TabsTrigger>
            <TabsTrigger value="command_execution">Commandes</TabsTrigger>
            <TabsTrigger value="data_import">Import</TabsTrigger>
          </TabsList>
          
          <TabsContent value="commits" className="space-y-3">
            {repo.commits && repo.commits.length > 0 ? (
              repo.commits.map((commit) => (
                <Card key={commit.id} className="border-l-4 border-l-purple-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <GitCommit className="w-3 h-3" />
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
                            {commit.hash.substring(0, 8)}
                          </code>
                        </div>
                        <p className="text-sm font-medium">{commit.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {commit.author} • {commit.committedAt ? formatDate(commit.committedAt) : 'Date inconnue'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                Aucun commit trouvé
              </p>
            )}
          </TabsContent>

          {Object.entries(procedureTypeLabels).map(([type, label]) => (
            <TabsContent key={type} value={type} className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                {React.createElement(procedureTypeIcons[type as keyof typeof procedureTypeIcons], { className: "w-4 h-4" })}
                <h3 className="font-medium">{label}</h3>
              </div>
              {repo.proceduresByType?.[type as keyof ProceduresByType] && repo.proceduresByType[type as keyof ProceduresByType].length > 0 ? (
                repo.proceduresByType[type as keyof ProceduresByType].map((procedure) => (
                  <ProcedureCard key={procedure.id} procedure={procedure} repoName={repo.name} />
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Aucune procédure de type "{label}" trouvée
                </p>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      )}
    </Card>
  );
}

export default function ProjectDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const projectId = parseInt(params.id || "0");
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [selectedVersionName, setSelectedVersionName] = useState<string>("");

  const { data: project, isLoading: projectLoading } = useQuery<ProjectWithTeam>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });

  const { data: versions, isLoading: versionsLoading } = useQuery<ProjectVersionWithDetails[]>({
    queryKey: [`/api/projects/${projectId}/versions`],
    enabled: !!projectId,
  });

  if (projectLoading || versionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Header 
            title="Chargement..." 
            subtitle="Chargement des détails du projet"
          />
          <div className="p-6 space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Header 
            title="Projet introuvable" 
            subtitle="Le projet demandé n'existe pas"
          />
          <div className="p-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Projet introuvable
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Le projet avec l'ID {projectId} n'existe pas ou vous n'avez pas les permissions pour y accéder.
                </p>
                <Button onClick={() => setLocation("/projects")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour aux projets
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <Header 
          title={project.name}
          subtitle={project.description || "Détails du projet"}
          actions={
            <Button variant="outline" onClick={() => setLocation("/projects")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          }
        />

        <div className="p-6 space-y-6">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{project.name}</CardTitle>
                  <CardDescription className="text-base mt-1">
                    {project.description}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={statusColors[project.status as keyof typeof statusColors] || statusColors.development}>
                    {statusLabels[project.status as keyof typeof statusLabels] || project.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {project.team && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Équipe: {project.team.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Créé le: {project.createdAt ? formatDate(project.createdAt) : 'Date inconnue'}</span>
                </div>
                {project.repositoryUrl && (
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-gray-500" />
                    <a 
                      href={project.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Repository principal
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Project Versions */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Versions du projet</h2>
              <Button onClick={() => setVersionModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle version
              </Button>
            </div>
            
            {versions && versions.length > 0 ? (
              versions.map((version) => (
                <Card key={version.id} className="border-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle 
                          className="text-lg hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                          onClick={() => setLocation(`/projects/${projectId}/versions/${version.id}`)}
                        >
                          Version {version.version}
                        </CardTitle>
                        <CardDescription>{version.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedVersionId(version.id);
                            setSelectedVersionName(version.version);
                            setReleaseModalOpen(true);
                          }}
                        >
                          <LinkIcon className="w-4 h-4 mr-2" />
                          Associer à une release
                        </Button>
                        <Badge className={statusColors[version.status as keyof typeof statusColors] || statusColors.development}>
                          {statusLabels[version.status as keyof typeof statusLabels] || version.status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {version.createdAt ? formatDate(version.createdAt) : 'Date inconnue'}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="repositories" className="w-full">
                      <TabsList>
                        <TabsTrigger value="repositories">Repositories Git</TabsTrigger>
                        <TabsTrigger value="pvs">PVs</TabsTrigger>
                        <TabsTrigger value="cab">Tickets CAB</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="repositories" className="space-y-4">
                        {version.gitRepos && version.gitRepos.length > 0 ? (
                          version.gitRepos.map((repo) => (
                            <GitRepoSection key={repo.id} repo={repo} />
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                            Aucun repository Git trouvé pour cette version
                          </p>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="pvs" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {["pv_fonctionnel_recette", "pv_metier_recette", "pv_conformite_preprod", "pv_tests_homologation_preprod"].map((pvType) => {
                            const pvTypeLabels = {
                              pv_fonctionnel_recette: "PV Fonctionnel Recette",
                              pv_metier_recette: "PV Métier Recette", 
                              pv_conformite_preprod: "PV Conformité Préprod",
                              pv_tests_homologation_preprod: "PV Tests Homologation IT Préprod"
                            };
                            
                            const pv = version.pvs?.find(p => p.type === pvType);
                            
                            return (
                              <Card key={pvType} className={`border-l-4 ${pv?.status === 'completed' ? 'border-l-green-500 bg-green-50 dark:bg-green-950' : 'border-l-orange-500'}`}>
                                <CardHeader className="pb-3">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <CardTitle className="text-sm">{pvTypeLabels[pvType as keyof typeof pvTypeLabels]}</CardTitle>
                                      <CardDescription className="text-xs">
                                        {pv ? `Status: ${pv.status}` : 'Non créé'}
                                      </CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {pv?.status === 'completed' ? (
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                      ) : (
                                        <Clock className="w-4 h-4 text-orange-600" />
                                      )}
                                    </div>
                                  </div>
                                </CardHeader>
                                {pv?.files && pv.files.length > 0 && (
                                  <CardContent>
                                    <div className="space-y-2">
                                      <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                        Fichiers attachés ({pv.files.length})
                                      </p>
                                      {pv.files.slice(0, 3).map((file) => (
                                        <div key={file.id} className="flex items-center gap-2 text-xs">
                                          <FileText className="w-3 h-3" />
                                          <span className="truncate">{file.fileName}</span>
                                          <span className="text-gray-400">
                                            ({Math.round((file.fileSize || 0) / 1024)} KB)
                                          </span>
                                        </div>
                                      ))}
                                      {pv.files.length > 3 && (
                                        <p className="text-xs text-gray-500">
                                          +{pv.files.length - 3} autres fichiers
                                        </p>
                                      )}
                                    </div>
                                  </CardContent>
                                )}
                              </Card>
                            );
                          })}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="cab" className="space-y-3">
                        {version.cabs && version.cabs.length > 0 ? (
                          version.cabs.map((cab) => (
                            <Card key={cab.id} className="border-l-4 border-l-blue-500">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <CardTitle className="text-sm">{cab.ticketNumber}</CardTitle>
                                    <CardDescription className="text-sm">{cab.title}</CardDescription>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className={statusColors[cab.status as keyof typeof statusColors] || statusColors.open}>
                                      {statusLabels[cab.status as keyof typeof statusLabels] || cab.status}
                                    </Badge>
                                    <Badge className={priorityColors[cab.priority as keyof typeof priorityColors] || priorityColors.medium}>
                                      {cab.priority}
                                    </Badge>
                                  </div>
                                </div>
                              </CardHeader>
                              {cab.description && (
                                <CardContent>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">{cab.description}</p>
                                  {cab.assignee && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                      Assigné à: {cab.assignee.email}
                                    </p>
                                  )}
                                  {cab.dueDate && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Échéance: {formatDate(cab.dueDate)}
                                    </p>
                                  )}
                                </CardContent>
                              )}
                            </Card>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                            Aucun ticket CAB trouvé pour cette version
                          </p>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Aucune version
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Ce projet n'a pas encore de versions définies.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <VersionModal 
        open={versionModalOpen} 
        onOpenChange={setVersionModalOpen} 
        projectId={projectId} 
      />
      
      {selectedVersionId && (
        <VersionReleaseModal
          open={releaseModalOpen}
          onOpenChange={setReleaseModalOpen}
          projectId={projectId}
          versionId={selectedVersionId}
          versionName={selectedVersionName}
        />
      )}
    </div>
  );
}