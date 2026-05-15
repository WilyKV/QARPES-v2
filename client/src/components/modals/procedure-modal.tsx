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
// Onglets supprimés pour unifier édition et affichage dans un seul champ
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useState, useEffect, useMemo, useRef } from "react";
import type React from "react";
import type { FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Table, Bold, Italic, List, Plus, Minus } from "lucide-react";

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
  const DEFAULT_TABLE_GENERIC = `
<table style="border-collapse: collapse; width: 100%; margin: 10px 0;">
  <thead>
    <tr>
      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Étape</th>
      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Action</th>
      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Détails</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">1</td>
      <td style="border: 1px solid #ddd; padding: 8px;">Initialisation</td>
      <td style="border: 1px solid #ddd; padding: 8px;">Décrire l'étape d'initialisation...</td>
    </tr>
  </tbody>
</table>`;
  const DEFAULT_TABLE_ENVVARS = `
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
      <td style="border: 1px solid #ddd; padding: 8px;">postgresql://user:pass@host:5432/db</td>
      <td style="border: 1px solid #ddd; padding: 8px;">URL de connexion à la base</td>
    </tr>
  </tbody>
</table>`;
  const DEFAULT_TABLE_SERVICE_VERIFICATION = `
<table style="border-collapse: collapse; width: 100%; margin: 10px 0;">
  <thead>
    <tr>
      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Service</th>
      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Point de contrôle</th>
      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Résultat attendu</th>
      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Statut</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">API</td>
      <td style="border: 1px solid #ddd; padding: 8px;">/health</td>
      <td style="border: 1px solid #ddd; padding: 8px;">HTTP 200</td>
      <td style="border: 1px solid #ddd; padding: 8px;">À vérifier</td>
    </tr>
  </tbody>
</table>`;

  const DEFAULT_TABLE_COMMAND_EXECUTION = `
<table style="border-collapse: collapse; width: 100%; margin: 10px 0;">
  <thead>
    <tr>
      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Commande</th>
      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Contexte</th>
      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Remarques</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">npm run build</td>
      <td style="border: 1px solid #ddd; padding: 8px;">Dossier racine</td>
      <td style="border: 1px solid #ddd; padding: 8px;">Vérifier l'output</td>
    </tr>
  </tbody>
</table>`;

  const DEFAULT_TABLE_DATA_IMPORT = `
<table style="border-collapse: collapse; width: 100%; margin: 10px 0;">
  <thead>
    <tr>
      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Source</th>
      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Destination</th>
      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Format</th>
      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2;">Étapes</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">CSV</td>
      <td style="border: 1px solid #ddd; padding: 8px;">Base de données</td>
      <td style="border: 1px solid #ddd; padding: 8px;">UTF-8</td>
      <td style="border: 1px solid #ddd; padding: 8px;">Nettoyage, mapping, import</td>
    </tr>
  </tbody>
</table>`;

  const defaultTableByType = (t?: string) => {
    switch (t) {
      case "environment_variables":
        return DEFAULT_TABLE_ENVVARS;
      case "service_verification":
        return DEFAULT_TABLE_SERVICE_VERIFICATION;
      case "command_execution":
        return DEFAULT_TABLE_COMMAND_EXECUTION;
      case "data_import":
        return DEFAULT_TABLE_DATA_IMPORT;
      default:
        return DEFAULT_TABLE_GENERIC;
    }
  };
  const [content, setContent] = useState(existingProcedure?.content || defaultTableByType(type));
  const editorRef = useRef<HTMLDivElement | null>(null);
  
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
      content: existingProcedure?.content || defaultTableByType(type || existingProcedure?.type),
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
      const initial = existingProcedure.content || defaultTableByType(existingProcedure.type);
      setContent(initial);
      form.reset({
        description: existingProcedure.description || "",
        type: existingProcedure.type || "environment_variables",
        content: initial,
      });
      // Injecte le HTML dans l'éditeur sans re-render pour préserver le curseur
      if (editorRef.current) editorRef.current.innerHTML = initial;
    } else if (isOpen) {
      // Nouvelle procédure: préremplir avec le tableau par défaut
      const preset = defaultTableByType(type);
      setContent(preset);
      form.setValue("content", preset);
      if (editorRef.current) editorRef.current.innerHTML = preset;
      if (type) {
        form.setValue("type", type as any);
      }
    }
  }, [isOpen, existingProcedure, type, form]);

  // S'assure que le contenu par défaut est bien injecté quand l'éditeur est monté
  useEffect(() => {
    if (!isOpen) return;
    const el = editorRef.current;
    if (el && !el.innerHTML) {
      el.innerHTML = content || defaultTableByType(type);
    }
  }, [isOpen, editorRef, content, type]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const finalType = data.type || (type as any) || "environment_variables";
      const fallback = defaultTableByType(finalType);
      const finalContent = (content && content.trim().length > 0) ? content : fallback;

      const procedureData = {
        ...data,
        title: getTypeLabel(data.type), // Ajouter le title automatiquement
        content: finalContent,
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
  onError: (_error: unknown) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la procédure.",
        variant: "destructive",
      });
    },
  });

  // Si l'utilisateur change le type lors d'une création (pas d'édition), injecter le tableau par défaut s'il n'y a rien
  useEffect(() => {
    if (!isOpen || existingProcedure) return;
    const el = editorRef.current;
    if (!el) return;
    const current = (el.innerHTML || "").trim();
    if (current.length === 0) {
      const preset = defaultTableByType(selectedType);
      setContent(preset);
      form.setValue("content", preset);
      el.innerHTML = preset;
    }
  }, [selectedType, isOpen, existingProcedure, form]);

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
  onError: (_error: unknown) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la procédure.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    form.reset();
  setContent(defaultTableByType(type || form.getValues("type")));
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
    const tableHTML = defaultTableByType(form.getValues("type"));
    // Insère au curseur pour éviter de réinitialiser l'éditeur
    try {
      document.execCommand('insertHTML', false, tableHTML);
    } catch {}
    syncEditorContent();
  };

  // Utilitaires pour manipuler le tableau sous le curseur
  const getCurrentCell = (): HTMLTableCellElement | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const node: Node | null = sel.anchorNode;
    let el: HTMLElement | null = (node as HTMLElement)?.nodeType === Node.ELEMENT_NODE
      ? (node as HTMLElement)
      : (node as ChildNode)?.parentElement || null;
    while (el && el.tagName !== 'TD' && el.tagName !== 'TH') {
      el = el.parentElement;
    }
    return (el as HTMLTableCellElement) || null;
  };

  const addRow = (after: boolean, baseCell?: HTMLTableCellElement | null) => {
    const cell = baseCell || getCurrentCell();
    if (!cell) {
      toast({ title: "Aucune cellule", description: "Placez le curseur dans un tableau pour ajouter une ligne.", variant: "destructive" });
      return;
    }
    const tr = cell.closest('tr');
    if (!tr) return;
    const section = tr.parentElement as HTMLElement | null; // THEAD/TBODY/TFOOT
    const isHeader = section?.tagName === 'THEAD';
    const refCells = Array.from(tr.cells);
    const newTr = document.createElement('tr');
    refCells.forEach((refCell) => {
      const tag = isHeader ? 'TH' : 'TD';
      const newCell = document.createElement(tag);
      // Copie de styles pour homogénéité
      (newCell as HTMLElement).style.cssText = (refCell as HTMLElement).style.cssText;
      newCell.innerHTML = isHeader ? (refCell.textContent ? refCell.textContent : '') : '';
      newCell.setAttribute('style', (refCell as HTMLElement).getAttribute('style') || '');
      newTr.appendChild(newCell);
    });
    if (after) {
      tr.insertAdjacentElement('afterend', newTr);
    } else {
      tr.insertAdjacentElement('beforebegin', newTr);
    }
    syncEditorContent();
  };

  const removeRow = (baseCell?: HTMLTableCellElement | null) => {
    const cell = baseCell || getCurrentCell();
    if (!cell) {
      toast({ title: "Aucune cellule", description: "Placez le curseur dans un tableau pour supprimer une ligne.", variant: "destructive" });
      return;
    }
    const tr = cell.closest('tr');
    if (!tr) return;
    const section = tr.parentElement as HTMLElement | null;
    // Empêche la suppression de l'en-tête pour garder une structure lisible
    if (section?.tagName === 'THEAD') {
      toast({ title: "Action non autorisée", description: "La suppression de la ligne d'en-tête est désactivée.", variant: "destructive" });
      return;
    }
    // Évite de vider complètement le tableau (au moins une ligne dans le tbody)
    const tbody = tr.closest('tbody');
    if (tbody && tbody.rows.length <= 1) {
      toast({ title: "Impossible", description: "Le tableau doit conserver au moins une ligne de données.", variant: "destructive" });
      return;
    }
    tr.remove();
    syncEditorContent();
  };

  const addColumn = (after: boolean, baseCell?: HTMLTableCellElement | null) => {
    const cell = baseCell || getCurrentCell();
    if (!cell) {
      toast({ title: "Aucune cellule", description: "Placez le curseur dans un tableau pour ajouter une colonne.", variant: "destructive" });
      return;
    }
    const index = (cell as HTMLTableCellElement).cellIndex;
    const table = cell.closest('table');
    if (!table) return;
  const rows: NodeListOf<HTMLTableRowElement> = table.querySelectorAll('tr');
  rows.forEach((row: HTMLTableRowElement) => {
      const isHeader = (row.parentElement as HTMLElement | null)?.tagName === 'THEAD';
      const insertPos = after ? index + 1 : index;
      const refCell = row.cells[Math.min(index, row.cells.length - 1)] as HTMLElement | undefined;
      if (isHeader) {
        const th = document.createElement('th');
        if (refCell) th.style.cssText = refCell.style.cssText;
        th.setAttribute('style', refCell?.getAttribute('style') || '');
        th.innerHTML = refCell?.textContent ? refCell.textContent : 'Nouvelle colonne';
        row.insertBefore(th, row.children[insertPos] || null);
      } else {
        const td = document.createElement('td');
        if (refCell) td.style.cssText = refCell.style.cssText;
        td.setAttribute('style', refCell?.getAttribute('style') || '');
        td.innerHTML = '';
        row.insertBefore(td, row.children[insertPos] || null);
      }
    });
    syncEditorContent();
  };

  const removeColumn = (baseCell?: HTMLTableCellElement | null) => {
    const cell = baseCell || getCurrentCell();
    if (!cell) {
      toast({ title: "Aucune cellule", description: "Placez le curseur dans un tableau pour supprimer une colonne.", variant: "destructive" });
      return;
    }
    const index = (cell as HTMLTableCellElement).cellIndex;
    const table = cell.closest('table');
    if (!table) return;
    // Évite de supprimer la dernière colonne
    const headerRow = table.querySelector('thead tr') || table.querySelector('tbody tr');
    if (headerRow && headerRow.children.length <= 1) {
      toast({ title: "Impossible", description: "Le tableau doit conserver au moins une colonne.", variant: "destructive" });
      return;
    }
    const rows = table.querySelectorAll('tr');
    rows.forEach((row) => {
      if (row.children[index]) {
        row.removeChild(row.children[index]);
      }
    });
    syncEditorContent();
  };

  const syncEditorContent = () => {
    const el = editorRef.current;
    if (el) {
      const html = el.innerHTML;
      setContent(html);
      form.setValue('content', html);
    }
  };

  const formatText = (action: 'bold' | 'italic' | 'list') => {
    try {
      if (action === 'list') {
        document.execCommand('insertUnorderedList');
      } else if (action === 'bold') {
        document.execCommand('bold');
      } else if (action === 'italic') {
        document.execCommand('italic');
      }
      // Récupère le HTML après l'action
      const editor = document.getElementById('procedure-editor');
      if (editor) {
        const html = editor.innerHTML;
        setContent(html);
        form.setValue('content', html);
      }
    } catch {}
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
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
                render={({ field }: { field: any }) => (
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
              render={() => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Contenu de la procédure (un seul champ éditable)
                  </FormLabel>
                  <div className="flex items-center gap-2 mb-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => formatText('bold')}>
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => formatText('italic')}>
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => formatText('list')}>
                      <List className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={insertTable}>
                      <Table className="h-4 w-4 mr-1" /> Ajouter un tableau
                    </Button>
                    <div className="border-l pl-2 ml-2 flex items-center gap-1">
                      <span className="text-xs text-gray-500">Tableau:</span>
                      <Button type="button" variant="outline" size="sm" onClick={() => addRow(false)} title="Ajouter une ligne au début">
                        <Plus className="h-3 w-3" />Ligne
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => addRow(true)} title="Ajouter une ligne à la fin">
                        Ligne<Plus className="h-3 w-3" />
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => addColumn(false)} title="Ajouter une colonne au début">
                        <Plus className="h-3 w-3" />Col
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => addColumn(true)} title="Ajouter une colonne à la fin">
                        Col<Plus className="h-3 w-3" />
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeRow()} title="Supprimer la ligne actuelle">
                        <Minus className="h-3 w-3" />Ligne
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeColumn()} title="Supprimer la colonne actuelle">
                        <Minus className="h-3 w-3" />Col
                      </Button>
                    </div>
                  </div>
                  <FormControl>
                    <div
                      id="procedure-editor"
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      className="relative min-h-[300px] p-3 border rounded-md bg-white dark:bg-gray-900 prose prose-sm max-w-none dark:prose-invert focus:outline-none"
                      onInput={syncEditorContent}
                    />
                  </FormControl>
                  <FormMessage />
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