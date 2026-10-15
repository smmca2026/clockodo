import { useState, useEffect } from 'react';

export const translations = {
  en: {
    // Nav Items
    timesheet: 'Timesheet',
    time_tracker: 'Time Tracker',
    calendar: 'Calendar',
    dashboard: 'Dashboard',
    reports: 'Reports',
    projects: 'Projects',
    team: 'Team',
    settings: 'Settings',
    logout: 'Log Out',
    sec_tracking: 'TRACKING',
    sec_analyze: 'ANALYZE',
    sec_manage: 'MANAGE',
    admin_badge: '👑 Workspace Admin',
    employee_badge: '👤 Employee Account',
    admin_owner: 'Admin (Owner)',
    employee: 'Employee',

    // Header & Global
    search_placeholder: 'Search projects, tasks, team... (Ctrl+K)',
    active_timer: 'Active Timer',
    live: 'Live',

    // Settings Banner & Tabs
    workspace_settings_title: 'Workspace & Account Settings',
    workspace_settings_desc: 'Configure login credentials, language localization, UI appearance, and time tracking policies.',
    tab_profile: 'Profile & Workspace',
    tab_security: 'Security & Password',
    tab_language: 'Language & Region',
    tab_appearance: 'Appearance & Theme',
    tab_notifications: 'Notifications',
    tab_tracking: 'Tracking Rules',

    // Profile Form
    personal_details_title: 'Personal Details & Workspace Affiliation',
    personal_details_desc: 'Manage your profile information, registered work email address, department, and company workspace affiliation.',
    employee_info_title: 'Employee Profile Information',
    employee_info_desc: 'These details identify your timesheet submissions, report activity logs, and workspace team directory entries.',
    full_name: 'Full Name',
    work_email: 'Work Email',
    department: 'Department / Designation',
    organization_workspace: 'Organization Workspace',
    save_profile_changes: 'Save Profile Changes',
    saving_profile: 'Saving Profile...',

    // Language Form
    language_pref_title: 'Language & Regional Preferences',
    language_pref_desc: 'Choose your preferred interface language, date formatting, time representation, and workspace currency.',
    select_primary_lang: 'Select Primary Display Language',
    select_primary_lang_desc: 'Choose between English, Tamil (தமிழ்), Hindi (हिन्दी), and international languages.',
    save_language_pref: 'Save Language Preferences',

    // Appearance Form
    appearance_title: 'Visual Theme & Display Preferences',
    appearance_desc: 'Configure your interface color theme. Choose between System Theme, Maximum Dark Mode, or Crisp Light Mode.',
    theme_system: 'System Theme (Default)',
    theme_system_desc: 'Automatically matches your operating system and browser preferences.',
    theme_system_tag: 'Default Auto',
    theme_dark: 'Maximum Dark Theme',
    theme_dark_desc: 'Deep Obsidian canvas with vibrant Emerald Green accents and high contrast.',
    theme_dark_tag: 'Maximum Dark',
    theme_light: 'White / Light Theme',
    theme_light_desc: 'Crisp white card surfaces, soft neutral borders, clean and highly readable.',
    theme_light_tag: 'Clean White',
    save_theme_pref: 'Save Theme Settings',
    active_theme_label: 'Active Theme',
  },

  ta: {
    // Nav Items
    timesheet: 'நேரத்தாள் (Timesheet)',
    time_tracker: 'நேரக் கண்காணிப்பு (Tracker)',
    calendar: 'நாட்காட்டி (Calendar)',
    dashboard: 'முகப்புப் பலகை (Dashboard)',
    reports: 'அறிக்கைகள் (Reports)',
    projects: 'திட்டங்கள் (Projects)',
    team: 'குழு (Team)',
    settings: 'அமைப்புகள் (Settings)',
    logout: 'வெளியேறு (Log Out)',
    sec_tracking: 'நேரக் கண்காணிப்பு',
    sec_analyze: 'பகுப்பாய்வு',
    sec_manage: 'மேலாண்மை',
    admin_badge: '👑 நிறுவன நிர்வாகி (Admin)',
    employee_badge: '👤 பணியாளர் கணக்கு',
    admin_owner: 'நிர்வாகி (Owner)',
    employee: 'பணியாளர்',

    // Header & Global
    search_placeholder: 'திட்டங்கள், பணிகள், குழுவைத் தேடு... (Ctrl+K)',
    active_timer: 'செயலில் உள்ள டைமர்',
    live: 'நேரலை',

    // Settings Banner & Tabs
    workspace_settings_title: 'பணியிட மற்றும் கணக்கு அமைப்புகள்',
    workspace_settings_desc: 'உள்நுழைவு விவரங்கள், மொழி மாற்றம், தோற்றம் மற்றும் கண்காணிப்பு அமைப்புகளை உள்ளமைக்கவும்.',
    tab_profile: 'சுயவிவரம் & பணியிடம்',
    tab_security: 'பாதுகாப்பு & கடவுச்சொல்',
    tab_language: 'மொழி & பிராந்தியம் (தமிழ்)',
    tab_appearance: 'தோற்றம் & தீம்',
    tab_notifications: 'அறிவிப்புகள்',
    tab_tracking: 'கண்காணிப்பு விதிகள்',

    // Profile Form
    personal_details_title: 'தனிப்பட்ட விவரங்கள் & பணியிட இணைப்பு',
    personal_details_desc: 'உங்கள் சுயவிவர தகவல், பணி மின்னஞ்சல் முகவரி, துறை மற்றும் நிறுவன அமைப்புகளை நிர்வகிக்கவும்.',
    employee_info_title: 'பணியாளர் சுயவிவரத் தகவல்கள்',
    employee_info_desc: 'இந்த விவரங்கள் உங்கள் நேரத்தாள் பதிவுகள் மற்றும் குழு பட்டியலில் பிரதிபலிக்கும்.',
    full_name: 'முழுப் பெயர்',
    work_email: 'பணி மின்னஞ்சல் முகவரி',
    department: 'துறை / பதவி',
    organization_workspace: 'நிறுவன பணியிடம்',
    save_profile_changes: 'சுயவிவர மாற்றங்களைச் சேமி',
    saving_profile: 'சேமிக்கப்படுகிறது...',

    // Language Form
    language_pref_title: 'மொழி & பிராந்திய விருப்பங்கள்',
    language_pref_desc: 'உங்களுக்கு விருப்பமான இடைமுக மொழி, தேதி வடிவம், நேர வடிவம் மற்றும் நாணயத்தை தேர்ந்தெடுக்கவும்.',
    select_primary_lang: 'முதன்மை காட்சி மொழியைத் தேர்ந்தெடுக்கவும்',
    select_primary_lang_desc: 'ஆங்கிலம் (English), தமிழ் (Tamil), இந்தி (Hindi) ஆகியவற்றில் இருந்து தேர்ந்தெடுக்கவும்.',
    save_language_pref: 'மொழி விருப்பங்களைச் சேமி',

    // Appearance Form
    appearance_title: 'தோற்றம் & காட்சி விருப்பங்கள்',
    appearance_desc: 'உங்கள் திரையின் நிறத் தீமை மாற்றவும். சிஸ்டம் தீம், டார்க் தீம் அல்லது லைட் வெள்ளை தீமைத் தேர்ந்தெடுக்கவும்.',
    theme_system: 'கணினி தீம் (இயல்புநிலை)',
    theme_system_desc: 'உங்கள் கணினி அல்லது உலாவி அமைப்புகளுக்கு ஏற்ப தானாகவே மாறும்.',
    theme_system_tag: 'Default Auto',
    theme_dark: 'அதிகபட்ச டார்க் தீம்',
    theme_dark_desc: 'கண்களுக்கு இதமான அடர் கருப்பு மற்றும் எமரால்டு பச்சை நிற தோற்றம்.',
    theme_dark_tag: 'Maximum Dark',
    theme_light: 'வெள்ளை / லைட் தீம்',
    theme_light_desc: 'தூய வெள்ளை பின்னணி மற்றும் தெளிவான எழுத்துக்கள் கொண்ட தோற்றம்.',
    theme_light_tag: 'Clean White',
    save_theme_pref: 'தீம் அமைப்புகளைச் சேமி',
    active_theme_label: 'செயலில் உள்ள தீம்',
  },

  hi: {
    // Nav Items
    timesheet: 'टाइमशीट (Timesheet)',
    time_tracker: 'टाइम ट्रैकर (Tracker)',
    calendar: 'कैलेंडर (Calendar)',
    dashboard: 'डैशबोर्ड (Dashboard)',
    reports: 'रिपोर्ट्स (Reports)',
    projects: 'प्रोजेक्ट्स (Projects)',
    team: 'टीम (Team)',
    settings: 'सेटिंग्स (Settings)',
    logout: 'लॉग आउट (Log Out)',
    sec_tracking: 'ट्रैकिंग',
    sec_analyze: 'विश्लेषण',
    sec_manage: 'प्रबंधन',
    admin_badge: '👑 कार्यक्षेत्र व्यवस्थापक (Admin)',
    employee_badge: '👤 कर्मचारी खाता',
    admin_owner: 'व्यवस्थापक (Owner)',
    employee: 'कर्मचारी',

    // Header & Global
    search_placeholder: 'प्रोजेक्ट, कार्य, टीम खोजें... (Ctrl+K)',
    active_timer: 'सक्रिय टाइमर',
    live: 'लाइव',

    // Settings Banner & Tabs
    workspace_settings_title: 'कार्यक्षेत्र और खाता सेटिंग्स',
    workspace_settings_desc: 'लॉगिन क्रेडेंशियल, भाषा, स्क्रीन दिखावट और ट्रैकिंग नियम कॉन्फ़िगर करें।',
    tab_profile: 'प्रोफ़ाइल और कार्यक्षेत्र',
    tab_security: 'सुरक्षा और पासवर्ड',
    tab_language: 'भाषा और क्षेत्र (हिन्दी)',
    tab_appearance: 'दिखावट और थीम',
    tab_notifications: 'सूचनाएं',
    tab_tracking: 'ट्रैकिंग नियम',

    // Profile Form
    personal_details_title: 'व्यक्तिगत विवरण और कार्यक्षेत्र संबद्धता',
    personal_details_desc: 'अपनी प्रोफ़ाइल जानकारी, पंजीकृत कार्य ईमेल पता, विभाग और कार्यक्षेत्र का प्रबंधन करें।',
    employee_info_title: 'कर्मचारी प्रोफ़ाइल जानकारी',
    employee_info_desc: 'यह विवरण आपकी टाइमशीट प्रविष्टियों और टीम निर्देशिका में दिखाई देगा।',
    full_name: 'पूरा नाम',
    work_email: 'कार्य ईमेल पता',
    department: 'विभाग / पद',
    organization_workspace: 'कंपनी कार्यक्षेत्र',
    save_profile_changes: 'प्रोफ़ाइल परिवर्तन सहेजें',
    saving_profile: 'सहेजा जा रहा है...',

    // Language Form
    language_pref_title: 'भाषा और क्षेत्रीय प्राथमिकताएं',
    language_pref_desc: 'अपनी पसंदीदा इंटरफ़ेस भाषा, दिनांक प्रारूप, समय प्रारूप और मुद्रा चुनें।',
    select_primary_lang: 'प्राथमिक प्रदर्शन भाषा चुनें',
    select_primary_lang_desc: 'अंग्रेजी (English), तमिल (Tamil), हिन्दी (Hindi) में से चुनें।',
    save_language_pref: 'भाषा प्राथमिकताएं सहेजें',

    // Appearance Form
    appearance_title: 'दृश्य थीम और प्रदर्शन प्राथमिकताएं',
    appearance_desc: 'अपनी स्क्रीन थीम चुनें: सिस्टम थीम, अधिकतम डार्क थीम, या स्वच्छ लाइट थीम।',
    theme_system: 'सिस्टम थीम (डिफ़ॉल्ट)',
    theme_system_desc: 'आपके कंप्यूटर या ब्राउज़र की सेटिंग्स के अनुसार अपने आप सेट होता है।',
    theme_system_tag: 'Default Auto',
    theme_dark: 'अधिकतम डार्क थीम',
    theme_dark_desc: 'आंखों के लिए आरामदायक गहरा डार्क और एमराल्ड ग्रीन लुक।',
    theme_dark_tag: 'Maximum Dark',
    theme_light: 'सफेद / लाइट थीम',
    theme_light_desc: 'स्वच्छ सफेद सतह और स्पष्ट टेक्स्ट वाला लाइट मोड।',
    theme_light_tag: 'Clean White',
    save_theme_pref: 'थीम सेटिंग्स सहेजें',
    active_theme_label: 'सक्रिय थीम',
  }
};

