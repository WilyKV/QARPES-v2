import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Rocket, Users, FolderOpen, Shield, User } from "lucide-react";

export default function Landing() {
  const [selectedRole, setSelectedRole] = useState<string>("viewer");

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleDemoLogin = () => {
    window.location.href = `/api/auth/demo?role=${selectedRole}`;
  };

  const roles = [
    { value: "admin", label: "Admin", description: "Accès complet" },
    { value: "manager", label: "Manager", description: "Gestion des équipes et projets" },
    { value: "dev", label: "Développeur", description: "Gestion des projets" },
    { value: "ops", label: "Ops", description: "Gestion des releases" },
    { value: "viewer", label: "Viewer", description: "Lecture seule" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Rocket className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Release Manager
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Plateforme de gestion des releases d'entreprise avec suivi complet des projets, équipes et processus ARB
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Rocket className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Gestion des Releases</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                CRUD complet avec format YYYYMM-NN et suivi des statuts
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <FolderOpen className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Projets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Gestion des projets avec statuts et assignation aux équipes
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Équipes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Gestion des équipes avec membres et rôles définis
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Shield className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <CardTitle className="text-lg">ARB</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Accès, Responsabilités, Budgets avec workflow de validation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Key Features */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Fonctionnalités Principales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Interface Moderne</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Tableaux de bord intuitifs avec filtres avancés et navigation responsive
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Gestion des Rôles</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Contrôle d'accès basé sur les rôles (Admin, Manager, Dev, Ops, Viewer)
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Relations Complètes</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Liens entre Releases ↔ Projets ↔ Équipes ↔ ARB
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Validation Robuste</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Validation des données et gestion d'erreurs complète
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Tableaux Avancés</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Filtres, tri et recherche pour toutes les entités
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Production Ready</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Architecture TypeScript avec PostgreSQL et authentification sécurisée
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Commencer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Connectez-vous pour accéder à la plateforme de gestion des releases
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={handleLogin}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  Se connecter avec Microsoft O365
                </Button>
                
                <div className="border-t pt-3 mt-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center justify-center">
                    <User className="h-4 w-4 mr-2" />
                    Connexion démo - Choisissez votre rôle :
                  </p>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-full mb-3">
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{role.label}</span>
                            <span className="text-xs text-gray-500">{role.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleDemoLogin}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    Connexion démo en tant que {roles.find(r => r.value === selectedRole)?.label}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
