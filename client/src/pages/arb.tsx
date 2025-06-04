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
import { ArbModal } from "@/components/modals/arb-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Search, Edit, Trash2, Shield, DollarSign } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { ArbWithDetails } from "@shared/schema";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  in_review: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

const statusLabels = {
  pending: "En attente",
  in_review: "En révision",
  approved: "Approuvé",
  rejected: "Rejeté",
};

const typeColors = {
  access: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  responsibility: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  budget: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
};

const typeLabels = {
  access: "Accès",
  responsibility: "Responsabilité",
  budget: "Budget",
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

const priorityLabels = {
  low: "Faible",
  medium: "Moyenne",
  high: "Élevée",
  critical: "Critique",
};

export default function ARBPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArb, setEditingArb] = useState<ArbWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Non autorisé",
        description: "Vous devez être connecté pour accéder aux ARB. Redirection en cours...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: arbs, isLoading: arbsLoading } = useQuery({
    queryKey: ["/api/arb"],
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/arb/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/arb"] });
      toast({
        title: "Succès",
        description: "ARB supprimé avec succès",
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
        description: "Impossible de supprimer l'ARB",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (arb: ArbWithDetails) => {
    setEditingArb(arb);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet ARB ?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingArb(null);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "?";
  };

  const formatBudget = (amount?: number) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount / 100);
  };

  const filteredArbs = arbs?.filter((arb: ArbWithDetails) =>
    arb.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    arb.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    arb.requester.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    arb.requester.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    arb.team?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    arb.project?.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const columns = [
    {
      accessorKey: "title",
      header: "Titre",
      cell: ({ row }: any) => (
        <div>
          <div className="font-medium">{row.getValue("title")}</div>
          {row.original.description && (
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
              {row.original.description}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }: any) => {
        const type = row.getValue("type") as keyof typeof typeColors;
        return (
          <Badge className={typeColors[type] || typeColors.access}>
            {typeLabels[type] || type}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }: any) => {
        const status = row.getValue("status") as keyof typeof statusColors;
        return (
          <Badge className={statusColors[status] || statusColors.pending}>
            {statusLabels[status] || status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "priority",
      header: "Priorité",
      cell: ({ row }: any) => {
        const priority = row.getValue("priority") as keyof typeof priorityColors;
        return (
          <Badge className={priorityColors[priority] || priorityColors.medium}>
            {priorityLabels[priority] || priority}
          </Badge>
        );
      },
    },
    {
      accessorKey: "requester",
      header: "Demandeur",
      cell: ({ row }: any) => {
        const requester = row.original.requester;
        return (
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={requester.profileImageUrl} />
              <AvatarFallback className="text-xs">
                {getInitials(requester.firstName, requester.lastName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">
              {requester.firstName} {requester.lastName}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "team",
      header: "Équipe",
      cell: ({ row }: any) => (
        <div>
          {row.original.team?.name || (
            <span className="text-gray-500 dark:text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "budget",
      header: "Budget",
      cell: ({ row }: any) => {
        const budget = row.getValue("budget");
        const type = row.original.type;
        return type === "budget" && budget ? (
          <div className="flex items-center space-x-1">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span>{formatBudget(budget)}</span>
          </div>
        ) : (
          <span className="text-gray-500 dark:text-gray-400">-</span>
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: "Échéance",
      cell: ({ row }: any) => {
        const date = row.getValue("dueDate");
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
          title="ARB" 
          subtitle="Gestion des Accès, Responsabilités et Budgets"
          actions={
            <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau ARB
            </Button>
          }
        />

        <div className="p-6">
          {/* Search and Filters */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par titre, demandeur, équipe ou projet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={filteredArbs}
            loading={arbsLoading}
            emptyMessage="Aucun ARB trouvé"
          />
        </div>
      </main>

      <ArbModal 
        open={isModalOpen} 
        onOpenChange={handleModalClose}
        arb={editingArb}
      />
    </div>
  );
}
