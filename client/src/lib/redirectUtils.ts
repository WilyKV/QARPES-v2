/**
 * Utilitaire pour gérer les redirections d'authentification
 */

/**
 * Redirige l'utilisateur vers la page d'accueil
 */
export function redirectToHome() {
 window.location.href = "/";
}

/**
 * Redirige l'utilisateur vers la page d'accueil avec un délai
 * @param delay Délai en millisecondes (par défaut 500ms)
 */
export function redirectToHomeDelayed(delay: number = 500) {
 setTimeout(() => {
 redirectToHome();
 }, delay);
}
