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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertProcedureSchema, type Procedure } from "@shared/schema";
import { z } from "zod";
import { useEffect } from "react";

const procedureTypes = [
  { value: "environment_variables", label: "Variables d'environnement" },
  { value: "service_verification", label: "Vérification des services" },
  { value: "command_execution", label: "Exécution de commandes" },
  { value: "data_import", label: "Import de données" },
];

const formSchema = insertProcedureSchema.pick({
  type: true,
  title: true,
  description: true,
  content: true,
  order: true,
}).extend({
  type: z.enum(["environment_variables", "service_verification", "command_execution", "data_import"]),
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  content: z.string().min(1, "Le contenu est requis"),
  order: z.number().int().min(0, "L'ordre doit être positif"),
});

type FormData = z.infer<typeof formSchema>;

interface ProcedureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gitRepoId: number;
  projectId: number;
  versionId: number;
  procedure?: Procedure;
  procedureType?: string;
}

export function ProcedureModal({ 
  open, 
  onOpenChange, 
  gitRepoId, 
  projectId, 
  versionId, 
  procedure,
  procedureType
}: ProcedureModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!procedure;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: procedure?.type || procedureType || "environment_variables",
      title: procedure?.title || "",
      description: procedure?.description || "",
      content: typeof procedure?.content === "string" ? procedure.content : JSON.stringify(procedure?.content || {}),
      order: procedure?.order || 0,
    },
  });

  useEffect(() => {
    if (isEditing && procedure) {
      form.reset({
        type: procedure.type as any,
        title: procedure.title,
        description: procedure.description || "",
        content: typeof procedure.content === "string" ? procedure.content : JSON.stringify(procedure.content),
        order: procedure.order,
      });
    } else if (!isEditing) {
      form.reset({
        type: procedureType as any || "environment_variables",
        title: "",
        description: "",
        content: "",
        order: 0,
      });
    }
  }, [procedure, isEditing, procedureType, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      let content;
      try {
        content = JSON.parse(data.content);
      } catch {
        content = { text: data.content };
      }

      const payload = {
        ...data,
        content,
      };

      if (isEditing) {
        return await apiRequest("PATCH", `/api/procedures/${procedure.id}`, payload);
      } else {
        return await apiRequest("POST", `/api/git-repos/${gitRepoId}/procedures`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/versions/${versionId}`] });
      toast({
        title: "Succès",
        description: isEditing ? "Procédure modifiée avec succès" : "Procédure ajoutée avec succès",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Erreur lors de ${isEditing ? 'la modification' : 'l\'ajout'} de la procédure: ${error.message}`,
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
            {isEditing ? "Modifier la procédure" : "Ajouter une procédure"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de procédure</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {procedureTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Titre de la procédure"
                      {...field}
                    />
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
                  <FormLabel>Description (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Description de la procédure..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenu</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Contenu de la procédure (JSON ou texte)..."
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordre</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="0"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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