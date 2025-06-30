import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { z } from "zod";
import type { ProjectWithTeam, Team } from "@shared/schema";

const formSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  status: z.string().optional().default("development"),
  teamId: z.number().optional(),
  repositoryUrl: z.string().url().optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

interface ProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: ProjectWithTeam | null;
}

export function ProjectModal({ open, onOpenChange, project }: ProjectModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!project;

  // Récupérer les équipes pour le select
  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    enabled: open,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "development",
      teamId: undefined,
      repositoryUrl: "",
    },
  });

  useEffect(() => {
    if (project) {
      form.reset({
        name: String(project.name || ""),
        description: String(project.description || ""),
        status: String(project.status || "development"),
        teamId: project.teamId ? Number(project.teamId) : undefined,
        repositoryUrl: String(project.repositoryUrl || ""),
      });
    } else {
      // Pour un nouveau projet, on ne définit que les champs nécessaires
      form.reset({
        name: "",
        description: "",
        status: "development", // Statut par défaut fixe
        teamId: undefined,
        repositoryUrl: "", // Pas de repository lors de la création
      });
    }
  }, [project, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        // Pour un nouveau projet, on force le statut à "development" et on retire l'URL
        status: isEditing ? data.status : "development",
        repositoryUrl: isEditing ? (data.repositoryUrl || null) : null,
        teamId: data.teamId || null,
      };

      if (isEditing) {
        await apiRequest("PUT", `/api/projects/${project.id}`, payload);
      } else {
        await apiRequest("POST", "/api/projects", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Succès",
        description: `Projet ${isEditing ? "modifié" : "créé"} avec succès`,
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
        description: `Impossible de ${isEditing ? "modifier" : "créer"} le projet`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const statusOptions = [
    { value: "development", label: "Développement" },
    { value: "testing", label: "Recette" },
    { value: "preproduction", label: "Pré-production" },
    { value: "production", label: "Production" },
    { value: "archived", label: "Archivé" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le projet" : "Nouveau projet"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Nom du projet */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du projet *</FormLabel>
                  <FormControl>
                    <Input placeholder="Mon super projet" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Description du projet (optionnel)" 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Information pour la création */}
            {!isEditing && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
                <p className="font-medium">ℹ️ Information</p>
                <p>Le statut sera automatiquement défini sur "Développement". Les repositories Git seront gérés au niveau des versions de projet.</p>
              </div>
            )}

            {/* Statut et Équipe */}
            <div className={isEditing ? "grid grid-cols-2 gap-4" : "block"}>
              {/* Statut - Uniquement visible lors de l'édition */}
              {isEditing && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Statut" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="teamId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Équipe</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "none" ? undefined : Number(value))} 
                      value={field.value ? String(field.value) : "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Aucune équipe</SelectItem>
                        {teams.map((team) => (
                          <SelectItem key={Number(team.id)} value={String(Number(team.id))}>
                            {String(team.name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Repository URL - Uniquement visible lors de l'édition */}
            {isEditing && (
              <FormField
                control={form.control}
                name="repositoryUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL du repository</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://github.com/user/repo (optionnel)" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Boutons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending 
                  ? (isEditing ? "Modification..." : "Création...") 
                  : (isEditing ? "Modifier" : "Créer")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
