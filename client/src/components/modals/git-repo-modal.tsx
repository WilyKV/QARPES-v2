import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertGitRepoSchema, type GitRepo, type GitRepoWithDetails, type ProjectVersionWithDetails } from "@shared/schema";
import { z } from "zod";
import { useState, useEffect } from "react";

const formSchema = insertGitRepoSchema.extend({
  name: z.string().min(1, "Le nom est requis"),
});

type FormData = z.infer<typeof formSchema>;

interface GitRepoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectVersionId: number;
  projectId: number;
  versionId: number;
  gitRepo?: GitRepo;
}

export function GitRepoModal({ 
  open, 
  onOpenChange, 
  projectVersionId, 
  projectId, 
  versionId, 
  gitRepo 
}: GitRepoModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!gitRepo;
  const [isCreatingNew, setIsCreatingNew] = useState(!isEditing);

  // Récupérer les détails de la version pour obtenir la release associée
  const { data: version } = useQuery<ProjectVersionWithDetails>({
    queryKey: [`/api/projects/${projectId}/versions/${versionId}`],
    enabled: open,
  });

  // Récupérer tous les repositories Git existants pour permettre la sélection
  const { data: allGitRepos = [] } = useQuery<GitRepoWithDetails[]>({
    queryKey: ["/api/git-repos/all"],
    enabled: open && !isEditing,
  });

  // Calculer la branche automatiquement basée sur la release associée
  const automaticBranch = version?.releaseId ? `release/${version.releaseId}` : "main";

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: gitRepo?.name || "",
      url: gitRepo?.url || "",
    },
  });

  useEffect(() => {
    if (isEditing && gitRepo) {
      form.reset({
        name: gitRepo.name,
        url: gitRepo.url || "",
      });
    } else if (!isEditing) {
      form.reset({
        name: "",
        url: "",
      });
    }
  }, [gitRepo, isEditing, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEditing) {
        return await apiRequest("PATCH", `/api/git-repos/${gitRepo.id}`, data);
      } else {
        return await apiRequest("POST", `/api/project-versions/${projectVersionId}/git-repos`, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/versions/${versionId}`] });
      toast({
        title: "Succès",
        description: `Repository ${isEditing ? "modifié" : "créé"} avec succès`,
      });
      onOpenChange(false);
      form.reset();
      setIsCreatingNew(!isEditing);
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
        description: `Impossible de ${isEditing ? "modifier" : "créer"} le repository`,
        variant: "destructive",
      });
    },
  });

  const handleSelectExistingRepo = async (repoId: string) => {
    if (repoId === "new") {
      setIsCreatingNew(true);
      return;
    }

    const selectedRepo = allGitRepos.find(repo => repo.id.toString() === repoId);
    if (selectedRepo) {
      try {
        // Associer le repository existant à la version de projet
        await apiRequest("POST", `/api/project-versions/${projectVersionId}/git-repos`, {
          name: selectedRepo.name,
          url: selectedRepo.url,
          branch: automaticBranch, // Branche automatique basée sur la release
        });
        
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/versions/${versionId}`] });
        toast({
          title: "Succès",
          description: "Repository associé avec succès",
        });
        onOpenChange(false);
      } catch (error) {
        if (isUnauthorizedError(error as Error)) {
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
          description: "Impossible d'associer le repository",
          variant: "destructive",
        });
      }
    }
  };

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le repository" : "Repository Git"}
          </DialogTitle>
        </DialogHeader>

        {!isEditing && !isCreatingNew && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Sélectionner un repository existant</label>
              <Select onValueChange={handleSelectExistingRepo}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choisir un repository existant ou créer un nouveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">+ Créer un nouveau repository</SelectItem>
                  {allGitRepos.map((repo) => (
                    <SelectItem key={repo.id} value={repo.id.toString()}>
                      {repo.name} ({repo.url || 'Pas d\'URL'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p><strong>Branche automatique:</strong> {automaticBranch}</p>
              {version?.releaseId && (
                <p className="mt-1">Basée sur la release associée: {version.releaseId}</p>
              )}
            </div>
          </div>
        )}

        {(isEditing || isCreatingNew) && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du repository</FormLabel>
                    <FormControl>
                      <Input placeholder="my-project-repo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL du repository (optionnel)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://github.com/user/repo.git" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />



              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Branche automatique:</strong> {automaticBranch}</p>
                {version?.releaseId && (
                  <p className="mt-1">Basée sur la release associée: {version.releaseId}</p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    if (!isEditing) {
                      setIsCreatingNew(false);
                    } else {
                      onOpenChange(false);
                    }
                  }}
                >
                  {isEditing ? "Annuler" : "Retour"}
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
        )}
      </DialogContent>
    </Dialog>
  );
}