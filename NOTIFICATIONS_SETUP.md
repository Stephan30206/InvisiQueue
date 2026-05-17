# Internal Notifications System — §3.10 Implementation

## Overview
Professional internal in-app notifications for queue status updates (FR/EN bilingual).

## Files Created/Modified

### 1. **lib/notification-center.ts** ✅
- Singleton notification store (max 50 notifications in memory)
- `NotificationCenter.push(type, title, message)` — add notification
- `useNotifications()` hook — subscribe to changes
- Types: `approaching` | `your_turn` | `missed` | `excluded` | `left` | `joined`

### 2. **lib/use-language.ts** ✅
- Updated to support nested translation keys (e.g., `"notif.approaching_title"`)
- Variable interpolation: `t("notif.approaching_body", { position: 2 })`
- Fully typed with TypeScript

### 3. **lib/i18n.ts** ✅
- Added `notif` namespace with FR/EN translations
- All notification text with `{{variable}}` placeholders

### 4. **components/NotificationBell.tsx** ✅
- Header bell icon with unread badge
- Bottom-sheet modal with notification list
- Type-specific icons and colors
- Read/unread state management

### 5. **app/(protected)/_layout.tsx** ✅
- Integrated `NotificationBell` in header via `headerRight`
- Header styling for consistency

### 6. **hooks/useQueueRealtime.ts** ✅
- Real-time Supabase listener on `queue_entries`
- Automatically pushes notifications on status changes:
  - `excluded` → "excluded" notification
  - `served` → "left" notification
  - `waiting` + `position === 1` → "your_turn"
  - `waiting` + `position <= 3` → "approaching"
  - `waiting` + `missed_turns > 0` → "missed"

## Usage Examples

### In Queue Screens
```typescript
import { useQueueRealtime } from "@/hooks/useQueueRealtime";
import { useLanguage } from "@/lib/use-language";

export default function MyQueueScreen() {
  const { t } = useLanguage();
  const [myEntry, setMyEntry] = useState(null);
  
  useQueueRealtime(userId, (entry) => {
    setMyEntry(entry);
  });
  
  return (
    <Text>{t("myQueueTab")}</Text>
  );
}
```

### Manual Notifications
```typescript
import { NotificationCenter } from "@/lib/notification-center";
import { useLanguage } from "@/lib/use-language";

const { t } = useLanguage();

NotificationCenter.push(
  "joined",
  t("notif.joined_title"),
  t("notif.joined_body")
);
```

### With Variables
```typescript
// French: "Vous êtes 2ème dans la file. Rapprochez-vous."
t("notif.approaching_body", { position: 2 })

// English: "You are 2nd in line. Please come closer."
```

## Theme Integration
Notifications use `getThemeColors()` for light/dark mode consistency.
- Colors, typography, and spacing respect theme settings
- Bell icon is responsive to theme changes

## Notification Bell Features
- ✅ Unread count badge
- ✅ Click to open modal
- ✅ "Mark all as read" action
- ✅ Time display (locale-aware)
- ✅ Type-specific icons & colors
- ✅ Empty state when no notifications

## Requirements Met (§3.10)
| Requirement | Implementation |
|---|---|
| Approche du tour (≤ 3 positions) | `approaching` notification in `useQueueRealtime` |
| Imminence du passage (position 1) | `your_turn` notification |
| Notifications internes uniquement | In-memory store, no push/system notifications |
| Bilingue FR/EN | `useLanguage()` with full i18n support |
| Non-intrusive UI | Header bell + bottom sheet modal |
| Professional design | Consistent theming, icon types, colors |

## Notes
- Notifications persist until app close (in-memory)
- No database storage required for MVP
- Ready for future push notification upgrade
- All translations support variable interpolation
