import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ProjectModal } from "@/components/modals/project-modal";
import { Plus, Search, Edit, Trash2, ExternalLink, MoreHorizontal, Users, Calendar, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { ProjectWithTeam } from "@shared/schema";

const statusColors = {
  development: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  testing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  preproduction: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  production: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
};

const statusLabels = {
  development: "Développement",
  testing: "Recette",
  preproduction: "Pré-production",
  production: "Production",
};

// Composant pour afficher et naviguer vers la dernière version d'un projet
function ProjectVersionBadge({ projectId }: { projectId: number }) {
  const { data: versions, isLoading } = useQuery({
    queryKey: ['/api/projects', projectId, 'versions'],
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <Badge variant="secondary" className="text-xs">
        Loading...
      </Badge>
    );
  }

  const latestVersion = Array.isArray(versions) && versions.length > 0 ? versions[0] : null;

  if (!latestVersion) {
    return (
      <Badge variant="outline" className="text-xs">
        Aucune version
      </Badge>
    );
  }

  return (
    <Badge
      variant="default"
      className="text-xs cursor-pointer hover:bg-blue-700 bg-blue-600 text-white"
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
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.team?.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const columns = [
    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.getValue("name")}</div>
          {row.original.description && (
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
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
            <span className="text-gray-500 dark:text-gray-400">Aucune équipe</span>
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
          <span className="text-gray-500 dark:text-gray-400">-</span>
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
          <p className="mt-2 text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <Header 
          title="Projets" 
          subtitle="Gestion des projets avec statuts et équipes"
          actions={
            <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Projet
            </Button>
          }
        />

        <div className="p-6">
          {/* Search and Filters */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par nom, description ou équipe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Projects Grid */}
          {projectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <ExternalLink className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Aucun projet trouvé
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm ? "Aucun projet ne correspond à votre recherche." : "Commencez par créer votre premier projet."}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un projet
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project: ProjectWithTeam) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer group"
                      onClick={() => window.location.href = `/projects/${project.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {project.name}
                          </CardTitle>
                          <ProjectVersionBadge projectId={project.id} />
                        </div>
                        {project.team && (
                          <CardDescription className="flex items-center mt-1">
                            <Users className="w-3 h-3 mr-1" />
                            {project.team.name}
                          </CardDescription>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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
                              handleDelete(project.id);
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {project.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mb-3">
                      <Badge 
                        className={statusColors[project.status as keyof typeof statusColors] || statusColors.development}
                      >
                        {statusLabels[project.status as keyof typeof statusLabels] || project.status}
                      </Badge>
                      
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3 h-3 mr-1" />
                        {project.createdAt ? new Date(project.createdAt).toLocaleDateString('fr-FR') : '-'}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/projects/${project.id}`;
                        }}
                        className="flex-1"
                      >
                        Voir le projet
                      </Button>
                    </div>
                    
                    {project.repositoryUrl && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (project.repositoryUrl) {
                              window.open(project.repositoryUrl, '_blank');
                            }
                          }}
                          className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Repository
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
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
