# GMBIJOUX — API

NestJS 11 + Prisma 6 + PostgreSQL 16. La conception complète (modèle, endpoints, sécurité) est dans [ARCHITECTURE.md](ARCHITECTURE.md).

## Démarrer en local

```bash
cd backend
cp .env.example .env          # puis renseigner JWT_SECRET et ADMIN_PASSWORD
docker compose up -d          # PostgreSQL sur le port 5434
npm install
npm run db:deploy             # applique les migrations
npm run db:seed               # ⚠️ vide la base puis la remplit avec les données de démo
npm run dev                   # API sur http://localhost:3000/api/v1
```

Puis, à la racine du site : `npm run dev`. Vite redirige `/api` vers le port 3000 (variable `API_URL` pour changer la cible).
L'administration est sur `/admin` ; le compte est `ADMIN_EMAIL` / `ADMIN_PASSWORD` du `.env`, créé par le seed.

## Ce qui est en place

| Domaine | Endpoints |
|---|---|
| Santé | `GET /health` |
| Auth | `POST /auth/login` · `POST /auth/refresh` · `POST /auth/logout` · `GET /auth/me` |
| Commande (public) | `GET /shipping/methods?country=MA` · `POST /orders/quote` (totaux calculés côté serveur ; `shippingMethodId` facultatif) · `POST /orders` (en-tête `Idempotency-Key` conseillé) |
| Catalogue (public) | `GET /products` (filtres `q`, `category`, `collection`, `brand`, `tag`, `color`, `movement`, `gender`, `minPrice`, `maxPrice`, `inStock`, `onSale`, `isNew`, `featured`, `sort`, `page`, `limit`) · `GET /products/:slug` · `GET /categories` · `GET /collections` · `GET /brands` |
| Admin produits | `GET/POST /admin/products` · `GET/PATCH /admin/products/:id` · `PATCH …/:id/status` · `POST …/:id/stock` (avec `variantId` pour un produit à déclinaisons) · `PUT …/:id/variants` (options + déclinaisons) |
| Admin commandes | `GET /admin/orders` · `GET /admin/orders/:id` · `PATCH …/:id/status` · `POST …/:id/shipments` · `POST …/:id/payment-received` (espèces encaissées ou virement reçu) · `POST /admin/payments/:id/refund` |
| Admin catégories | `GET/POST /admin/categories` · `PATCH/DELETE /admin/categories/:id` · `POST/DELETE …/:id/image` |
| Admin photos produit | `POST /admin/products/:id/images` · `PATCH …/images/:imageId/primary` · `DELETE …/images/:imageId` |
| Admin promotions | `GET/POST /admin/coupons` · `PATCH/DELETE /admin/coupons/:id` · idem pour `/admin/promotions` |
| Admin avis | `GET /admin/reviews` · `PATCH /admin/reviews/:id/status` |
| Admin clients | `GET /admin/users` |
| Admin stats | `GET /admin/stats/overview` · `sales-by-day` · `top-products` · `recent-orders` · `low-stock` |

Sécurité : Argon2id ; JWT d'accès de 15 min gardé en mémoire par le front ; refresh token opaque (cookie `httpOnly`, `SameSite=Strict`, chemin `/api/v1/auth`) stocké haché et renouvelé à chaque usage, avec révocation de toute la session en cas de rejeu. Guard JWT global (`@Public()` pour ouvrir une route), rôle ADMIN relu en base, limitation de débit (100 req/min, 5 connexions/min), Helmet, CORS limité à `FRONTEND_URL`, validation stricte des corps, corps limité à 100 ko, journal d'audit (`audit_logs`) pour chaque action admin.

Règles métier côté serveur : machine à états des commandes (transitions invalides refusées), annulation qui restitue le stock et rembourse si la commande était payée, remboursement partiel ou total avec restitution du stock, stock jamais négatif, note moyenne des produits mise à jour à la modération, prix finaux calculés par `PricingService` (prix promo + promotions automatiques).

## Boutique au Maroc : prix, livraison, paiement

- **Devise** : dirham marocain (MAD, affiché « DH »). Les montants sont stockés en centimes de dirham.
- **Livraison** : incluse dans le prix des montres, aucun choix au moment de la commande. Une seule méthode active (« Livraison incluse », Amana, 2 à 4 jours, 0 DH) dans `shipping_methods`.
- **Paiement** : à la livraison (espèces) ou par **virement bancaire avant expédition**. Une commande par virement ne peut pas être confirmée tant que l'admin n'a pas cliqué « Virement reçu ». Les coordonnées affichées au client viennent de `BANK_HOLDER`, `BANK_NAME`, `BANK_RIB` dans `.env` (**à compléter**).
- La commande crée (ou retrouve par e-mail) un compte client, réserve le stock et le coupon dans une transaction verrouillée : deux clients ne peuvent pas acheter la même dernière pièce.

## Images

Envoyées depuis l'admin (JPG, PNG ou WebP, 5 Mo max, format vérifié sur le contenu du fichier) et enregistrées dans `UPLOAD_DIR` (`uploads/` par défaut), servies sous `/uploads`. Ce dossier doit être sauvegardé et persistant en production ; passer à Cloudinary/S3 dès qu'il y a plusieurs serveurs.

## Options et déclinaisons

Une montre peut avoir jusqu'à 3 options (Couleur, Bracelet, Taille…), chacune avec ses valeurs ; une valeur peut porter une pastille (`colorHex`). Chaque combinaison est une déclinaison (`product_variants`) avec son SKU, son stock, un prix et un prix promo facultatifs (sinon ceux de la montre) et un statut actif.
Le stock de la montre est la somme des déclinaisons actives, recalculée par l'API. Les commandes figent le libellé (« Bleu nuit · Cuir ») et le SKU de la déclinaison achetée ; annulation et remboursement remettent le stock sur la bonne déclinaison.
En public, `GET /products/:slug` renvoie `options`, `variants` (prix final, disponibilité) et `swatches` ; le filtre `color` cherche aussi dans les déclinaisons.

## Pas encore branché

- **Stripe** : les remboursements sont enregistrés en base, mais **aucun appel à Stripe n'est fait** (un avertissement est journalisé). Tant que l'intégration n'est pas faite, il faut aussi rembourser dans le tableau de bord Stripe.
- **Paiement par carte (Stripe), espace client, emails (confirmation de commande), wishlist** : pas encore implémentés. Le panier reste dans le navigateur ; la commande est envoyée à l'API au moment de la validation.
- **Redis** : la limitation de débit est en mémoire (suffisant pour une seule instance).
- **Cloudinary/S3** : les images sont stockées sur le disque du serveur (voir « Images »). Les photos de départ des montres de marque sont dans `public/` du site.

## Notes Prisma

- La migration `product_variants` a été générée avec `prisma migrate diff` (le mode interactif n'est pas disponible ici) ; l'index unique du panier y utilise `NULLS NOT DISTINCT`.
- La colonne `products.search_vector` (recherche plein texte) et les contraintes `CHECK` sont créées en SQL brut dans la migration initiale.
- `prisma migrate dev` détecte à tort une dérive sur `search_vector` (colonne générée). Pour une nouvelle migration : `npx prisma migrate dev --create-only`, **supprimer la ligne `ALTER COLUMN "search_vector" DROP DEFAULT`** du fichier généré, puis `npm run db:deploy`.
