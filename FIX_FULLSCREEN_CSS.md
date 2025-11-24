# Ajout de marges pour les éléments du header et footer

## CSS à ajouter dans cv-request.html

Ajoutez ces règles CSS **après** les règles `.page-content` (vers la ligne 205), juste avant `</style>` :

```css
        /* Add margins for header and footer elements */
        .header__container {
            padding: 0 20px !important;
        }
        
        .footer {
            padding: 0 20px 20px 20px !important;
        }
        
        .legal-mention {
            margin-bottom: 20px !important;
        }
        
        /* Ensure form content has proper spacing */
        .cv-request-form {
            padding: 40px 20px !important;
        }
```

## Explication

- `.header__container` : Ajoute 20px de marge à gauche et à droite pour le header (breadcrumb, date, channel, langue)
- `.footer` : Ajoute 20px de marge sur les côtés et 20px en bas
- `.legal-mention` : Ajoute 20px de marge en bas pour le texte copyright
- `.cv-request-form` : Assure que le formulaire garde ses marges

## Étapes

1. Ouvrez `cv-request.html`
2. Allez vers la ligne 205 (après `.page-content`)
3. Ajoutez le CSS ci-dessus avant `</style>`
4. Sauvegardez
5. Testez localement
6. Commitez et pushez si ça fonctionne
