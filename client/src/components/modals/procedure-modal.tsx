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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Procedure } from "@shared/schema";
import { z } from "zod";
import { useEffect, useRef } from "react";

const procedureTypes = [
  { value: "environment_variables", label: "Variables d'environnement" },
  { value: "service_verification", label: "Vérification des services" },
  { value: "command_execution", label: "Exécution de commandes" },
  { value: "data_import", label: "Import de données" },
];

// Configuration de la barre d'outils Quill enrichie
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['link', 'image', 'code-block'],
    ['blockquote'],
    ['clean']
  ]
};

const quillFormats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'indent', 'color', 'background', 
  'align', 'link', 'image', 'code-block', 'blockquote'
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
  const quillRef = useRef<any>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: (procedure?.type as any) || (procedureType as any) || "environment_variables",
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
        type: (procedureType as any) || "environment_variables",
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
      queryClient.invalidateQueries({ queryKey: [`/api/git-repos/${gitRepoId}/procedures`] });
      toast({
        title: "Succès",
        description: isEditing ? "Procédure modifiée avec succès" : "Procédure ajoutée avec succès",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const insertTable = () => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection();
      const tableHTML = `
        <table style="border-collapse: collapse; width: 100%; margin: 10px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left;">En-tête 1</th>
              <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left;">En-tête 2</th>
              <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left;">En-tête 3</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #dee2e6; padding: 8px;">Cellule 1</td>
              <td style="border: 1px solid #dee2e6; padding: 8px;">Cellule 2</td>
              <td style="border: 1px solid #dee2e6; padding: 8px;">Cellule 3</td>
            </tr>
            <tr>
              <td style="border: 1px solid #dee2e6; padding: 8px;">Cellule 4</td>
              <td style="border: 1px solid #dee2e6; padding: 8px;">Cellule 5</td>
              <td style="border: 1px solid #dee2e6; padding: 8px;">Cellule 6</td>
            </tr>
          </tbody>
        </table>
      `;
      if (range) {
        quill.clipboard.dangerouslyPasteHTML(range.index, tableHTML);
        quill.setSelection(range.index + tableHTML.length);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier la procédure" : `Ajouter une procédure - ${procedureTypes.find(p => p.value === procedureType)?.label || 'Nouvelle procédure'}`}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!procedureType && (
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
            )}

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenu de la procédure</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={insertTable}
                          className="flex items-center gap-2"
                        >
                          <span>⊞</span>
                          Insérer un tableau
                        </Button>
                      </div>
                      <div className="border rounded-md">
                        <ReactQuill
                          ref={quillRef}
                          theme="snow"
                          value={field.value}
                          onChange={field.onChange}
                          modules={quillModules}
                          formats={quillFormats}
                          placeholder="Décrivez la procédure avec la barre d'outils de formatage..."
                          style={{ minHeight: '200px' }}
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Utilisez la barre d'outils pour formater votre texte ou le bouton "Insérer un tableau" ci-dessus.
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