import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { ReleaseModal } from "@/components/modals/release-modal";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { STATUS_COLORS, STATUS_OPTIONS } from "@/lib/constants";
import type { ReleaseWithProjects } from "@shared/schema";
import type { Team } from "@shared/schema";

// Liste exhaustive des statuts et leur mapping français
const ALL_STATUS_LABELS = STATUS_OPTIONS.release.reduce((acc, cur) => { acc[cur.value] = cur.label; return acc; }, {} as Record<string, string>);

const statusColors = STATUS_COLORS;

const TABLES = [
  {
    title: "En développement",
    statuses: ["0"],
  },
  {
    title: "A déployer",
    statuses: ["1"],
  },
  {
    title: "Recette en cours",
    statuses: ["2"],
  },
  {
    title: "En préproduction",
    statuses: ["3"],
  },
  {
    title: "Mis en production",
    statuses: ["4"],
  },
  {
    title: "Merge final",
    statuses: ["5"],
  },
  {
    title: "Annulé",
    statuses: ["Annulé"],
  },
];

const statusLabels = {
  testing: "Recette",
  preproduction: "Préprod",
  production: "Production",
};

// Edition inline : composant cellule éditable
interface EditableCellProps {
  value: string | number | undefined | null;
  onSave: (value: string) => void;
  type?: string;
  options?: { value: string; label: string }[];
}

function EditableCell({ value, onSave, type = "text", options = [] }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? "");
  useEffect(() => { setVal(value ?? ""); }, [value]);
  if (!editing) return (
    <span onClick={() => setEditing(true)} className="cursor-pointer hover:underline">{type === "select" ? (options?.find(o => o.value === value)?.label || value) : value || <span className="text-gray-400">-</span>}</span>
  );
  return (
    <span>
      {type === "select" ? (
        <select value={val} onChange={e => setVal(e.target.value)} onBlur={() => { setEditing(false); onSave(val as string); }}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input value={val} onChange={e => setVal(e.target.value)} onBlur={() => { setEditing(false); onSave(val as string); }} />
      )}
    </span>
  );
}

// Ajout d'un type local pour la release avec équipe
export type ReleaseWithTeamAndProjects = ReleaseWithProjects & { team?: Team };

