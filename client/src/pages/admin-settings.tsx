import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { NotificationBanner } from "@/components/layout/notification-banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Bell, Plus, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface DashboardSettings {
  logDashboardUrl?: string;
  kitCitizenUrl?: string;
}

interface Notification {
  id: number;
  message: string;
  color: string;
  isActive: boolean;
  createdAt: string;
}

const colorOptions = [
  { value: "blue", label: "Bleu" },
  { value: "red", label: "Rouge" },
  { value: "yellow", label: "Jaune" },
  { value: "green", label: "Vert" },
  { value: "orange", label: "Orange" },
  { value: "purple", label: "Violet" },
];

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [logDashboardUrl, setLogDashboardUrl] = useState("");
  const [kitCitizenUrl, setKitCitizenUrl] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [newColor, setNewColor] = useState("blue");

  const { data: settings } = useQuery<DashboardSettings>({ queryKey: ["/api/admin/settings"], retry: false });
  const { data: notifications, isLoading: notificationsLoading } = useQuery<Notification[]>({ queryKey: ["/api/admin/notifications"], retry: false });

  useEffect(() => {
    if (settings) {
      setLogDashboardUrl(settings.logDashboardUrl || "");
      setKitCitizenUrl(settings.kitCitizenUrl || "");
    }
  }, [settings]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
    queryClient.invalidateQueries({ queryKey: ["/api/notifications/active"] });
  };

  const updateMutation = useMutation({
    mutationFn: async (data: DashboardSettings) => await apiRequest("PUT", "/api/admin/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/dashboard"] });
      toast({ title: "Succès", description: "Paramètres mis à jour avec succès" });
    },
    onError: () => toast({ title: "Erreur", description: "Impossible de mettre à jour les paramètres", variant: "destructive" }),
  });

  const createNotificationMutation = useMutation({
    mutationFn: async (data: { message: string; color: string }) => await apiRequest("POST", "/api/admin/notifications", data),
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Succès", description: "Notification créée avec succès" });
      setIsDialogOpen(false);
      setNewMessage("");
      setNewColor("blue");
    },
    onError: () => toast({ title: "Erreur", description: "Impossible de créer la notification", variant: "destructive" }),
  });

  const toggleNotificationMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => await apiRequest("PATCH", `/api/admin/notifications/${id}`, { isActive }),
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Succès", description: "Statut de la notification mis à jour" });
    },
    onError: () => toast({ title: "Erreur", description: "Impossible de mettre à jour la notification", variant: "destructive" }),
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: number) => await apiRequest("DELETE", `/api/admin/notifications/${id}`),
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Succès", description: "Notification supprimée avec succès" });
    },
    onError: () => toast({ title: "Erreur", description: "Impossible de supprimer la notification", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ logDashboardUrl, kitCitizenUrl });
  };

  const handleCreateNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) {
      toast({ title: "Erreur", description: "Le message ne peut pas être vide", variant: "destructive" });
      return;
    }
    createNotificationMutation.mutate({ message: newMessage, color: newColor });
  };

  const handleDeleteNotification = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette notification ?")) {
      deleteNotificationMutation.mutate(id);
    }
  };

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
          <Header title="Paramètres" subtitle="Configuration du système" />
          <div className="p-6">
            <NotificationBanner />
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Accès non autorisé. Seuls les administrateurs peuvent accéder à cette page.
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
        <Header title="Paramètres" subtitle="Configuration du système" />
        <div className="p-6 max-w-4xl space-y-6">
          <NotificationBanner />

          {/* Section 1 : URLs Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Paramètres du Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="logDashboardUrl">URL Log Dashboard</Label>
                  <Input id="logDashboardUrl" type="url" placeholder="https://..." value={logDashboardUrl} onChange={(e) => setLogDashboardUrl(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Lien vers le tableau de bord des logs (affiché sur le dashboard principal)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kitCitizenUrl">URL Kit Citizen</Label>
                  <Input id="kitCitizenUrl" type="url" placeholder="https://..." value={kitCitizenUrl} onChange={(e) => setKitCitizenUrl(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Lien vers le kit citizen développeur (affiché sur le dashboard principal)</p>
                </div>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Enregistrement..." : "Enregistrer les paramètres"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Section 2 : Notifications globales */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notifications globales
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Messages affichés en bannière à tous les utilisateurs connectés</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Nouvelle notification
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Créer une notification</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateNotification} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea id="message" placeholder="Tapez le message de la notification..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} rows={3} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="color">Couleur</Label>
                        <Select value={newColor} onValueChange={setNewColor}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {colorOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" disabled={createNotificationMutation.isPending}>
                        {createNotificationMutation.isPending ? "Création..." : "Créer"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {notificationsLoading ? (
                <p className="text-center text-muted-foreground py-4">Chargement...</p>
              ) : notifications && notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card">
                      <Badge className="capitalize shrink-0">{notification.color}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Créée {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: fr })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`active-${notification.id}`} className="text-xs cursor-pointer">
                            {notification.isActive ? "Active" : "Inactive"}
                          </Label>
                          <Switch
                            id={`active-${notification.id}`}
                            checked={notification.isActive}
                            onCheckedChange={(checked) => toggleNotificationMutation.mutate({ id: notification.id, isActive: checked })}
                          />
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteNotification(notification.id)} disabled={deleteNotificationMutation.isPending}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">Aucune notification trouvée</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
