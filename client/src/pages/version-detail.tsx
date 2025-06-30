import React, { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, Calendar, GitCommit, FileText, CheckCircle, Clock, AlertCircle, 
  Settings, Database, Terminal, Upload, GitBranch, Users, Link as LinkIcon, 
  Plus, Edit, Trash2, Rocket, Shield, Code, Server 
} from "lucide-react";
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
import ProcedureModal from "@/components/modals/procedure-modal";
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

// Composant séparé pour éviter les hooks dans une boucle
function RepoCommitsCard({ versionGitRepo }: { versionGitRepo: any }) {
  const { data: commits } = useQuery({
    queryKey: [`/api/version-git-repos/${versionGitRepo.id}/commits`],
    enabled: !!versionGitRepo.id,
  });

  return (
    <Card key={versionGitRepo.id}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            <CardTitle className="text-base">{versionGitRepo.gitRepo?.name}</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {commits && Array.isArray(commits) ? commits.length : 0} commit(s)
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {commits && Array.isArray(commits) && commits.length > 0 ? (
          <div className="space-y-3">
            {commits.slice(0, 5).map((commit) => (
              <div key={commit.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  <Badge variant="secondary" className="text-xs font-mono">
                    {commit.hash.substring(0, 8)}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{commit.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {commit.author} • {commit.committedAt ? formatDate(commit.committedAt) : 'Date inconnue'}
                  </p>
                </div>
              </div>
            ))}
            {commits.length > 5 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                +{commits.length - 5} autres commits
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            Aucun commit trouvé
          </p>
        )}
      </CardContent>
    </Card>
  );
}

const statusColors = {
  development: "bg-gradient-to-r from-blue-50 to-indigo-100 text-blue-800 border-blue-200 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-200 dark:border-blue-700",
  testing: "bg-gradient-to-r from-yellow-50 to-amber-100 text-yellow-800 border-yellow-200 dark:from-yellow-900/30 dark:to-amber-900/30 dark:text-yellow-200 dark:border-yellow-700",
  preproduction: "bg-gradient-to-r from-purple-50 to-violet-100 text-purple-800 border-purple-200 dark:from-purple-900/30 dark:to-violet-900/30 dark:text-purple-200 dark:border-purple-700",
  production: "bg-gradient-to-r from-green-50 to-emerald-100 text-green-800 border-green-200 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-200 dark:border-green-700",
  open: "bg-gradient-to-r from-blue-50 to-indigo-100 text-blue-800 border-blue-200 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-200 dark:border-blue-700",
  in_progress: "bg-gradient-to-r from-yellow-50 to-amber-100 text-yellow-800 border-yellow-200 dark:from-yellow-900/30 dark:to-amber-900/30 dark:text-yellow-200 dark:border-yellow-700",
  approved: "bg-gradient-to-r from-green-50 to-emerald-100 text-green-800 border-green-200 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-200 dark:border-green-700",
  rejected: "bg-gradient-to-r from-red-50 to-rose-100 text-red-800 border-red-200 dark:from-red-900/30 dark:to-rose-900/30 dark:text-red-200 dark:border-red-700",
  closed: "bg-gradient-to-r from-gray-50 to-slate-100 text-gray-800 border-gray-200 dark:from-gray-900/30 dark:to-slate-900/30 dark:text-gray-200 dark:border-gray-700",
  // Version statuses with enhanced styling
  en_cours_arb: "bg-gradient-to-r from-orange-50 to-amber-100 text-orange-800 border-orange-200 dark:from-orange-900/30 dark:to-amber-900/30 dark:text-orange-200 dark:border-orange-700",
  en_developpement: "bg-gradient-to-r from-blue-50 to-cyan-100 text-blue-800 border-blue-200 dark:from-blue-900/30 dark:to-cyan-900/30 dark:text-blue-200 dark:border-blue-700",
  a_deployer_recette: "bg-gradient-to-r from-violet-50 to-purple-100 text-violet-800 border-violet-200 dark:from-violet-900/30 dark:to-purple-900/30 dark:text-violet-200 dark:border-violet-700",
  recette_en_cours: "bg-gradient-to-r from-indigo-50 to-blue-100 text-indigo-800 border-indigo-200 dark:from-indigo-900/30 dark:to-blue-900/30 dark:text-indigo-200 dark:border-indigo-700",
  a_deployer_preprod: "bg-gradient-to-r from-teal-50 to-cyan-100 text-teal-800 border-teal-200 dark:from-teal-900/30 dark:to-cyan-900/30 dark:text-teal-200 dark:border-teal-700",
  preprod_en_cours: "bg-gradient-to-r from-emerald-50 to-green-100 text-emerald-800 border-emerald-200 dark:from-emerald-900/30 dark:to-green-900/30 dark:text-emerald-200 dark:border-emerald-700",
  a_deployer_production: "bg-gradient-to-r from-green-50 to-lime-100 text-green-800 border-green-200 dark:from-green-900/30 dark:to-lime-900/30 dark:text-green-200 dark:border-green-700",
  merge_git_a_faire: "bg-gradient-to-r from-purple-50 to-pink-100 text-purple-800 border-purple-200 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-200 dark:border-purple-700",
  annule: "bg-gradient-to-r from-red-50 to-rose-100 text-red-800 border-red-200 dark:from-red-900/30 dark:to-rose-900/30 dark:text-red-200 dark:border-red-700",
  hotfix_a_prevoir: "bg-gradient-to-r from-amber-50 to-orange-100 text-amber-800 border-amber-200 dark:from-amber-900/30 dark:to-orange-900/30 dark:text-amber-200 dark:border-amber-700",
  termine: "bg-gradient-to-r from-green-50 to-emerald-100 text-green-800 border-green-200 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-200 dark:border-green-700",
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

function GitRepoSection({ versionGitRepo, onAddCommit, onAddProcedure }: { 
  versionGitRepo: any; 
  onAddCommit: (versionGitRepoId: number) => void;
  onAddProcedure: (versionGitRepoId: number, type: string) => void;
}) {
  const { data: procedures } = useQuery<ProceduresByType>({
    queryKey: [`/api/version-git-repos/${versionGitRepo.id}/procedures`],
    enabled: !!versionGitRepo.id,
  });
  
  const { data: commits } = useQuery({
    queryKey: [`/api/version-git-repos/${versionGitRepo.id}/commits`],
    enabled: !!versionGitRepo.id,
  });

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-700/50 hover:shadow-xl transition-all duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
              <GitBranch className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {versionGitRepo.gitRepo?.name}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                {versionGitRepo.gitRepo?.lastCommitHash ? (
                  <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                    {versionGitRepo.gitRepo.lastCommitHash.substring(0, 7)}
                  </span>
                ) : 'Aucun commit'}
                {commits && Array.isArray(commits) && (
                  <span className="ml-2">• {commits.length} commit(s)</span>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onAddCommit(versionGitRepo.id)}
              className="hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20"
            >
              <GitCommit className="w-4 h-4 mr-2" />
              Commit
            </Button>
            {versionGitRepo.gitRepo?.url && (
              <Button variant="outline" size="sm" asChild className="hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-900/20">
                <a href={versionGitRepo.gitRepo.url} target="_blank" rel="noopener noreferrer">
                  <GitBranch className="w-4 h-4 mr-2" />
                  Repo
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Settings className="w-4 h-4 text-purple-500" />
                Procédures de déploiement
              </h4>
              <div className="flex gap-2 flex-wrap">
                {Object.keys(procedureTypeLabels).map((type) => {
                  const Icon = procedureTypeIcons[type as keyof typeof procedureTypeIcons];
                  return (
                    <Button
                      key={type}
                      variant="outline"
                      size="sm"
                      onClick={() => onAddProcedure(versionGitRepo.id, type)}
                      className="text-xs hover:bg-purple-50 hover:border-purple-200 dark:hover:bg-purple-900/20"
                    >
                      <Icon className="w-3 h-3 mr-1" />
                      {procedureTypeLabels[type as keyof typeof procedureTypeLabels]}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
          
          {procedures && Object.entries(procedures).some(([, procedureList]) => procedureList.length > 0) ? (
            <div className="space-y-4">
              {Object.entries(procedures).map(([type, procedureList]) => (
                procedureList.length > 0 && (
                  <div key={type} className="space-y-3">
                    <h5 className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2">
                      {procedureTypeLabels[type as keyof typeof procedureTypeLabels]} 
                      <Badge variant="outline" className="text-xs">
                        {procedureList.length}
                      </Badge>
                    </h5>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {procedureList.map((procedure) => (
                        <ProcedureCard 
                          key={procedure.id} 
                          procedure={procedure} 
                          repoName={versionGitRepo.gitRepo?.name || ''} 
                        />
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <Settings className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aucune procédure de déploiement configurée
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Cliquez sur les boutons ci-dessus pour ajouter des procédures
              </p>
            </div>
          )}
          
          {commits && Array.isArray(commits) && commits.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Commits</h4>
              <div className="space-y-2">
                {commits.map((commit: any) => (
                  <Card key={commit.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-mono text-sm">{commit.hash.substring(0, 7)}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">{commit.message}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {commit.author} • {formatDate(commit.committedAt)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
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
  const [selectedProcedureType, setSelectedProcedureType] = useState<string>('');

  const { data: version, isLoading: versionLoading } = useQuery<ProjectVersionWithDetails>({
    queryKey: [`/api/projects/${projectId}/versions/${versionId}`],
    enabled: !!projectId && !!versionId,
  });

  // Récupérer les détails de la release si la version en a une
  const { data: release } = useQuery<any>({
    queryKey: [`/api/releases/${version?.releaseId}`],
    enabled: !!version?.releaseId,
  });

  // Handlers for commits and procedures
  const handleAddCommit = (versionGitRepoId: number) => {
    setSelectedGitRepoForCommit(versionGitRepoId);
    setSelectedCommit(null);
    setCommitModalOpen(true);
  };

  const handleAddProcedure = (versionGitRepoId: number, type: string) => {
    setSelectedGitRepoForProcedure(versionGitRepoId);
    setSelectedProcedureType(type);
    setSelectedProcedure(null);
    setProcedureModalOpen(true);
  };

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex">
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
                Changer de release
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
          <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-900/10">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Version {version.version}
                  </CardTitle>
                  <CardDescription className="text-lg mt-2 text-gray-600 dark:text-gray-300">
                    {version.description}
                  </CardDescription>
                  {version.releaseId && release && (
                    <div className="flex items-center gap-2 mt-3">
                      <LinkIcon className="w-4 h-4 text-blue-500" />
                      <a 
                        href={`/releases/${version.releaseId}`} 
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline font-medium"
                      >
                        Release: {release?.name || `#${version.releaseId}`}
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={`px-4 py-2 text-sm font-medium ${statusColors[version.status as keyof typeof statusColors] || statusColors.en_developpement}`}>
                    {statusLabels[version.status as keyof typeof statusLabels] || version.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-700/30 rounded-lg">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Date de création</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {version.createdAt ? formatDate(version.createdAt) : 'Date inconnue'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-700/30 rounded-lg">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <GitBranch className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Repositories</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {version.versionGitRepos?.length || 0} repo(s)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-gray-700/30 rounded-lg">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Rocket className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Release</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {version.releaseId ? 'Associée' : 'Non associée'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Version Details */}
          <Tabs defaultValue="repositories" className="w-full">
            <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <TabsTrigger value="repositories" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                <GitBranch className="w-4 h-4 mr-2" />
                Repositories
              </TabsTrigger>
              <TabsTrigger value="commits" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                <GitCommit className="w-4 h-4 mr-2" />
                Commits
              </TabsTrigger>
              <TabsTrigger value="pvs" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                <FileText className="w-4 h-4 mr-2" />
                PVs
              </TabsTrigger>
              <TabsTrigger value="cab" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                <Shield className="w-4 h-4 mr-2" />
                CAB
              </TabsTrigger>
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
              
              {version.versionGitRepos && version.versionGitRepos.length > 0 ? (                version.versionGitRepos.map((versionGitRepo) => (
                  <GitRepoSection 
                    key={versionGitRepo.id} 
                    versionGitRepo={versionGitRepo}
                    onAddCommit={handleAddCommit}
                    onAddProcedure={handleAddProcedure}
                  />
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

            <TabsContent value="commits" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Tous les commits</h3>
              </div>
              
              {version.versionGitRepos && version.versionGitRepos.length > 0 ? (
                version.versionGitRepos.map((versionGitRepo) => (
                  <RepoCommitsCard key={versionGitRepo.id} versionGitRepo={versionGitRepo} />
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
      
      <CommitModal
        open={commitModalOpen}
        onOpenChange={setCommitModalOpen}
        versionGitRepoId={selectedGitRepoForCommit}
        projectId={projectId}
        versionId={versionId}
        commit={selectedCommit}
      />
      
      <ProcedureModal
        isOpen={procedureModalOpen}
        onClose={() => setProcedureModalOpen(false)}
        versionGitRepoId={selectedGitRepoForProcedure}
        type={selectedProcedureType}
        existingProcedure={selectedProcedure}
        onSuccess={() => {
          setProcedureModalOpen(false);
          setSelectedProcedure(null);
          setSelectedProcedureType('');
        }}
      />
    </div>
  );
}