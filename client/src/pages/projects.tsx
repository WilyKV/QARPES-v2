import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { NotificationBanner } from "@/components/layout/notification-banner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ProjectModal } from "@/components/modals/project-modal";
import { Plus, Search, Edit, Trash2, ExternalLink, MoreHorizontal, Users, Calendar, ArrowRight, FolderOpen, Code2, GitBranch, Activity } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { ProjectWithTeam } from "@shared/schema";

const statusColors = {
 development: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm",
 testing: "bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-sm",
 preproduction: "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm",
 production: "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-sm",
};

const statusLabels = {
 development: "Développement",
 testing: "Recette",
 preproduction: "Pré-production",
 production: "Production",
};

const statusIcons = {
 development: Code2,
 testing: Activity,
 preproduction: GitBranch,
 production: FolderOpen,
};

// Composant pour afficher et naviguer vers la dernière version d'un projet
function ProjectVersionBadge({ projectId }: { projectId: number }) {
 const { data: versions, isLoading, error } = useQuery({
 queryKey: [`/api/projects/${projectId}/versions`],
 enabled: !!projectId,
 staleTime: 30000,
 });

 if (isLoading) {
 return (
 <div className="w-12 h-5 bg-gray-200 rounded animate-pulse"></div>
 );
 }

 if (error) {
 return null;
 }

 const latestVersion = Array.isArray(versions) && versions.length > 0 ? versions[0] : null;

 if (!latestVersion) {
 return (
 <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600">
 Aucune version
 </Badge>
 );
 }

 return (
 <Badge
 variant="default" 
 className="text-xs cursor-pointer hover:scale-105 transition-transform bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-sm"
 onClick={(e) => {
 e.stopPropagation();
 window.location.href = `/projects/${projectId}/versions/${latestVersion.id}`;
 }}
 title={`Cliquer pour aller à la version ${latestVersion.version}`}
 >
 v{latestVersion.version}
 </Badge>
 );
}

