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
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
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
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useState, useEffect, useMemo, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

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
  const quillRef = useRef<ReactQuill>(null);
  
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
    const proceduresOfType = procedures[typeKey] || [];
    
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
      return apiRequest(`/api/git-repos/${gitRepoId}/procedures`, procedureData);
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
      return apiRequest(`/api/procedures/${existingProcedure.id}`, {
        method: "PATCH",
        body: JSON.stringify(procedureData),
      });
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

  // Configuration de l'éditeur avec insertion de tableaux HTML
  const modules = useMemo(() => {
    return {
      toolbar: {
        container: [
          [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'color': [] }, { 'background': [] }],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          [{ 'indent': '-1'}, { 'indent': '+1' }],
          [{ 'align': [] }],
          ['link', 'image'],
          ['blockquote', 'code-block'],
          ['clean'],
          ['table-insert']
        ],
        handlers: {
          'table-insert': function() {
            const quill = this.quill;
            const range = quill.getSelection();
            if (range) {
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
              quill.clipboard.dangerouslyPasteHTML(range.index, tableHTML);
            }
          }
        }
      },
    };
  }, []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet', 'indent',
    'align',
    'link', 'image',
    'blockquote', 'code-block'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {existingProcedure ? "Modifier la procédure" : "Ajouter une procédure"} - {getTypeLabel(selectedType)}
          </DialogTitle>
        </DialogHeader>

        {existingProcedureOfType && !existingProcedure && (
          <Alert className="mb-4">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
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
                  <FormLabel>Contenu de la procédure</FormLabel>
                  <FormControl>
                    <div className="border rounded-md">
                      <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-800 border-b text-sm text-gray-600 dark:text-gray-400">
                        Utilisez la barre d'outils pour formater votre texte ou cliquez sur le bouton "Insérer un tableau" pour ajouter des tableaux.
                      </div>
                      <ReactQuill
                        ref={quillRef}
                        theme="snow"
                        value={content}
                        onChange={(value) => {
                          setContent(value);
                          form.setValue("content", value);
                        }}
                        modules={modules}
                        formats={formats}
                        style={{ minHeight: '300px' }}
                        placeholder="Décrivez les étapes de la procédure..."
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending || (existingProcedureOfType && !existingProcedure)}
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