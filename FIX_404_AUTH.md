# Correction du bug 404 sur les pages protégées

## 🐛 Problème identifié

Lorsqu'un utilisateur non authentifié accédait à la page `/releases`, une erreur 404 se produisait. Le problème venait de :

1. La requête API était lancée même si l'utilisateur n'était pas authentifié
2. La redirection utilisait `window.location.href` au lieu du router `wouter`
3. La requête API échouait avec une 404 avant que la redirection ne se produise

## ✅ Solution appliquée

### 1. Ajout de l'option `enabled` dans useQuery

```typescript
const { data: releases, isLoading: releasesLoading } = useQuery({
  queryKey: ["/api/releases"],
  retry: false,
  enabled: isAuthenticated, // ✅ Ne lance la requête que si authentifié
});
```

Cela empêche React Query de lancer la requête API tant que l'utilisateur n'est pas authentifié.

### 2. Utilisation du router wouter pour la redirection

Au lieu de :
```typescript
redirectToHomeDelayed(); // utilise window.location.href
```

On utilise maintenant :
```typescript
setTimeout(() => {
  setLocation("/"); // ✅ Utilise le router wouter
}, 500);
```

### 3. Ajout de setLocation dans les dépendances useEffect

```typescript
useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    toast({
      title: "Non autorisé",
      description: "Vous devez être connecté pour accéder aux releases.",
      variant: "destructive",
    });
    setTimeout(() => {
      setLocation("/");
    }, 500);
  }
}, [isAuthenticated, isLoading, toast, setLocation]); // ✅ setLocation ajouté
```

## 📝 Fichiers modifiés

- `client/src/pages/releases.tsx`
  - Ajout de `enabled: isAuthenticated` dans useQuery
  - Remplacement de `redirectToHomeDelayed()` par `setTimeout(() => setLocation("/"), 500)`
  - Ajout de `setLocation` dans les dépendances de useEffect

## 🧪 Test de la correction

1. **Sans être connecté** :
   - Aller sur `/releases`
   - ✅ Un toast "Non autorisé" s'affiche
   - ✅ Redirection vers `/` après 500ms
   - ✅ Pas d'erreur 404

2. **Avec authentification** :
   - Se connecter sur `/`
   - Aller sur `/releases`
   - ✅ La page se charge normalement
   - ✅ Les données sont affichées

## 🔄 À appliquer sur d'autres pages

Cette correction devrait être appliquée sur toutes les pages protégées qui utilisent `useQuery` :

- `/teams`
- `/projects`
- `/arb`
- `/releases/:id`
- etc.

Le pattern à suivre :

```typescript
// 1. Récupérer setLocation
const [, setLocation] = useLocation();

// 2. Ajouter enabled dans useQuery
const { data, isLoading: dataLoading } = useQuery({
  queryKey: ["/api/endpoint"],
  retry: false,
  enabled: isAuthenticated, // ✅
});

// 3. Redirection avec wouter
useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    toast({ title: "Non autorisé" });
    setTimeout(() => {
      setLocation("/");
    }, 500);
  }
}, [isAuthenticated, isLoading, toast, setLocation]);
```

## 💡 Avantages de cette solution

1. **Pas de requêtes inutiles** : L'API n'est appelée que si l'utilisateur est authentifié
2. **Pas d'erreur 404** : La redirection se fait avant toute tentative de requête
3. **Meilleure UX** : Message clair et redirection fluide
4. **Performance** : Évite les requêtes API inutiles
5. **Compatibilité router** : Utilise wouter au lieu de window.location

## 📅 Date de correction

3 octobre 2025
