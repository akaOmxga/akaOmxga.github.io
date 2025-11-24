# CV Request System

Système serverless permettant aux recruteurs de recevoir automatiquement votre CV par e-mail via un formulaire accessible par QR code.

## 📁 Fichiers créés

### Frontend
- **`cv-request.html`** - Page de formulaire avec style rétro/vintage
- **`cv-request.js`** - Validation, sanitization, rate limiting côté client

### Backend (Cloudflare Worker)
- **`cloudflare-worker/worker.js`** - Fonction serverless pour envoi d'emails
- **`cloudflare-worker/wrangler.toml`** - Configuration du Worker

### Documentation
- **`SETUP_CV_REQUEST.md`** - Guide complet d'installation étape par étape
- **`QUICK_REFERENCE.md`** - Référence rapide des commandes et configs

## 🔒 Sécurité

✅ Sanitization des inputs (prévention injection)  
✅ Validation email RFC 5322  
✅ Rate limiting client (3 req/5min) + serveur (5 req/h)  
✅ Protection CORS  
✅ Pas de vulnérabilités XSS

## 🚀 Prochaines étapes

1. **Déployer le Worker Cloudflare** (suivre `SETUP_CV_REQUEST.md`)
2. **Mettre à jour `cv-request.js`** avec l'URL du Worker
3. **Tester le flux complet** depuis le site web
4. **Générer le QR code** quand nécessaire pour usage réel

## 📧 Flux de fonctionnement

1. Recruteur scanne QR → ouvre `cv-request.html`
2. Saisit son email → validation client
3. Soumission → Cloudflare Worker
4. Worker vérifie, récupère CV, envoie 2 emails :
   - **Au recruteur** : CV en pièce jointe
   - **À vous** : notification avec email du recruteur

## 💰 Coût

**Gratuit** avec les tiers gratuits :
- Cloudflare Workers : 100k req/jour
- KV Storage : 100k lectures/jour
- MailChannels : 100 emails/jour

## 📖 Documentation

Voir `SETUP_CV_REQUEST.md` pour les instructions complètes de déploiement.
