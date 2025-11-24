# Guide de Déploiement Cloudflare Worker - Étape par Étape

## Étape 1 : Installation de Wrangler ✅

Wrangler est maintenant installé ! Vous pouvez vérifier avec :
```bash
wrangler --version
```

## Étape 2 : Se connecter à Cloudflare

Ouvrez un terminal et exécutez :
```bash
wrangler login
```

**Ce qui va se passer** :
- Une fenêtre de navigateur va s'ouvrir
- Connectez-vous à votre compte Cloudflare (ou créez-en un gratuitement)
- Autorisez Wrangler à accéder à votre compte
- Revenez au terminal - vous verrez "Successfully logged in"

## Étape 3 : Créer le KV Namespace

Le KV namespace sert à stocker les données de rate limiting. Exécutez :

```bash
cd cloudflare-worker
wrangler kv:namespace create "CV_REQUESTS"
```

**Résultat attendu** :
```
🌀 Creating namespace with title "cv-request-worker-CV_REQUESTS"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "CV_REQUESTS", id = "abc123def456..." }
```

**IMPORTANT** : Copiez l'ID qui s'affiche (par exemple `abc123def456...`)

## Étape 4 : Mettre à jour wrangler.toml

Ouvrez `cloudflare-worker/wrangler.toml` et remplacez :
```toml
id = "YOUR_KV_NAMESPACE_ID"
```

Par :
```toml
id = "abc123def456..."  # Votre ID réel
```

## Étape 5 : Configurer le Worker

Ouvrez `cloudflare-worker/worker.js` et vérifiez/modifiez :

```javascript
const CONFIG = {
    OWNER_EMAIL: 'victor.simon760@gmail.com',  // ✅ Votre email
    OWNER_NAME: 'Victor SIMON',                 // ✅ Votre nom
    CV_FILENAME: 'Victor_SIMON_CV.pdf',        // ✅ Nom du fichier
    GITHUB_PAGES_ORIGIN: 'https://akaomxga.github.io', // ✅ Votre URL
    // ...
};
```

## Étape 6 : Déployer le Worker

Dans le dossier `cloudflare-worker`, exécutez :
```bash
wrangler deploy
```

**Résultat attendu** :
```
Total Upload: XX.XX KiB / gzip: XX.XX KiB
Uploaded cv-request-worker (X.XX sec)
Published cv-request-worker (X.XX sec)
  https://cv-request-worker.YOUR-SUBDOMAIN.workers.dev
Current Deployment ID: xxxxx
```

**IMPORTANT** : Copiez l'URL complète du Worker (par exemple `https://cv-request-worker.abc123.workers.dev`)

## Étape 7 : Mettre à jour le Frontend

Ouvrez `cv-request.js` et modifiez la ligne 8 :

```javascript
API_ENDPOINT: 'https://cv-request-worker.YOUR-SUBDOMAIN.workers.dev/send-cv',
```

Remplacez par votre URL réelle :
```javascript
API_ENDPOINT: 'https://cv-request-worker.abc123.workers.dev/send-cv',
```

## Étape 8 : Vérifier que le CV est accessible

Ouvrez votre navigateur et allez sur :
```
https://akaomxga.github.io/CV_VictorSIMON_2026.pdf
```

Le PDF doit se télécharger. Si ce n'est pas le cas :
1. Commitez et pushez `CV_VictorSIMON_2026.pdf` sur GitHub
2. Attendez quelques minutes que GitHub Pages se mette à jour

## Étape 9 : Tester le système

1. Ouvrez `cv-request.html` dans votre navigateur local
2. Entrez votre propre adresse email
3. Cliquez sur "Send CV"
4. Vérifiez vos emails :
   - Vous devriez recevoir le CV avec la pièce jointe
   - Vous devriez recevoir une notification sur `victor.simon760@gmail.com`

## Étape 10 : Déployer sur GitHub Pages

```bash
git add cv-request.html cv-request.js cloudflare-worker/ SETUP_CV_REQUEST.md
git commit -m "Add CV request system"
git push origin main
```

Attendez quelques minutes, puis testez sur :
```
https://akaomxga.github.io/cv-request.html
```

## Commandes Utiles

**Voir les logs en temps réel** :
```bash
wrangler tail
```

**Redéployer après modification** :
```bash
cd cloudflare-worker
wrangler deploy
```

**Lister vos Workers** :
```bash
wrangler deployments list
```

## Dépannage

### "wrangler: command not found"
- Fermez et rouvrez votre terminal
- Ou utilisez : `npx wrangler` au lieu de `wrangler`

### "Authentication error"
- Exécutez : `wrangler login` à nouveau

### "KV namespace not found"
- Vérifiez que l'ID dans `wrangler.toml` correspond à celui créé
- Recréez le namespace si nécessaire

### Emails non reçus
- Vérifiez les logs : `wrangler tail`
- Vérifiez le dossier spam
- Vérifiez que le CV est accessible sur GitHub Pages

## Résumé des Commandes

```bash
# 1. Se connecter
wrangler login

# 2. Créer KV namespace
cd cloudflare-worker
wrangler kv:namespace create "CV_REQUESTS"

# 3. Mettre à jour wrangler.toml avec l'ID

# 4. Déployer
wrangler deploy

# 5. Copier l'URL et mettre à jour cv-request.js

# 6. Tester localement puis déployer sur GitHub
```

---

**Vous êtes prêt !** Suivez ces étapes dans l'ordre et tout devrait fonctionner. 🚀
