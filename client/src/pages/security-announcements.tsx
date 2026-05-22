import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { NotificationBanner } from "@/components/layout/notification-banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { hasPermission } from "@/lib/permissions";
import { Plus, Edit, Trash2, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Announcement {
 id: number;
 title: string;
 content: string;
 isFeatured: boolean;
 createdAt: string;
 createdBy: {
 firstName: string;
 lastName: string;
 };
}

export default function SecurityAnnouncementsPage() {
 const { toast } = useToast();
 const { user, isAuthenticated, isLoading } = useAuth();
 const queryClient = useQueryClient();
 const [isDialogOpen, setIsDialogOpen] = useState(false);
 const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
 const [title, setTitle] = useState("");
 const [content, setContent] = useState("");
 const [isFeatured, setIsFeatured] = useState(false);
 const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

 const canEdit = hasPermission(user?.role, "edit_security");

 const { data: announcements, isLoading: announcementsLoading } = useQuery<Announcement[]>({
 queryKey: ["/api/security/announcements"],
 retry: false,
 });

 const createMutation = useMutation({
 mutationFn: async (data: { title: string; content: string; isFeatured: boolean }) => {
 if (editingAnnouncement) {
 await apiRequest("PUT", `/api/security/announcements/${editingAnnouncement.id}`, data);
 } else {
 await apiRequest("POST", "/api/security/announcements", data);
 }
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/security/announcements"] });
 toast({
 title: "Succès",
 description: editingAnnouncement ? "Annonce mise à jour" : "Annonce créée avec succès",
 });
 handleCloseDialog();
 },
 onError: () => {
 toast({
 title: "Erreur",
 description: "Impossible de sauvegarder l'annonce",
 variant: "destructive",
 });
 },
 });

 const deleteMutation = useMutation({
 mutationFn: async (id: number) => {
 await apiRequest("DELETE", `/api/security/announcements/${id}`);
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/security/announcements"] });
 toast({
 title: "Succès",
 description: "Annonce supprimée avec succès",
 });
 },
 onError: () => {
 toast({
 title: "Erreur",
 description: "Impossible de supprimer l'annonce",
 variant: "destructive",
 });
 },
 });

 const featureMutation = useMutation({
 mutationFn: async (id: number) => {
 await apiRequest("PATCH", `/api/security/announcements/${id}/feature`);
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/security/announcements"] });
 toast({
 title: "Succès",
 description: "Annonce mise à la une",
 });
 },
 onError: () => {
 toast({
 title: "Erreur",
 description: "Impossible de mettre à la une",
 variant: "destructive",
 });
 },
 });

 const handleOpenDialog = (announcement?: Announcement) => {
 if (announcement) {
 setEditingAnnouncement(announcement);
 setTitle(announcement.title);
 setContent(announcement.content);
 setIsFeatured(announcement.isFeatured);
 }
 setIsDialogOpen(true);
 };

 const handleCloseDialog = () => {
 setIsDialogOpen(false);
 setEditingAnnouncement(null);
 setTitle("");
 setContent("");
 setIsFeatured(false);
 };

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!title.trim() || !content.trim()) {
 toast({
 title: "Erreur",
 description: "Le titre et le contenu sont requis",
 variant: "destructive",
 });
 return;
 }
 createMutation.mutate({ title, content, isFeatured });
 };

 const handleDelete = (id: number) => {
 if (confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) {
 deleteMutation.mutate(id);
 }
 };

 const toggleExpand = (id: number) => {
 setExpandedIds(prev => {
 const next = new Set(prev);
 if (next.has(id)) {
 next.delete(id);
 } else {
 next.add(id);
 }
 return next;
 });
 };

 const featured = announcements?.find(a => a.isFeatured);
 const regular = announcements?.filter(a => !a.isFeatured) || [];

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
 title="Annonces de Sécurité"
 subtitle="Informations et alertes de sécurité"
 actions={
 canEdit ? (
 <Button
 onClick={() => handleOpenDialog()}
 className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
 >
 <Plus className="h-4 w-4 mr-2" />
 Nouvelle annonce
 </Button>
 ) : undefined
 }
 />

 <div className="p-6 max-w-5xl">
 <NotificationBanner />

 {/* Featured Announcement */}
 {featured && (
 <Card className="mb-6 border-2 border-yellow-500 shadow-lg">
 <CardHeader className="pb-3">
 <div className="flex items-start justify-between">
 <div className="flex-1">
 <Badge className="mb-2 bg-yellow-500 text-yellow-950">
 <Star className="h-3 w-3 mr-1" />
 À la une
 </Badge>
 <CardTitle className="text-xl">{featured.title}</CardTitle>
 </div>
 {canEdit && (
 <div className="flex gap-2">
 <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(featured)}>
 <Edit className="h-4 w-4" />
 </Button>
 <Button variant="ghost" size="sm" onClick={() => handleDelete(featured.id)}>
 <Trash2 className="h-4 w-4 text-red-500" />
 </Button>
 </div>
 )}
 </div>
 </CardHeader>
 <CardContent>
 <p className="text-sm whitespace-pre-wrap">{featured.content}</p>
 <p className="text-xs text-muted-foreground mt-3">
 Par {featured.createdBy.firstName} {featured.createdBy.lastName} •{" "}
 {formatDistanceToNow(new Date(featured.createdAt), { addSuffix: true, locale: fr })}
 </p>
 </CardContent>
 </Card>
 )}

 {/* Regular Announcements */}
 <div className="grid gap-4">
 {announcementsLoading ? (
 <p className="text-center text-muted-foreground">Chargement...</p>
 ) : regular.length > 0 ? (
 regular.map((announcement) => {
 const isExpanded = expandedIds.has(announcement.id);
 const shouldTruncate = announcement.content.length > 200;
 const displayContent = isExpanded ? announcement.content : announcement.content.slice(0, 200);

 return (
 <Card key={announcement.id}>
 <CardHeader className="pb-3">
 <div className="flex items-start justify-between">
 <CardTitle className="text-lg flex-1">{announcement.title}</CardTitle>
 {canEdit && (
 <div className="flex gap-2">
 <Button
 variant="ghost"
 size="sm"
 onClick={() => featureMutation.mutate(announcement.id)}
 title="Mettre à la une"
 >
 <Star className="h-4 w-4" />
 </Button>
 <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(announcement)}>
 <Edit className="h-4 w-4" />
 </Button>
 <Button variant="ghost" size="sm" onClick={() => handleDelete(announcement.id)}>
 <Trash2 className="h-4 w-4 text-red-500" />
 </Button>
 </div>
 )}
 </div>
 </CardHeader>
 <CardContent>
 <p className="text-sm whitespace-pre-wrap">
 {displayContent}
 {shouldTruncate && !isExpanded && "..."}
 </p>
 {shouldTruncate && (
 <Button
 variant="link"
 size="sm"
 onClick={() => toggleExpand(announcement.id)}
 className="px-0 mt-1"
 >
 {isExpanded ? "Voir moins" : "Voir plus"}
 </Button>
 )}
 <p className="text-xs text-muted-foreground mt-3">
 Par {announcement.createdBy.firstName} {announcement.createdBy.lastName} •{" "}
 {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true, locale: fr })}
 </p>
 </CardContent>
 </Card>
 );
 })
 ) : (
 !featured && (
 <Card>
 <CardContent className="pt-6">
 <p className="text-center text-muted-foreground">Aucune annonce trouvée</p>
 </CardContent>
 </Card>
 )
 )}
 </div>
 </div>
 </main>

 {/* Dialog */}
 <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
 <DialogContent className="max-w-2xl">
 <DialogHeader>
 <DialogTitle>{editingAnnouncement ? "Modifier l'annonce" : "Créer une annonce"}</DialogTitle>
 </DialogHeader>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="title">Titre</Label>
 <Input
 id="title"
 placeholder="Titre de l'annonce..."
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="content">Contenu</Label>
 <Textarea
 id="content"
 placeholder="Contenu de l'annonce..."
 value={content}
 onChange={(e) => setContent(e.target.value)}
 rows={6}
 />
 </div>
 <div className="flex items-center space-x-2">
 <Checkbox
 id="featured"
 checked={isFeatured}
 onCheckedChange={(checked) => setIsFeatured(checked as boolean)}
 />
 <Label htmlFor="featured" className="cursor-pointer">
 Mettre à la une
 </Label>
 </div>
 <div className="flex gap-2">
 <Button type="submit" disabled={createMutation.isPending}>
 {createMutation.isPending ? "Enregistrement..." : editingAnnouncement ? "Modifier" : "Créer"}
 </Button>
 <Button type="button" variant="outline" onClick={handleCloseDialog}>
 Annuler
 </Button>
 </div>
 </form>
 </DialogContent>
 </Dialog>
 </div>
 );
}
