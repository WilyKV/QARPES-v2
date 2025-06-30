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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useState, useEffect, useMemo } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Table, Bold, Italic, List, Eye, Code } from "lucide-react";

const procedureSchema = z.object({
  description: z.string().optional(),
  type: z.enum(["environment_variables", "service_verification", "command_execution", "data_import"]),
  content: z.string().min(1, "Le contenu est obligatoire"),
});

type FormData = z.infer<typeof procedureSchema>;

interface ProcedureModalProps {
  isOpen: boolean;
  onClose: () => void;
  versionGitRepoId: number;
  type?: string;
  existingProcedure?: any;
  onSuccess?: () => void;
}

export default function ProcedureModal({
  isOpen,
  onClose,
  versionGitRepoId,
  type,
  existingProcedure,
  onSuccess,
}: ProcedureModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState(existingProcedure?.content || "");
  const [activeTab, setActiveTab] = useState("preview");
  
  // Récupérer les procédures existantes pour vérifier les doublons
  const { data: procedures } = useQuery({
    queryKey: [`/api/version-git-repos/${versionGitRepoId}/procedures`],
    enabled: !!versionGitRepoId && isOpen,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(procedureSchema),
    defaultValues: {
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
        title: getTypeLabel(data.type), // Ajouter le title automatiquement
        content,
        // Note: gitRepoId n'est plus envoyé, il sera résolu côté serveur
      };
      const response = await fetch(`/api/version-git-repos/${versionGitRepoId}/procedures`, {
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
      queryClient.invalidateQueries({ queryKey: [`/api/version-git-repos/${versionGitRepoId}/procedures`] });
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
      queryClient.invalidateQueries({ queryKey: [`/api/version-git-repos/${versionGitRepoId}/procedures`] });
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
    setActiveTab("preview");
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

  // Déterminer quels champs afficher selon le type
  const shouldShowDescription = (type: string) => {
    // Pour les variables d'environnement, la description est optionnelle (informations hors release)
    return true;
  };

  const getDescriptionLabel = (type: string) => {
    if (type === "environment_variables") {
      return "Informations hors Release (optionnelle)";
    }
    return "Description (optionnelle)";
  };

  const getDescriptionPlaceholder = (type: string) => {
    if (type === "environment_variables") {
      return "Informations sur les variables d'environnement qui ne sont pas spécifiques à une release...";
    }
    return "Description courte de la procédure...";
  };

  // Fonctions d'aide pour le formatage
  const insertTable = () => {
    const tableHTML = `
<table style="border-collapse: collapse; width: 100%; margin: 10px 0;">
  <thead>
    <tr>
      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Variable</th>
      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Valeur</th>
      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">DATABASE_URL</td>
      <td style="border: 1px solid #ddd; padding: 8px;">postgresql://...</td>
      <td style="border: 1px solid #ddd; padding: 8px;">URL de connexion à la base de données</td>
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
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto bg-white dark:bg-gray-900">
        <DialogHeader className="pb-6 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {existingProcedure ? "Modifier la procédure" : "Ajouter une procédure"}
          </DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {getTypeLabel(selectedType)}
          </p>
        </DialogHeader>

        {existingProcedureOfType && !existingProcedure && (
          <Alert className="mb-6 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 dark:border-orange-800 dark:bg-orange-900/20">
            <InfoIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              Une procédure de type "{getTypeLabel(selectedType)}" existe déjà. 
              Il ne peut y avoir qu'une seule procédure par type par dépôt Git.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Le type est défini automatiquement et masqué à l'utilisateur */}
            <input type="hidden" {...form.register("type")} />
            
            {shouldShowDescription(selectedType) && (
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {getDescriptionLabel(selectedType)}
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={getDescriptionPlaceholder(selectedType)}
                        className="resize-none bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Contenu de la procédure
                  </FormLabel>
                  <FormControl>
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                      <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border-b border-gray-300 dark:border-gray-600 p-3">
                          <div className="flex items-center justify-between">
                            <TabsList className="bg-white/50 dark:bg-gray-800/50">
                              <TabsTrigger value="preview" className="flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                Aperçu & Édition
                              </TabsTrigger>
                              <TabsTrigger value="editor" className="flex items-center gap-2">
                                <Code className="w-4 h-4" />
                                Code HTML
                              </TabsTrigger>
                            </TabsList>
                            
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
                                Tableau
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <TabsContent value="preview" className="m-0">
                          <div className="grid grid-cols-1 lg:grid-cols-2 h-[400px]">
                            {/* Zone d'édition */}
                            <div className="border-r border-gray-300 dark:border-gray-600">
                              <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-300 dark:border-gray-600">
                                Édition
                              </div>
                              <Textarea
                                value={content}
                                onChange={(e) => {
                                  setContent(e.target.value);
                                  form.setValue("content", e.target.value);
                                }}
                                placeholder="Décrivez les étapes de la procédure... Utilisez du HTML pour le formatage."
                                className="h-[352px] border-0 resize-none focus:ring-0 focus:border-0 rounded-none bg-white dark:bg-gray-900"
                                style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", monospace' }}
                              />
                            </div>
                            
                            {/* Zone d'aperçu */}
                            <div>
                              <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-300 dark:border-gray-600">
                                Aperçu en temps réel
                              </div>
                              <div 
                                className="h-[352px] p-4 prose prose-sm max-w-none dark:prose-invert overflow-auto bg-white dark:bg-gray-900"
                                dangerouslySetInnerHTML={{ __html: content || '<p class="text-gray-500 dark:text-gray-400 italic">Commencez à taper pour voir l\'aperçu...</p>' }}
                              />
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="editor" className="m-0">
                          <Textarea
                            value={content}
                            onChange={(e) => {
                              setContent(e.target.value);
                              form.setValue("content", e.target.value);
                            }}
                            placeholder="Code HTML de la procédure..."
                            className="min-h-[400px] border-0 resize-none focus:ring-0 focus:border-0 rounded-none"
                            style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", monospace' }}
                          />
                        </TabsContent>
                      </Tabs>
                    </div>
                  </FormControl>
                  <FormMessage />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Astuce: L'onglet "Aperçu & Édition" vous permet de voir et modifier le contenu en temps réel. Utilisez les boutons de formatage ou l'onglet "Code HTML" pour des modifications avancées.
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
                className="px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
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