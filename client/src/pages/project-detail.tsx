import React, { useMemo, useState } from "react";
import { useParams, useLocation } from "wouter";
import { sanitizeHtml } from "@/lib/sanitize";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, FileText, Users, Plus, Link as LinkIcon, Activity, Layers, Target, Settings, GitBranch, CheckCircle, Clock, Terminal, Upload, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { formatDate } from "@/lib/constants";
import { VersionModal } from "@/components/modals/version-modal";
import { VersionReleaseModal } from "@/components/modals/version-release-modal";
import { ProjectModal } from "@/components/modals/project-modal";
import type { 
 ProjectWithTeam, 
 ProjectVersionWithDetails,
 ProceduresByType,
 Procedure 
} from "@shared/schema";

// Status styling with modern gradients and colors
const statusColors = {
 development: "bg-gradient-to-r from-blue-50 to-indigo-100 text-blue-800 border-blue-200",
 testing: "bg-gradient-to-r from-yellow-50 to-amber-100 text-yellow-800 border-yellow-200",
 preproduction: "bg-gradient-to-r from-purple-50 to-violet-100 text-purple-800 border-purple-200",
 production: "bg-gradient-to-r from-green-50 to-emerald-100 text-green-800 border-green-200",
 archived: "bg-gradient-to-r from-gray-50 to-slate-100 text-gray-800 border-gray-200",
 open: "bg-gradient-to-r from-blue-50 to-indigo-100 text-blue-800 border-blue-200",
 in_progress: "bg-gradient-to-r from-yellow-50 to-amber-100 text-yellow-800 border-yellow-200",
 approved: "bg-gradient-to-r from-green-50 to-emerald-100 text-green-800 border-green-200",
 rejected: "bg-gradient-to-r from-red-50 to-rose-100 text-red-800 border-red-200",
 closed: "bg-gradient-to-r from-gray-50 to-slate-100 text-gray-800 border-gray-200",
 // Version statuses with enhanced styling
 en_cours_arb: "bg-gradient-to-r from-orange-50 to-amber-100 text-orange-800 border-orange-200",
 en_developpement: "bg-gradient-to-r from-blue-50 to-cyan-100 text-blue-800 border-blue-200",
 a_deployer_recette: "bg-gradient-to-r from-violet-50 to-purple-100 text-violet-800 border-violet-200",
 recette_en_cours: "bg-gradient-to-r from-indigo-50 to-blue-100 text-indigo-800 border-indigo-200",
 a_deployer_preprod: "bg-gradient-to-r from-teal-50 to-cyan-100 text-teal-800 border-teal-200",
 preprod_en_cours: "bg-gradient-to-r from-emerald-50 to-green-100 text-emerald-800 border-emerald-200",
 a_deployer_production: "bg-gradient-to-r from-green-50 to-lime-100 text-green-800 border-green-200",
 merge_git_a_faire: "bg-gradient-to-r from-purple-50 to-pink-100 text-purple-800 border-purple-200",
 annule: "bg-gradient-to-r from-red-50 to-rose-100 text-red-800 border-red-200",
 hotfix_a_prevoir: "bg-gradient-to-r from-amber-50 to-orange-100 text-amber-800 border-amber-200",
 termine: "bg-gradient-to-r from-green-50 to-emerald-100 text-green-800 border-green-200",
};

