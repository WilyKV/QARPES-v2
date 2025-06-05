import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, GitCommit, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { formatDate } from "@/lib/constants";

interface ProjectVersion {
  id: number;
  version: string;
  status: string;
  description?: string;
  releaseDate?: string;
  createdAt: string;
  commits?: Commit[];
  cabTickets?: CabTicket[];
  procedures?: Procedure[];
}

interface Commit {
  id: number;
  hash: string;
  message: string;
  author: string;
  commitDate: string;
}

interface CabTicket {
  id: number;
  ticketNumber: string;
  subject: string;
  status: string;
  url?: string;
}

interface Procedure {
  id: number;
  title: string;
  description?: string;
  category: string;
  url?: string;
}

interface ProjectWithVersions {
  id: number;
  name: string;
  description?: string;
  team?: {
    id: number;
    name: string;
  };
  versions: ProjectVersion[];
}

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'production': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'testing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'development': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'planning': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'in_review': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'production':
      case 'approved':
        return <CheckCircle className="w-3 h-3" />;
      case 'testing':
      case 'in_progress':
      case 'in_review':
        return <Clock className="w-3 h-3" />;
      case 'pending':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <Badge className={`${getStatusColor(status)} flex items-center gap-1`}>
      {getStatusIcon(status)}
      {status.replace('_', ' ')}
    </Badge>
  );
};

export default function ProjectDetail() {
  const { id } = useParams();
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);

  // Simulation des données - à remplacer par les vraies API
  const { data: project, isLoading } = useQuery({
    queryKey: [`/api/projects/${id}/versions`],
    retry: false,
    // Données de test pour le développement
    queryFn: async () => {
      // Simuler un délai de réseau
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockData: ProjectWithVersions = {
        id: parseInt(id || "0"),
        name: "Portail Étudiant v3.0",
        description: "Refonte complète du portail étudiant avec nouvelle UI/UX et fonctionnalités avancées",
        team: {
          id: 5,
          name: "Équipe Frontend"
        },
        versions: [
          {
            id: 1,
            version: "v3.0.0",
            status: "production",
            description: "Version majeure avec nouvelle interface utilisateur",
            releaseDate: "2024-01-31",
            createdAt: "2024-01-15T10:00:00Z",
            commits: [
              {
                id: 1,
                hash: "a1b2c3d4",
                message: "feat: nouvelle interface de connexion",
                author: "Marie Dubois",
                commitDate: "2024-01-25T10:30:00Z"
              },
              {
                id: 2,
                hash: "e5f6g7h8",
                message: "fix: correction bug affichage notes",
                author: "Pierre Martin",
                commitDate: "2024-01-28T14:20:00Z"
              }
            ],
            cabTickets: [
              {
                id: 1,
                ticketNumber: "CAB-2024-001",
                subject: "Déploiement Portail Étudiant v3.0.0 en production",
                status: "approved",
                url: "https://cab.omneseducation.com/tickets/2024-001"
              }
            ],
            procedures: [
              {
                id: 1,
                title: "Procédure de déploiement production",
                description: "Étapes détaillées pour le déploiement en production du portail",
                category: "deployment",
                url: "https://docs.omneseducation.com/deploy/portail-v3"
              }
            ]
          },
          {
            id: 2,
            version: "v3.1.0",
            status: "in_progress",
            description: "Améliorations de performance et nouvelles fonctionnalités",
            releaseDate: "2024-03-15",
            createdAt: "2024-02-01T10:00:00Z",
            commits: [
              {
                id: 3,
                hash: "m3n4o5p6",
                message: "perf: optimisation requêtes base de données",
                author: "Thomas Rousseau",
                commitDate: "2024-03-10T16:45:00Z"
              }
            ],
            cabTickets: [
              {
                id: 2,
                ticketNumber: "CAB-2024-015",
                subject: "Mise à jour infrastructure pour v3.1.0",
                status: "pending"
              }
            ],
            procedures: []
          }
        ]
      };
      
      return mockData;
    }
  });

  const selectedVersion = project?.versions.find(v => v.id === selectedVersionId) || project?.versions[0];

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Chargement..." />
          <main className="flex-1 overflow-auto p-6">
            <div className="space-y-6">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Projet non trouvé" />
          <main className="flex-1 overflow-auto p-6">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">Le projet demandé n'existe pas.</p>
              <Button className="mt-4" onClick={() => window.history.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={project.name}
          subtitle={project.team?.name}
          actions={
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux projets
            </Button>
          }
        />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Description du projet */}
            {project.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">{project.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Liste des versions */}
            <Card>
              <CardHeader>
                <CardTitle>Versions ({project.versions.length})</CardTitle>
                <CardDescription>
                  Cliquez sur une version pour voir ses détails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {project.versions.map((version) => (
                    <div
                      key={version.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedVersion?.id === version.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => setSelectedVersionId(version.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{version.version}</h3>
                        <StatusBadge status={version.status} />
                      </div>
                      {version.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {version.description}
                        </p>
                      )}
                      {version.releaseDate && (
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(version.releaseDate)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Détails de la version sélectionnée */}
            {selectedVersion && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Détails de la version {selectedVersion.version}
                    <StatusBadge status={selectedVersion.status} />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="commits" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="commits" className="flex items-center gap-2">
                        <GitCommit className="w-4 h-4" />
                        Commits ({selectedVersion.commits?.length || 0})
                      </TabsTrigger>
                      <TabsTrigger value="cab" className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        CAB ({selectedVersion.cabTickets?.length || 0})
                      </TabsTrigger>
                      <TabsTrigger value="procedures" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Procédures ({selectedVersion.procedures?.length || 0})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="commits" className="mt-4">
                      <div className="space-y-3">
                        {selectedVersion.commits?.length ? (
                          selectedVersion.commits.map((commit) => (
                            <div key={commit.id} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                      {commit.hash}
                                    </code>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                      par {commit.author}
                                    </span>
                                  </div>
                                  <p className="text-sm font-medium">{commit.message}</p>
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(commit.commitDate)}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                            Aucun commit pour cette version
                          </p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="cab" className="mt-4">
                      <div className="space-y-3">
                        {selectedVersion.cabTickets?.length ? (
                          selectedVersion.cabTickets.map((ticket) => (
                            <div key={ticket.id} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium">{ticket.ticketNumber}</span>
                                    <StatusBadge status={ticket.status} />
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {ticket.subject}
                                  </p>
                                </div>
                                {ticket.url && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(ticket.url, '_blank')}
                                  >
                                    Voir
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                            Aucun ticket CAB pour cette version
                          </p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="procedures" className="mt-4">
                      <div className="space-y-3">
                        {selectedVersion.procedures?.length ? (
                          selectedVersion.procedures.map((procedure) => (
                            <div key={procedure.id} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium">{procedure.title}</span>
                                    <Badge variant="outline">{procedure.category}</Badge>
                                  </div>
                                  {procedure.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                      {procedure.description}
                                    </p>
                                  )}
                                </div>
                                {procedure.url && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(procedure.url, '_blank')}
                                  >
                                    Consulter
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                            Aucune procédure pour cette version
                          </p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}