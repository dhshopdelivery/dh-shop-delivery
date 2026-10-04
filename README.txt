DH SHOP & DELIVERY — V7 CORRECTION

Fichiers principaux : index.html, style.css, app.js, admin.js.

CORRECTIONS :
- Menu : un seul « Suivi de commande ». Les catégories produits ne peuvent plus créer un doublon avec les rubriques système.
- Suivi : utilise la fonction publique track_order pour éviter « introuvable » à cause des droits SELECT sur orders.
- Tailles : 38.40.45, 38. 40. 45, 38,40,45 sont normalisées en choix séparés.
- Accueil : ajout de la carte « Nous trouver — Niamey, Niger » sous les produits.
- Administration : suppression des produits et commandes avec vérification du nombre de lignes réellement supprimées.

IMPORTANT : ne pas modifier les fichiers Supabase, les clés ou le mot de passe.

SI LA SUPPRESSION AFFICHЕ « VÉRIFIEZ LA POLITIQUE DELETE » :
Les politiques RLS doivent autoriser DELETE aux utilisateurs authenticated dont public.is_admin() = true. Utiliser la politique déjà prévue pour le projet :

create policy "Admin can delete products" on public.products for delete to authenticated using (public.is_admin());
create policy "Admin can delete orders" on public.orders for delete to authenticated using (public.is_admin());

Si une politique du même nom existe déjà, ne pas la recréer.