export function getSavedLanguage() {
  try {
    const raw = localStorage.getItem('clockodo_language_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.language && translations[parsed.language]) return parsed.language;
    }
    const direct = localStorage.getItem('clockodo_language');
    if (direct && translations[direct]) return direct;
  } catch (e) {}
  return 'en';
}

export function setAppLanguage(lang) {
  const safeLang = translations[lang] ? lang : 'en';
  try {
    localStorage.setItem('clockodo_language', safeLang);
    const existing = localStorage.getItem('clockodo_language_settings');
    let obj = {};
    if (existing) {
      try { obj = JSON.parse(existing); } catch (e) {}
    }
    obj.language = safeLang;
    localStorage.setItem('clockodo_language_settings', JSON.stringify(obj));
    window.dispatchEvent(new CustomEvent('clockodo_language_changed', { detail: safeLang }));
  } catch (e) {}
  return safeLang;
}

export function useLanguage() {
  const [lang, setLangState] = useState(getSavedLanguage);

  useEffect(() => {
    const handler = (e) => {
      setLangState(e.detail || getSavedLanguage());
    };
    window.addEventListener('clockodo_language_changed', handler);
    return () => window.removeEventListener('clockodo_language_changed', handler);
  }, []);

  const t = (key) => {
    if (translations[lang] && translations[lang][key]) {
      return translations[lang][key];
    }
    if (translations.en && translations.en[key]) {
      return translations.en[key];
    }
    return key;
  };

  const changeLanguage = (newLang) => {
    const applied = setAppLanguage(newLang);
    setLangState(applied);
  };

  return { lang, t, setLang: changeLanguage };
}
