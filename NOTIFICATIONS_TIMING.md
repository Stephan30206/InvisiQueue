# Quand les Notifications Vont Apparaître — § 3.10

## Déclenchement des Notifications

Les notifications **s'affichent automatiquement** quand le statut de la file d'attente change via Supabase. Voici le calendrier complet:

### 1️⃣ **Notification "Joined" (Inscription confirmée)**
**Quand?** → Lors du `INSERT` dans `queue_entries` avec `status = "waiting"`  
**Message FR** → "Vous avez rejoint la file avec succès."  
**Message EN** → "You have joined the queue."  

**Où?** → Déclenché par une fonction Supabase Edge Function ou trigger lors de la requête `joinQueue()`

---

### 2️⃣ **Notification "Approaching" (Bientôt votre tour)**
**Quand?** → Quand `position <= 3` ET `status = "waiting"`  
**Message FR** → "Vous êtes {{position}}ème dans la file. Rapprochez-vous."  
**Message EN** → "You are {{position}}th in line. Please come closer."  

**Exemple:**
- Position 1 → "You are 1st in line..."
- Position 2 → "You are 2nd in line..."
- Position 3 → "You are 3rd in line..."

---

### 3️⃣ **Notification "Your Turn" (C'est votre tour !)**
**Quand?** → Quand `position === 1` ET `status = "waiting"`  
**Message FR** → "Présentez-vous au comptoir maintenant."  
**Message EN** → "Please come to the counter now."  

---

### 4️⃣ **Notification "Missed" (Tour manqué)**
**Quand?** → Quand `missed_turns > 0` ET `status = "waiting"`  
**Message FR** → "{{missed}} tour(s) manqué(s). Encore {{remaining}} avant exclusion."  
**Message EN** → "{{missed}} missed turn(s). {{remaining}} left before removal."  

**Exemples:**
- 1 tour manqué: "1 missed turn. 2 left before removal."
- 2 tours manqués: "2 missed turns. 1 left before removal."

---

### 5️⃣ **Notification "Excluded" (Retiré de la file)**
**Quand?** → Quand `status === "excluded"`  
**Message FR** → "Vous avez manqué 3 tours. Veuillez vous réinscrire."  
**Message EN** → "You missed 3 turns. Please rejoin the queue."  

**Déclencheur:** Automatique quand `missed_turns >= 3` via trigger Supabase

---

### 6️⃣ **Notification "Left" (Servi avec succès)**
**Quand?** → Quand `status === "served"`  
**Message FR** → "Votre passage est terminé. Merci !"  
**Message EN** → "Your turn is complete. Thank you!"  

**Déclencheur:** Quand l'admin appelle `callNext()` ou marque la personne comme servie

---

## Flux Typique d'une File d'Attente

```
1. User rejoint → INSERT status="waiting", position=5
   ↓ NOTIFICATION: "joined_title" + "joined_body"

2. Quelqu'un est servi → position passe à 4
   (Pas de notif, juste un update)

3. Quelqu'un d'autre est servi → position passe à 3
   ↓ NOTIFICATION: "approaching_title" + "approaching_body"

4. Quelqu'un d'autre est servi → position passe à 2
   (Déjà notifié, pas de duplication)

5. Quelqu'un d'autre est servi → position passe à 1
   ↓ NOTIFICATION: "your_turn_title" + "your_turn_body"

6. Admin appelle le suivant → status="served"
   ↓ NOTIFICATION: "served_title" + "served_body"
   → User est retiré de la file
   → myEntry devient null
```

---

## Cas Spéciaux: Tours Manqués

Si l'utilisateur manque son tour (no-show):

```
1. position=1, is_present=false → Timer de 30 secondes
2. Timer expire → missed_turns++ (devient 1)
   ↓ NOTIFICATION: "missed_title" avec "1 missed turn. 2 left before removal."
   → position recule vers fin de file

3. (Répète) position=1 à nouveau, manque encore
   → missed_turns devient 2
   ↓ NOTIFICATION: "missed_title" avec "2 missed turns. 1 left before removal."

4. (Répète) position=1 à nouveau, manque une 3ème fois
   → missed_turns devient 3
   → status devient "excluded"
   ↓ NOTIFICATION: "excluded_title" + "excluded_body"
   → User ne peut plus revenir sans se réinscrire
```

---

## Affichage du Notification Bell

### Badge (Nombre de Notifications Non Lues)
- ✅ Apparaît immédiatement dans l'en-tête
- ✅ Se met à jour en temps réel
- ✅ Affiche "9+" si plus de 9 notifications

### Modal (Panel des Notifications)
- ✅ Slide up depuis le bas
- ✅ Affiche toutes les notifications (max 50)
- ✅ Différentes couleurs par type
- ✅ Horodatage locale (FR: HH:mm, EN: HH:mm)
- ✅ Bouton "Mark all as read" / "Tout marquer lu"

---

## Exemple d'Intégration dans le Code

```typescript
// Dans hooks/useQueueRealtime.ts
const channel = supabase
  .channel(`queue-${userId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'queue_entries',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    const updated = payload.new as QueueEntry;

    // Les notifications se déclenchent automatiquement:
    if (updated.position === 1) {
      NotificationCenter.push(
        'your_turn',
        t('notif.your_turn_title'),
        t('notif.your_turn_body')
      );
    }
    // ... etc
  })
  .subscribe();
```

---

## Test des Notifications

### Via Supabase Console
1. Allez dans `Database` → `queue_entries`
2. Sélectionnez un enregistrement de test
3. Modifiez `position` → 1
4. ✅ Une notification "your_turn" doit s'afficher

### Via App Gestion
1. Accédez à l'onglet "Gestion"
2. Cliquez "Appeler le suivant"
3. ✅ Le user reçoit une notification "served"

---

## Support Multilingue

Les notifications **suivent la langue** sélectionnée dans les paramètres:
- 🇫🇷 Français: Toutes les clés sous `translations.fr.notif.*`
- 🇬🇧 Anglais: Toutes les clés sous `translations.en.notif.*`

Le changement de langue est **instantané** et affecte:
- ✅ Les nouvelles notifications
- ✅ Les textes du Notification Bell
- ✅ Les horodatages

