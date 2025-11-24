# Fix pour l'affichage plein écran de cv-request.html

## Problème
L'overlay de la page CV Request ne prend pas toute la largeur de l'écran sur desktop, créant des bandes noires sur les côtés.

## Solution
Ajouter ces règles CSS dans le fichier `cv-request.html` après la ligne 178 (après `.back-link`).

### CSS à ajouter (lignes 180-198)

Remplacez les lignes 180-190 actuelles :

```css
        /* Make overlay full-screen on desktop */
        .page-container {
            width: 100% !important;
            max-width: none !important;
        }
```

Par ce code plus complet :

```css
        /* Force full-screen width on all containers */
        .page-container {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
        }
        
        .tv {
            width: 100% !important;
            max-width: none !important;
        }
        
        .tv-screen {
            width: 100% !important;
            max-width: none !important;
        }
        
        .tv-content {
            width: 100% !important;
            max-width: none !important;
        }
        
        .page-content {
            width: 100% !important;
            max-width: none !important;
        }
```

## Étapes

1. Ouvrez `cv-request.html` dans votre éditeur
2. Allez aux lignes 180-190
3. Remplacez le CSS actuel par le nouveau code ci-dessus
4. Sauvegardez le fichier
5. Testez localement en ouvrant le fichier dans votre navigateur
6. Si ça fonctionne, commitez et pushez sur GitHub

## Test

Après modification, l'overlay devrait prendre toute la largeur de l'écran, comme sur les autres pages de votre site quand vous changez de channel.
