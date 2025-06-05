import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertGitRepoSchema, type GitRepo } from "@shared/schema";
import { z } from "zod";

const formSchema = insertGitRepoSchema.extend({
  name: z.string().min(1, "Le nom est requis"),
  branch: z.string().min(1, "La branche est requise"),
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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: gitRepo?.name || "",
      url: gitRepo?.url || "",
      branch: gitRepo?.branch || "main",
      lastCommitHash: gitRepo?.lastCommitHash || "",
    },
  });

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

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le repository" : "Nouveau repository Git"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du repository</FormLabel>
                  <FormControl>
                    <Input placeholder="nom-du-repo" {...field} />
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
                  <FormLabel>URL (optionnelle)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://github.com/user/repo" 
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
              name="branch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branche</FormLabel>
                  <FormControl>
                    <Input placeholder="main" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastCommitHash"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dernier commit (optionnel)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="abc123..." 
                      {...field} 
                      value={field.value || ""} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
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