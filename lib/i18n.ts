export type Language = 'en' | 'fr';

export const translations = {
  en: {
    // Common
    language: 'English',
    darkMode: 'Dark Mode',
    
    // Profile
    profile: 'Profile',
    myAccount: 'My Account',
    personalInformation: 'Personal Information',
    personalInfoSub: 'Edit your name, email and phone',
    security: 'Security & Privacy',
    securitySub: 'Change your password',
    language: 'Language',
    preferences: 'Preferences',
    notifications: 'Push Notifications',
    notificationsSub: 'Queue alerts and updates',
    darkModeSub: 'Adjust visual appearance',
    support: 'Support',
    helpCenter: 'Help Center',
    helpCenterSub: 'FAQ and technical support',
    appVersion: 'App Version',
    logout: 'Logout',
    login: 'Login',
    confirmLogout: 'Logout',
    confirmLogoutMessage: 'Are you sure you want to logout?',
    cancel: 'Cancel',
    verified: 'Verified User',
    guest: 'Guest',
    goldClient: 'Gold Client',
    activeFiles: 'active files',
    activeFile: 'active file',
    toManage: 'to manage',
    termsFooter: 'By using Invisible Queue, you accept our Terms of Use and Privacy Policy.',
    activeQueuesCount: (count: number) => count > 1 ? `${count} files` : `${count} file`,
  },
  fr: {
    // Common
    language: 'Français',
    darkMode: 'Mode Sombre',
    
    // Profile
    profile: 'Profil',
    myAccount: 'Mon compte',
    personalInformation: 'Informations Personnelles',
    personalInfoSub: 'Modifier votre nom, email et téléphone',
    security: 'Sécurité & Confidentialité',
    securitySub: 'Changer de mot de passe',
    language: 'Langue',
    preferences: 'Préférences',
    notifications: 'Notifications Push',
    notificationsSub: 'Alertes de file d\'attente et mises à jour',
    darkModeSub: 'Ajuster l\'apparence visuelle',
    support: 'Support',
    helpCenter: 'Centre d\'aide',
    helpCenterSub: 'FAQ et support technique',
    appVersion: 'Version de l\'application',
    logout: 'Se déconnecter',
    login: 'Se connecter',
    confirmLogout: 'Déconnexion',
    confirmLogoutMessage: 'Êtes-vous sûr de vouloir vous déconnecter ?',
    cancel: 'Annuler',
    verified: 'Utilisateur Vérifié',
    guest: 'Invité',
    goldClient: 'Client Or',
    activeFiles: 'files actives',
    activeFile: 'file active',
    toManage: 'à administrer',
    termsFooter: 'En utilisant Invisible Queue, vous acceptez nos Conditions d\'utilisation et notre Politique de confidentialité.',
    activeQueuesCount: (count: number) => count > 1 ? `${count} files` : `${count} file`,
  },
};

export const getTranslation = (language: Language, key: keyof typeof translations.en): any => {
  return translations[language][key as keyof typeof translations[typeof language]];
};
