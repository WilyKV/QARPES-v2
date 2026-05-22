import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { NotificationBanner } from "@/components/layout/notification-banner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { TeamModal } from "@/components/modals/team-modal";
import { TeamMembersModal } from "@/components/modals/team-members-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Search, Edit, Trash2, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { TeamWithMembers } from "@shared/schema";

export default function Teams() {
 const { toast } = useToast();
 const { isAuthenticated, isLoading } = useAuth();
 const queryClient = useQueryClient();
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingTeam, setEditingTeam] = useState<TeamWithMembers | null>(null);
 const [searchTerm, setSearchTerm] = useState("");
 const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
 const [selectedTeamForMembers, setSelectedTeamForMembers] = useState<TeamWithMembers | null>(null);

 useEffect(() => {
 if (!isLoading && !isAuthenticated) {
 toast({
 title: "Non autorisé",
 description: "Vous devez être connecté pour accéder aux équipes. Redirection en cours...",
 variant: "destructive",
 });
 setTimeout(() => {
 window.location.href = "/api/login";
 }, 500);
 return;
 }
 }, [isAuthenticated, isLoading, toast]);

 const { data: teams, isLoading: teamsLoading } = useQuery<TeamWithMembers[]>({
 queryKey: ["/api/teams"],
 retry: false,
 });

 const deleteMutation = useMutation({
 mutationFn: async (id: number) => {
 await apiRequest("DELETE", `/api/teams/${id}`);
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
 toast({
 title: "Succès",
 description: "Équipe supprimée avec succès",
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
 description: "Impossible de supprimer l'équipe",
 variant: "destructive",
 });
 },
 });

 const handleEdit = (team: TeamWithMembers) => {
 setEditingTeam(team);
 setIsModalOpen(true);
 };

 const handleDelete = async (id: number) => {
 if (confirm("Êtes-vous sûr de vouloir supprimer cette équipe ?")) {
 deleteMutation.mutate(id);
 }
 };

 const handleModalClose = () => {
 setIsModalOpen(false);
 setEditingTeam(null);
 };

 const handleShowMembers = (team: TeamWithMembers) => {
 setSelectedTeamForMembers(team);
 setIsMembersModalOpen(true);
 };

 const handleMembersModalClose = () => {
 setIsMembersModalOpen(false);
 setSelectedTeamForMembers(null);
 };

 const getInitials = (firstName?: string, lastName?: string) => {
 const first = firstName?.charAt(0) || "";
 const last = lastName?.charAt(0) || "";
 return (first + last).toUpperCase() || "?";
 };

 const filteredTeams = teams?.filter((team: TeamWithMembers) =>
 team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 team.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 team.leader?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 team.leader?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
 ) || [];

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
 accessorKey: "leader",
 header: "Chef d'équipe",
 cell: ({ row }: any) => {
 const leader = row.original.leader;
 return leader ? (
 <div className="flex items-center space-x-2">
 <Avatar className="h-6 w-6">
 <AvatarImage src={leader.profileImageUrl} />
 <AvatarFallback className="text-xs">
 {getInitials(leader.firstName, leader.lastName)}
 </AvatarFallback>
 </Avatar>
 <span className="text-sm">
 {leader.firstName} {leader.lastName}
 </span>
 </div>
 ) : (
 <span className="text-gray-500">Aucun chef</span>
 );
 },
 },
 {
 accessorKey: "_count",
 header: "Membres",
 cell: ({ row }: any) => (
 <Button
 variant="ghost"
 className="flex items-center space-x-1 hover:bg-blue-50 cursor-pointer"
 onClick={() => handleShowMembers(row.original)}
 >
 <Users className="h-4 w-4 text-blue-600" />
 <span className="text-blue-600 font-medium">{row.original._count?.members || 0}</span>
 </Button>
 ),
 },
 {
 accessorKey: "createdAt",
 header: "Créée le",
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
 <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
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
 title="Équipes" 
 subtitle="Gestion des équipes avec membres et rôles"
 actions={
 <Button 
 onClick={() => setIsModalOpen(true)} 
 className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
 >
 <Plus className="h-4 w-4 mr-2" />
 Nouvelle Équipe
 </Button>
 }
 />

 <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
 <NotificationBanner />

 {/* Search and Filters */}
 <div className="mb-6">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
 <Input
 placeholder="Rechercher par nom, description ou chef d'équipe..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="pl-10 bg-white/80 backdrop-blur-sm border-0 shadow-lg"
 />
 </div>
 </div>

 {/* Data Table */}
 <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border-0">
 <DataTable
 columns={columns}
 data={filteredTeams}
 loading={teamsLoading}
 emptyMessage="Aucune équipe trouvée"
 />
 </div>
 </div>
 </main>

 <TeamModal 
 open={isModalOpen} 
 onOpenChange={handleModalClose}
 team={editingTeam}
 />

 <TeamMembersModal
 open={isMembersModalOpen}
 onOpenChange={handleMembersModalClose}
 team={selectedTeamForMembers}
 />
 </div>
 );
}
