import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Plus, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { type TeamWithMembers, type User } from "@shared/schema";

// Remplacement du type de formulaire par une définition explicite (plus de zod)
type FormData = {
  name: string;
  description?: string;
  leaderId: string;
};

interface TeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team?: TeamWithMembers | null;
}

export function TeamModal({ open, onOpenChange, team }: TeamModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!team;
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const form = useForm<FormData>({
    resolver: undefined,
    defaultValues: {
      name: typeof team?.name === 'string' ? team.name : '',
      description: typeof team?.description === 'string' ? team.description : '',
      leaderId: typeof team?.leaderId === 'string' ? team.leaderId : 'none',
    },
  });

  // Récupérer tous les utilisateurs pour le select du chef d'équipe
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    retry: false,
  });

  // Récupérer les membres actuels de l'équipe si on édite
  const { data: currentMembers = [], refetch: refetchMembers } = useQuery<any[]>({
    queryKey: [`/api/teams/${team?.id}/members`],
    enabled: isEditing && !!team?.id,
    retry: false,
  });

  // Mutation pour ajouter un membre
  const addMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!team?.id) return;
      await apiRequest("POST", `/api/teams/${team.id}/members`, { userId });
    },
    onSuccess: () => {
      refetchMembers();
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setSelectedUserId("");
      toast({
        title: "Succès",
        description: "Membre ajouté à l'équipe",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le membre",
        variant: "destructive",
      });
    },
  });

  // Mutation pour retirer un membre
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!team?.id) return;
      await apiRequest("DELETE", `/api/teams/${team.id}/members/${userId}`);
    },
    onSuccess: () => {
      refetchMembers();
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "Succès",
        description: "Membre retiré de l'équipe",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: "Impossible de retirer le membre",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (team) {
      form.reset({
        name: typeof team.name === 'string' ? team.name : '',
        description: typeof team.description === 'string' ? team.description : '',
        leaderId: typeof team.leaderId === 'string' ? team.leaderId : 'none',
      });
    } else {
      form.reset({
        name: '',
        description: '',
        leaderId: 'none',
      });
    }
  }, [team, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        leaderId: data.leaderId === "none" ? null : (data.leaderId || null),
      };

      if (isEditing) {
        await apiRequest("PUT", `/api/teams/${team.id}`, payload);
      } else {
        await apiRequest("POST", "/api/teams", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Succès",
        description: `Équipe ${isEditing ? "modifiée" : "créée"} avec succès`,
      });
      onOpenChange(false);
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
        description: `Impossible de ${isEditing ? "modifier" : "créer"} l'équipe`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier l'Équipe" : "Nouvelle Équipe"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de l'Équipe</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom de l'équipe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Description de l'équipe"
                      rows={3}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="leaderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chef d'Équipe</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un chef d'équipe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Aucun chef d'équipe</SelectItem>
                      {users.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Section des membres de l'équipe (uniquement en mode édition) */}
            {isEditing && team && (
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-lg">Membres de l'Équipe</h3>
                    <Badge variant="secondary">{currentMembers.length}</Badge>
                  </div>
                </div>

                {/* Liste des membres actuels */}
                {currentMembers.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {currentMembers.map((member: any) => {
                      const memberUser = users.find((u: any) => u.id === member.member?.user?.id);
                      return (
                        <div 
                          key={member.member?.user?.id} 
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={memberUser?.profileImageUrl ?? undefined} />
                              <AvatarFallback className="text-xs">
                                {memberUser?.firstName?.charAt(0)}{memberUser?.lastName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {memberUser?.firstName} {memberUser?.lastName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {memberUser?.email}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMemberMutation.mutate(member.member?.user?.id)}
                            disabled={removeMemberMutation.isPending}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Formulaire pour ajouter un nouveau membre */}
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">
                      Ajouter un membre
                    </label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un utilisateur" />
                      </SelectTrigger>
                      <SelectContent>
                        {users
                          .filter((user: any) => !currentMembers.some((m: any) => m.userId === user.id))
                          .map((user: any) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.firstName} {user.lastName} ({user.email})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    onClick={() => selectedUserId && addMemberMutation.mutate(selectedUserId)}
                    disabled={!selectedUserId || addMemberMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {mutation.isPending ? "En cours..." : (isEditing ? "Modifier" : "Créer")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
