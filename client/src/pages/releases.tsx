import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { ReleaseModal } from "@/components/modals/release-modal";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
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

export default function Releases() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<ReleaseWithProjects | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Non autorisé",
        description: "Vous devez être connecté pour accéder aux releases. Redirection en cours...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: releases, isLoading: releasesLoading } = useQuery({
    queryKey: ["/api/releases"],
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/releases/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/releases"] });
      toast({
        title: "Succès",
        description: "Release supprimée avec succès",
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
        description: "Impossible de supprimer la release",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (release: ReleaseWithTeamAndProjects) => {
    setEditingRelease(release);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette release ?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingRelease(null);
  };

  const filteredReleases = releases?.filter((release: ReleaseWithTeamAndProjects) =>
    release.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    release.releaseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    release.team?.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const columns = [
    {
      accessorKey: "releaseId",
      header: "ID Release",
      cell: ({ row }: any) => (
        <Badge variant="outline" className="font-mono">
          {row.getValue("releaseId")}
        </Badge>
      ),
    },
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
      accessorKey: "releaseProjects",
      header: "Projets",
      cell: ({ row }: any) => (
        <div>
          <span className="font-medium">
            {row.original.releaseProjects?.length || 0}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
            projet{(row.original.releaseProjects?.length || 0) > 1 ? "s" : ""}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "releaseDate",
      header: "Date de Release",
      cell: ({ row }: any) => {
        const date = row.getValue("releaseDate");
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
          title="Releases" 
          subtitle="Gestion des releases avec format YYYYMM-NN"
          actions={
            <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Release
            </Button>
          }
        />

        <div className="p-6">
          {/* Search and Filters */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par nom, ID ou équipe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={filteredReleases}
            loading={releasesLoading}
            emptyMessage="Aucune release trouvée"
          />
        </div>
      </main>

      <ReleaseModal 
        open={isModalOpen} 
        onOpenChange={handleModalClose}
        release={editingRelease}
      />
    </div>
  );
}