const statusLabels = {
 development: "Développement",
 testing: "Recette",
 preproduction: "Pré-production",
 production: "Production",
 archived: "Archivé",
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

// Procedure type icons and labels (aligné avec version-detail)
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

// Procedure Card Component
function ProcedureCard({ procedure }: { procedure: Procedure }) {
 const Icon = procedureTypeIcons[procedure.type as keyof typeof procedureTypeIcons];
 
 return (
 <Card className={`border-l-4 ${procedure.isCompleted ? 'border-l-green-500 bg-green-50' : 'border-l-blue-500'} hover:shadow-md transition-shadow duration-200`}>
 <CardHeader className="pb-3">
 <div className="flex items-start justify-between">
 <div className="flex items-center gap-2">
 {Icon && <Icon className="w-4 h-4" />}
 <CardTitle className="text-sm">{procedure.title}</CardTitle>
 </div>
 <div className="flex items-center gap-2">
 {procedure.type in procedureTypeLabels && (
 <Badge variant="outline" className="text-xs">
 {procedureTypeLabels[procedure.type as keyof typeof procedureTypeLabels]}
 </Badge>
 )}
 {procedure.isCompleted ? (
 <CheckCircle className="w-4 h-4 text-green-600" />
 ) : (
 <Clock className="w-4 h-4 text-orange-600" />
 )}
 </div>
 </div>
 </CardHeader>
 {procedure.content && (
 <CardContent className="pt-0">
 <div
 className="text-sm prose prose-sm max-w-none"
 dangerouslySetInnerHTML={{ __html: sanitizeHtml(procedure.content) }}
 />
 </CardContent>
 )}
 </Card>
 );
}

// Enhanced version status icons
const getVersionStatusIcon = (status: string) => {
 switch (status) {
 case 'en_cours_arb':
 return <Activity className="w-4 h-4" />;
 case 'en_developpement':
 return <Layers className="w-4 h-4" />;
 case 'a_deployer_recette':
 case 'recette_en_cours':
 return <Target className="w-4 h-4" />;
 case 'a_deployer_preprod':
 case 'preprod_en_cours':
 return <Target className="w-4 h-4" />;
 case 'a_deployer_production':
 return <Target className="w-4 h-4" />;
 case 'termine':
 return <Target className="w-4 h-4" />;
 default:
 return <Activity className="w-4 h-4" />;
 }
};

export default function ProjectDetail() {
 const params = useParams();
 const [, setLocation] = useLocation();
 const projectId = parseInt(params.id || "0");
 const [versionModalOpen, setVersionModalOpen] = useState(false);
 const [releaseModalOpen, setReleaseModalOpen] = useState(false);
 const [projectModalOpen, setProjectModalOpen] = useState(false);
 const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
 const [selectedVersionName, setSelectedVersionName] = useState<string>("");
 const [currentReleaseId, setCurrentReleaseId] = useState<number | null>(null);

 const { data: project, isLoading: projectLoading } = useQuery<ProjectWithTeam>({
 queryKey: [`/api/projects/${projectId}`],
 enabled: !!projectId,
 });

 const { data: versions, isLoading: versionsLoading } = useQuery<ProjectVersionWithDetails[]>({
 queryKey: [`/api/projects/${projectId}/versions`],
 enabled: !!projectId,
 });

 // Versions triées décroissantes par numéro sémantique strict (ex: 2.10.0 > 2.2.0 > 2.1.9)
 const sortedVersions = useMemo(() => {
 const toParts = (v?: string) => (String(v || "0.0.0").trim().replace(/^v/i, "")).split(".").map((n) => Number(n) || 0);
 return (versions || []).slice().sort((a, b) => {
 const ap = toParts(a.version as any);
 const bp = toParts(b.version as any);
 for (let i = 0; i < Math.max(ap.length, bp.length); i++) {
 const diff = (bp[i] || 0) - (ap[i] || 0);
 if (diff !== 0) return diff;
 }
 // Égalité: plus récent d'abord
 const ad = a.createdAt ? new Date(a.createdAt as any).getTime() : 0;
 const bd = b.createdAt ? new Date(b.createdAt as any).getTime() : 0;
 return bd - ad;
 });
 }, [versions]);

 const { data: releases = [] } = useQuery<any[]>({
 queryKey: ["/api/releases"],
 enabled: !!projectId,
 });

 if (projectLoading || versionsLoading) {
 return (
 <div className="min-h-screen bg-background flex">
 <Sidebar />
 <main className="flex-1 overflow-auto ml-64">
 <Header 
 title="Chargement..." 
 subtitle="Chargement des détails du projet"
 />
 <div className="p-4 md:p-6 lg:p-8 space-y-6">
 <div className="space-y-4">
 <Skeleton className="h-32 w-full" />
 <Skeleton className="h-48 w-full" />
 <Skeleton className="h-64 w-full" />
 </div>
 </div>
 </main>
 </div>
 );
 }

 if (!project) {
 return (
 <div className="min-h-screen bg-background flex">
 <Sidebar />
 <main className="flex-1 overflow-auto ml-64">
 <Header 
 title="Projet introuvable" 
 subtitle="Le projet demandé n'existe pas"
 />
 <div className="p-4 md:p-6 lg:p-8">
 <Card className="max-w-md mx-auto shadow-lg border-0 bg-white/80 backdrop-blur-sm">
 <CardContent className="pt-6 text-center">
 <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-rose-200 rounded-full flex items-center justify-center mx-auto mb-4">
 <FileText className="w-8 h-8 text-red-600" />
 </div>
 <h3 className="text-xl font-semibold text-gray-900 mb-2">
 Projet introuvable
 </h3>
 <p className="text-gray-600 mb-6">
 Le projet avec l'ID {projectId} n'existe pas ou vous n'avez pas les permissions pour y accéder.
 </p>
 <Button 
 onClick={() => setLocation("/projects")}
 className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
 >
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

 // Get next action for version status
 const getNextAction = (status: string) => {
 switch(status) {
 case 'en_cours_arb':
 return 'ARB en cours';
 case 'en_developpement':
 return 'En développement';
 case 'a_deployer_recette':
 return 'Déploiement recette à faire';
 case 'recette_en_cours':
 return 'Recette en cours';
 case 'a_deployer_preprod':
 return 'Déploiement préprod à faire';
 case 'preprod_en_cours':
 return 'Préprod en cours';
 case 'a_deployer_production':
 return 'Déploiement production à faire';
 case 'merge_git_a_faire':
 return 'Merge git à faire';
 case 'termine':
 return 'Terminé';
 case 'annule':
 return 'Annulé';
 case 'hotfix_a_prevoir':
 return 'Hotfix à prévoir';
 default:
 return 'Statut inconnu';
 }
 };

 // Progression basée sur critères:
 // - +20% si release associée
 // - +20% si au moins un repo associé
 // - +20% si les 4 PVs fournis (2 recette + 2 préprod)
 // - +20% si 2 CAB créés (recette + préprod)
 // - +20% si au moins une procédure de chaque repo ajoutée
 // Règle spéciale: sans les 2 PVs préprod et le CAB préprod, on est à 80% => flèche "Recette finalisée"
 function computeVersionProgress(v: ProjectVersionWithDetails) {
 let progress = 0;
 const hasRelease = v.releaseId !== null && v.releaseId !== undefined && Number(v.releaseId) > 0;
 const repos = (v as any).versionGitRepos || [];
 const hasAtLeastOneRepo = repos.length > 0;
 const pvs = (v as any).pvs || [];
 const pvByCat: Record<string, number> = {};
 for (const pv of pvs) pvByCat[pv.category] = (pvByCat[pv.category] || 0) + 1;
 const pvFonctionnelRecette = pvByCat['pv_fonctionnel_recette'] ? 1 : 0;
 const pvMetierRecette = pvByCat['pv_metier_recette'] ? 1 : 0;
 const pvConformitePreprod = pvByCat['pv_conformite_preprod'] ? 1 : 0;
 const pvTestsPreprod = pvByCat['pv_tests_homologation_preprod'] ? 1 : 0;
 const all4PVs = pvFonctionnelRecette && pvMetierRecette && pvConformitePreprod && pvTestsPreprod;

 const cabs = (v as any).cabs || [];
 const hasCabAny = cabs.length > 0; // CAB "recette" approximé par la présence de n'importe quel CAB
 const hasCabPreprod = cabs.some((c: any) => String(c.environment) === 'preprod');
 const twoCabs = hasCabAny && hasCabPreprod;

 const hasProceduresPerRepo = hasAtLeastOneRepo && repos.every((r: any) => {
 const procs = r.procedures;
 if (!procs) return false;
 // Supporte soit un tableau, soit un objet par type
 if (Array.isArray(procs)) return procs.length > 0;
 return Object.values(procs as any).some((arr: any) => Array.isArray(arr) && arr.length > 0);
 });

 if (hasRelease) progress += 20;
 if (hasAtLeastOneRepo) progress += 20;
 if (all4PVs) progress += 20; else {
 // Recette: considérer 2 PVs de recette comme 20% partiels, et 2 de préprod pour compléter ce bloc
 const hasBothRecettePVs = pvFonctionnelRecette && pvMetierRecette;
 const hasBothPreprodPVs = pvConformitePreprod && pvTestsPreprod;
 if (hasBothRecettePVs && !hasBothPreprodPVs) {
 // 10% partiels pour marquer l'avancement (optionnel). On garde la règle principale simple: bloc PV = 20% si 4 PVs
 }
 }
 if (twoCabs) progress += 20;
 if (hasProceduresPerRepo) progress += 20;

 // Forcer le palier 80% quand: release + repo + 2 PVs recette + au moins 1 CAB + procédures par repo
 const hasRecetteDone = hasRelease && hasAtLeastOneRepo && (pvFonctionnelRecette && pvMetierRecette) && hasCabAny && hasProceduresPerRepo;
 if (hasRecetteDone && progress < 80) progress = 80;

 // 100% quand tout est complet (incluant préprod)
 const allPreprodDone = hasCabPreprod && pvConformitePreprod && pvTestsPreprod;
 if (hasRecetteDone && allPreprodDone && progress < 100) progress = 100;

 return Math.min(progress, 100);
 }

 return (
 <div className="min-h-screen bg-background flex">
 <Sidebar />
 <main className="flex-1 overflow-auto ml-64">
 <Header 
 title={String(project?.name || '')}
 subtitle="Détails du projet"
 />
 
 <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
 {/* Project Header Card */}
 <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
 <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 h-2"></div>
 <CardHeader className="pb-4">
 <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
 <div className="flex-1">
 <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
 {String(project?.name || '')}
 </CardTitle>
 {project?.description && (
 <CardDescription className="text-base md:text-lg mt-2 text-gray-600">
 {String(project.description)}
 </CardDescription>
 )}
 </div>
 <div className="flex flex-wrap items-center gap-3">
 <Badge className={`px-4 py-2 text-sm font-medium border ${statusColors[String(project?.status) as keyof typeof statusColors] || statusColors.development}`}>
 {statusLabels[String(project?.status) as keyof typeof statusLabels] || String(project?.status)}
 </Badge>
 <Button
 variant="outline"
 size="sm"
 onClick={() => setProjectModalOpen(true)}
 className="flex items-center gap-2"
 >
 <Edit className="w-4 h-4" />
 Modifier
 </Button>
 </div>
 </div>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {project.team && (
 <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
 <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
 <Users className="w-5 h-5 text-white" />
 </div>
 <div>
 <p className="text-sm font-medium text-gray-600">Équipe</p>
 <p className="text-base font-semibold text-gray-900">
 {String(project?.team?.name || 'Non définie')}
 </p>
 </div>
 </div>
 )}
 <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
 <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
 <Calendar className="w-5 h-5 text-white" />
 </div>
 <div>
 <p className="text-sm font-medium text-gray-600">Créé le</p>
 <p className="text-base font-semibold text-gray-900">
 {project?.createdAt ? formatDate(String(project.createdAt)) : 'Date inconnue'}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-100">
 <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full flex items-center justify-center">
 <Layers className="w-5 h-5 text-white" />
 </div>
 <div>
 <p className="text-sm font-medium text-gray-600">Versions</p>
 <p className="text-base font-semibold text-gray-900">
 {versions?.length || 0} version{(versions?.length || 0) > 1 ? 's' : ''}
 </p>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Project Versions */}
 <div className="space-y-6">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <h2 className="text-2xl font-bold text-gray-900">Versions du projet</h2>
 <Button 
 onClick={() => setVersionModalOpen(true)}
 className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
 >
 <Plus className="w-4 h-4 mr-2" />
 Nouvelle version
 </Button>
 </div>
 
 {sortedVersions && sortedVersions.length > 0 ? (
 <div className="grid gap-4">
 {sortedVersions.map((version, index) => {
 const progress = computeVersionProgress(version as any);
 
 return (
 <Card key={String(version.id)} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200 cursor-pointer group" onClick={() => setLocation(`/projects/${projectId}/versions/${String(version.id)}`)}>
 <CardContent className="p-6">
 <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
 <div className="flex-1">
 <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-3">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
 <span className="text-white font-bold text-lg">v{String(version.version)}</span>
 </div>
 <div>
 <h3 className="text-xl font-semibold text-gray-900">
 Version {String(version.version)}
 </h3>
 <p className="text-sm text-gray-600">
 {getNextAction(String(version.status))}
 </p>
 </div>
 </div>
 <div className="flex flex-wrap items-center gap-2">
 <Badge className={`px-3 py-1 text-xs font-medium border ${statusColors[String(version.status) as keyof typeof statusColors] || statusColors.development}`}>
 {getVersionStatusIcon(String(version.status))}
 <span className="ml-1">{statusLabels[String(version.status) as keyof typeof statusLabels] || String(version.status)}</span>
 </Badge>
 {version.releaseId && String(version.releaseId) !== '0' ? (
 <Badge 
 variant="secondary" 
 className="bg-green-100 text-green-800 cursor-pointer hover:bg-green-200 transition-colors"
 onClick={(e) => {
 e.stopPropagation();
 const release = releases.find(r => r.id === Number(version.releaseId));
 if (release) {
 window.location.href = `/releases/${release.id}`;
 }
 }}
 title="Cliquer pour voir la release"
 >
 Release: {releases.find(r => r.id === Number(version.releaseId))?.releaseId || String(version.releaseId)}
 </Badge>
 ) : (
 <Badge variant="outline" className="text-gray-500 border-gray-300">
 Aucune release
 </Badge>
 )}
 <Button
 size="sm"
 variant="outline"
 className="ml-auto group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors"
 onClick={(e) => {
 e.stopPropagation();
 setSelectedVersionId(Number(version.id));
 setSelectedVersionName(String(version.version));
 setCurrentReleaseId(version.releaseId && String(version.releaseId) !== '0' ? Number(version.releaseId) : null);
 setReleaseModalOpen(true);
 }}
 >
 <LinkIcon className="w-4 h-4 mr-2" />
 Changer de release
 </Button>
 </div>
 </div>
 
 {/* Progress Bar */}
 <div className="mb-3">
 <div className="flex items-center justify-between mb-2">
 <span className="text-sm font-medium text-gray-700">Progression</span>
 <span className="text-sm font-medium text-gray-700">{progress}%</span>
 </div>
 <div className="relative w-full bg-gray-200 rounded-full h-2">
 <div 
 className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300" 
 style={{ width: `${progress}%` }}
 />
 {/* Marqueurs 80% / 100% */}
 {progress >= 80 && progress < 100 && (
 <div className="absolute -top-6 left-[80%] -translate-x-1/2 text-xs text-amber-600 flex items-center gap-1">
 <span className="inline-block w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-8 border-b-amber-400" />
 Recette finalisée
 </div>
 )}
 {progress >= 100 && (
 <div className="absolute -top-6 right-0 text-xs text-emerald-600 flex items-center gap-1">
 <span className="inline-block w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-8 border-b-emerald-400" />
 Pré-production finalisée
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>
 );
 })}
 </div>
 ) : (
 <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
 <CardContent className="pt-12 pb-12 text-center">
 <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
 <FileText className="w-10 h-10 text-gray-400" />
 </div>
 <h3 className="text-xl font-semibold text-gray-900 mb-3">
 Aucune version
 </h3>
 <p className="text-gray-600 mb-6">
 Ce projet n'a pas encore de versions définies. Créez votre première version pour commencer.
 </p>
 <Button 
 onClick={() => setVersionModalOpen(true)}
 className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
 >
 <Plus className="w-4 h-4 mr-2" />
 Créer la première version
 </Button>
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

 <ProjectModal
 open={projectModalOpen}
 onOpenChange={setProjectModalOpen}
 project={project}
 />
 
 {selectedVersionId && (
 <VersionReleaseModal
 open={releaseModalOpen}
 onOpenChange={setReleaseModalOpen}
 projectId={projectId}
 versionId={selectedVersionId}
 versionName={selectedVersionName}
 currentReleaseId={currentReleaseId}
 />
 )}
 </div>
 );
}