export default function Releases() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<ReleaseWithProjects | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleViewRelease = (releaseId: number) => {
    setLocation(`/releases/${releaseId}`);
  };

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

  const handleEdit = (release: ReleaseWithProjects) => {
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

  // Correction du typage de releases (on force le tableau de ReleaseWithTeamAndProjects)
  const releasesTyped: ReleaseWithTeamAndProjects[] = Array.isArray(releases) ? releases as ReleaseWithTeamAndProjects[] : [];

  // Correction du filtrage (on vérifie que les champs sont bien des string)
  const filteredReleases: ReleaseWithTeamAndProjects[] = releasesTyped.filter((release) =>
    (typeof release.name === "string" ? release.name : "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (typeof release.releaseId === "string" ? release.releaseId : "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (typeof release.team?.name === "string" ? release.team.name : "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Correction du typage de updateField
  const updateField = (id: number, field: string, value: string) => {
    apiRequest("PUT", `/api/releases/${id}`, { [field]: value })
      .then(() => queryClient.invalidateQueries({ queryKey: ["/api/releases"] }))
      .catch(() => toast({ title: "Erreur", description: "Échec de la modification", variant: "destructive" }));
  };

  // Ajout d'une fonction utilitaire pour la couleur des statuts
  function getStatusColor(status: string) {
    switch (status) {
      case "0": return "bg-slate-500 text-white shadow-sm"; // En développement
      case "1": return "bg-blue-500 text-white shadow-sm"; // A déployer
      case "2": return "bg-amber-500 text-white shadow-sm"; // Recette en cours
      case "3": return "bg-purple-500 text-white shadow-sm"; // Préprod
      case "4": return "bg-emerald-500 text-white shadow-sm"; // Production
      case "5": return "bg-pink-500 text-white shadow-sm"; // Merge final
      case "Annulé": return "bg-red-500 text-white shadow-sm"; // Annulé
      default: return "bg-gray-300 text-gray-700 shadow-sm";
    }
  }

  // Fonction pour obtenir le nombre de versions de projet associées
  function getProjectVersionsCount(release: ReleaseWithTeamAndProjects): number {
    return Array.isArray(release.projectVersions) ? release.projectVersions.length : 0;
  }

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

  // Découpage des releases par tableau selon les statuts demandés
  const preprodProdStatuses = ["3", "4"];
  const devDeployRecetteStatuses = ["0", "1", "2"];

  const releasesPreprodProd = filteredReleases.filter(r => preprodProdStatuses.includes(String(r.status)));
  const releasesDevDeployRecette = filteredReleases.filter(r => devDeployRecetteStatuses.includes(String(r.status)));
  const releasesAutres = filteredReleases.filter(r => !preprodProdStatuses.includes(String(r.status)) && !devDeployRecetteStatuses.includes(String(r.status)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex">
      <Sidebar />
      <main className="flex-1 overflow-auto ml-64">
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
        <div className="p-6 space-y-8">
          {/* Barre de recherche améliorée */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par ID, nom de release..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tableau 1 : Préprod & Prod */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 shadow-lg border border-purple-200 dark:border-purple-700">
            <h2 className="text-xl font-bold mb-4 text-purple-800 dark:text-purple-200 flex items-center">
              <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full mr-3"></div>
              Préproduction & Production
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 text-sm">Release</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 text-sm">Statut</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 text-sm">Production</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {releasesPreprodProd.map((row) => {
                      const rowId = typeof row.id === "number" ? row.id : (typeof row.id === "string" ? parseInt(row.id, 10) : undefined);
                      const releaseId = typeof row.releaseId === "string" ? row.releaseId : (row.releaseId ? String(row.releaseId) : "");
                      const name = typeof row.name === "string" ? row.name : "";
                      const status = typeof row.status === "string" ? row.status : "";
                      const safeDate = (d: any) => {
                        if (!d) return "";
                        if (typeof d === "string") return d.slice(0, 10);
                        if (d instanceof Date) return d.toISOString().slice(0, 10);
                        if (typeof d === "object" && typeof d.toISOString === "function") return d.toISOString().slice(0, 10);
                        return "";
                      };
                      const displayName = releaseId ? `Release ${releaseId}` : (name || "Sans nom");
                      return (
                        <tr key={rowId} className="hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-150">
                          <td className="px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">{displayName}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                              {STATUS_OPTIONS.release.find(o => o.value === status)?.label || status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <EditableCell value={safeDate(row.productionDate)} onSave={v => updateField(rowId!, "productionDate", v)} type="date" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleViewRelease(rowId!)} className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900">
                                <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(row)} className="h-8 w-8 p-0 hover:bg-yellow-100 dark:hover:bg-yellow-900">
                                <Edit className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(rowId!)} disabled={deleteMutation.isPending} className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900">
                                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {releasesPreprodProd.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <div className="text-4xl mb-2">📋</div>
                  <p>Aucune release en préproduction ou production</p>
                </div>
              )}
            </div>
          </div>

          {/* Tableau 2 : Développement, A déployer, Recette */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-6 shadow-lg border border-amber-200 dark:border-amber-700">
            <h2 className="text-xl font-bold mb-4 text-amber-800 dark:text-amber-200 flex items-center">
              <div className="w-2 h-8 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full mr-3"></div>
              Développement, À déployer & Recette
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 text-sm">Release</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 text-sm">Statut</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 text-sm">Recette</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 text-sm">Préprod</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 text-sm">Production</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {releasesDevDeployRecette.map((row) => {
                    const rowId = typeof row.id === "number" ? row.id : (typeof row.id === "string" ? parseInt(row.id, 10) : undefined);
                    const releaseId = typeof row.releaseId === "string" ? row.releaseId : (row.releaseId ? String(row.releaseId) : "");
                    const name = typeof row.name === "string" ? row.name : "";
                    const status = typeof row.status === "string" ? row.status : "";
                    const safeDate = (d: any) => {
                      if (!d) return "";
                      if (typeof d === "string") return d.slice(0, 10);
                      if (d instanceof Date) return d.toISOString().slice(0, 10);
                      if (typeof d === "object" && typeof d.toISOString === "function") return d.toISOString().slice(0, 10);
                      return "";
                    };
                    const displayName = releaseId ? `Release ${releaseId}` : (name || "Sans nom");
                    return (
                      <tr key={rowId} className="hover:bg-amber-50 dark:hover:bg-gray-700 transition-colors duration-150">
                        <td className="px-4 py-3 text-sm font-medium text-amber-600 dark:text-amber-400">{displayName}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                            {STATUS_OPTIONS.release.find(o => o.value === status)?.label || status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <EditableCell value={safeDate(row.recetteDate)} onSave={v => updateField(rowId!, "recetteDate", v)} type="date" />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <EditableCell value={safeDate(row.preprodDate)} onSave={v => updateField(rowId!, "preprodDate", v)} type="date" />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <EditableCell value={safeDate(row.productionDate)} onSave={v => updateField(rowId!, "productionDate", v)} type="date" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleViewRelease(rowId!)} className="h-8 w-8 p-0 hover:bg-amber-100 dark:hover:bg-amber-900">
                              <Eye className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(row)} className="h-8 w-8 p-0 hover:bg-yellow-100 dark:hover:bg-yellow-900">
                              <Edit className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(rowId!)} disabled={deleteMutation.isPending} className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900">
                              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
              {releasesDevDeployRecette.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <div className="text-4xl mb-2">🚧</div>
                  <p>Aucune release en développement, à déployer ou en recette</p>
                </div>
              )}
            </div>
          </div>

          {/* Tableau 3 : Autres */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200 flex items-center">
              <div className="w-2 h-8 bg-gradient-to-b from-slate-500 to-gray-500 rounded-full mr-3"></div>
              Autres
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 text-sm">Release</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 text-sm">Statut</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 text-sm">Production</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {releasesAutres.map((row) => {
                    const rowId = typeof row.id === "number" ? row.id : (typeof row.id === "string" ? parseInt(row.id, 10) : undefined);
                    const releaseId = typeof row.releaseId === "string" ? row.releaseId : (row.releaseId ? String(row.releaseId) : "");
                    const name = typeof row.name === "string" ? row.name : "";
                    const status = typeof row.status === "string" ? row.status : "";
                    const safeDate = (d: any) => {
                      if (!d) return "";
                      if (typeof d === "string") return d.slice(0, 10);
                      if (d instanceof Date) return d.toISOString().slice(0, 10);
                      if (typeof d === "object" && typeof d.toISOString === "function") return d.toISOString().slice(0, 10);
                      return "";
                    };
                    const displayName = releaseId ? `Release ${releaseId}` : (name || "Sans nom");
                    return (
                      <tr key={rowId} className="hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors duration-150">
                        <td className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">{displayName}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                            {STATUS_OPTIONS.release.find(o => o.value === status)?.label || status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <EditableCell value={safeDate(row.productionDate)} onSave={v => updateField(rowId!, "productionDate", v)} type="date" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleViewRelease(rowId!)} className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-900">
                              <Eye className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(row)} className="h-8 w-8 p-0 hover:bg-yellow-100 dark:hover:bg-yellow-900">
                              <Edit className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(rowId!)} disabled={deleteMutation.isPending} className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900">
                              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
              {releasesAutres.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <div className="text-4xl mb-2">📁</div>
                  <p>Aucune autre release</p>
                </div>
              )}
            </div>
          </div>
                    const rowId = typeof row.id === "number" ? row.id : (typeof row.id === "string" ? parseInt(row.id, 10) : undefined);
                    const releaseId = typeof row.releaseId === "string" ? row.releaseId : (row.releaseId ? String(row.releaseId) : "");
                    const name = typeof row.name === "string" ? row.name : "";
                    const status = typeof row.status === "string" ? row.status : "";
                    const safeDate = (d: any) => {
                      if (!d) return "";
                      if (typeof d === "string") return d.slice(0, 10);
                      if (d instanceof Date) return d.toISOString().slice(0, 10);
                      if (typeof d === "object" && typeof d.toISOString === "function") return d.toISOString().slice(0, 10);
                      return "";
                    };
                    const displayName = releaseId ? `Release ${releaseId}` : (name || "Sans nom");
                    return (
                      <tr key={rowId} className="hover:bg-amber-50 dark:hover:bg-gray-700 transition-colors duration-150">
                        <td className="px-4 py-3 text-sm font-medium text-amber-600 dark:text-amber-400">{displayName}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                            {STATUS_OPTIONS.release.find(o => o.value === status)?.label || status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <EditableCell value={safeDate(row.recetteDate)} onSave={v => updateField(rowId!, "recetteDate", v)} type="date" />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <EditableCell value={safeDate(row.preprodDate)} onSave={v => updateField(rowId!, "preprodDate", v)} type="date" />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <EditableCell value={safeDate(row.productionDate)} onSave={v => updateField(rowId!, "productionDate", v)} type="date" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleViewRelease(rowId!)} className="h-8 w-8 p-0 hover:bg-amber-100 dark:hover:bg-amber-900">
                              <Eye className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(row)} className="h-8 w-8 p-0 hover:bg-yellow-100 dark:hover:bg-yellow-900">
                              <Edit className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(rowId!)} disabled={deleteMutation.isPending} className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900">
                              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
              {releasesDevDeployRecette.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <div className="text-4xl mb-2">�</div>
                  <p>Aucune release en développement, à déployer ou en recette</p>
                </div>
              )}
            </div>
          </div>

          {/* Tableau 3 : Autres */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200 flex items-center">
              <div className="w-2 h-8 bg-gradient-to-b from-slate-500 to-gray-500 rounded-full mr-3"></div>
              Autres
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 text-sm">Release</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 text-sm">Statut</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 text-sm">Production</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {releasesAutres.map((row) => {
                    const rowId = typeof row.id === "number" ? row.id : (typeof row.id === "string" ? parseInt(row.id, 10) : undefined);
                    const releaseId = typeof row.releaseId === "string" ? row.releaseId : (row.releaseId ? String(row.releaseId) : "");
                    const name = typeof row.name === "string" ? row.name : "";
                    const status = typeof row.status === "string" ? row.status : "";
                    const safeDate = (d: any) => {
                      if (!d) return "";
                      if (typeof d === "string") return d.slice(0, 10);
                      if (d instanceof Date) return d.toISOString().slice(0, 10);
                      if (typeof d === "object" && typeof d.toISOString === "function") return d.toISOString().slice(0, 10);
                      return "";
                    };
                    const displayName = releaseId ? `Release ${releaseId}` : (name || "Sans nom");
                    return (
                      <tr key={rowId} className="hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors duration-150">
                        <td className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400">{displayName}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                            {STATUS_OPTIONS.release.find(o => o.value === status)?.label || status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <EditableCell value={safeDate(row.productionDate)} onSave={v => updateField(rowId!, "productionDate", v)} type="date" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleViewRelease(rowId!)} className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-900">
                              <Eye className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(row)} className="h-8 w-8 p-0 hover:bg-yellow-100 dark:hover:bg-yellow-900">
                              <Edit className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(rowId!)} disabled={deleteMutation.isPending} className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900">
                              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
              {releasesAutres.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <div className="text-4xl mb-2">📁</div>
                  <p>Aucune autre release</p>
                </div>
              )}
            </div>
          </div>
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
