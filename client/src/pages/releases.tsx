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
      case "0": return "bg-gray-400 text-white"; // En développement
      case "1": return "bg-blue-400 text-white"; // A déployer
      case "2": return "bg-yellow-400 text-black"; // Recette en cours
      case "3": return "bg-purple-500 text-white"; // Préprod
      case "4": return "bg-green-500 text-white"; // Production
      case "5": return "bg-pink-500 text-white"; // Merge final
      case "Annulé": return "bg-red-500 text-white"; // Annulé
      default: return "bg-gray-200 text-gray-700";
    }
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
        <div className="p-6 space-y-12">
          {/* Tableau 1 : Préprod & Prod */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Préproduction & Production</h2>
            <div className="rounded-xl shadow bg-white dark:bg-gray-800 p-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left">ID Release</th>
                    <th className="px-3 py-2 text-left">Nom</th>
                    <th className="px-3 py-2 text-left">Statut</th>
                    <th className="px-3 py-2 text-left">Équipe</th>
                    <th className="px-3 py-2 text-left">Projets</th>
                    <th className="px-3 py-2 text-left">Recette</th>
                    <th className="px-3 py-2 text-left">Préprod</th>
                    <th className="px-3 py-2 text-left">Prod</th>
                    <th className="px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {releasesPreprodProd.map((row) => {
                    const rowId = typeof row.id === "number" ? row.id : (typeof row.id === "string" ? parseInt(row.id, 10) : undefined);
                    const releaseId = typeof row.releaseId === "string" ? row.releaseId : (row.releaseId ? String(row.releaseId) : "");
                    const name = typeof row.name === "string" ? row.name : "";
                    const status = typeof row.status === "string" ? row.status : "";
                    const teamName = typeof row.team?.name === "string" ? row.team.name : "";
                    const safeDate = (d: any) => {
                      if (!d) return "";
                      if (typeof d === "string") return d.slice(0, 10);
                      if (d instanceof Date) return d.toISOString().slice(0, 10);
                      if (typeof d === "object" && typeof d.toISOString === "function") return d.toISOString().slice(0, 10);
                      return "";
                    };
                    return (
                      <tr key={rowId} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-3 py-2 font-mono">{releaseId}</td>
                        <td className="px-3 py-2">
                          <EditableCell value={name} onSave={v => updateField(rowId!, "name", v)} />
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${getStatusColor(status)}`}>
                            {STATUS_OPTIONS.release.find(o => o.value === status)?.label || status}
                          </span>
                        </td>
                        <td className="px-3 py-2">{teamName || <span className="text-gray-400">-</span>}</td>
                        <td className="px-3 py-2">{Array.isArray(row.releaseProjects) ? row.releaseProjects.length : 0}</td>
                        <td className="px-3 py-2">
                          <EditableCell value={safeDate(row.recetteDate)} onSave={v => updateField(rowId!, "recetteDate", v)} type="date" />
                        </td>
                        <td className="px-3 py-2">
                          <EditableCell value={safeDate(row.preprodDate)} onSave={v => updateField(rowId!, "preprodDate", v)} type="date" />
                        </td>
                        <td className="px-3 py-2">
                          <EditableCell value={safeDate(row.productionDate)} onSave={v => updateField(rowId!, "productionDate", v)} type="date" />
                        </td>
                        <td className="px-3 py-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(rowId!)} disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {releasesPreprodProd.length === 0 && <div className="text-center text-gray-400 py-8">Aucune release</div>}
            </div>
          </div>

          {/* Tableau 2 : Développement, A déployer, Recette */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Développement, À déployer & Recette</h2>
            <div className="rounded-xl shadow bg-white dark:bg-gray-800 p-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left">ID Release</th>
                    <th className="px-3 py-2 text-left">Nom</th>
                    <th className="px-3 py-2 text-left">Statut</th>
                    <th className="px-3 py-2 text-left">Équipe</th>
                    <th className="px-3 py-2 text-left">Projets</th>
                    <th className="px-3 py-2 text-left">Recette</th>
                    <th className="px-3 py-2 text-left">Préprod</th>
                    <th className="px-3 py-2 text-left">Prod</th>
                    <th className="px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {releasesDevDeployRecette.map((row) => {
                    const rowId = typeof row.id === "number" ? row.id : (typeof row.id === "string" ? parseInt(row.id, 10) : undefined);
                    const releaseId = typeof row.releaseId === "string" ? row.releaseId : (row.releaseId ? String(row.releaseId) : "");
                    const name = typeof row.name === "string" ? row.name : "";
                    const status = typeof row.status === "string" ? row.status : "";
                    const teamName = typeof row.team?.name === "string" ? row.team.name : "";
                    const safeDate = (d: any) => {
                      if (!d) return "";
                      if (typeof d === "string") return d.slice(0, 10);
                      if (d instanceof Date) return d.toISOString().slice(0, 10);
                      if (typeof d === "object" && typeof d.toISOString === "function") return d.toISOString().slice(0, 10);
                      return "";
                    };
                    return (
                      <tr key={rowId} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-3 py-2 font-mono">{releaseId}</td>
                        <td className="px-3 py-2">
                          <EditableCell value={name} onSave={v => updateField(rowId!, "name", v)} />
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${getStatusColor(status)}`}>
                            {STATUS_OPTIONS.release.find(o => o.value === status)?.label || status}
                          </span>
                        </td>
                        <td className="px-3 py-2">{teamName || <span className="text-gray-400">-</span>}</td>
                        <td className="px-3 py-2">{Array.isArray(row.releaseProjects) ? row.releaseProjects.length : 0}</td>
                        <td className="px-3 py-2">
                          <EditableCell value={safeDate(row.recetteDate)} onSave={v => updateField(rowId!, "recetteDate", v)} type="date" />
                        </td>
                        <td className="px-3 py-2">
                          <EditableCell value={safeDate(row.preprodDate)} onSave={v => updateField(rowId!, "preprodDate", v)} type="date" />
                        </td>
                        <td className="px-3 py-2">
                          <EditableCell value={safeDate(row.productionDate)} onSave={v => updateField(rowId!, "productionDate", v)} type="date" />
                        </td>
                        <td className="px-3 py-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(rowId!)} disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {releasesDevDeployRecette.length === 0 && <div className="text-center text-gray-400 py-8">Aucune release</div>}
            </div>
          </div>

          {/* Tableau 3 : Autres */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Autres</h2>
            <div className="rounded-xl shadow bg-white dark:bg-gray-800 p-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left">ID Release</th>
                    <th className="px-3 py-2 text-left">Nom</th>
                    <th className="px-3 py-2 text-left">Statut</th>
                    <th className="px-3 py-2 text-left">Équipe</th>
                    <th className="px-3 py-2 text-left">Projets</th>
                    <th className="px-3 py-2 text-left">Recette</th>
                    <th className="px-3 py-2 text-left">Préprod</th>
                    <th className="px-3 py-2 text-left">Prod</th>
                    <th className="px-3 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {releasesAutres.map((row) => {
                    const rowId = typeof row.id === "number" ? row.id : (typeof row.id === "string" ? parseInt(row.id, 10) : undefined);
                    const releaseId = typeof row.releaseId === "string" ? row.releaseId : (row.releaseId ? String(row.releaseId) : "");
                    const name = typeof row.name === "string" ? row.name : "";
                    const status = typeof row.status === "string" ? row.status : "";
                    const teamName = typeof row.team?.name === "string" ? row.team.name : "";
                    const safeDate = (d: any) => {
                      if (!d) return "";
                      if (typeof d === "string") return d.slice(0, 10);
                      if (d instanceof Date) return d.toISOString().slice(0, 10);
                      if (typeof d === "object" && typeof d.toISOString === "function") return d.toISOString().slice(0, 10);
                      return "";
                    };
                    return (
                      <tr key={rowId} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-3 py-2 font-mono">{releaseId}</td>
                        <td className="px-3 py-2">
                          <EditableCell value={name} onSave={v => updateField(rowId!, "name", v)} />
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${getStatusColor(status)}`}>
                            {STATUS_OPTIONS.release.find(o => o.value === status)?.label || status}
                          </span>
                        </td>
                        <td className="px-3 py-2">{teamName || <span className="text-gray-400">-</span>}</td>
                        <td className="px-3 py-2">{Array.isArray(row.releaseProjects) ? row.releaseProjects.length : 0}</td>
                        <td className="px-3 py-2">
                          <EditableCell value={safeDate(row.recetteDate)} onSave={v => updateField(rowId!, "recetteDate", v)} type="date" />
                        </td>
                        <td className="px-3 py-2">
                          <EditableCell value={safeDate(row.preprodDate)} onSave={v => updateField(rowId!, "preprodDate", v)} type="date" />
                        </td>
                        <td className="px-3 py-2">
                          <EditableCell value={safeDate(row.productionDate)} onSave={v => updateField(rowId!, "productionDate", v)} type="date" />
                        </td>
                        <td className="px-3 py-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(rowId!)} disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {releasesAutres.length === 0 && <div className="text-center text-gray-400 py-8">Aucune release</div>}
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
