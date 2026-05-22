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
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { type Commit } from "@shared/schema";
import { z } from "zod";
import { useEffect } from "react";

const formSchema = z
 .object({
 hash: z
 .string()
 .min(1, "Le hash est requis")
 .max(40, "Maximum 40 caractères"),
 message: z.string().min(1, "Le message est requis"),
 })
 .strict();

type FormData = z.infer<typeof formSchema>;

interface CommitModalProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 versionGitRepoId: number;
 projectId: number;
 versionId: number;
 commit?: Commit;
}

export function CommitModal({
 open,
 onOpenChange,
 versionGitRepoId,
 projectId,
 versionId,
 commit,
}: CommitModalProps) {
 const { toast } = useToast();
 const queryClient = useQueryClient();
 const { user } = useAuth();
 const isEditing = !!commit;

 const form = useForm<FormData>({
 resolver: zodResolver(formSchema),
 defaultValues: {
 hash: commit?.hash || "",
 message: commit?.message || "",
 },
 });

 useEffect(() => {
 if (isEditing && commit) {
 form.reset({
 hash: commit.hash,
 message: commit.message,
 });
 } else if (!isEditing) {
 form.reset({
 hash: "",
 message: "",
 });
 }
 }, [commit, isEditing, form]);

 const mutation = useMutation({
 mutationFn: async (data: FormData) => {
 const payload = {
 ...data,
 author: user ? `${user.firstName} ${user.lastName}` : 'Utilisateur inconnu',
 authorEmail: user?.email || '',
 committedAt: new Date().toISOString(),
 };

 if (isEditing) {
 return await apiRequest("PATCH", `/api/commits/${commit.id}`, payload);
 } else {
 return await apiRequest(
 "POST",
 `/api/version-git-repos/${versionGitRepoId}/commits`,
 payload
 );
 }
 },
 onSuccess: () => {
 // Invalider la requête de la version complète
 queryClient.invalidateQueries({
 queryKey: [`/api/projects/${projectId}/versions/${versionId}`],
 });
 
 // Invalider spécifiquement la requête des commits pour ce repository
 queryClient.invalidateQueries({
 queryKey: [`/api/version-git-repos/${versionGitRepoId}/commits`],
 });
 
 toast({
 title: "Succès",
 description: isEditing
 ? "Commit modifié avec succès"
 : "Commit ajouté avec succès",
 });
 onOpenChange(false);
 },
 onError: (error) => {
 toast({
 title: "Erreur",
 description: `Erreur lors de ${
 isEditing ? "la modification" : "l'ajout"
 } du commit: ${error.message}`,
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

 <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
 <p><strong>Auteur:</strong> {user ? `${user.firstName} ${user.lastName}` : 'Utilisateur inconnu'}</p>
 <p><strong>Email:</strong> {user?.email || 'Non disponible'}</p>
 <p><strong>Date:</strong> {new Date().toLocaleString('fr-FR')}</p>
 </div>

 <div className="flex justify-end gap-2">
 <Button
 type="button"
 variant="outline"
 onClick={() => onOpenChange(false)}
 >
 Annuler
 </Button>
 <Button type="submit" disabled={mutation.isPending}>
 {mutation.isPending
 ? "En cours..."
 : isEditing
 ? "Modifier"
 : "Ajouter"}
 </Button>
 </div>
 </form>
 </Form>
 </DialogContent>
 </Dialog>
 );
}