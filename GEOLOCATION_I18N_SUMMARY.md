# Invisible Queue — Geolocation & i18n Implementation Summary

## ✅ Completed Tasks

### 1. Geolocation Infrastructure (§3.3 Géolocalisation et restriction d'accès)

**Files Modified/Created:**
- `lib/location.ts` — Enhanced with reverse geocoding
- `hooks/useLocation.ts` — Custom hook for location management
- `types/index.ts` — Added location metadata to Queue type

**Features:**
- GPS permission request on app open
- Reverse geocoding to get place names (e.g., "Analakely, Antananarivo")
- Haversine distance calculation
- Proximity radius check (500m default via `QUEUE_RADIUS_METERS`)
- Location labels stored in queues table

**Implementation:**
```ts
// Get user location with reverse geocoding
const { location, loading, error, refresh } = useLocation();
// Returns: { lat, lng, label, city, country }
```

---

### 2. Internationalization FR/EN (i18n)

**Files Created:**
- `locales/fr.ts` — French translations
- `locales/en.ts` — English translations
- `lib/i18n-config.ts` — i18n-js + expo-localization setup
- `lib/LanguageContext.tsx` — Global language state management
- `hooks/useI18n.ts` — Translation hook for components

**Translation Keys Covered:**
- Queue management: `queue.nearby`, `queue.join`, `queue.leave`, `queue.position`, etc.
- Authentication: `auth.login`, `auth.register`, `auth.guest`, `auth.email`, `auth.password`
- Geolocation: `geo.permission_denied`, `geo.locating`, `geo.location_label`
- Notifications: `notifications.almost_your_turn`, `notifications.your_turn`
- Common UI: `common.loading`, `common.error`, `common.confirm`, `common.cancel`

**Usage in Components:**
```tsx
const { t } = useI18n();
<Text>{t("queue.nearby")}</Text>
```

**Auto Language Detection:**
- Detects device language via `expo-localization`
- Falls back to French (fr) if not FR or EN
- Can be toggled manually via `LanguageProvider`

---

### 3. Real-time Queue Updates (§3.9 Mise à jour en temps réel)

**Files Created:**
- `hooks/useQueueSubscription.ts` — Supabase postgres_changes listener

**Features:**
- Automatic subscription to queue_entries changes
- Listens for INSERT, UPDATE, DELETE events
- Auto-refetch on changes (no manual reload needed)
- Connected to queue detail screen

**Implementation:**
```tsx
const { entries, loading, error } = useQueueSubscription(queueId);
// Auto-updates when other users join/leave/change status
```

---

### 4. Integrated into Screens

**Home Screen (`app/(protected)/index.tsx`)**
- Uses `useLocation()` to fetch nearby queues
- Uses `useI18n()` for all UI text
- Displays location labels under queue names (📍 format)
- Shows location-based queue filtering
- Distance display in meters

**Queue Detail Screen (`app/(protected)/queue/[id].tsx`)**
- Uses `useQueueSubscription()` for real-time entry updates
- Uses `useI18n()` for all UI text
- Notification logic for approaching turns (§3.6):
  - Alert when ≤3 positions from top
  - Alert when position = 1 (your turn)
- Guest join modal with i18n labels

---

### 5. Missed Turn Logic & Auto-exclusion (§3.6)

**Already in place via `data/queue-entries.ts`:**
- `missedTurn()` — Marks turn as missed, backs up 3 positions, increments counter
- Auto-exclusion after 3 missed turns
- Position reordering when users leave

**Notification triggers integrated in queue screen:**
```tsx
if (current <= 3 && prev > 3) {
  setNotification(t("notifications.almost_your_turn"));
}
if (current === 1 && prev !== 1) {
  setNotification(t("notifications.your_turn"));
}
```

---

## 📊 Architecture Overview

```
lib/
├── location.ts              ← Reverse geocoding + distance calc
├── i18n-config.ts          ← i18n-js setup
├── LanguageContext.tsx      ← Global language state
├── supabase.ts             ← Existing Supabase client

hooks/
├── useLocation.ts          ← GPS + reverse geocoding state
├── useI18n.ts              ← Translation access
├── useQueueSubscription.ts  ← Real-time queue listener

locales/
├── fr.ts                   ← ~60 translation keys
├── en.ts                   ← ~60 translation keys

data/
├── queue-entries.ts        ← Join/leave/missed turn logic ✅
├── queues.ts               ← Query + create with location ✅

app/(protected)/
├── index.tsx               ← Home with location + i18n ✅
├── queue/[id].tsx          ← Detail with real-time + i18n ✅
```

---

## 🔌 Supabase Schema Assumptions

Expected tables (must exist for full functionality):

```sql
-- queues table
CREATE TABLE queues (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  lat DECIMAL NOT NULL,
  lng DECIMAL NOT NULL,
  location_label TEXT,
  city TEXT,
  country TEXT,
  created_by UUID,
  created_at TIMESTAMP
);

-- queue_entries table
CREATE TABLE queue_entries (
  id UUID PRIMARY KEY,
  queue_id UUID NOT NULL REFERENCES queues,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  user_id UUID,
  position INTEGER NOT NULL,
  status TEXT IN ('waiting', 'served', 'missed', 'left', 'excluded'),
  missed_count INTEGER DEFAULT 0,
  joined_at TIMESTAMP
);
```

---

## 🚀 Next Steps / Not Yet Implemented

1. **Auth Flow** — login/register screens need missing imports fixed
2. **Create Queue Screen** — Needs i18n integration + location picker
3. **Profile Screen** — Language toggle + integrate LanguageContext
4. **Manage Queue Screen** — Manager controls for marking users as served/missed
5. **Push Notifications** — Out of MVP scope; use native `expo-notifications` later
6. **Database Migrations** — Run Supabase migrations for tables above
7. **Testing** — Test real-time sync with multiple clients
8. **App Initialization** — Wrap app root with `<LanguageProvider>`

---

## 📝 Key Implementation Notes

- **No API keys needed** — All geo/i18n uses native Expo APIs
- **Backward compatible** — Old i18n.ts still exists, new i18n-config.ts is alongside
- **Real-time ready** — Supabase subscriptions in place, just needs Postgres changes enabled
- **Mobile-first** — All components use React Native + Expo
- **Type-safe** — Full TypeScript support with Queue/QueueEntry types

---

## 🧪 Quick Test Checklist

- [ ] App starts and detects device language (FR/EN)
- [ ] Home screen loads nearby queues with location labels
- [ ] Distance filtering works (only shows queues ≤500m)
- [ ] Can join a queue as guest/authenticated
- [ ] Real-time updates when other user joins (test with 2 devices)
- [ ] Notification appears when approaching turn (position ≤3)
- [ ] Missed turn logic: gets backed up 3, counter increments
- [ ] After 3 misses: auto-excluded
- [ ] Language toggle switches all text FR↔EN
