// Arab countries seed data: UAE, Qatar, Bahrain, Oman, Libya, Tunisia, Algeria, Morocco, Sudan
export const placesData3: {
  name: string;
  type: "COUNTRY" | "REGION" | "CITY";
  parent?: string;
  aliases?: string[];
  sortOrder?: number;
}[] = [
  // ============================================================
  // الإمارات العربية المتحدة (UAE)
  // ============================================================
  { name: "الإمارات العربية المتحدة", type: "COUNTRY", aliases: ["UAE", "United Arab Emirates"], sortOrder: 8 },

  { name: "إمارة أبوظبي", type: "REGION", parent: "الإمارات العربية المتحدة", aliases: ["Abu Dhabi Emirate", "أبوظبي"], sortOrder: 1 },
  { name: "أبوظبي", type: "CITY", parent: "إمارة أبوظبي", aliases: ["Abu Dhabi City"] },
  { name: "العين", type: "CITY", parent: "إمارة أبوظبي", aliases: ["Al Ain", "Al-Ain"] },
  { name: "ليوا", type: "CITY", parent: "إمارة أبوظبي", aliases: ["Liwa Oasis"] },
  { name: "مدينة زايد", type: "CITY", parent: "إمارة أبوظبي", aliases: ["Zayed City", "Medinat Zayed"] },
  { name: "الرويس", type: "CITY", parent: "إمارة أبوظبي", aliases: ["Ruwais"] },
  { name: "غياثي", type: "CITY", parent: "إمارة أبوظبي", aliases: ["Ghayathi"] },
  { name: "بني ياس", type: "CITY", parent: "إمارة أبوظبي", aliases: ["Baniyas"] },
  { name: "الشهامة", type: "CITY", parent: "إمارة أبوظبي", aliases: ["Al-Shahama"] },
  { name: "خليفة سيتي", type: "CITY", parent: "إمارة أبوظبي", aliases: ["Khalifa City"] },
  { name: "محمد بن زايد", type: "CITY", parent: "إمارة أبوظبي", aliases: ["Mohammed Bin Zayed City"] },

  { name: "إمارة دبي", type: "REGION", parent: "الإمارات العربية المتحدة", aliases: ["Dubai Emirate", "دبي"], sortOrder: 2 },
  { name: "دبي", type: "CITY", parent: "إمارة دبي", aliases: ["Dubai"] },
  { name: "ديرة", type: "CITY", parent: "إمارة دبي", aliases: ["Deira"] },
  { name: "بر دبي", type: "CITY", parent: "إمارة دبي", aliases: ["Bur Dubai"] },
  { name: "جميرا", type: "CITY", parent: "إمارة دبي", aliases: ["Jumeirah"] },
  { name: "المرسى", type: "CITY", parent: "إمارة دبي", aliases: ["Dubai Marina"] },
  { name: "وسط مدينة دبي", type: "CITY", parent: "إمارة دبي", aliases: ["Downtown Dubai"] },
  { name: "القوز", type: "CITY", parent: "إمارة دبي", aliases: ["Al Quoz"] },
  { name: "الكرامة", type: "CITY", parent: "إمارة دبي", aliases: ["Al Karama"] },
  { name: "قرية جميرا الدائرية", type: "CITY", parent: "إمارة دبي", aliases: ["Jumeirah Village Circle", "JVC"] },
  { name: "مردف", type: "CITY", parent: "إمارة دبي", aliases: ["Mirdif"] },
  { name: "حتا", type: "CITY", parent: "إمارة دبي", aliases: ["Hatta"] },
  { name: "نخلة جميرا", type: "CITY", parent: "إمارة دبي", aliases: ["Palm Jumeirah"] },
  { name: "الورقاء", type: "CITY", parent: "إمارة دبي", aliases: ["Al Warqa"] },

  { name: "إمارة الشارقة", type: "REGION", parent: "الإمارات العربية المتحدة", aliases: ["Sharjah Emirate", "الشارقة"], sortOrder: 3 },
  { name: "الشارقة", type: "CITY", parent: "إمارة الشارقة", aliases: ["Sharjah"] },
  { name: "خورفكان", type: "CITY", parent: "إمارة الشارقة", aliases: ["Khor Fakkan"] },
  { name: "كلباء", type: "CITY", parent: "إمارة الشارقة", aliases: ["Kalba"] },
  { name: "ضباء", type: "CITY", parent: "إمارة الشارقة", aliases: ["Dibba Al-Hisn"] },
  { name: "الذيد", type: "CITY", parent: "إمارة الشارقة", aliases: ["Al-Dhaid"] },

  { name: "إمارة عجمان", type: "REGION", parent: "الإمارات العربية المتحدة", aliases: ["Ajman Emirate", "عجمان"], sortOrder: 4 },
  { name: "عجمان", type: "CITY", parent: "إمارة عجمان", aliases: ["Ajman City"] },
  { name: "مصفوت", type: "CITY", parent: "إمارة عجمان", aliases: ["Masfut"] },

  { name: "إمارة أم القيوين", type: "REGION", parent: "الإمارات العربية المتحدة", aliases: ["Umm Al Quwain Emirate", "أم القيوين"], sortOrder: 5 },
  { name: "أم القيوين", type: "CITY", parent: "إمارة أم القيوين", aliases: ["Umm Al Quwain City"] },
  { name: "فلج المعلا", type: "CITY", parent: "إمارة أم القيوين", aliases: ["Falaj Al Mualla"] },

  { name: "إمارة رأس الخيمة", type: "REGION", parent: "الإمارات العربية المتحدة", aliases: ["Ras Al Khaimah Emirate", "رأس الخيمة"], sortOrder: 6 },
  { name: "رأس الخيمة", type: "CITY", parent: "إمارة رأس الخيمة", aliases: ["Ras Al Khaimah City"] },
  { name: "خور خوير", type: "CITY", parent: "إمارة رأس الخيمة", aliases: ["Khor Khwair"] },
  { name: "الجزيرة الحمراء", type: "CITY", parent: "إمارة رأس الخيمة", aliases: ["Al Jazirah Al Hamra"] },
  { name: "الرمس", type: "CITY", parent: "إمارة رأس الخيمة", aliases: ["Al Rams"] },

  { name: "إمارة الفجيرة", type: "REGION", parent: "الإمارات العربية المتحدة", aliases: ["Fujairah Emirate", "الفجيرة"], sortOrder: 7 },
  { name: "الفجيرة", type: "CITY", parent: "إمارة الفجيرة", aliases: ["Fujairah City"] },
  { name: "دبا الفجيرة", type: "CITY", parent: "إمارة الفجيرة", aliases: ["Dibba Al-Fujairah"] },

  // ============================================================
  // قطر (Qatar)
  // ============================================================
  { name: "قطر", type: "COUNTRY", aliases: ["Qatar"], sortOrder: 9 },

  { name: "بلدية الدوحة", type: "REGION", parent: "قطر", aliases: ["Doha Municipality"], sortOrder: 1 },
  { name: "الدوحة", type: "CITY", parent: "بلدية الدوحة", aliases: ["Doha"] },
  { name: "الوعب", type: "CITY", parent: "بلدية الدوحة", aliases: ["Al-Waab"] },
  { name: "الدفنة", type: "CITY", parent: "بلدية الدوحة", aliases: ["Al-Dafna"] },
  { name: "المنصورة (قطر)", type: "CITY", parent: "بلدية الدوحة", aliases: ["Al-Mansoura - Qatar"] },

  { name: "بلدية الريان", type: "REGION", parent: "قطر", aliases: ["Al-Rayyan Municipality", "الريان"], sortOrder: 2 },
  { name: "الريان", type: "CITY", parent: "بلدية الريان", aliases: ["Al-Rayyan City"] },
  { name: "أم صلال محمد", type: "CITY", parent: "بلدية الريان", aliases: ["Umm Salal Muhammad"] },
  { name: "معيذر", type: "CITY", parent: "بلدية الريان", aliases: ["Muaither"] },

  { name: "بلدية الوكرة", type: "REGION", parent: "قطر", aliases: ["Al-Wakra Municipality", "الوكرة"], sortOrder: 3 },
  { name: "الوكرة", type: "CITY", parent: "بلدية الوكرة", aliases: ["Al-Wakra City"] },
  { name: "الوكير", type: "CITY", parent: "بلدية الوكرة", aliases: ["Al-Wukair"] },
  { name: "مسيعيد", type: "CITY", parent: "بلدية الوكرة", aliases: ["Mesaieed"] },

  { name: "بلدية الشمال", type: "REGION", parent: "قطر", aliases: ["Al-Shamal Municipality", "الشمال"], sortOrder: 4 },
  { name: "الشمال (قطر)", type: "CITY", parent: "بلدية الشمال", aliases: ["Al-Shamal City"] },
  { name: "الرويس (قطر)", type: "CITY", parent: "بلدية الشمال", aliases: ["Al-Ruwais - Qatar"] },

  { name: "بلدية أم صلال", type: "REGION", parent: "قطر", aliases: ["Umm Salal Municipality", "أم صلال"], sortOrder: 5 },
  { name: "أم صلال علي", type: "CITY", parent: "بلدية أم صلال", aliases: ["Umm Salal Ali"] },

  { name: "بلدية الخور والذخيرة", type: "REGION", parent: "قطر", aliases: ["Al-Khor Municipality", "الخور"], sortOrder: 6 },
  { name: "الخور", type: "CITY", parent: "بلدية الخور والذخيرة", aliases: ["Al-Khor"] },
  { name: "الذخيرة", type: "CITY", parent: "بلدية الخور والذخيرة", aliases: ["Al-Dhakhira"] },

  { name: "بلدية الضعيان", type: "REGION", parent: "قطر", aliases: ["Al-Daayen Municipality", "الضعيان"], sortOrder: 7 },
  { name: "الضعيان", type: "CITY", parent: "بلدية الضعيان", aliases: ["Al-Daayen City"] },
  { name: "لوسيل", type: "CITY", parent: "بلدية الضعيان", aliases: ["Lusail"] },

  { name: "بلدية الظعاين", type: "REGION", parent: "قطر", aliases: ["Al-Shahaniya Municipality", "الظعاين"], sortOrder: 8 },
  { name: "الظعاين", type: "CITY", parent: "بلدية الظعاين", aliases: ["Al-Tha'ain"] },

  // ============================================================
  // البحرين (Bahrain)
  // ============================================================
  { name: "البحرين", type: "COUNTRY", aliases: ["Bahrain"], sortOrder: 10 },

  { name: "محافظة العاصمة (البحرين)", type: "REGION", parent: "البحرين", aliases: ["Capital Governorate - Bahrain"], sortOrder: 1 },
  { name: "المنامة", type: "CITY", parent: "محافظة العاصمة (البحرين)", aliases: ["Manama"] },
  { name: "الجفير", type: "CITY", parent: "محافظة العاصمة (البحرين)", aliases: ["Al-Juffair"] },
  { name: "القضيبية", type: "CITY", parent: "محافظة العاصمة (البحرين)", aliases: ["Al-Qudaybiyya"] },
  { name: "سيف", type: "CITY", parent: "محافظة العاصمة (البحرين)", aliases: ["Seef"] },
  { name: "أم الحصم", type: "CITY", parent: "محافظة العاصمة (البحرين)", aliases: ["Umm Al Hassam"] },

  { name: "محافظة المحرق", type: "REGION", parent: "البحرين", aliases: ["Muharraq Governorate"], sortOrder: 2 },
  { name: "المحرق", type: "CITY", parent: "محافظة المحرق", aliases: ["Muharraq City"] },
  { name: "عراد", type: "CITY", parent: "محافظة المحرق", aliases: ["Arad"] },
  { name: "قلالي", type: "CITY", parent: "محافظة المحرق", aliases: ["Galali"] },

  { name: "محافظة الشمالية (البحرين)", type: "REGION", parent: "البحرين", aliases: ["Northern Governorate - Bahrain"], sortOrder: 3 },
  { name: "المالكية", type: "CITY", parent: "محافظة الشمالية (البحرين)", aliases: ["Al-Malikiyya - Bahrain"] },
  { name: "سترة", type: "CITY", parent: "محافظة الشمالية (البحرين)", aliases: ["Sitrah"] },
  { name: "بني جمرة", type: "CITY", parent: "محافظة الشمالية (البحرين)", aliases: ["Bani Jamra"] },
  { name: "الرفاع الغربي", type: "CITY", parent: "محافظة الشمالية (البحرين)", aliases: ["Western Riffa"] },

  { name: "محافظة الجنوبية (البحرين)", type: "REGION", parent: "البحرين", aliases: ["Southern Governorate - Bahrain"], sortOrder: 4 },
  { name: "الرفاع", type: "CITY", parent: "محافظة الجنوبية (البحرين)", aliases: ["Riffa"] },
  { name: "عوالي", type: "CITY", parent: "محافظة الجنوبية (البحرين)", aliases: ["Awali"] },
  { name: "الزلاق", type: "CITY", parent: "محافظة الجنوبية (البحرين)", aliases: ["Al-Zallaq"] },

  // ============================================================
  // عُمان (Oman)
  // ============================================================
  { name: "عُمان", type: "COUNTRY", aliases: ["Oman", "سلطنة عمان"], sortOrder: 11 },

  { name: "محافظة مسقط", type: "REGION", parent: "عُمان", aliases: ["Muscat Governorate"], sortOrder: 1 },
  { name: "مسقط", type: "CITY", parent: "محافظة مسقط", aliases: ["Muscat"] },
  { name: "مطرح", type: "CITY", parent: "محافظة مسقط", aliases: ["Mutrah"] },
  { name: "السيب", type: "CITY", parent: "محافظة مسقط", aliases: ["Al-Seeb"] },
  { name: "بوشر", type: "CITY", parent: "محافظة مسقط", aliases: ["Bausher"] },
  { name: "العامرات", type: "CITY", parent: "محافظة مسقط", aliases: ["Al-Amerat"] },
  { name: "قريات", type: "CITY", parent: "محافظة مسقط", aliases: ["Quriyat"] },
  { name: "روي", type: "CITY", parent: "محافظة مسقط", aliases: ["Ruwi"] },

  { name: "محافظة ظفار", type: "REGION", parent: "عُمان", aliases: ["Dhofar Governorate"], sortOrder: 2 },
  { name: "صلالة", type: "CITY", parent: "محافظة ظفار", aliases: ["Salalah"] },
  { name: "طاقة", type: "CITY", parent: "محافظة ظفار", aliases: ["Taqah"] },
  { name: "مرباط", type: "CITY", parent: "محافظة ظفار", aliases: ["Mirbat"] },
  { name: "ثمريت", type: "CITY", parent: "محافظة ظفار", aliases: ["Thumrait"] },

  { name: "محافظة مسندم", type: "REGION", parent: "عُمان", aliases: ["Musandam Governorate"], sortOrder: 3 },
  { name: "خصب", type: "CITY", parent: "محافظة مسندم", aliases: ["Khasab"] },
  { name: "بخاء", type: "CITY", parent: "محافظة مسندم", aliases: ["Bukha"] },

  { name: "محافظة البريمي", type: "REGION", parent: "عُمان", aliases: ["Al-Buraimi Governorate"], sortOrder: 4 },
  { name: "البريمي", type: "CITY", parent: "محافظة البريمي", aliases: ["Al-Buraimi City"] },

  { name: "محافظة الداخلية", type: "REGION", parent: "عُمان", aliases: ["Ad-Dakhliyah Governorate"], sortOrder: 5 },
  { name: "نزوى", type: "CITY", parent: "محافظة الداخلية", aliases: ["Nizwa"] },
  { name: "بهلاء", type: "CITY", parent: "محافظة الداخلية", aliases: ["Bahla"] },
  { name: "إزكي", type: "CITY", parent: "محافظة الداخلية", aliases: ["Izki"] },
  { name: "سمائل", type: "CITY", parent: "محافظة الداخلية", aliases: ["Samail"] },

  { name: "محافظة الشرقية الشمالية", type: "REGION", parent: "عُمان", aliases: ["North Al-Sharqiyah Governorate"], sortOrder: 6 },
  { name: "إبراء", type: "CITY", parent: "محافظة الشرقية الشمالية", aliases: ["Ibra"] },
  { name: "المضيبي", type: "CITY", parent: "محافظة الشرقية الشمالية", aliases: ["Al-Mudaibi"] },

  { name: "محافظة الشرقية الجنوبية", type: "REGION", parent: "عُمان", aliases: ["South Al-Sharqiyah Governorate"], sortOrder: 7 },
  { name: "صور", type: "CITY", parent: "محافظة الشرقية الجنوبية", aliases: ["Sur"] },
  { name: "مصيرة", type: "CITY", parent: "محافظة الشرقية الجنوبية", aliases: ["Masirah Island"] },

  { name: "محافظة الظاهرة", type: "REGION", parent: "عُمان", aliases: ["Ad-Dhahirah Governorate"], sortOrder: 8 },
  { name: "عبري", type: "CITY", parent: "محافظة الظاهرة", aliases: ["Ibri"] },
  { name: "ينقل", type: "CITY", parent: "محافظة الظاهرة", aliases: ["Yanqul"] },

  { name: "محافظة الباطنة الشمالية", type: "REGION", parent: "عُمان", aliases: ["North Al-Batinah Governorate"], sortOrder: 9 },
  { name: "صحار", type: "CITY", parent: "محافظة الباطنة الشمالية", aliases: ["Sohar"] },
  { name: "شناص", type: "CITY", parent: "محافظة الباطنة الشمالية", aliases: ["Shinas"] },

  { name: "محافظة الباطنة الجنوبية", type: "REGION", parent: "عُمان", aliases: ["South Al-Batinah Governorate"], sortOrder: 10 },
  { name: "الرستاق", type: "CITY", parent: "محافظة الباطنة الجنوبية", aliases: ["Rustaq"] },
  { name: "نخل", type: "CITY", parent: "محافظة الباطنة الجنوبية", aliases: ["Nakhal"] },

  { name: "محافظة الوسطى", type: "REGION", parent: "عُمان", aliases: ["Al-Wusta Governorate"], sortOrder: 11 },
  { name: "هيما", type: "CITY", parent: "محافظة الوسطى", aliases: ["Haima"] },
  { name: "دقم", type: "CITY", parent: "محافظة الوسطى", aliases: ["Duqm"] },

  // ============================================================
  // ليبيا (Libya)
  // ============================================================
  { name: "ليبيا", type: "COUNTRY", aliases: ["Libya"], sortOrder: 12 },

  { name: "منطقة طرابلس", type: "REGION", parent: "ليبيا", aliases: ["Tripoli District"], sortOrder: 1 },
  { name: "طرابلس", type: "CITY", parent: "منطقة طرابلس", aliases: ["Tripoli"] },
  { name: "جنزور", type: "CITY", parent: "منطقة طرابلس", aliases: ["Janzur"] },
  { name: "تاجوراء", type: "CITY", parent: "منطقة طرابلس", aliases: ["Tajoura"] },
  { name: "أبو سليم", type: "CITY", parent: "منطقة طرابلس", aliases: ["Abu Salim"] },
  { name: "بن غشير", type: "CITY", parent: "منطقة طرابلس", aliases: ["Ben Ghashir"] },

  { name: "منطقة بنغازي", type: "REGION", parent: "ليبيا", aliases: ["Benghazi District"], sortOrder: 2 },
  { name: "بنغازي", type: "CITY", parent: "منطقة بنغازي", aliases: ["Benghazi"] },
  { name: "البنينا", type: "CITY", parent: "منطقة بنغازي", aliases: ["Al-Banina"] },

  { name: "منطقة مصراتة", type: "REGION", parent: "ليبيا", aliases: ["Misrata District"], sortOrder: 3 },
  { name: "مصراتة", type: "CITY", parent: "منطقة مصراتة", aliases: ["Misrata"] },
  { name: "الخمس", type: "CITY", parent: "منطقة مصراتة", aliases: ["Al-Khums"] },

  { name: "منطقة الزاوية", type: "REGION", parent: "ليبيا", aliases: ["Zawiya District"], sortOrder: 4 },
  { name: "الزاوية", type: "CITY", parent: "منطقة الزاوية", aliases: ["Zawiya"] },
  { name: "صبراتة", type: "CITY", parent: "منطقة الزاوية", aliases: ["Sabratha"] },
  { name: "صرمان", type: "CITY", parent: "منطقة الزاوية", aliases: ["Surman"] },

  { name: "منطقة سرت", type: "REGION", parent: "ليبيا", aliases: ["Sirte District"], sortOrder: 5 },
  { name: "سرت", type: "CITY", parent: "منطقة سرت", aliases: ["Sirte"] },

  { name: "منطقة سبها", type: "REGION", parent: "ليبيا", aliases: ["Sabha District"], sortOrder: 6 },
  { name: "سبها", type: "CITY", parent: "منطقة سبها", aliases: ["Sabha"] },
  { name: "أوباري", type: "CITY", parent: "منطقة سبها", aliases: ["Ubari"] },
  { name: "مرزق", type: "CITY", parent: "منطقة سبها", aliases: ["Murzuq"] },

  { name: "منطقة درنة", type: "REGION", parent: "ليبيا", aliases: ["Derna District"], sortOrder: 7 },
  { name: "درنة", type: "CITY", parent: "منطقة درنة", aliases: ["Derna"] },
  { name: "القبة (ليبيا)", type: "CITY", parent: "منطقة درنة", aliases: ["Al-Qubbah - Libya"] },

  { name: "منطقة غريان", type: "REGION", parent: "ليبيا", aliases: ["Gharyan District"], sortOrder: 8 },
  { name: "غريان", type: "CITY", parent: "منطقة غريان", aliases: ["Gharyan"] },
  { name: "يفرن", type: "CITY", parent: "منطقة غريان", aliases: ["Yafran"] },
  { name: "نالوت", type: "CITY", parent: "منطقة غريان", aliases: ["Nalut"] },

  { name: "منطقة طبرق", type: "REGION", parent: "ليبيا", aliases: ["Tobruk District"], sortOrder: 9 },
  { name: "طبرق", type: "CITY", parent: "منطقة طبرق", aliases: ["Tobruk"] },
  { name: "البيضاء (ليبيا)", type: "CITY", parent: "منطقة طبرق", aliases: ["Al-Bayda - Libya"] },

  // ============================================================
  // تونس (Tunisia)
  // ============================================================
  { name: "تونس", type: "COUNTRY", aliases: ["Tunisia"], sortOrder: 13 },

  { name: "ولاية تونس", type: "REGION", parent: "تونس", aliases: ["Tunis Governorate"], sortOrder: 1 },
  { name: "تونس العاصمة", type: "CITY", parent: "ولاية تونس", aliases: ["Tunis City"] },
  { name: "المرسى (تونس)", type: "CITY", parent: "ولاية تونس", aliases: ["La Marsa"] },
  { name: "سيدي بو سعيد", type: "CITY", parent: "ولاية تونس", aliases: ["Sidi Bou Said"] },
  { name: "قرطاج", type: "CITY", parent: "ولاية تونس", aliases: ["Carthage"] },
  { name: "باردو", type: "CITY", parent: "ولاية تونس", aliases: ["Bardo"] },
  { name: "حلق الوادي", type: "CITY", parent: "ولاية تونس", aliases: ["La Goulette"] },

  { name: "ولاية أريانة", type: "REGION", parent: "تونس", aliases: ["Ariana Governorate"], sortOrder: 2 },
  { name: "أريانة", type: "CITY", parent: "ولاية أريانة", aliases: ["Ariana City"] },
  { name: "رواد", type: "CITY", parent: "ولاية أريانة", aliases: ["Raoued"] },

  { name: "ولاية بن عروس", type: "REGION", parent: "تونس", aliases: ["Ben Arous Governorate"], sortOrder: 3 },
  { name: "بن عروس", type: "CITY", parent: "ولاية بن عروس", aliases: ["Ben Arous City"] },
  { name: "رادس", type: "CITY", parent: "ولاية بن عروس", aliases: ["Rades"] },
  { name: "المروج (تونس)", type: "CITY", parent: "ولاية بن عروس", aliases: ["El Mourouj"] },

  { name: "ولاية منوبة", type: "REGION", parent: "تونس", aliases: ["Manouba Governorate"], sortOrder: 4 },
  { name: "منوبة", type: "CITY", parent: "ولاية منوبة", aliases: ["Manouba City"] },
  { name: "دوار هيشر", type: "CITY", parent: "ولاية منوبة", aliases: ["Douar Hicher"] },

  { name: "ولاية نابل", type: "REGION", parent: "تونس", aliases: ["Nabeul Governorate"], sortOrder: 5 },
  { name: "نابل (تونس)", type: "CITY", parent: "ولاية نابل", aliases: ["Nabeul City"] },
  { name: "الحمامات", type: "CITY", parent: "ولاية نابل", aliases: ["Hammamet"] },
  { name: "قربة (تونس)", type: "CITY", parent: "ولاية نابل", aliases: ["Korba"] },

  { name: "ولاية زغوان", type: "REGION", parent: "تونس", aliases: ["Zaghouan Governorate"], sortOrder: 6 },
  { name: "زغوان", type: "CITY", parent: "ولاية زغوان", aliases: ["Zaghouan City"] },

  { name: "ولاية بنزرت", type: "REGION", parent: "تونس", aliases: ["Bizerte Governorate"], sortOrder: 7 },
  { name: "بنزرت", type: "CITY", parent: "ولاية بنزرت", aliases: ["Bizerte City"] },
  { name: "منزل بورقيبة", type: "CITY", parent: "ولاية بنزرت", aliases: ["Menzel Bourguiba"] },
  { name: "ماطر", type: "CITY", parent: "ولاية بنزرت", aliases: ["Mateur"] },

  { name: "ولاية باجة", type: "REGION", parent: "تونس", aliases: ["Beja Governorate"], sortOrder: 8 },
  { name: "باجة", type: "CITY", parent: "ولاية باجة", aliases: ["Beja City"] },

  { name: "ولاية جندوبة", type: "REGION", parent: "تونس", aliases: ["Jendouba Governorate"], sortOrder: 9 },
  { name: "جندوبة", type: "CITY", parent: "ولاية جندوبة", aliases: ["Jendouba City"] },
  { name: "طبرقة", type: "CITY", parent: "ولاية جندوبة", aliases: ["Tabarka"] },

  { name: "ولاية الكاف", type: "REGION", parent: "تونس", aliases: ["Kef Governorate"], sortOrder: 10 },
  { name: "الكاف", type: "CITY", parent: "ولاية الكاف", aliases: ["El Kef City"] },

  { name: "ولاية سليانة", type: "REGION", parent: "تونس", aliases: ["Siliana Governorate"], sortOrder: 11 },
  { name: "سليانة", type: "CITY", parent: "ولاية سليانة", aliases: ["Siliana City"] },
  { name: "مكثر", type: "CITY", parent: "ولاية سليانة", aliases: ["Makthar"] },

  { name: "ولاية سوسة", type: "REGION", parent: "تونس", aliases: ["Sousse Governorate"], sortOrder: 12 },
  { name: "سوسة", type: "CITY", parent: "ولاية سوسة", aliases: ["Sousse City"] },
  { name: "الحمام (تونس)", type: "CITY", parent: "ولاية سوسة", aliases: ["Hammam Sousse"] },

  { name: "ولاية المنستير", type: "REGION", parent: "تونس", aliases: ["Monastir Governorate"], sortOrder: 13 },
  { name: "المنستير", type: "CITY", parent: "ولاية المنستير", aliases: ["Monastir City"] },

  { name: "ولاية المهدية", type: "REGION", parent: "تونس", aliases: ["Mahdia Governorate"], sortOrder: 14 },
  { name: "المهدية", type: "CITY", parent: "ولاية المهدية", aliases: ["Mahdia City"] },
  { name: "الجم", type: "CITY", parent: "ولاية المهدية", aliases: ["El Jem"] },

  { name: "ولاية القيروان", type: "REGION", parent: "تونس", aliases: ["Kairouan Governorate"], sortOrder: 15 },
  { name: "القيروان", type: "CITY", parent: "ولاية القيروان", aliases: ["Kairouan City"] },

  { name: "ولاية القصرين", type: "REGION", parent: "تونس", aliases: ["Kasserine Governorate"], sortOrder: 16 },
  { name: "القصرين", type: "CITY", parent: "ولاية القصرين", aliases: ["Kasserine City"] },
  { name: "سبيطلة", type: "CITY", parent: "ولاية القصرين", aliases: ["Sbeitla"] },

  { name: "ولاية سيدي بوزيد", type: "REGION", parent: "تونس", aliases: ["Sidi Bouzid Governorate"], sortOrder: 17 },
  { name: "سيدي بوزيد", type: "CITY", parent: "ولاية سيدي بوزيد", aliases: ["Sidi Bouzid City"] },

  { name: "ولاية صفاقس", type: "REGION", parent: "تونس", aliases: ["Sfax Governorate"], sortOrder: 18 },
  { name: "صفاقس", type: "CITY", parent: "ولاية صفاقس", aliases: ["Sfax City"] },
  { name: "عقارب", type: "CITY", parent: "ولاية صفاقس", aliases: ["Agareb"] },

  { name: "ولاية قابس", type: "REGION", parent: "تونس", aliases: ["Gabes Governorate"], sortOrder: 19 },
  { name: "قابس", type: "CITY", parent: "ولاية قابس", aliases: ["Gabes City"] },
  { name: "مطماطة", type: "CITY", parent: "ولاية قابس", aliases: ["Matmata"] },

  { name: "ولاية مدنين", type: "REGION", parent: "تونس", aliases: ["Medenine Governorate"], sortOrder: 20 },
  { name: "مدنين", type: "CITY", parent: "ولاية مدنين", aliases: ["Medenine City"] },
  { name: "جربة", type: "CITY", parent: "ولاية مدنين", aliases: ["Djerba", "Jerba"] },
  { name: "زرزيس", type: "CITY", parent: "ولاية مدنين", aliases: ["Zarzis"] },
  { name: "بن قردان", type: "CITY", parent: "ولاية مدنين", aliases: ["Ben Guerdane"] },

  { name: "ولاية تطاوين", type: "REGION", parent: "تونس", aliases: ["Tataouine Governorate"], sortOrder: 21 },
  { name: "تطاوين", type: "CITY", parent: "ولاية تطاوين", aliases: ["Tataouine City"] },

  { name: "ولاية قفصة", type: "REGION", parent: "تونس", aliases: ["Gafsa Governorate"], sortOrder: 22 },
  { name: "قفصة", type: "CITY", parent: "ولاية قفصة", aliases: ["Gafsa City"] },
  { name: "المتلوي", type: "CITY", parent: "ولاية قفصة", aliases: ["Metlaoui"] },

  { name: "ولاية توزر", type: "REGION", parent: "تونس", aliases: ["Tozeur Governorate"], sortOrder: 23 },
  { name: "توزر", type: "CITY", parent: "ولاية توزر", aliases: ["Tozeur City"] },
  { name: "نفطة", type: "CITY", parent: "ولاية توزر", aliases: ["Nefta"] },

  { name: "ولاية قبلي", type: "REGION", parent: "تونس", aliases: ["Kebili Governorate"], sortOrder: 24 },
  { name: "قبلي", type: "CITY", parent: "ولاية قبلي", aliases: ["Kebili City"] },
  { name: "دوز", type: "CITY", parent: "ولاية قبلي", aliases: ["Douz"] },

  // ============================================================
  // الجزائر (Algeria) — 58 ولاية
  // ============================================================
  { name: "الجزائر", type: "COUNTRY", aliases: ["Algeria"], sortOrder: 14 },

  { name: "ولاية الجزائر", type: "REGION", parent: "الجزائر", aliases: ["Algiers Wilaya"], sortOrder: 1 },
  { name: "الجزائر العاصمة", type: "CITY", parent: "ولاية الجزائر", aliases: ["Algiers", "Alger"] },
  { name: "الحراش", type: "CITY", parent: "ولاية الجزائر", aliases: ["El Harrach"] },
  { name: "باب الوادي", type: "CITY", parent: "ولاية الجزائر", aliases: ["Bab El Oued"] },
  { name: "دالي إبراهيم", type: "CITY", parent: "ولاية الجزائر", aliases: ["Dely Ibrahim"] },
  { name: "الرويبة (الجزائر)", type: "CITY", parent: "ولاية الجزائر", aliases: ["Rouiba"] },
  { name: "درارية", type: "CITY", parent: "ولاية الجزائر", aliases: ["Draria"] },
  { name: "برج البحري", type: "CITY", parent: "ولاية الجزائر", aliases: ["Bordj El Bahri"] },

  { name: "ولاية الشلف", type: "REGION", parent: "الجزائر", aliases: ["Chlef Wilaya"], sortOrder: 2 },
  { name: "الشلف", type: "CITY", parent: "ولاية الشلف", aliases: ["Chlef City"] },
  { name: "تنس", type: "CITY", parent: "ولاية الشلف", aliases: ["Tenes"] },

  { name: "ولاية الأغواط", type: "REGION", parent: "الجزائر", aliases: ["Laghouat Wilaya"], sortOrder: 3 },
  { name: "الأغواط", type: "CITY", parent: "ولاية الأغواط", aliases: ["Laghouat City"] },
  { name: "آفلو", type: "CITY", parent: "ولاية الأغواط", aliases: ["Aflou"] },

  { name: "ولاية أم البواقي", type: "REGION", parent: "الجزائر", aliases: ["Oum El Bouaghi Wilaya"], sortOrder: 4 },
  { name: "أم البواقي", type: "CITY", parent: "ولاية أم البواقي", aliases: ["Oum El Bouaghi City"] },
  { name: "عين مليلة", type: "CITY", parent: "ولاية أم البواقي", aliases: ["Ain M'lila"] },

  { name: "ولاية باتنة", type: "REGION", parent: "الجزائر", aliases: ["Batna Wilaya"], sortOrder: 5 },
  { name: "باتنة", type: "CITY", parent: "ولاية باتنة", aliases: ["Batna City"] },
  { name: "آريس", type: "CITY", parent: "ولاية باتنة", aliases: ["Arris"] },
  { name: "تيمقاد", type: "CITY", parent: "ولاية باتنة", aliases: ["Timgad"] },

  { name: "ولاية بجاية", type: "REGION", parent: "الجزائر", aliases: ["Bejaia Wilaya"], sortOrder: 6 },
  { name: "بجاية", type: "CITY", parent: "ولاية بجاية", aliases: ["Bejaia City"] },
  { name: "أقبو", type: "CITY", parent: "ولاية بجاية", aliases: ["Akbou"] },

  { name: "ولاية بسكرة", type: "REGION", parent: "الجزائر", aliases: ["Biskra Wilaya"], sortOrder: 7 },
  { name: "بسكرة", type: "CITY", parent: "ولاية بسكرة", aliases: ["Biskra City"] },
  { name: "طولقة", type: "CITY", parent: "ولاية بسكرة", aliases: ["Tolga"] },

  { name: "ولاية بشار", type: "REGION", parent: "الجزائر", aliases: ["Bechar Wilaya"], sortOrder: 8 },
  { name: "بشار", type: "CITY", parent: "ولاية بشار", aliases: ["Bechar City"] },

  { name: "ولاية البليدة", type: "REGION", parent: "الجزائر", aliases: ["Blida Wilaya"], sortOrder: 9 },
  { name: "البليدة", type: "CITY", parent: "ولاية البليدة", aliases: ["Blida City"] },
  { name: "بوفاريك", type: "CITY", parent: "ولاية البليدة", aliases: ["Boufarik"] },
  { name: "مفتاح", type: "CITY", parent: "ولاية البليدة", aliases: ["Meftah"] },

  { name: "ولاية البويرة", type: "REGION", parent: "الجزائر", aliases: ["Bouira Wilaya"], sortOrder: 10 },
  { name: "البويرة", type: "CITY", parent: "ولاية البويرة", aliases: ["Bouira City"] },

  { name: "ولاية تمنراست", type: "REGION", parent: "الجزائر", aliases: ["Tamanrasset Wilaya"], sortOrder: 11 },
  { name: "تمنراست", type: "CITY", parent: "ولاية تمنراست", aliases: ["Tamanrasset City"] },

  { name: "ولاية تبسة", type: "REGION", parent: "الجزائر", aliases: ["Tebessa Wilaya"], sortOrder: 12 },
  { name: "تبسة", type: "CITY", parent: "ولاية تبسة", aliases: ["Tebessa City"] },

  { name: "ولاية تلمسان", type: "REGION", parent: "الجزائر", aliases: ["Tlemcen Wilaya"], sortOrder: 13 },
  { name: "تلمسان", type: "CITY", parent: "ولاية تلمسان", aliases: ["Tlemcen City"] },
  { name: "مغنية", type: "CITY", parent: "ولاية تلمسان", aliases: ["Maghnia"] },
  { name: "غزوات", type: "CITY", parent: "ولاية تلمسان", aliases: ["Ghazaouet"] },

  { name: "ولاية تيارت", type: "REGION", parent: "الجزائر", aliases: ["Tiaret Wilaya"], sortOrder: 14 },
  { name: "تيارت", type: "CITY", parent: "ولاية تيارت", aliases: ["Tiaret City"] },

  { name: "ولاية تيزي وزو", type: "REGION", parent: "الجزائر", aliases: ["Tizi Ouzou Wilaya"], sortOrder: 15 },
  { name: "تيزي وزو", type: "CITY", parent: "ولاية تيزي وزو", aliases: ["Tizi Ouzou City"] },
  { name: "دراع بن خدة", type: "CITY", parent: "ولاية تيزي وزو", aliases: ["Draa Ben Khedda"] },

  { name: "ولاية الجلفة", type: "REGION", parent: "الجزائر", aliases: ["Djelfa Wilaya"], sortOrder: 17 },
  { name: "الجلفة", type: "CITY", parent: "ولاية الجلفة", aliases: ["Djelfa City"] },
  { name: "عين وسارة", type: "CITY", parent: "ولاية الجلفة", aliases: ["Ain Oussara"] },

  { name: "ولاية جيجل", type: "REGION", parent: "الجزائر", aliases: ["Jijel Wilaya"], sortOrder: 18 },
  { name: "جيجل", type: "CITY", parent: "ولاية جيجل", aliases: ["Jijel City"] },

  { name: "ولاية سطيف", type: "REGION", parent: "الجزائر", aliases: ["Setif Wilaya"], sortOrder: 19 },
  { name: "سطيف", type: "CITY", parent: "ولاية سطيف", aliases: ["Setif City"] },
  { name: "العلمة", type: "CITY", parent: "ولاية سطيف", aliases: ["El Eulma"] },

  { name: "ولاية سعيدة", type: "REGION", parent: "الجزائر", aliases: ["Saida Wilaya"], sortOrder: 20 },
  { name: "سعيدة", type: "CITY", parent: "ولاية سعيدة", aliases: ["Saida City"] },

  { name: "ولاية سكيكدة", type: "REGION", parent: "الجزائر", aliases: ["Skikda Wilaya"], sortOrder: 21 },
  { name: "سكيكدة", type: "CITY", parent: "ولاية سكيكدة", aliases: ["Skikda City"] },
  { name: "عزابة", type: "CITY", parent: "ولاية سكيكدة", aliases: ["Azzaba"] },

  { name: "ولاية سيدي بلعباس", type: "REGION", parent: "الجزائر", aliases: ["Sidi Bel Abbes Wilaya"], sortOrder: 22 },
  { name: "سيدي بلعباس", type: "CITY", parent: "ولاية سيدي بلعباس", aliases: ["Sidi Bel Abbes City"] },

  { name: "ولاية عنابة", type: "REGION", parent: "الجزائر", aliases: ["Annaba Wilaya"], sortOrder: 23 },
  { name: "عنابة", type: "CITY", parent: "ولاية عنابة", aliases: ["Annaba City"] },
  { name: "القالة", type: "CITY", parent: "ولاية عنابة", aliases: ["El Kala"] },

  { name: "ولاية قالمة", type: "REGION", parent: "الجزائر", aliases: ["Guelma Wilaya"], sortOrder: 24 },
  { name: "قالمة", type: "CITY", parent: "ولاية قالمة", aliases: ["Guelma City"] },

  { name: "ولاية قسنطينة", type: "REGION", parent: "الجزائر", aliases: ["Constantine Wilaya"], sortOrder: 25 },
  { name: "قسنطينة", type: "CITY", parent: "ولاية قسنطينة", aliases: ["Constantine City"] },
  { name: "الخروب", type: "CITY", parent: "ولاية قسنطينة", aliases: ["El Khroub"] },

  { name: "ولاية المدية", type: "REGION", parent: "الجزائر", aliases: ["Medea Wilaya"], sortOrder: 26 },
  { name: "المدية", type: "CITY", parent: "ولاية المدية", aliases: ["Medea City"] },

  { name: "ولاية مستغانم", type: "REGION", parent: "الجزائر", aliases: ["Mostaganem Wilaya"], sortOrder: 27 },
  { name: "مستغانم", type: "CITY", parent: "ولاية مستغانم", aliases: ["Mostaganem City"] },

  { name: "ولاية المسيلة", type: "REGION", parent: "الجزائر", aliases: ["M'Sila Wilaya"], sortOrder: 28 },
  { name: "المسيلة", type: "CITY", parent: "ولاية المسيلة", aliases: ["M'Sila City"] },
  { name: "بوسعادة", type: "CITY", parent: "ولاية المسيلة", aliases: ["Bou Saada"] },

  { name: "ولاية معسكر", type: "REGION", parent: "الجزائر", aliases: ["Mascara Wilaya"], sortOrder: 29 },
  { name: "معسكر", type: "CITY", parent: "ولاية معسكر", aliases: ["Mascara City"] },

  { name: "ولاية ورقلة", type: "REGION", parent: "الجزائر", aliases: ["Ouargla Wilaya"], sortOrder: 30 },
  { name: "ورقلة", type: "CITY", parent: "ولاية ورقلة", aliases: ["Ouargla City"] },
  { name: "حاسي مسعود", type: "CITY", parent: "ولاية ورقلة", aliases: ["Hassi Messaoud"] },
  { name: "تقرت (ورقلة)", type: "CITY", parent: "ولاية ورقلة", aliases: ["Touggourt"] },

  { name: "ولاية وهران", type: "REGION", parent: "الجزائر", aliases: ["Oran Wilaya"], sortOrder: 31 },
  { name: "وهران", type: "CITY", parent: "ولاية وهران", aliases: ["Oran City"] },
  { name: "أرزيو", type: "CITY", parent: "ولاية وهران", aliases: ["Arzew"] },
  { name: "عين الترك", type: "CITY", parent: "ولاية وهران", aliases: ["Ain el-Turk"] },

  { name: "ولاية البيض", type: "REGION", parent: "الجزائر", aliases: ["El Bayadh Wilaya"], sortOrder: 32 },
  { name: "البيض", type: "CITY", parent: "ولاية البيض", aliases: ["El Bayadh City"] },

  { name: "ولاية إليزي", type: "REGION", parent: "الجزائر", aliases: ["Illizi Wilaya"], sortOrder: 33 },
  { name: "إليزي", type: "CITY", parent: "ولاية إليزي", aliases: ["Illizi City"] },
  { name: "جانت", type: "CITY", parent: "ولاية إليزي", aliases: ["Djanet"] },

  { name: "ولاية برج بوعريريج", type: "REGION", parent: "الجزائر", aliases: ["Bordj Bou Arreridj Wilaya"], sortOrder: 34 },
  { name: "برج بوعريريج", type: "CITY", parent: "ولاية برج بوعريريج", aliases: ["BBA City"] },

  { name: "ولاية بومرداس", type: "REGION", parent: "الجزائر", aliases: ["Boumerdes Wilaya"], sortOrder: 35 },
  { name: "بومرداس", type: "CITY", parent: "ولاية بومرداس", aliases: ["Boumerdes City"] },
  { name: "برج منايل", type: "CITY", parent: "ولاية بومرداس", aliases: ["Bordj Menaiel"] },

  { name: "ولاية الطارف", type: "REGION", parent: "الجزائر", aliases: ["El Tarf Wilaya"], sortOrder: 36 },
  { name: "الطارف", type: "CITY", parent: "ولاية الطارف", aliases: ["El Tarf City"] },

  { name: "ولاية تندوف", type: "REGION", parent: "الجزائر", aliases: ["Tindouf Wilaya"], sortOrder: 37 },
  { name: "تندوف", type: "CITY", parent: "ولاية تندوف", aliases: ["Tindouf City"] },

  { name: "ولاية تيسمسيلت", type: "REGION", parent: "الجزائر", aliases: ["Tissemsilt Wilaya"], sortOrder: 38 },
  { name: "تيسمسيلت", type: "CITY", parent: "ولاية تيسمسيلت", aliases: ["Tissemsilt City"] },

  { name: "ولاية الوادي", type: "REGION", parent: "الجزائر", aliases: ["El Oued Wilaya"], sortOrder: 39 },
  { name: "الوادي", type: "CITY", parent: "ولاية الوادي", aliases: ["El Oued City"] },

  { name: "ولاية خنشلة", type: "REGION", parent: "الجزائر", aliases: ["Khenchela Wilaya"], sortOrder: 40 },
  { name: "خنشلة", type: "CITY", parent: "ولاية خنشلة", aliases: ["Khenchela City"] },

  { name: "ولاية سوق أهراس", type: "REGION", parent: "الجزائر", aliases: ["Souk Ahras Wilaya"], sortOrder: 41 },
  { name: "سوق أهراس", type: "CITY", parent: "ولاية سوق أهراس", aliases: ["Souk Ahras City"] },

  { name: "ولاية تيبازة", type: "REGION", parent: "الجزائر", aliases: ["Tipaza Wilaya"], sortOrder: 42 },
  { name: "تيبازة", type: "CITY", parent: "ولاية تيبازة", aliases: ["Tipaza City"] },
  { name: "الشرفة (تيبازة)", type: "CITY", parent: "ولاية تيبازة", aliases: ["Cherchell"] },

  { name: "ولاية ميلة", type: "REGION", parent: "الجزائر", aliases: ["Mila Wilaya"], sortOrder: 43 },
  { name: "ميلة", type: "CITY", parent: "ولاية ميلة", aliases: ["Mila City"] },

  { name: "ولاية عين الدفلى", type: "REGION", parent: "الجزائر", aliases: ["Ain Defla Wilaya"], sortOrder: 44 },
  { name: "عين الدفلى", type: "CITY", parent: "ولاية عين الدفلى", aliases: ["Ain Defla City"] },
  { name: "خميس مليانة", type: "CITY", parent: "ولاية عين الدفلى", aliases: ["Khemis Miliana"] },

  { name: "ولاية النعامة", type: "REGION", parent: "الجزائر", aliases: ["Naama Wilaya"], sortOrder: 45 },
  { name: "النعامة", type: "CITY", parent: "ولاية النعامة", aliases: ["Naama City"] },
  { name: "مشرية", type: "CITY", parent: "ولاية النعامة", aliases: ["Mecheria"] },

  { name: "ولاية عين تموشنت", type: "REGION", parent: "الجزائر", aliases: ["Ain Temouchent Wilaya"], sortOrder: 46 },
  { name: "عين تموشنت", type: "CITY", parent: "ولاية عين تموشنت", aliases: ["Ain Temouchent City"] },
  { name: "بني صاف", type: "CITY", parent: "ولاية عين تموشنت", aliases: ["Beni Saf"] },

  { name: "ولاية غرداية", type: "REGION", parent: "الجزائر", aliases: ["Ghardaia Wilaya"], sortOrder: 47 },
  { name: "غرداية", type: "CITY", parent: "ولاية غرداية", aliases: ["Ghardaia City"] },
  { name: "متليلي", type: "CITY", parent: "ولاية غرداية", aliases: ["Metlili"] },
  { name: "بريان", type: "CITY", parent: "ولاية غرداية", aliases: ["Berriane"] },

  { name: "ولاية غليزان", type: "REGION", parent: "الجزائر", aliases: ["Relizane Wilaya"], sortOrder: 48 },
  { name: "غليزان", type: "CITY", parent: "ولاية غليزان", aliases: ["Relizane City"] },

  { name: "ولاية تيميمون", type: "REGION", parent: "الجزائر", aliases: ["Timimoun Wilaya"], sortOrder: 49 },
  { name: "تيميمون", type: "CITY", parent: "ولاية تيميمون", aliases: ["Timimoun City"] },

  { name: "ولاية برج باجي مختار", type: "REGION", parent: "الجزائر", aliases: ["Bordj Badji Mokhtar Wilaya"], sortOrder: 50 },
  { name: "برج باجي مختار", type: "CITY", parent: "ولاية برج باجي مختار", aliases: ["Bordj Badji Mokhtar City"] },

  { name: "ولاية أولاد جلال", type: "REGION", parent: "الجزائر", aliases: ["Ouled Djellal Wilaya"], sortOrder: 51 },
  { name: "أولاد جلال", type: "CITY", parent: "ولاية أولاد جلال", aliases: ["Ouled Djellal City"] },

  { name: "ولاية بني عباس", type: "REGION", parent: "الجزائر", aliases: ["Beni Abbes Wilaya"], sortOrder: 52 },
  { name: "بني عباس", type: "CITY", parent: "ولاية بني عباس", aliases: ["Beni Abbes City"] },

  { name: "ولاية إن صالح", type: "REGION", parent: "الجزائر", aliases: ["In Salah Wilaya"], sortOrder: 53 },
  { name: "إن صالح", type: "CITY", parent: "ولاية إن صالح", aliases: ["In Salah City"] },

  { name: "ولاية إن قزام", type: "REGION", parent: "الجزائر", aliases: ["In Guezzam Wilaya"], sortOrder: 54 },
  { name: "إن قزام", type: "CITY", parent: "ولاية إن قزام", aliases: ["In Guezzam City"] },

  { name: "ولاية تقرت", type: "REGION", parent: "الجزائر", aliases: ["Touggourt Wilaya"], sortOrder: 55 },
  { name: "تقرت", type: "CITY", parent: "ولاية تقرت", aliases: ["Touggourt City"] },

  { name: "ولاية جانت", type: "REGION", parent: "الجزائر", aliases: ["Djanet Wilaya"], sortOrder: 56 },
  { name: "جانت (ولاية)", type: "CITY", parent: "ولاية جانت", aliases: ["Djanet City"] },

  { name: "ولاية المغير", type: "REGION", parent: "الجزائر", aliases: ["El Meghaier Wilaya"], sortOrder: 57 },
  { name: "المغير", type: "CITY", parent: "ولاية المغير", aliases: ["El Meghaier City"] },

  { name: "ولاية المنيعة", type: "REGION", parent: "الجزائر", aliases: ["El Menia Wilaya"], sortOrder: 58 },
  { name: "المنيعة", type: "CITY", parent: "ولاية المنيعة", aliases: ["El Menia City"] },

  // ============================================================
  // المغرب (Morocco)
  // ============================================================
  { name: "المغرب", type: "COUNTRY", aliases: ["Morocco"], sortOrder: 15 },

  { name: "جهة طنجة-تطوان-الحسيمة", type: "REGION", parent: "المغرب", aliases: ["Tanger-Tetouan-Al Hoceima Region"], sortOrder: 1 },
  { name: "طنجة", type: "CITY", parent: "جهة طنجة-تطوان-الحسيمة", aliases: ["Tangier"] },
  { name: "تطوان", type: "CITY", parent: "جهة طنجة-تطوان-الحسيمة", aliases: ["Tetouan"] },
  { name: "الحسيمة", type: "CITY", parent: "جهة طنجة-تطوان-الحسيمة", aliases: ["Al Hoceima"] },
  { name: "العرائش", type: "CITY", parent: "جهة طنجة-تطوان-الحسيمة", aliases: ["Larache"] },
  { name: "شفشاون", type: "CITY", parent: "جهة طنجة-تطوان-الحسيمة", aliases: ["Chefchaouen"] },
  { name: "القصر الكبير", type: "CITY", parent: "جهة طنجة-تطوان-الحسيمة", aliases: ["Ksar el-Kebir"] },

  { name: "جهة الشرق", type: "REGION", parent: "المغرب", aliases: ["Oriental Region"], sortOrder: 2 },
  { name: "وجدة", type: "CITY", parent: "جهة الشرق", aliases: ["Oujda"] },
  { name: "الناظور", type: "CITY", parent: "جهة الشرق", aliases: ["Nador"] },
  { name: "بركان", type: "CITY", parent: "جهة الشرق", aliases: ["Berkane"] },
  { name: "تاوريرت", type: "CITY", parent: "جهة الشرق", aliases: ["Taourirt"] },

  { name: "جهة فاس-مكناس", type: "REGION", parent: "المغرب", aliases: ["Fes-Meknes Region"], sortOrder: 3 },
  { name: "فاس", type: "CITY", parent: "جهة فاس-مكناس", aliases: ["Fes", "Fez"] },
  { name: "مكناس", type: "CITY", parent: "جهة فاس-مكناس", aliases: ["Meknes"] },
  { name: "تازة", type: "CITY", parent: "جهة فاس-مكناس", aliases: ["Taza"] },
  { name: "إفران", type: "CITY", parent: "جهة فاس-مكناس", aliases: ["Ifrane"] },

  { name: "جهة الرباط-سلا-القنيطرة", type: "REGION", parent: "المغرب", aliases: ["Rabat-Sale-Kenitra Region"], sortOrder: 4 },
  { name: "الرباط", type: "CITY", parent: "جهة الرباط-سلا-القنيطرة", aliases: ["Rabat"] },
  { name: "سلا", type: "CITY", parent: "جهة الرباط-سلا-القنيطرة", aliases: ["Sale", "Salé"] },
  { name: "القنيطرة", type: "CITY", parent: "جهة الرباط-سلا-القنيطرة", aliases: ["Kenitra"] },
  { name: "تمارة", type: "CITY", parent: "جهة الرباط-سلا-القنيطرة", aliases: ["Temara"] },
  { name: "خميسات", type: "CITY", parent: "جهة الرباط-سلا-القنيطرة", aliases: ["Khemisset"] },

  { name: "جهة بني ملال-خنيفرة", type: "REGION", parent: "المغرب", aliases: ["Beni Mellal-Khenifra Region"], sortOrder: 5 },
  { name: "بني ملال", type: "CITY", parent: "جهة بني ملال-خنيفرة", aliases: ["Beni Mellal"] },
  { name: "خريبكة", type: "CITY", parent: "جهة بني ملال-خنيفرة", aliases: ["Khouribga"] },
  { name: "أزيلال", type: "CITY", parent: "جهة بني ملال-خنيفرة", aliases: ["Azilal"] },

  { name: "جهة الدار البيضاء-سطات", type: "REGION", parent: "المغرب", aliases: ["Casablanca-Settat Region"], sortOrder: 6 },
  { name: "الدار البيضاء", type: "CITY", parent: "جهة الدار البيضاء-سطات", aliases: ["Casablanca"] },
  { name: "المحمدية", type: "CITY", parent: "جهة الدار البيضاء-سطات", aliases: ["Mohammedia"] },
  { name: "سطات", type: "CITY", parent: "جهة الدار البيضاء-سطات", aliases: ["Settat"] },
  { name: "الجديدة (المغرب)", type: "CITY", parent: "جهة الدار البيضاء-سطات", aliases: ["El Jadida"] },

  { name: "جهة مراكش-آسفي", type: "REGION", parent: "المغرب", aliases: ["Marrakech-Safi Region"], sortOrder: 7 },
  { name: "مراكش", type: "CITY", parent: "جهة مراكش-آسفي", aliases: ["Marrakech", "Marrakesh"] },
  { name: "آسفي", type: "CITY", parent: "جهة مراكش-آسفي", aliases: ["Safi"] },
  { name: "الصويرة", type: "CITY", parent: "جهة مراكش-آسفي", aliases: ["Essaouira"] },

  { name: "جهة درعة-تافيلالت", type: "REGION", parent: "المغرب", aliases: ["Draa-Tafilalet Region"], sortOrder: 8 },
  { name: "ورزازات", type: "CITY", parent: "جهة درعة-تافيلالت", aliases: ["Ouarzazate"] },
  { name: "الرشيدية", type: "CITY", parent: "جهة درعة-تافيلالت", aliases: ["Errachidia"] },
  { name: "زاكورة", type: "CITY", parent: "جهة درعة-تافيلالت", aliases: ["Zagora"] },

  { name: "جهة سوس-ماسة", type: "REGION", parent: "المغرب", aliases: ["Souss-Massa Region"], sortOrder: 9 },
  { name: "أكادير", type: "CITY", parent: "جهة سوس-ماسة", aliases: ["Agadir"] },
  { name: "تيزنيت", type: "CITY", parent: "جهة سوس-ماسة", aliases: ["Tiznit"] },
  { name: "تارودانت", type: "CITY", parent: "جهة سوس-ماسة", aliases: ["Taroudant"] },

  { name: "جهة كلميم-واد نون", type: "REGION", parent: "المغرب", aliases: ["Guelmim-Oued Noun Region"], sortOrder: 10 },
  { name: "كلميم", type: "CITY", parent: "جهة كلميم-واد نون", aliases: ["Guelmim"] },
  { name: "طانطان", type: "CITY", parent: "جهة كلميم-واد نون", aliases: ["Tan-Tan"] },

  { name: "جهة العيون-الساقية الحمراء", type: "REGION", parent: "المغرب", aliases: ["Laayoune-Sakia El Hamra Region"], sortOrder: 11 },
  { name: "العيون", type: "CITY", parent: "جهة العيون-الساقية الحمراء", aliases: ["Laayoune"] },
  { name: "بوجدور", type: "CITY", parent: "جهة العيون-الساقية الحمراء", aliases: ["Boujdour"] },

  { name: "جهة الداخلة-وادي الذهب", type: "REGION", parent: "المغرب", aliases: ["Dakhla-Oued Ed-Dahab Region"], sortOrder: 12 },
  { name: "الداخلة", type: "CITY", parent: "جهة الداخلة-وادي الذهب", aliases: ["Dakhla"] },

  // ============================================================
  // السودان (Sudan)
  // ============================================================
  { name: "السودان", type: "COUNTRY", aliases: ["Sudan"], sortOrder: 16 },

  { name: "ولاية الخرطوم", type: "REGION", parent: "السودان", aliases: ["Khartoum State"], sortOrder: 1 },
  { name: "الخرطوم", type: "CITY", parent: "ولاية الخرطوم", aliases: ["Khartoum"] },
  { name: "أم درمان", type: "CITY", parent: "ولاية الخرطوم", aliases: ["Omdurman"] },
  { name: "الخرطوم بحري", type: "CITY", parent: "ولاية الخرطوم", aliases: ["Khartoum North"] },
  { name: "جبرة", type: "CITY", parent: "ولاية الخرطوم", aliases: ["Jabra"] },

  { name: "ولاية الجزيرة (السودان)", type: "REGION", parent: "السودان", aliases: ["Al-Jazirah State", "Gezira State"], sortOrder: 2 },
  { name: "ودمدني", type: "CITY", parent: "ولاية الجزيرة (السودان)", aliases: ["Wad Madani"] },
  { name: "رفاعة", type: "CITY", parent: "ولاية الجزيرة (السودان)", aliases: ["Rifa'a"] },

  { name: "ولاية النيل الأبيض", type: "REGION", parent: "السودان", aliases: ["White Nile State"], sortOrder: 3 },
  { name: "ربك", type: "CITY", parent: "ولاية النيل الأبيض", aliases: ["Rabak"] },
  { name: "كوستي", type: "CITY", parent: "ولاية النيل الأبيض", aliases: ["Kosti"] },

  { name: "ولاية النيل الأزرق", type: "REGION", parent: "السودان", aliases: ["Blue Nile State"], sortOrder: 4 },
  { name: "الدمازين", type: "CITY", parent: "ولاية النيل الأزرق", aliases: ["Ad-Damazin"] },

  { name: "ولاية سنار", type: "REGION", parent: "السودان", aliases: ["Sennar State"], sortOrder: 5 },
  { name: "سنار", type: "CITY", parent: "ولاية سنار", aliases: ["Sennar City"] },

  { name: "ولاية القضارف", type: "REGION", parent: "السودان", aliases: ["Al-Qadarif State", "Gadarif State"], sortOrder: 6 },
  { name: "القضارف", type: "CITY", parent: "ولاية القضارف", aliases: ["Gedaref", "Gadarif"] },

  { name: "ولاية كسلا", type: "REGION", parent: "السودان", aliases: ["Kassala State"], sortOrder: 7 },
  { name: "كسلا", type: "CITY", parent: "ولاية كسلا", aliases: ["Kassala City"] },

  { name: "ولاية البحر الأحمر (السودان)", type: "REGION", parent: "السودان", aliases: ["Red Sea State - Sudan"], sortOrder: 8 },
  { name: "بورتسودان", type: "CITY", parent: "ولاية البحر الأحمر (السودان)", aliases: ["Port Sudan"] },
  { name: "طوكر", type: "CITY", parent: "ولاية البحر الأحمر (السودان)", aliases: ["Tokar"] },

  { name: "ولاية نهر النيل (السودان)", type: "REGION", parent: "السودان", aliases: ["River Nile State"], sortOrder: 9 },
  { name: "عطبرة", type: "CITY", parent: "ولاية نهر النيل (السودان)", aliases: ["Atbara"] },
  { name: "شندي", type: "CITY", parent: "ولاية نهر النيل (السودان)", aliases: ["Shendi"] },

  { name: "ولاية الشمالية (السودان)", type: "REGION", parent: "السودان", aliases: ["Northern State - Sudan"], sortOrder: 10 },
  { name: "دنقلا", type: "CITY", parent: "ولاية الشمالية (السودان)", aliases: ["Dongola"] },
  { name: "وادي حلفا", type: "CITY", parent: "ولاية الشمالية (السودان)", aliases: ["Wadi Halfa"] },

  { name: "ولاية شمال كردفان", type: "REGION", parent: "السودان", aliases: ["North Kordofan State"], sortOrder: 11 },
  { name: "الأبيض", type: "CITY", parent: "ولاية شمال كردفان", aliases: ["El Obeid"] },
  { name: "بارا", type: "CITY", parent: "ولاية شمال كردفان", aliases: ["Bara"] },

  { name: "ولاية جنوب كردفان", type: "REGION", parent: "السودان", aliases: ["South Kordofan State"], sortOrder: 12 },
  { name: "كادقلي", type: "CITY", parent: "ولاية جنوب كردفان", aliases: ["Kadugli"] },

  { name: "ولاية غرب كردفان", type: "REGION", parent: "السودان", aliases: ["West Kordofan State"], sortOrder: 13 },
  { name: "الفولة", type: "CITY", parent: "ولاية غرب كردفان", aliases: ["El Fula"] },

  { name: "ولاية شمال دارفور", type: "REGION", parent: "السودان", aliases: ["North Darfur State"], sortOrder: 14 },
  { name: "الفاشر", type: "CITY", parent: "ولاية شمال دارفور", aliases: ["El Fasher"] },

  { name: "ولاية جنوب دارفور", type: "REGION", parent: "السودان", aliases: ["South Darfur State"], sortOrder: 15 },
  { name: "نيالا", type: "CITY", parent: "ولاية جنوب دارفور", aliases: ["Nyala"] },

  { name: "ولاية وسط دارفور", type: "REGION", parent: "السودان", aliases: ["Central Darfur State"], sortOrder: 16 },
  { name: "زالنجي", type: "CITY", parent: "ولاية وسط دارفور", aliases: ["Zalingei"] },

  { name: "ولاية شرق دارفور", type: "REGION", parent: "السودان", aliases: ["East Darfur State"], sortOrder: 17 },
  { name: "الضعين (شرق دارفور)", type: "CITY", parent: "ولاية شرق دارفور", aliases: ["Ed Daein - East Darfur"] },

  { name: "ولاية غرب دارفور", type: "REGION", parent: "السودان", aliases: ["West Darfur State"], sortOrder: 18 },
  { name: "الجنينة", type: "CITY", parent: "ولاية غرب دارفور", aliases: ["El Geneina"] },

  // ============================================================
  // موريتانيا (Mauritania)
  // ============================================================
  { name: "موريتانيا", type: "COUNTRY", aliases: ["Mauritania"], sortOrder: 17 },

  { name: "نواكشوط الغربية", type: "REGION", parent: "موريتانيا", aliases: ["Nouakchott West"], sortOrder: 1 },
  { name: "نواكشوط", type: "CITY", parent: "نواكشوط الغربية", aliases: ["Nouakchott"] },
  { name: "نواكشوط الشمالية", type: "REGION", parent: "موريتانيا", aliases: ["Nouakchott North"], sortOrder: 2 },
  { name: "نواكشوط الجنوبية", type: "REGION", parent: "موريتانيا", aliases: ["Nouakchott South"], sortOrder: 3 },
  { name: "آدرار", type: "REGION", parent: "موريتانيا", aliases: ["Adrar"], sortOrder: 4 },
  { name: "أطار", type: "CITY", parent: "آدرار", aliases: ["Atar"] },
  { name: "ترارزة", type: "REGION", parent: "موريتانيا", aliases: ["Trarza"], sortOrder: 5 },
  { name: "روصو", type: "CITY", parent: "ترارزة", aliases: ["Rosso"] },
  { name: "براكنة", type: "REGION", parent: "موريتانيا", aliases: ["Brakna"], sortOrder: 6 },
  { name: "بوكي", type: "CITY", parent: "براكنة", aliases: ["Boghé"] },
  { name: "غورغول", type: "REGION", parent: "موريتانيا", aliases: ["Gorgol"], sortOrder: 7 },
  { name: "كيهيدي", type: "CITY", parent: "غورغول", aliases: ["Kaédi"] },
  { name: "الحوض الشرقي", type: "REGION", parent: "موريتانيا", aliases: ["Hodh Ech Chargui"], sortOrder: 8 },
  { name: "نيورو", type: "CITY", parent: "الحوض الشرقي", aliases: ["Néma"] },
  { name: "الحوض الغربي", type: "REGION", parent: "موريتانيا", aliases: ["Hodh El Gharbi"], sortOrder: 9 },
  { name: "كيفة", type: "CITY", parent: "الحوض الغربي", aliases: ["Kiffa"] },
  { name: "العصابة", type: "REGION", parent: "موريتانيا", aliases: ["Assaba"], sortOrder: 10 },
  { name: "لعيون", type: "CITY", parent: "العصابة", aliases: ["Aïoun el-Atrouss"] },
  { name: "داخلت نواديبو", type: "REGION", parent: "موريتانيا", aliases: ["Dakhlet Nouadhibou"], sortOrder: 11 },
  { name: "نواذيبو", type: "CITY", parent: "داخلت نواديبو", aliases: ["Nouadhibou"] },
  { name: "تيرس زمور", type: "REGION", parent: "موريتانيا", aliases: ["Tiris Zemmour"], sortOrder: 12 },
  { name: "زويرات", type: "CITY", parent: "تيرس زمور", aliases: ["Zouerate"] },
  { name: "تاقنت", type: "REGION", parent: "موريتانيا", aliases: ["Tagant"], sortOrder: 13 },
  { name: "تيجكجة", type: "CITY", parent: "تاقنت", aliases: ["Tidjikja"] },

  // ============================================================
  // الصومال (Somalia)
  // ============================================================
  { name: "الصومال", type: "COUNTRY", aliases: ["Somalia"], sortOrder: 18 },

  { name: "بنادر", type: "REGION", parent: "الصومال", aliases: ["Banadir"], sortOrder: 1 },
  { name: "مقديشو", type: "CITY", parent: "بنادر", aliases: ["Mogadishu"] },
  { name: "جوبالاند", type: "REGION", parent: "الصومال", aliases: ["Jubaland"], sortOrder: 2 },
  { name: "كيسمايو", type: "CITY", parent: "جوبالاند", aliases: ["Kismayo"] },
  { name: "بونتلاند", type: "REGION", parent: "الصومال", aliases: ["Puntland"], sortOrder: 3 },
  { name: "بوساسو", type: "CITY", parent: "بونتلاند", aliases: ["Bosaso"] },
  { name: "صوماليلاند", type: "REGION", parent: "الصومال", aliases: ["Somaliland"], sortOrder: 4 },
  { name: "هرجيسا", type: "CITY", parent: "صوماليلاند", aliases: ["Hargeisa"] },
  { name: "هيرشبيلي", type: "REGION", parent: "الصومال", aliases: ["Hirshabelle"], sortOrder: 5 },
  { name: "غلمدغ", type: "REGION", parent: "الصومال", aliases: ["Galmudug"], sortOrder: 6 },
  { name: "دوسمريب", type: "CITY", parent: "غلمدغ", aliases: ["Dhusamareb"] },
  { name: "الصومال الجنوب الغربي", type: "REGION", parent: "الصومال", aliases: ["South West Somalia"], sortOrder: 7 },
  { name: "بيدوا", type: "CITY", parent: "الصومال الجنوب الغربي", aliases: ["Baidoa"] },

  // ============================================================
  // جيبوتي (Djibouti)
  // ============================================================
  { name: "جيبوتي", type: "COUNTRY", aliases: ["Djibouti"], sortOrder: 19 },

  { name: "منطقة جيبوتي", type: "REGION", parent: "جيبوتي", aliases: ["Djibouti Region"], sortOrder: 1 },
  { name: "مدينة جيبوتي", type: "CITY", parent: "منطقة جيبوتي", aliases: ["Djibouti City"] },
  { name: "تاجورة", type: "REGION", parent: "جيبوتي", aliases: ["Tadjoura"], sortOrder: 2 },
  { name: "علي صبيح", type: "REGION", parent: "جيبوتي", aliases: ["Ali Sabieh"], sortOrder: 3 },
  { name: "ديخيل", type: "REGION", parent: "جيبوتي", aliases: ["Dikhil"], sortOrder: 4 },
  { name: "أوبوك", type: "REGION", parent: "جيبوتي", aliases: ["Obock"], sortOrder: 5 },
  { name: "عرتا", type: "REGION", parent: "جيبوتي", aliases: ["Arta"], sortOrder: 6 },

  // ============================================================
  // جزر القمر (Comoros)
  // ============================================================
  { name: "جزر القمر", type: "COUNTRY", aliases: ["Comoros"], sortOrder: 20 },

  { name: "نجازيجا", type: "REGION", parent: "جزر القمر", aliases: ["Grande Comore", "جزيرة القمر الكبرى"], sortOrder: 1 },
  { name: "موروني", type: "CITY", parent: "نجازيجا", aliases: ["Moroni"] },
  { name: "أنجوان", type: "REGION", parent: "جزر القمر", aliases: ["Anjouan", "نزواني"], sortOrder: 2 },
  { name: "موتسامودو", type: "CITY", parent: "أنجوان", aliases: ["Mutsamudu"] },
  { name: "موهيلي", type: "REGION", parent: "جزر القمر", aliases: ["Mohéli", "مواني"], sortOrder: 3 },
  { name: "فيمبوني", type: "CITY", parent: "موهيلي", aliases: ["Fomboni"] },
];
