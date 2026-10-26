// Service worker de l'appli de pointage.
// Les fichiers de la page sont servis depuis le réseau en priorité (les mises à jour arrivent donc tout de suite)
// et gardés en cache pour démarrer même sans connexion. Les données (Supabase) ne sont JAMAIS mises en cache.
const CACHE = "pointage-v1";
const FICHIERS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable.png"];

self.addEventListener("install", evenement => {
  evenement.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FICHIERS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", evenement => {
  evenement.waitUntil(
    caches.keys()
      .then(cles => Promise.all(cles.filter(cle => cle !== CACHE).map(cle => caches.delete(cle))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", evenement => {
  const requete = evenement.request;
  const url = new URL(requete.url);
  // Seulement les fichiers de cette page : Supabase et le CDN passent directement par le réseau.
  if (requete.method !== "GET" || url.origin !== self.location.origin) return;

  evenement.respondWith(
    fetch(requete)
      .then(reponse => {
        if (reponse && reponse.ok) {
          const copie = reponse.clone();
          caches.open(CACHE).then(cache => cache.put(requete, copie));
        }
        return reponse;
      })
      .catch(() => caches.match(requete).then(enCache => enCache || caches.match("./index.html")))
  );
});
