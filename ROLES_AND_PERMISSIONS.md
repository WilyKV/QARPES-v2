# Système de Rôles et Permissions QARPES-v2

## 📋 Vue d'ensemble

Le système de gestion des rôles et permissions permet de contrôler finement les accès et les actions disponibles pour chaque utilisateur selon son rôle dans l'organisation.

## 👥 Rôles disponibles

### 1. **Admin** (Administrateur)
- **Accès** : Complet
- **Permissions** :
  - ✅ Voir toutes les fonctionnalités
  - ✅ Modifier équipes, projets, releases, ARB
  - ✅ Supprimer équipes, projets, releases, ARB
  - ✅ Gérer les dépôts Git et procédures
- **Usage** : Réservé aux administrateurs système

### 2. **Prod** (Équipe Production)
- **Accès** : Lecture complète + Modification limitée
- **Permissions** :
  - ✅ Voir toutes les fonctionnalités
  - ✅ Modifier projets, releases, dépôts Git, procédures
  - ✅ Supprimer projets et releases
  - ❌ **NE PEUT PAS** modifier ou supprimer les équipes
  - ❌ **NE PEUT PAS** modifier ou supprimer les ARB
- **Usage** : Équipe en charge de la production et des déploiements

### 3. **Architecte**
- **Accès** : Lecture complète + Modification ARB uniquement
- **Permissions** :
  - ✅ Voir toutes les fonctionnalités
  - ✅ Modifier les ARB (Architecture Review Board)
  - ✅ Supprimer les ARB
  - ❌ **NE PEUT PAS** modifier équipes, projets, releases
- **Usage** : Architectes techniques validant les demandes d'architecture

### 4. **PO** (Product Owner) et **Chef de Projet**
- **Accès** : Lecture complète + Modification équipes/projets
- **Permissions** :
  - ✅ Voir toutes les fonctionnalités
  - ✅ Modifier équipes et projets
  - ✅ Gérer les dépôts Git
  - ✅ Supprimer des projets
  - ❌ **NE PEUT PAS** modifier les releases
  - ❌ **NE PEUT PAS** modifier les ARB
- **Usage** : Responsables de projets et d'équipes

### 5. **Invité** (Guest/Viewer)
- **Accès** : Lecture seule complète
- **Permissions** :
  - ✅ Voir toutes les fonctionnalités
  - ❌ **AUCUNE modification** possible
  - ❌ **AUCUNE suppression** possible
- **Usage** : Parties prenantes, observateurs, clients

## 🔧 Utilisation dans le code

### Hook usePermissions

```typescript
import { usePermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const permissions = usePermissions();
  
  return (
    <>
      {permissions.canEditProjects() && (
        <Button onClick={handleEdit}>Éditer</Button>
      )}
      
      {permissions.canDeleteProjects() && (
        <Button onClick={handleDelete}>Supprimer</Button>
      )}
    </>
  );
}
```

### Fonctions de permissions disponibles

```typescript
// Vérification générique
permissions.hasPermission('edit_teams')

// Fonctions spécifiques
permissions.canEditTeams()
permissions.canEditProjects()
permissions.canEditReleases()
permissions.canEditArb()
permissions.canEditGitRepos()
permissions.canEditProcedures()
permissions.canDeleteTeams()
permissions.canDeleteProjects()
permissions.canDeleteReleases()
permissions.canDeleteArb()
```

## 📊 Matrice des permissions

| Permission | Admin | Prod | Architecte | PO/Chef Projet | Invité |
|-----------|-------|------|-----------|---------------|--------|
| **Voir tout** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Modifier Équipes** | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Modifier Projets** | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Modifier Releases** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Modifier ARB** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Modifier Git Repos** | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Modifier Procédures** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Supprimer Équipes** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Supprimer Projets** | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Supprimer Releases** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Supprimer ARB** | ✅ | ❌ | ✅ | ❌ | ❌ |

## 🔐 Redirection automatique

Lorsqu'un utilisateur n'est pas authentifié ou n'a pas les droits d'accès nécessaires :
- ✅ Redirection automatique vers la page d'accueil (`/`)
- ✅ Message d'erreur explicite via toast
- ✅ Délai de 500ms avant redirection pour que l'utilisateur puisse lire le message

## 🎨 Exemple d'intégration dans une page

```typescript
import { usePermissions } from '@/hooks/usePermissions';
import { redirectToHomeDelayed } from '@/lib/redirectUtils';

function MyPage() {
  const { user, isAuthenticated } = useAuth();
  const permissions = usePermissions();
  
  // Redirection si non authentifié
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Non autorisé",
        description: "Vous devez être connecté",
        variant: "destructive",
      });
      redirectToHomeDelayed();
    }
  }, [isAuthenticated]);
  
  return (
    <div>
      {/* Affichage conditionnel des boutons */}
      <Button 
        onClick={handleEdit}
        disabled={!permissions.canEditProjects()}
      >
        Éditer
      </Button>
      
      {permissions.canDeleteProjects() && (
        <Button onClick={handleDelete} variant="destructive">
          Supprimer
        </Button>
      )}
    </div>
  );
}
```

## 📝 Configuration dans la base de données

Le rôle de l'utilisateur est stocké dans la table `User` :

```sql
-- Valeurs possibles pour le champ role:
'admin'
'prod'
'architecte'
'po'
'chef_projet'
'invite'
'viewer' (alias de 'invite')
```

Par défaut, les nouveaux utilisateurs ont le rôle `viewer` (invité).

## 🚀 Migration des utilisateurs existants

Pour mettre à jour les rôles des utilisateurs existants :

```sql
-- Exemple : Définir un utilisateur comme admin
UPDATE "User" SET role = 'admin' WHERE email = 'admin@example.com';

-- Exemple : Définir plusieurs utilisateurs comme prod
UPDATE "User" SET role = 'prod' WHERE id IN ('user1', 'user2', 'user3');
```

## ✨ Améliorations futures possibles

1. **Rôles personnalisés** : Permettre la création de rôles personnalisés
2. **Permissions granulaires** : Permissions au niveau des entités individuelles
3. **Hiérarchie de rôles** : Héritage de permissions entre rôles
4. **Audit des permissions** : Journalisation des actions basées sur les permissions
5. **Interface d'administration** : Gestion visuelle des rôles et permissions

## 🐛 Dépannage

### "L'utilisateur ne peut pas modifier malgré son rôle"
- Vérifier que le rôle est correctement défini en base de données
- Vérifier que le rôle est en minuscules
- Vider le cache du navigateur
- Vérifier que le hook `usePermissions` est bien appelé

### "Redirection en boucle"
- Vérifier que la page d'accueil (`/`) ne nécessite pas d'authentification
- Vérifier que `redirectToHomeDelayed` n'est appelé qu'une fois

### "Les permissions ne se mettent pas à jour"
- Recharger la page pour forcer la récupération des données utilisateur
- Vérifier que le cache React Query est invalidé après modification du rôle
