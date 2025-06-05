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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertCommitSchema, type Commit } from "@shared/schema";
import { z } from "zod";
import { useEffect } from "react";

const formSchema = insertCommitSchema.pick({
  hash: true,
  message: true,
  author: true,
  authorEmail: true,
  committedAt: true,
}).extend({
  hash: z.string().min(1, "Le hash est requis").max(40, "Maximum 40 caractères"),
  message: z.string().min(1, "Le message est requis"),
  author: z.string().min(1, "L'auteur est requis"),
  authorEmail: z.string().email("Email invalide").optional(),
  committedAt: z.string().min(1, "La date est requise"),
});

type FormData = z.infer<typeof formSchema>;

interface CommitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gitRepoId: number;
  projectId: number;
  versionId: number;
  commit?: Commit;
}

export function CommitModal({ 
  open, 
  onOpenChange, 
  gitRepoId, 
  projectId, 
  versionId, 
  commit 
}: CommitModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!commit;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hash: commit?.hash || "",
      message: commit?.message || "",
      author: commit?.author || "",
      authorEmail: commit?.authorEmail || "",
      committedAt: commit?.committedAt ? new Date(commit.committedAt).toISOString().slice(0, 16) : "",
    },
  });

  useEffect(() => {
    if (isEditing && commit) {
      form.reset({
        hash: commit.hash,
        message: commit.message,
        author: commit.author,
        authorEmail: commit.authorEmail || "",
        committedAt: commit.committedAt ? new Date(commit.committedAt).toISOString().slice(0, 16) : "",
      });
    } else if (!isEditing) {
      form.reset({
        hash: "",
        message: "",
        author: "",
        authorEmail: "",
        committedAt: "",
      });
    }
  }, [commit, isEditing, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        committedAt: new Date(data.committedAt).toISOString(),
      };

      if (isEditing) {
        return await apiRequest("PATCH", `/api/commits/${commit.id}`, payload);
      } else {
        return await apiRequest("POST", `/api/git-repos/${gitRepoId}/commits`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/versions/${versionId}`] });
      toast({
        title: "Succès",
        description: isEditing ? "Commit modifié avec succès" : "Commit ajouté avec succès",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Erreur lors de ${isEditing ? 'la modification' : 'l\'ajout'} du commit: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le commit" : "Ajouter un commit"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="hash"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hash du commit</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ex: abc123def456..."
                      {...field}
                      maxLength={40}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message du commit</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Description du commit..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Auteur</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Nom de l'auteur"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="authorEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email de l'auteur (optionnel)</FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="email@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="committedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date du commit</FormLabel>
                  <FormControl>
                    <Input 
                      type="datetime-local"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "En cours..." : isEditing ? "Modifier" : "Ajouter"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}