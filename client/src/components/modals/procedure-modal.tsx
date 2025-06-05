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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useState, useEffect, useMemo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Table, Bold, Italic, List } from "lucide-react";

const procedureSchema = z.object({
  title: z.string().min(1, "Le titre est obligatoire"),
  description: z.string().optional(),
  type: z.enum(["environment_variables", "service_verification", "command_execution", "data_import"]),
  content: z.string().min(1, "Le contenu est obligatoire"),
});

type FormData = z.infer<typeof procedureSchema>;

interface ProcedureModalProps {
  isOpen: boolean;
  onClose: () => void;
  gitRepoId: number;
  type?: string;
  existingProcedure?: any;
  onSuccess?: () => void;
}

export default function ProcedureModal({
  isOpen,
  onClose,
  gitRepoId,
  type,
  existingProcedure,
  onSuccess,
}: ProcedureModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState(existingProcedure?.content || "");
  
  // Récupérer les procédures existantes pour vérifier les doublons
  const { data: procedures } = useQuery({
    queryKey: [`/api/git-repos/${gitRepoId}/procedures`],
    enabled: !!gitRepoId && isOpen,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(procedureSchema),
    defaultValues: {
      title: existingProcedure?.title || "",
      description: existingProcedure?.description || "",
      type: type as any || existingProcedure?.type || "environment_variables",
      content: existingProcedure?.content || "",
    },
  });

  const selectedType = form.watch("type");

  // Vérifier s'il existe déjà une procédure de ce type
  const existingProcedureOfType = useMemo(() => {
    if (!procedures || !selectedType) return null;
    
    const typeKey = selectedType as keyof typeof procedures;
    const proceduresOfType = (procedures as any)[typeKey] || [];
    
    // Si on modifie une procédure existante, on l'exclut de la vérification
    if (existingProcedure) {
      return proceduresOfType.find((p: any) => p.id !== existingProcedure.id);
    }
    
    return proceduresOfType.length > 0 ? proceduresOfType[0] : null;
  }, [procedures, selectedType, existingProcedure]);

  // Initialiser le contenu quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && existingProcedure) {
      setContent(existingProcedure.content || "");
      form.reset({
        title: existingProcedure.title || "",
        description: existingProcedure.description || "",
        type: existingProcedure.type || "environment_variables",
        content: existingProcedure.content || "",
      });
    } else if (isOpen && type) {
      form.setValue("type", type as any);
    }
  }, [isOpen, existingProcedure, type, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const procedureData = {
        ...data,
        gitRepoId,
        content,
      };
      const response = await fetch(`/api/git-repos/${gitRepoId}/procedures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(procedureData),
      });
      if (!response.ok) throw new Error('Failed to create procedure');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Procédure créée",
        description: "La procédure a été créée avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/git-repos/${gitRepoId}/procedures`] });
      queryClient.invalidateQueries({ queryKey: [`/api/project-versions`] });
      onSuccess?.();
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la procédure.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const procedureData = {
        ...data,
        content,
      };
      const response = await fetch(`/api/procedures/${existingProcedure.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(procedureData),
      });
      if (!response.ok) throw new Error('Failed to update procedure');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Procédure mise à jour",
        description: "La procédure a été mise à jour avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/git-repos/${gitRepoId}/procedures`] });
      queryClient.invalidateQueries({ queryKey: [`/api/project-versions`] });
      onSuccess?.();
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la procédure.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    form.reset();
    setContent("");
    onClose();
  };

  const onSubmit = (data: FormData) => {
    const finalData = { ...data, content };
    
    // Si une procédure de ce type existe déjà et qu'on n'est pas en mode modification
    if (existingProcedureOfType && !existingProcedure) {
      toast({
        title: "Procédure existante",
        description: `Une procédure de type "${getTypeLabel(selectedType)}" existe déjà. Veuillez la modifier plutôt que d'en créer une nouvelle.`,
        variant: "destructive",
      });
      return;
    }
    
    if (existingProcedure) {
      updateMutation.mutate(finalData);
    } else {
      createMutation.mutate(finalData);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      environment_variables: "Variables d'environnement",
      service_verification: "Vérification des services",
      command_execution: "Exécution de commandes",
      data_import: "Import de données",
    };
    return labels[type as keyof typeof labels] || type;
  };

  // Fonctions d'aide pour le formatage
  const insertTable = () => {
    const tableHTML = `
<table style="border-collapse: collapse; width: 100%; margin: 10px 0;">
  <thead>
    <tr>
      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">En-tête 1</th>
      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">En-tête 2</th>
      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">En-tête 3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">Cellule 1</td>
      <td style="border: 1px solid #ddd; padding: 8px;">Cellule 2</td>
      <td style="border: 1px solid #ddd; padding: 8px;">Cellule 3</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">Cellule 4</td>
      <td style="border: 1px solid #ddd; padding: 8px;">Cellule 5</td>
      <td style="border: 1px solid #ddd; padding: 8px;">Cellule 6</td>
    </tr>
  </tbody>
</table>
`;
    setContent(content + tableHTML);
    form.setValue("content", content + tableHTML);
  };

  const formatText = (tag: string) => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      const selectedText = selection.toString();
      let formattedText = "";
      
      switch (tag) {
        case 'bold':
          formattedText = `<strong>${selectedText}</strong>`;
          break;
        case 'italic':
          formattedText = `<em>${selectedText}</em>`;
          break;
        case 'list':
          formattedText = `<ul><li>${selectedText}</li></ul>`;
          break;
        default:
          formattedText = selectedText;
      }
      
      const newContent = content.replace(selectedText, formattedText);
      setContent(newContent);
      form.setValue("content", newContent);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader className="pb-6 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            {existingProcedure ? "Modifier la procédure" : "Ajouter une procédure"}
          </DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {getTypeLabel(selectedType)}
          </p>
        </DialogHeader>

        {existingProcedureOfType && !existingProcedure && (
          <Alert className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
            <InfoIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              Une procédure de type "{getTypeLabel(selectedType)}" existe déjà. 
              Il ne peut y avoir qu'une seule procédure par type par dépôt Git.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de procédure</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!!type || !!existingProcedure}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="environment_variables">Variables d'environnement</SelectItem>
                        <SelectItem value="service_verification">Vérification des services</SelectItem>
                        <SelectItem value="command_execution">Exécution de commandes</SelectItem>
                        <SelectItem value="data_import">Import de données</SelectItem>
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
                      <Input placeholder="Titre de la procédure" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optionnelle)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Description courte de la procédure..."
                      className="resize-none"
                      rows={2}
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
                  <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Contenu de la procédure
                  </FormLabel>
                  <FormControl>
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600 p-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => formatText('bold')}
                            className="h-8 px-3"
                          >
                            <Bold className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => formatText('italic')}
                            className="h-8 px-3"
                          >
                            <Italic className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => formatText('list')}
                            className="h-8 px-3"
                          >
                            <List className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={insertTable}
                            className="h-8 px-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40"
                          >
                            <Table className="h-4 w-4 mr-1" />
                            Insérer un tableau
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        value={content}
                        onChange={(e) => {
                          setContent(e.target.value);
                          form.setValue("content", e.target.value);
                        }}
                        placeholder="Décrivez les étapes de la procédure... Vous pouvez utiliser du HTML pour le formatage."
                        className="min-h-[400px] border-0 resize-none focus:ring-0 focus:border-0"
                        style={{ fontFamily: 'monospace' }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Astuce: Sélectionnez du texte puis cliquez sur les boutons de formatage, ou utilisez le bouton "Insérer un tableau" pour ajouter des tableaux structurés.
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                className="px-6"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending || (existingProcedureOfType && !existingProcedure)}
                className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {createMutation.isPending || updateMutation.isPending ? "Enregistrement..." : 
                 existingProcedure ? "Mettre à jour" : "Ajouter"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}