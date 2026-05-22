import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { type ProjectPv } from "@shared/schema";
import { z } from "zod";
import { useState } from "react";
import { Upload, X, FileText } from "lucide-react";

const formSchema = z
 .object({
 category: z.enum(["pv_fonctionnel_recette", "pv_metier_recette", "pv_conformite_preprod", "pv_tests_homologation_preprod"], {
 required_error: "La catégorie est requise",
 }),
 status: z.enum(["en_cours", "validation", "valide", "refuse"], {
 required_error: "Le statut est requis",
 }),
 })
 .strict();

type FormData = z.infer<typeof formSchema>;

const categoryLabels = {
 pv_fonctionnel_recette: "PV fonctionnel [Recette]",
 pv_metier_recette: "PV métier [Recette]", 
 pv_conformite_preprod: "PV de conformité [Préprod]",
 pv_tests_homologation_preprod: "PV de tests d'homologation IT [Préprod]",
};

const statusLabels = {
 en_cours: "En cours",
 validation: "En validation",
 valide: "Validé",
 refuse: "Refusé",
};

interface PvModalProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 projectVersionId: number;
 projectId: number;
 versionId: number;
 pv?: ProjectPv;
}

export function PvModal({
 open,
 onOpenChange,
 projectVersionId,
 projectId,
 versionId,
 pv,
}: PvModalProps) {
 const { toast } = useToast();
 const queryClient = useQueryClient();
 const [uploadedFile, setUploadedFile] = useState<File | null>(null);

 // Récupérer les PVs existants pour vérifier les catégories déjà utilisées
 const { data: existingPvs } = useQuery({
 queryKey: ["pvs", projectVersionId],
 queryFn: () =>
 apiRequest("GET", `/api/projects/${projectId}/versions/${versionId}/pvs`),
 });

 const form = useForm<FormData, unknown, FormData>({
 resolver: zodResolver(formSchema),
 defaultValues: {
 category: (pv?.category as FormData["category"]) || undefined,
 status: (pv?.status as FormData["status"]) || "en_cours",
 },
 });

 const createMutation = useMutation({
 mutationFn: async (formData: FormData) => {
 const payload = new FormData();
 payload.append("category", formData.category);
 payload.append("status", formData.status);
 
 if (uploadedFile) {
 payload.append("file", uploadedFile);
 }

 return apiRequest(
 "POST",
 `/api/projects/${projectId}/versions/${versionId}/pvs`,
 payload
 );
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["pvs", projectVersionId] });
 toast({
 title: "Succès",
 description: "PV créé avec succès",
 });
 onOpenChange(false);
 form.reset();
 setUploadedFile(null);
 },
 onError: (error: any) => {
 if (isUnauthorizedError(error)) {
 return;
 }
 toast({
 title: "Erreur",
 description: "Impossible de créer le PV",
 variant: "destructive",
 });
 },
 });

 const updateMutation = useMutation({
 mutationFn: async (formData: FormData) => {
 const payload = new FormData();
 payload.append("category", formData.category);
 payload.append("status", formData.status);
 
 if (uploadedFile) {
 payload.append("file", uploadedFile);
 }

 return apiRequest(
 "PUT",
 `/api/projects/${projectId}/versions/${versionId}/pvs/${pv!.id}`,
 payload
 );
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["pvs", projectVersionId] });
 toast({
 title: "Succès",
 description: "PV modifié avec succès",
 });
 onOpenChange(false);
 setUploadedFile(null);
 },
 onError: (error: any) => {
 if (isUnauthorizedError(error)) {
 return;
 }
 toast({
 title: "Erreur",
 description: "Impossible de modifier le PV",
 variant: "destructive",
 });
 },
 });

 const onSubmit = (data: FormData) => {
 if (pv) {
 updateMutation.mutate(data);
 } else {
 createMutation.mutate(data);
 }
 };

 const handleFileUpload = (event: any) => {
 const file = event.target.files?.[0];
 if (file) {
 // Vérifier le type de fichier
 const allowedTypes = [
 'application/pdf',
 'application/msword',
 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
 'application/vnd.ms-powerpoint',
 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
 ];
 
 if (!allowedTypes.includes(file.type)) {
 toast({
 title: "Type de fichier non autorisé",
 description: "Seuls les fichiers PDF, DOC, DOCX, PPT et PPTX sont autorisés",
 variant: "destructive",
 });
 return;
 }
 
 setUploadedFile(file);
 }
 };

 const removeFile = () => {
 setUploadedFile(null);
 };

 // Obtenir les catégories disponibles (exclure celles déjà utilisées sauf si on édite)
 const getAvailableCategories = () => {
 if (!existingPvs || !Array.isArray(existingPvs)) return Object.keys(categoryLabels);
 
 const usedCategories = existingPvs
 .filter((existingPv: ProjectPv) => !pv || existingPv.id !== pv.id)
 .map((existingPv: ProjectPv) => existingPv.category);
 
 return Object.keys(categoryLabels).filter(
 (category) => !usedCategories.includes(category as any)
 );
 };

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="sm:max-w-[425px]">
 <DialogHeader>
 <DialogTitle>
 {pv ? "Modifier le PV" : "Créer un PV"}
 </DialogTitle>
 </DialogHeader>
 <Form {...form}>
 <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
 <FormField
 control={form.control}
 name="category"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Catégorie</FormLabel>
 <Select onValueChange={field.onChange} defaultValue={field.value}>
 <FormControl>
 <SelectTrigger>
 <SelectValue placeholder="Sélectionner une catégorie" />
 </SelectTrigger>
 </FormControl>
 <SelectContent>
 {getAvailableCategories().map((category) => (
 <SelectItem key={category} value={category}>
 {categoryLabels[category as keyof typeof categoryLabels]}
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
 name="status"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Statut</FormLabel>
 <Select onValueChange={field.onChange} defaultValue={field.value}>
 <FormControl>
 <SelectTrigger>
 <SelectValue placeholder="Sélectionner un statut" />
 </SelectTrigger>
 </FormControl>
 <SelectContent>
 {Object.entries(statusLabels).map(([value, label]) => (
 <SelectItem key={value} value={value}>
 {label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 <FormMessage />
 </FormItem>
 )}
 />

 <div className="space-y-2">
 <FormLabel>Fichier (optionnel)</FormLabel>
 <div className="flex items-center gap-2">
 <Input
 type="file"
 accept=".pdf,.doc,.docx,.ppt,.pptx"
 onChange={handleFileUpload}
 className="hidden"
 id="file-upload"
 />
 <label
 htmlFor="file-upload"
 className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
 >
 <Upload size={16} />
 Choisir un fichier
 </label>
 </div>
 
 {uploadedFile && (
 <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
 <FileText size={16} />
 <span className="flex-1 text-sm truncate">{uploadedFile.name}</span>
 <Button
 type="button"
 variant="ghost"
 size="sm"
 onClick={removeFile}
 >
 <X size={16} />
 </Button>
 </div>
 )}
 
 <p className="text-xs text-gray-500">
 Formats acceptés : PDF, DOC, DOCX, PPT, PPTX
 </p>
 </div>

 <div className="flex justify-end gap-2">
 <Button
 type="button"
 variant="outline"
 onClick={() => onOpenChange(false)}
 >
 Annuler
 </Button>
 <Button
 type="submit"
 disabled={createMutation.isPending || updateMutation.isPending}
 className="bg-blue-600 hover:bg-blue-700"
 >
 {createMutation.isPending || updateMutation.isPending
 ? "Enregistrement..."
 : pv
 ? "Modifier"
 : "Créer"}
 </Button>
 </div>
 </form>
 </Form>
 </DialogContent>
 </Dialog>
 );
}