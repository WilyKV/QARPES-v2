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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Edit, ShieldAlert } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User } from "@shared/schema";

const roleColors: Record<string, string> = {
 admin: "bg-red-100 text-red-800",
 prod: "bg-purple-100 text-purple-800",
 architecte: "bg-blue-100 text-blue-800",
 po: "bg-green-100 text-green-800",
 chef_projet: "bg-orange-100 text-orange-800",
 viewer: "bg-gray-100 text-gray-800",
 invite: "bg-gray-100 text-gray-800",
};

const roleLabels: Record<string, string> = {
 admin: "Administrateur",
 prod: "Production",
 architecte: "Architecte",
 po: "Product Owner",
 chef_projet: "Chef de Projet",
 viewer: "Visiteur",
 invite: "Invité",
};

const availableRoles = ["admin", "prod", "architecte", "po", "chef_projet", "viewer"];

export default function UsersPage() {
 const { toast } = useToast();
 const { user, isAuthenticated, isLoading } = useAuth();
 const queryClient = useQueryClient();
 const [isEditModalOpen, setIsEditModalOpen] = useState(false);
 const [editingUser, setEditingUser] = useState<User | null>(null);
 const [newRole, setNewRole] = useState<string>("");
 const [searchTerm, setSearchTerm] = useState("");

 useEffect(() => {
 if (!isLoading && !isAuthenticated) {
 toast({
 title: "Non autorisé",
 description: "Vous devez être connecté pour accéder à cette page. Redirection en cours...",
 variant: "destructive",
 });
 setTimeout(() => {
 window.location.href = "/api/login";
 }, 500);
 return;
 }
 }, [isAuthenticated, isLoading, toast]);

 const { data: users, isLoading: usersLoading } = useQuery<User[]>({
 queryKey: ["/api/users"],
 retry: false,
 enabled: user?.role === "admin",
 });

 const updateRoleMutation = useMutation({
 mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
 await apiRequest("PUT", `/api/users/${userId}`, { role });
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/users"] });
 toast({
 title: "Succès",
 description: "Rôle utilisateur mis à jour avec succès",
 });
 setIsEditModalOpen(false);
 setEditingUser(null);
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
 description: "Impossible de mettre à jour le rôle",
 variant: "destructive",
 });
 },
 });

 const handleEdit = (targetUser: User) => {
 setEditingUser(targetUser);
 setNewRole(targetUser.role);
 setIsEditModalOpen(true);
 };

 const handleSaveRole = async () => {
 if (!editingUser || !newRole) return;

 updateRoleMutation.mutate({
 userId: editingUser.id,
 role: newRole,
 });
 };

 const handleModalClose = () => {
 setIsEditModalOpen(false);
 setEditingUser(null);
 setNewRole("");
 };

 const filteredUsers = users?.filter((u: User) =>
 `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
 u.email?.toLowerCase().includes(searchTerm.toLowerCase())
 ) || [];

 const columns = [
 {
 accessorKey: "fullName",
 header: "Nom complet",
 cell: ({ row }: any) => {
 const targetUser = row.original as User;
 return (
 <div className="font-medium">
 {targetUser.firstName} {targetUser.lastName}
 </div>
 );
 },
 },
 {
 accessorKey: "email",
 header: "Email",
 cell: ({ row }: any) => (
 <div className="text-sm text-gray-600">
 {row.getValue("email") || "-"}
 </div>
 ),
 },
 {
 accessorKey: "role",
 header: "Rôle",
 cell: ({ row }: any) => {
 const role = row.getValue("role") as string;
 return (
 <Badge className={roleColors[role] || roleColors.viewer}>
 {roleLabels[role] || role}
 </Badge>
 );
 },
 },
 {
 accessorKey: "createdAt",
 header: "Date de création",
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

 if (user?.role !== "admin") {
 return (
 <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
 <Sidebar />

 <main className="flex-1 overflow-auto ml-64">
 <Header
 title="Utilisateurs"
 subtitle="Gestion des utilisateurs de l'application"
 />

 <div className="p-6">
 <Card className="max-w-2xl mx-auto">
 <CardHeader>
 <CardTitle className="flex items-center gap-2 text-red-600">
 <ShieldAlert className="h-5 w-5" />
 Accès non autorisé
 </CardTitle>
 <CardDescription>
 Vous devez être administrateur pour accéder à cette page.
 </CardDescription>
 </CardHeader>
 <CardContent>
 <p className="text-sm text-muted-foreground">
 Seuls les utilisateurs avec le rôle <Badge className={roleColors.admin}>Administrateur</Badge> peuvent gérer les utilisateurs.
 </p>
 </CardContent>
 </Card>
 </div>
 </main>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
 <Sidebar />

 <main className="flex-1 overflow-auto ml-64">
 <Header
 title="Utilisateurs"
 subtitle="Gestion des utilisateurs de l'application"
 />

 <div className="p-6">
 <NotificationBanner />

 <div className="mb-6">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
 <Input
 placeholder="Rechercher par nom ou email..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="pl-10"
 />
 </div>
 </div>

 <DataTable
 columns={columns}
 data={filteredUsers}
 loading={usersLoading}
 emptyMessage="Aucun utilisateur trouvé"
 />
 </div>
 </main>

 <Dialog open={isEditModalOpen} onOpenChange={handleModalClose}>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Modifier le rôle utilisateur</DialogTitle>
 <DialogDescription>
 Modifier le rôle de {editingUser?.firstName} {editingUser?.lastName}
 </DialogDescription>
 </DialogHeader>

 <div className="space-y-4 py-4">
 <div className="space-y-2">
 <Label htmlFor="role">Rôle</Label>
 <Select value={newRole} onValueChange={setNewRole}>
 <SelectTrigger>
 <SelectValue placeholder="Sélectionner un rôle" />
 </SelectTrigger>
 <SelectContent>
 {availableRoles.map((role) => (
 <SelectItem key={role} value={role}>
 {roleLabels[role] || role}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 <div className="flex justify-end gap-2">
 <Button variant="outline" onClick={handleModalClose}>
 Annuler
 </Button>
 <Button
 onClick={handleSaveRole}
 disabled={updateRoleMutation.isPending || !newRole}
 >
 Enregistrer
 </Button>
 </div>
 </div>
 </DialogContent>
 </Dialog>
 </div>
 );
}
