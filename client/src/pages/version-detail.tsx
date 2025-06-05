import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Calendar, GitCommit, FileText, CheckCircle, Clock, AlertCircle, Settings, Database, Terminal, Upload, GitBranch, Users, Link as LinkIcon, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { formatDate } from "@/lib/constants";
import { VersionReleaseModal } from "@/components/modals/version-release-modal";
import { GitRepoModal } from "@/components/modals/git-repo-modal";
import { PvModal } from "@/components/modals/pv-modal";
import { CabModal } from "@/components/modals/cab-modal";
import { CommitModal } from "@/components/modals/commit-modal";
import { ProcedureModal } from "@/components/modals/procedure-modal";
import type { 
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
  // Version statuses
  en_cours_arb: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  en_developpement: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  a_deployer_recette: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  recette_en_cours: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  a_deployer_preprod: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  preprod_en_cours: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  a_deployer_production: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  merge_git_a_faire: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  annule: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  hotfix_a_prevoir: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  termine: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
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
            <Badge variant="outline" className="text-xs">
              {repoName}
            </Badge>
            {procedure.isCompleted ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <Clock className="w-4 h-4 text-orange-600" />
            )}
          </div>
        </div>
        <CardDescription className="text-sm">
          {procedureTypeLabels[procedure.type as keyof typeof procedureTypeLabels]}
        </CardDescription>
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
  const { data: procedures } = useQuery<ProceduresByType>({
    queryKey: [`/api/git-repos/${repo.id}/procedures`],
    enabled: !!repo.id,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{repo.name}</CardTitle>
            <CardDescription>
              Dernier commit: {repo.lastCommitHash ? repo.lastCommitHash.substring(0, 7) : 'N/A'}
            </CardDescription>
          </div>
          {repo.url && (
            <Button variant="outline" size="sm" asChild>
              <a href={repo.url} target="_blank" rel="noopener noreferrer">
                <GitBranch className="w-4 h-4 mr-2" />
                Voir le repo
              </a>
            </Button>
          )}
        </div>
      </CardHeader>
      
      {procedures && (
        <CardContent>
          <div className="space-y-4">
            <h4 className="font-medium">Procédures de déploiement</h4>
            {Object.entries(procedures).map(([type, procedureList]) => (
              procedureList.length > 0 && (
                <div key={type} className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {procedureTypeLabels[type as keyof typeof procedureTypeLabels]} ({procedureList.length})
                  </h5>
                  <div className="space-y-2">
                    {procedureList.map((procedure) => (
                      <ProcedureCard 
                        key={procedure.id} 
                        procedure={procedure} 
                        repoName={repo.name} 
                      />
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function VersionDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const projectId = parseInt(params.projectId || "0");
  const versionId = parseInt(params.versionId || "0");
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Git Repo modal states
  const [gitRepoModalOpen, setGitRepoModalOpen] = useState(false);
  const [selectedGitRepo, setSelectedGitRepo] = useState<any>(null);
  
  // PV modal states
  const [pvModalOpen, setPvModalOpen] = useState(false);
  const [selectedPv, setSelectedPv] = useState<any>(null);
  
  // CAB modal states
  const [cabModalOpen, setCabModalOpen] = useState(false);
  const [selectedCab, setSelectedCab] = useState<any>(null);
  
  // Commit modal states
  const [commitModalOpen, setCommitModalOpen] = useState(false);
  const [selectedCommit, setSelectedCommit] = useState<any>(null);
  const [selectedGitRepoForCommit, setSelectedGitRepoForCommit] = useState<number>(0);
  
  // Procedure modal states
  const [procedureModalOpen, setProcedureModalOpen] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<any>(null);
  const [selectedGitRepoForProcedure, setSelectedGitRepoForProcedure] = useState<number>(0);
  const [selectedProcedureType, setSelectedProcedureType] = useState<string>("");

  const { data: version, isLoading: versionLoading } = useQuery<ProjectVersionWithDetails>({
    queryKey: [`/api/projects/${projectId}/versions/${versionId}`],
    enabled: !!projectId && !!versionId,
  });

  if (versionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Header 
            title="Chargement..." 
            subtitle="Chargement des détails de la version"
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

  if (!version) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Header 
            title="Version introuvable" 
            subtitle="Cette version n'existe pas"
          />
          <div className="p-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Version introuvable
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  La version avec l'ID {versionId} n'existe pas ou vous n'avez pas les permissions pour y accéder.
                </p>
                <Button onClick={() => setLocation(`/projects/${projectId}`)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour au projet
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
          title={`Version ${version.version}`}
          subtitle={version.description || "Détails de la version"}
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setReleaseModalOpen(true)}
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Associer à une release
              </Button>
              <Button variant="outline" onClick={() => setLocation(`/projects/${projectId}`)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au projet
              </Button>
            </div>
          }
        />

        <div className="p-6 space-y-6">
          {/* Version Info */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">Version {version.version}</CardTitle>
                  <CardDescription className="text-base mt-1">
                    {version.description}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={statusColors[version.status as keyof typeof statusColors] || statusColors.en_developpement}>
                    {statusLabels[version.status as keyof typeof statusLabels] || version.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Créée le: {version.createdAt ? formatDate(version.createdAt) : 'Date inconnue'}</span>
                </div>
                {version.releaseId && (
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Release associée: #{version.releaseId}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Repositories: {version.gitRepos?.length || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Version Details */}
          <Tabs defaultValue="repositories" className="w-full">
            <TabsList>
              <TabsTrigger value="repositories">Repositories Git</TabsTrigger>
              <TabsTrigger value="pvs">PVs</TabsTrigger>
              <TabsTrigger value="cab">Tickets CAB</TabsTrigger>
            </TabsList>
            
            <TabsContent value="repositories" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Repositories Git</h3>
                <Button 
                  onClick={() => {
                    setSelectedGitRepo(null);
                    setGitRepoModalOpen(true);
                  }}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un repository
                </Button>
              </div>
              
              {version.gitRepos && version.gitRepos.length > 0 ? (
                version.gitRepos.map((repo) => (
                  <Card key={repo.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{repo.name}</CardTitle>
                          <CardDescription>
                            Dernier commit: {repo.lastCommitHash ? repo.lastCommitHash.substring(0, 7) : 'N/A'}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedGitRepo(repo);
                              setGitRepoModalOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              if (confirm('Êtes-vous sûr de vouloir supprimer ce repository ?')) {
                                try {
                                  await apiRequest("DELETE", `/api/git-repos/${repo.id}`);
                                  queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/versions/${versionId}`] });
                                  toast({
                                    title: "Succès",
                                    description: "Repository supprimé avec succès",
                                  });
                                } catch (error) {
                                  toast({
                                    title: "Erreur",
                                    description: "Impossible de supprimer le repository",
                                    variant: "destructive",
                                  });
                                }
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          {repo.url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={repo.url} target="_blank" rel="noopener noreferrer">
                                <GitBranch className="w-4 h-4 mr-2" />
                                Voir le repo
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Aucun repository
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Aucun repository Git trouvé pour cette version
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="pvs" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">PVs (Procès-Verbaux)</h3>
                <Button 
                  onClick={() => {
                    setSelectedPv(null);
                    setPvModalOpen(true);
                  }}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un PV
                </Button>
              </div>
              
              {version.pvs && version.pvs.length > 0 ? (
                version.pvs.map((pv) => (
                  <Card key={pv.id} className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-sm">PV #{pv.id} - {pv.type}</CardTitle>
                          <CardDescription className="text-sm">
                            Statut: {pv.status} | {pv.files?.length || 0} fichier(s)
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPv(pv);
                              setPvModalOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              if (confirm('Êtes-vous sûr de vouloir supprimer ce PV ?')) {
                                try {
                                  await apiRequest("DELETE", `/api/project-pvs/${pv.id}`);
                                  queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/versions/${versionId}`] });
                                  toast({
                                    title: "Succès",
                                    description: "PV supprimé avec succès",
                                  });
                                } catch (error) {
                                  toast({
                                    title: "Erreur",
                                    description: "Impossible de supprimer le PV",
                                    variant: "destructive",
                                  });
                                }
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
                              +{pv.files.length - 3} fichier(s) supplémentaire(s)
                            </p>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Aucun PV
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Aucun PV trouvé pour cette version
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="cab" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Tickets CAB</h3>
                <Button 
                  onClick={() => {
                    setSelectedCab(null);
                    setCabModalOpen(true);
                  }}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un ticket CAB
                </Button>
              </div>
              
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCab(cab);
                              setCabModalOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              if (confirm('Êtes-vous sûr de vouloir supprimer ce ticket CAB ?')) {
                                try {
                                  await apiRequest("DELETE", `/api/cabs/${cab.id}`);
                                  queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/versions/${versionId}`] });
                                  toast({
                                    title: "Succès",
                                    description: "Ticket CAB supprimé avec succès",
                                  });
                                } catch (error) {
                                  toast({
                                    title: "Erreur",
                                    description: "Impossible de supprimer le ticket CAB",
                                    variant: "destructive",
                                  });
                                }
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Aucun ticket CAB
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Aucun ticket CAB trouvé pour cette version
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* All Modals */}
      <VersionReleaseModal
        open={releaseModalOpen}
        onOpenChange={setReleaseModalOpen}
        projectId={projectId}
        versionId={versionId}
        versionName={version?.version || ""}
      />
      
      <GitRepoModal
        open={gitRepoModalOpen}
        onOpenChange={setGitRepoModalOpen}
        projectVersionId={versionId}
        projectId={projectId}
        versionId={versionId}
        gitRepo={selectedGitRepo}
      />
      
      <PvModal
        open={pvModalOpen}
        onOpenChange={setPvModalOpen}
        projectVersionId={versionId}
        projectId={projectId}
        versionId={versionId}
        pv={selectedPv}
      />
      
      <CabModal
        open={cabModalOpen}
        onOpenChange={setCabModalOpen}
        projectVersionId={versionId}
        projectId={projectId}
        versionId={versionId}
        cab={selectedCab}
      />
    </div>
  );
}