export default function Projects() {
 const { toast } = useToast();
 const { isAuthenticated, isLoading } = useAuth();
 const queryClient = useQueryClient();
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingProject, setEditingProject] = useState<ProjectWithTeam | null>(null);
 const [searchTerm, setSearchTerm] = useState("");

 useEffect(() => {
 if (!isLoading && !isAuthenticated) {
 toast({
 title: "Non autorisé",
 description: "Vous devez être connecté pour accéder aux projets. Redirection en cours...",
 variant: "destructive",
 });
 setTimeout(() => {
 window.location.href = "/api/login";
 }, 500);
 return;
 }
 }, [isAuthenticated, isLoading, toast]);

 const { data: projects, isLoading: projectsLoading } = useQuery({
 queryKey: ["/api/projects"],
 retry: false,
 });

 const deleteMutation = useMutation({
 mutationFn: async (id: number) => {
 await apiRequest("DELETE", `/api/projects/${id}`);
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
 toast({
 title: "Succès",
 description: "Projet supprimé avec succès",
 });
 },
 onError: (error) => {
 if (isUnauthorizedError(error)) {
 toast({
 title: "Non autorisé",
 description: "Vous êtes déconnecté. Reconnexion en cours...",
 variant: "destructive",
 });
 setTimeout(() => {
 window.location.href = "/api/login";
 }, 500);
 return;
 }
 toast({
 title: "Erreur",
 description: "Impossible de supprimer le projet",
 variant: "destructive",
 });
 },
 });

 const handleEdit = (project: ProjectWithTeam) => {
 setEditingProject(project);
 setIsModalOpen(true);
 };

 const handleDelete = async (id: number) => {
 if (confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) {
 deleteMutation.mutate(id);
 }
 };

 const handleModalClose = () => {
 setIsModalOpen(false);
 setEditingProject(null);
 };

 const filteredProjects = Array.isArray(projects) ? projects.filter((project: ProjectWithTeam) =>
 String(project.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
 String(project.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
 String(project.team?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
 ) : [];

 const columns = [
 {
 accessorKey: "name",
 header: "Nom",
 cell: ({ row }: any) => (
 <div>
 <div className="font-medium">{row.getValue("name")}</div>
 {row.original.description && (
 <div className="text-sm text-gray-500 truncate max-w-xs">
 {row.original.description}
 </div>
 )}
 </div>
 ),
 },
 {
 accessorKey: "status",
 header: "Statut",
 cell: ({ row }: any) => {
 const status = row.getValue("status") as keyof typeof statusColors;
 return (
 <Badge className={statusColors[status] || statusColors.development}>
 {statusLabels[status] || status}
 </Badge>
 );
 },
 },
 {
 accessorKey: "team",
 header: "Équipe",
 cell: ({ row }: any) => (
 <div>
 {row.original.team?.name || (
 <span className="text-gray-500">Aucune équipe</span>
 )}
 </div>
 ),
 },
 {
 accessorKey: "repositoryUrl",
 header: "Repository",
 cell: ({ row }: any) => {
 const url = row.getValue("repositoryUrl");
 return url ? (
 <Button variant="ghost" size="sm" asChild>
 <a href={url} target="_blank" rel="noopener noreferrer">
 <ExternalLink className="h-4 w-4" />
 </a>
 </Button>
 ) : (
 <span className="text-gray-500">-</span>
 );
 },
 },
 {
 accessorKey: "createdAt",
 header: "Créé le",
 cell: ({ row }: any) => {
 const date = row.getValue("createdAt");
 return date ? new Date(date).toLocaleDateString("fr-FR") : "-";
 },
 },
 {
 id: "actions",
 header: "Actions",
 cell: ({ row }: any) => (
 <div className="flex items-center space-x-2">
 <Button
 variant="ghost"
 size="sm"
 onClick={() => handleEdit(row.original)}
 >
 <Edit className="h-4 w-4" />
 </Button>
 <Button
 variant="ghost"
 size="sm"
 onClick={() => handleDelete(row.original.id)}
 disabled={deleteMutation.isPending}
 >
 <Trash2 className="h-4 w-4" />
 </Button>
 </div>
 ),
 },
 ];

 if (isLoading || !isAuthenticated) {
 return (
 <div className="min-h-screen flex items-center justify-center">
 <div className="text-center">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
 <p className="mt-2 text-gray-600">Chargement...</p>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
 <Sidebar />
 
 <main className="flex-1 overflow-auto ml-64">
 <Header 
 title="Projets" 
 subtitle="Gestion des projets avec statuts et équipes"
 actions={
 <Button onClick={() => setIsModalOpen(true)} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg">
 <Plus className="h-4 w-4 mr-2" />
 Nouveau Projet
 </Button>
 }
 />

 <div className="p-6 space-y-6">
 <NotificationBanner />

 {/* Search and Filters */}
 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
 <Input
 placeholder="Rechercher par nom, description ou équipe..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
 />
 </div>
 </div>

 {/* Projects Grid */}
 {projectsLoading ? (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
 {[...Array(8)].map((_, i) => (
 <Card key={i} className="animate-pulse">
 <CardHeader>
 <div className="h-4 bg-gray-200 rounded w-3/4"></div>
 <div className="h-3 bg-gray-200 rounded w-1/2"></div>
 </CardHeader>
 <CardContent>
 <div className="h-3 bg-gray-200 rounded mb-2"></div>
 <div className="h-3 bg-gray-200 rounded w-2/3"></div>
 </CardContent>
 </Card>
 ))}
 </div>
 ) : filteredProjects.length === 0 ? (
 <div className="text-center py-16">
 <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-6">
 <FolderOpen className="w-10 h-10 text-blue-600" />
 </div>
 <h3 className="text-xl font-semibold text-gray-900 mb-2">
 {searchTerm ? "Aucun projet trouvé" : "Aucun projet"}
 </h3>
 <p className="text-gray-500 mb-6 max-w-sm mx-auto">
 {searchTerm ? "Aucun projet ne correspond à votre recherche." : "Commencez par créer votre premier projet pour organiser votre travail."}
 </p>
 {!searchTerm && (
 <Button onClick={() => setIsModalOpen(true)} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg">
 <Plus className="h-4 w-4 mr-2" />
 Créer un projet
 </Button>
 )}
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
 {filteredProjects.map((project: ProjectWithTeam) => {
 const StatusIcon = statusIcons[String(project.status) as keyof typeof statusIcons] || Code2;
 
 return (
 <Card 
 key={Number(project.id)} 
 className="hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer group bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl"
 onClick={() => window.location.href = `/projects/${project.id}`}
 >
 <CardHeader className="pb-3 relative">
 <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
 <DropdownMenu>
 <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
 <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
 <MoreHorizontal className="w-4 h-4" />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-48">
 <DropdownMenuItem onClick={(e) => {
 e.stopPropagation();
 handleEdit(project);
 }}>
 <Edit className="w-4 h-4 mr-2" />
 Modifier
 </DropdownMenuItem>
 <DropdownMenuItem 
 onClick={(e) => {
 e.stopPropagation();
 handleDelete(Number(project.id));
 }}
 className="text-red-600 focus:text-red-600"
 >
 <Trash2 className="w-4 h-4 mr-2" />
 Supprimer
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 
 <div className="flex items-start gap-3">
 <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-200 flex-shrink-0 group-hover:scale-110 transition-transform">
 <StatusIcon className="w-6 h-6 text-blue-600" />
 </div>
 <div className="flex-1 min-w-0">
 <CardTitle className="text-xl font-semibold group-hover:text-blue-600 transition-colors truncate">
 {String(project.name)}
 </CardTitle>
 <div className="flex items-center gap-2 mt-2">
 {project.team && (
 <CardDescription className="flex items-center text-sm">
 <Users className="w-4 h-4 mr-1" />
 {String(project.team.name)}
 </CardDescription>
 )}
 </div>
 </div>
 </div>
 </CardHeader>
 
 <CardContent className="space-y-4">
 {project.description && (
 <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
 {String(project.description)}
 </p>
 )}
 
 <div className="flex items-center justify-between">
 <Badge 
 className={statusColors[String(project.status) as keyof typeof statusColors] || statusColors.development}
 >
 {statusLabels[String(project.status) as keyof typeof statusLabels] || String(project.status)}
 </Badge>
 
 <div className="flex items-center text-sm text-gray-500">
 <Calendar className="w-4 h-4 mr-1" />
 {project.createdAt ? new Date(String(project.createdAt)).toLocaleDateString('fr-FR') : '-'}
 </div>
 </div>

 <div className="pt-2 border-t border-gray-100">
 <div className="flex items-center justify-between">
 <span className="text-sm font-medium text-gray-700">Dernière version :</span>
 <ProjectVersionBadge projectId={Number(project.id)} />
 </div>
 </div>
 </CardContent>
 </Card>
 );
 })}
 </div>
 )}
 </div>
 </main>

 <ProjectModal 
 open={isModalOpen} 
 onOpenChange={handleModalClose}
 project={editingProject}
 />
 </div>
 );
}
