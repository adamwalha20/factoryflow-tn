export type Language = 'fr' | 'ar' | 'en';

export const translations = {
  fr: {
    // Navigation
    dashboard: 'Tableau de Bord',
    production: 'Production',
    machines: 'Machines',
    machine_stops: 'Arrêts Machines',
    quality_control: 'Contrôle Qualité',
    maintenance: 'Maintenance',
    production_history: 'Historique Production',
    reports: 'Rapports',
    articles: 'Articles',
    raw_materials: 'Matières Premières',
    purchase_orders: 'Bons de Commande',
    manufacturing_orders: 'Ordres de Fabrication',
    cartons_labels: 'Cartons & Étiquettes',
    system_history: 'Historique Système',
    users: 'Utilisateurs',
    settings: 'Paramètres',

    // Common Actions
    add: 'Ajouter',
    edit: 'Modifier',
    delete: 'Supprimer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    search: 'Rechercher...',
    loading: 'Chargement...',
    status: 'État',
    actions: 'Actions',
    overview: "Vue d'ensemble",
    confirm_delete: 'Confirmer la suppression',
    logout: 'Déconnexion',

    // Production & Scrap
    target: 'Objectif',
    produced: 'Produit',
    good_quantity: 'Quantité Conforme',
    scrap_quantity: 'Rebut / Déchets',
    waste_percentage: 'Taux de Déchet',
    efficiency: 'Rendement (OEE)',
    operator: 'Opérateur',
    machine: 'Machine',
    order: 'Ordre',
    date: 'Date',

    // Scrap Reasons
    MACHINE_SETUP: 'Réglage & Démarrage',
    MATERIAL_DEFECT: 'Défaut Matière Première',
    CUTTING_ERROR: 'Erreur de Découpe',
    OPERATOR_ERROR: 'Erreur Opérateur',
    PRODUCT_DEFECT: 'Défaut Qualité Produit',
    OTHER: 'Autre motif',

    // Tablet
    start_production: 'Démarrer Production',
    pause_production: 'Mettre en Pause',
    finish_production: 'Terminer OF',
    report_problem: 'Signaler Arrêt',
    record_production: 'Enregistrer Production',
    record_waste: 'Enregistrer Déchets',
    online: 'En ligne',
    offline: 'Mode Hors-ligne (Sync en attente)'
  },
  ar: {
    // Navigation
    dashboard: 'لوحة القيادة',
    production: 'الإنتاج',
    machines: 'الآلات',
    machine_stops: 'أعطال وتوقف الآلات',
    quality_control: 'مراقبة الجودة',
    maintenance: 'الصيانة',
    production_history: 'سجل الإنتاج',
    reports: 'التقارير',
    articles: 'المنتجات والمقالات',
    raw_materials: 'المواد الأولية',
    purchase_orders: 'طلبيات الزبائن (BC)',
    manufacturing_orders: 'أوامر التصنيع (OF)',
    cartons_labels: 'الصناديق والباركود',
    system_history: 'سجل النظام والأمان',
    users: 'المستخدمون',
    settings: 'الإعدادات',

    // Common Actions
    add: 'إضافة',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    search: 'بحث...',
    loading: 'جار التحميل...',
    status: 'الحالة',
    actions: 'إجراءات',
    overview: 'نظرة عامة',
    confirm_delete: 'تأكيد الحذف',
    logout: 'تسجيل الخروج',

    // Production & Scrap
    target: 'الهدف المطلوب',
    produced: 'الإنتاج الفعلي',
    good_quantity: 'الكمية السليمة',
    scrap_quantity: 'الفواضل والنفايات',
    waste_percentage: 'نسبة الفاقد',
    efficiency: 'الكفاءة والجاهزية',
    operator: 'العامل / المشغل',
    machine: 'الآلة',
    order: 'أمر الشغل',
    date: 'التاريخ',

    // Scrap Reasons
    MACHINE_SETUP: 'ضبط وبداية تشغيل',
    MATERIAL_DEFECT: 'عيب في المادة الأولية',
    CUTTING_ERROR: 'خطأ في القص والتقطيع',
    OPERATOR_ERROR: 'خطأ في المناولة',
    PRODUCT_DEFECT: 'عدم تطابق الجودة',
    OTHER: 'سبب آخر',

    // Tablet
    start_production: 'بدء الإنتاج',
    pause_production: 'إيقاف مؤقت',
    finish_production: 'إنهاء أمر التصنيع',
    report_problem: 'تسجيل عطل أو توقف',
    record_production: 'تسجيل الكميات',
    record_waste: 'تسجيل الفواضل',
    online: 'متصل بالشبكة',
    offline: 'غير متصل (في انتظار المزامنة)'
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    production: 'Production',
    machines: 'Machines',
    machine_stops: 'Machine Downtime',
    quality_control: 'Quality Control',
    maintenance: 'Maintenance',
    production_history: 'Production History',
    reports: 'Reports',
    articles: 'Products & SKUs',
    raw_materials: 'Raw Materials',
    purchase_orders: 'Purchase Orders',
    manufacturing_orders: 'Manufacturing Orders',
    cartons_labels: 'Cartons & QR Labels',
    system_history: 'Audit Logs',
    users: 'Users',
    settings: 'Settings',

    // Common Actions
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search...',
    loading: 'Loading...',
    status: 'Status',
    actions: 'Actions',
    overview: 'Overview',
    confirm_delete: 'Confirm Delete',
    logout: 'Sign Out',

    // Production & Scrap
    target: 'Target',
    produced: 'Produced',
    good_quantity: 'Good Quantity',
    scrap_quantity: 'Scrap & Waste',
    waste_percentage: 'Waste %',
    efficiency: 'Efficiency (OEE)',
    operator: 'Operator',
    machine: 'Machine',
    order: 'Order',
    date: 'Date',

    // Scrap Reasons
    MACHINE_SETUP: 'Machine Setup',
    MATERIAL_DEFECT: 'Raw Material Defect',
    CUTTING_ERROR: 'Cutting Error',
    OPERATOR_ERROR: 'Operator Error',
    PRODUCT_DEFECT: 'Product Quality Defect',
    OTHER: 'Other Reason',

    // Tablet
    start_production: 'Start Production',
    pause_production: 'Pause Machine',
    finish_production: 'Finish Order',
    report_problem: 'Report Stop / Issue',
    record_production: 'Record Production',
    record_waste: 'Record Waste',
    online: 'Online',
    offline: 'Offline Mode (Sync Pending)'
  }
};
