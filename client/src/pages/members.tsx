import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, UserPlus, Mail, Calendar, Users, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import type { User, TeamWithMembers } from "@shared/schema";

const memberSchema = z.object({
  email: z.string().email("Email invalide").refine(email => email.endsWith("@omneseducation.com"), {
    message: "L'email doit être du domaine @omneseducation.com"
  }),
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  role: z.enum(["member", "leader"], {
    errorMap: () => ({ message: "Sélectionnez un rôle" })
  })
});

type MemberFormData = z.infer<typeof memberSchema>;

function MemberCard({ user, teams }: { user: User; teams: TeamWithMembers[] }) {
  const userTeams = teams.filter(team => 
    team.members?.some(member => member.userId === user.id) || team.leaderId === user.id
  );

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 hover:shadow-xl transition-all duration-200 group">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="w-12 h-12 ring-2 ring-blue-100 dark:ring-blue-800 group-hover:ring-blue-200 dark:group-hover:ring-blue-700 transition-all">
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              {user.firstName} {user.lastName}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Mail className="w-4 h-4" />
              {user.email}
            </CardDescription>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-300">
              <Calendar className="w-4 h-4" />
              Membre depuis {user.createdAt ? format(new Date(user.createdAt), "dd/MM/yyyy") : "Date inconnue"}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              Équipes ({userTeams.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {userTeams.map(team => (
                <Badge 
                  key={team.id} 
                  variant={team.leaderId === user.id ? "default" : "secondary"}
                  className={`text-xs ${team.leaderId === user.id 
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white" 
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  }`}
                >
                  {String(team.name)}
                  {team.leaderId === user.id && " (Leader)"}
                </Badge>
              ))}
              {userTeams.length === 0 && (
                <span className="text-sm text-gray-400">Aucune équipe assignée</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddMemberModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: "member"
    }
  });

  const { data: teams = [] } = useQuery<TeamWithMembers[]>({
    queryKey: ["/api/teams"]
  });

  const addMemberMutation = useMutation({
    mutationFn: async (data: MemberFormData) => {
      // Créer l'utilisateur
      const newUser = await apiRequest("/api/users", "POST", {
        id: `user-${Date.now()}`, // Généré côté client pour demo
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName
      });

      return newUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "Membre ajouté",
        description: "Le nouveau membre a été ajouté avec succès"
      });
      setIsOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le membre",
        variant: "destructive"
      });
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Ajouter un membre
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un nouveau membre</DialogTitle>
          <DialogDescription>
            Ajoutez un nouveau membre à l'organisation avec un email @omneseducation.com
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => addMemberMutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="prenom.nom@omneseducation.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl>
                      <Input placeholder="Prénom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={addMemberMutation.isPending}>
                {addMemberMutation.isPending ? "Ajout..." : "Ajouter"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Members() {
  const [searchTerm, setSearchTerm] = useState("");
  const [teamFilter, setTeamFilter] = useState<string>("all");

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"]
  });

  const { data: teams = [], isLoading: teamsLoading } = useQuery<TeamWithMembers[]>({
    queryKey: ["/api/teams"]
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === "" || 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (teamFilter === "all") return matchesSearch;
    if (teamFilter === "no-team") {
      const hasTeam = teams.some(team => 
        team.members?.some(member => member.userId === user.id) || team.leaderId === user.id
      );
      return matchesSearch && !hasTeam;
    }
    
    const isInTeam = teams.some(team => 
      team.id.toString() === teamFilter && 
      (team.members?.some(member => member.userId === user.id) || team.leaderId === user.id)
    );
    return matchesSearch && isInTeam;
  });

  if (usersLoading || teamsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement des membres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <Header 
          title="Gestion des Membres"
          subtitle="Gérez les membres de l'organisation et leurs équipes"
          actions={<AddMemberModal />}
        />

        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  Total Membres
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{users.length}</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  Équipes Actives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{teams.length}</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  Leaders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  {teams.filter(team => team.leaderId).length}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-rose-500 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  Sans Équipe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                  {users.filter(user => 
                    !teams.some(team => 
                      team.members?.some(member => member.userId === user.id) || team.leaderId === user.id
                    )
                  ).length}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 border-0 shadow-lg"
              />
            </div>
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 border-0 shadow-lg">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrer par équipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les équipes</SelectItem>
                <SelectItem value="no-team">Sans équipe</SelectItem>
                {teams.map(team => (
                  <SelectItem key={Number(team.id)} value={String(team.id)}>
                    {String(team.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map(user => (
              <MemberCard key={String(user.id)} user={user} teams={teams} />
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucun membre trouvé
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {searchTerm || teamFilter !== "all" 
                  ? "Essayez de modifier vos critères de recherche" 
                  : "Commencez par ajouter des membres à votre organisation"
                }
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}