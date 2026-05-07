# Features Documentation

## Dark Mode Support

### Overview
The app now includes full dark mode support across all screens. Users can toggle dark mode in the Profile settings, and the preference is automatically saved to local storage.

### Implementation
- **Provider**: `ThemeProvider` in `lib/theme-provider.tsx` manages dark mode state globally
- **Storage**: Preferences are persisted using AsyncStorage
- **Colors**: Centralized color system in `getThemeColors()` for consistent styling across the app

### Using Dark Mode in Components
```tsx
import { useTheme, getThemeColors } from "@/lib/theme-provider";

export function MyComponent() {
  const { colorScheme, isDarkMode, toggleDarkMode } = useTheme();
  const colors = getThemeColors(colorScheme);
  
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Hello</Text>
    </View>
  );
}
```

### Color System
Colors automatically adapt based on the color scheme:
- `background`: Main background color
- `surfaceLight`: Card/surface backgrounds
- `text`: Primary text color
- `textSecondary`: Secondary text color
- `textMuted`: Muted/disabled text
- `border`: Border colors
- `borderLight`: Light borders
- `icon`: Icon colors
- `danger`: Error/destructive colors
- `tabBar`: Tab bar background

## Multilingual Support (EN/FR)

### Overview
The app supports both English and French. Users can change the language in Profile settings, with preference saved to local storage.

### Implementation
- **Translations**: `lib/i18n.ts` contains all text strings for both languages
- **Hook**: `useLanguage()` in `lib/use-language.ts` provides easy access to translations
- **Provider**: Language state is managed globally via `ThemeProvider`

### Using Translations
```tsx
import { useLanguage } from "@/lib/use-language";

export function MyComponent() {
  const { t, language } = useLanguage();
  
  return (
    <View>
      <Text>{t("profile")}</Text>
      <Text>{t("darkMode")}</Text>
    </View>
  );
}
```

### Adding New Translations
1. Open `lib/i18n.ts`
2. Add the new key to both `en` and `fr` objects in the `translations` export
3. Use `t("newKey")` in components

Example:
```typescript
en: {
  myNewFeature: "My New Feature",
},
fr: {
  myNewFeature: "Ma Nouvelle Fonctionnalité",
}
```

## Profile Screen Features

All profile functionality is now fully operational:

### My Account Section
- Personal Information: Edit name, email, phone
- Security & Privacy: Change password
- Language: Switch between EN/FR with modal picker

### Preferences Section
- Push Notifications: Toggle queue alerts
- Dark Mode: Toggle dark/light theme

### Support Section
- Help Center: Access FAQ
- App Version: View current version

### Account Management
- Logout: Securely logout from the app
- Active Files Banner: Quick access to admin queues

## Screens with Dark Mode Support

All screens have been updated with dark mode support:
- ✅ Profile (`app/(protected)/profile.tsx`)
- ✅ Home/Files List (`app/(protected)/index.tsx`)
- ✅ My Queue (`app/(protected)/my-queue.tsx`)
- ✅ Login (`app/login.tsx`)
- ✅ Register (`app/register.tsx`)
- ✅ Protected Layout (`app/(protected)/_layout.tsx`)

## Testing

### Testing Dark Mode
1. Go to Profile tab
2. Toggle "Dark Mode" switch
3. Observe all screens adapt to dark theme
4. Close app and reopen - setting persists

### Testing Language
1. Go to Profile tab
2. Tap Language option
3. Select English or Français
4. All text updates immediately
5. Close app and reopen - setting persists

### Testing Profile Features
1. Toggle notifications
2. Verify active files banner appears/disappears
3. Test logout confirmation alert
4. Try language and dark mode combinations
