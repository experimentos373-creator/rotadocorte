// Rota do Corte - Service Worker para Notificações Mobile & Offline Cache
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Manipulador de clique em notificações do sistema
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Se já existe uma aba do painel aberta, foca nela
      for (const client of clientList) {
        if (client.url.includes("/admin") || client.url.includes("/agenda")) {
          return client.focus();
        }
      }
      // Se não, abre uma nova janela no painel do admin
      if (self.clients.openWindow) {
        return self.clients.openWindow("/admin");
      }
    })
  );
});
