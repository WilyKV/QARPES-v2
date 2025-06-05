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
import { type Procedure } from "@shared/schema";
import { z } from "zod";
import { useEffect } from "react";

const procedureTypes = [
  { value: "environment_variables", label: "Variables d'environnement" },
  { value: "service_verification", label: "Vérification des services" },
  { value: "command_execution", label: "Exécution de commandes" },
  { value: "data_import", label: "Import de données" },
];

const formSchema = z.object({
  type: z.enum(["environment_variables", "service_verification", "command_execution", "data_import"]),
  content: z.string().min(1, "Le contenu est requis"),
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
      content: typeof procedure?.content === "string" ? procedure.content : JSON.stringify(procedure?.content || ""),
    },
  });

  useEffect(() => {
    if (isEditing && procedure) {
      form.reset({
        type: procedure.type as any,
        content: typeof procedure.content === "string" ? procedure.content : JSON.stringify(procedure.content),
      });
    } else if (!isEditing) {
      form.reset({
        type: procedureType as any || "environment_variables",
        content: "",
      });
    }
  }, [procedure, isEditing, procedureType, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        title: procedureTypes.find(p => p.value === data.type)?.label || data.type,
        order: 1,
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
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenu de la procédure</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Décrivez la procédure avec du formatage (markdown supporté)..."
                      rows={12}
                      className="font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Vous pouvez utiliser la syntaxe Markdown pour le formatage (gras: **texte**, italique: *texte*, listes: - item)
                  </div>
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