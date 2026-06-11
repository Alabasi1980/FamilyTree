// Additional Arab countries seed data
export const placesData2: {
  name: string;
  type: "COUNTRY" | "REGION" | "CITY";
  parent?: string;
  aliases?: string[];
  sortOrder?: number;
}[] = [
  // ============================================================
  // مصر (Egypt)
  // ============================================================
  { name: "مصر", type: "COUNTRY", aliases: ["Egypt", "جمهورية مصر العربية"], sortOrder: 1 },

  // Governorates
  { name: "القاهرة", type: "REGION", parent: "مصر", aliases: ["Cairo", "محافظة القاهرة"] },
  { name: "الجيزة", type: "REGION", parent: "مصر", aliases: ["Giza", "محافظة الجيزة"] },
  { name: "الإسكندرية", type: "REGION", parent: "مصر", aliases: ["Alexandria", "محافظة الإسكندرية"] },
  { name: "الدقهلية", type: "REGION", parent: "مصر", aliases: ["Dakahlia", "محافظة الدقهلية"] },
  { name: "البحر الأحمر", type: "REGION", parent: "مصر", aliases: ["Red Sea", "محافظة البحر الأحمر"] },
  { name: "البحيرة", type: "REGION", parent: "مصر", aliases: ["Beheira", "محافظة البحيرة"] },
  { name: "الفيوم", type: "REGION", parent: "مصر", aliases: ["Fayoum", "محافظة الفيوم"] },
  { name: "الغربية", type: "REGION", parent: "مصر", aliases: ["Gharbia", "محافظة الغربية"] },
  { name: "الإسماعيلية", type: "REGION", parent: "مصر", aliases: ["Ismailia", "محافظة الإسماعيلية"] },
  { name: "المنوفية", type: "REGION", parent: "مصر", aliases: ["Menofia", "محافظة المنوفية"] },
  { name: "المنيا", type: "REGION", parent: "مصر", aliases: ["Minya", "محافظة المنيا"] },
  { name: "القليوبية", type: "REGION", parent: "مصر", aliases: ["Qalyubia", "محافظة القليوبية"] },
  { name: "الوادي الجديد", type: "REGION", parent: "مصر", aliases: ["New Valley", "محافظة الوادي الجديد"] },
  { name: "السويس", type: "REGION", parent: "مصر", aliases: ["Suez", "محافظة السويس"] },
  { name: "اسوان", type: "REGION", parent: "مصر", aliases: ["Aswan", "أسوان", "محافظة أسوان"] },
  { name: "اسيوط", type: "REGION", parent: "مصر", aliases: ["Asyut", "أسيوط", "محافظة أسيوط"] },
  { name: "بني سويف", type: "REGION", parent: "مصر", aliases: ["Beni Suef", "محافظة بني سويف"] },
  { name: "بورسعيد", type: "REGION", parent: "مصر", aliases: ["Port Said", "محافظة بورسعيد"] },
  { name: "دمياط", type: "REGION", parent: "مصر", aliases: ["Damietta", "محافظة دمياط"] },
  { name: "جنوب سيناء", type: "REGION", parent: "مصر", aliases: ["South Sinai", "محافظة جنوب سيناء"] },
  { name: "شمال سيناء", type: "REGION", parent: "مصر", aliases: ["North Sinai", "محافظة شمال سيناء"] },
  { name: "سوهاج", type: "REGION", parent: "مصر", aliases: ["Sohag", "محافظة سوهاج"] },
  { name: "قنا", type: "REGION", parent: "مصر", aliases: ["Qena", "محافظة قنا"] },
  { name: "كفر الشيخ", type: "REGION", parent: "مصر", aliases: ["Kafr el-Sheikh", "محافظة كفر الشيخ"] },
  { name: "مطروح", type: "REGION", parent: "مصر", aliases: ["Matrouh", "محافظة مطروح"] },
  { name: "الأقصر", type: "REGION", parent: "مصر", aliases: ["Luxor", "محافظة الأقصر"] },
  { name: "الشرقية", type: "REGION", parent: "مصر", aliases: ["Sharqia", "محافظة الشرقية"] },

  // Cairo cities/districts
  { name: "مدينة نصر", type: "CITY", parent: "القاهرة", aliases: ["Nasr City"] },
  { name: "هليوبوليس", type: "CITY", parent: "القاهرة", aliases: ["Heliopolis", "مصر الجديدة"] },
  { name: "المعادي", type: "CITY", parent: "القاهرة", aliases: ["Maadi"] },
  { name: "الزمالك", type: "CITY", parent: "القاهرة", aliases: ["Zamalek"] },
  { name: "عين شمس", type: "CITY", parent: "القاهرة", aliases: ["Ain Shams"] },
  { name: "شبرا", type: "CITY", parent: "القاهرة", aliases: ["Shoubra"] },
  { name: "التجمع الخامس", type: "CITY", parent: "القاهرة", aliases: ["Fifth Settlement"] },
  { name: "القاهرة الجديدة", type: "CITY", parent: "القاهرة", aliases: ["New Cairo"] },
  { name: "حلوان", type: "CITY", parent: "القاهرة", aliases: ["Helwan"] },
  { name: "المقطم", type: "CITY", parent: "القاهرة", aliases: ["Mokattam"] },
  { name: "الدقي", type: "CITY", parent: "القاهرة", aliases: ["Dokki"] },
  { name: "مدينة بدر", type: "CITY", parent: "القاهرة", aliases: ["Badr City"] },

  // Giza cities
  { name: "الجيزة المدينة", type: "CITY", parent: "الجيزة", aliases: ["Giza City"] },
  { name: "أكتوبر", type: "CITY", parent: "الجيزة", aliases: ["6th of October", "السادس من أكتوبر"] },
  { name: "الشيخ زايد", type: "CITY", parent: "الجيزة", aliases: ["Sheikh Zayed"] },
  { name: "الهرم", type: "CITY", parent: "الجيزة", aliases: ["Haram"] },
  { name: "الوراق", type: "CITY", parent: "الجيزة", aliases: ["Warraq"] },
  { name: "إمبابة", type: "CITY", parent: "الجيزة", aliases: ["Imbaba"] },
  { name: "بولاق الدكرور", type: "CITY", parent: "الجيزة", aliases: ["Bulaq al-Dakrur"] },
  { name: "الجيزة الجديدة", type: "CITY", parent: "الجيزة", aliases: ["New Giza"] },

  // Alexandria cities
  { name: "الإسكندرية المدينة", type: "CITY", parent: "الإسكندرية", aliases: ["Alexandria City"] },
  { name: "المنتزه", type: "CITY", parent: "الإسكندرية", aliases: ["Montaza"] },
  { name: "العجمي", type: "CITY", parent: "الإسكندرية", aliases: ["Agami"] },
  { name: "سيدي بشر", type: "CITY", parent: "الإسكندرية", aliases: ["Sidi Bishr"] },
  { name: "المحرم بك", type: "CITY", parent: "الإسكندرية", aliases: ["Moharam Bey"] },
  { name: "الرمل", type: "CITY", parent: "الإسكندرية", aliases: ["Raml"] },
  { name: "سموحة", type: "CITY", parent: "الإسكندرية", aliases: ["Smouha"] },
  { name: "برج العرب", type: "CITY", parent: "الإسكندرية", aliases: ["Borg el Arab"] },

  // Dakahlia cities
  { name: "المنصورة", type: "CITY", parent: "الدقهلية", aliases: ["Mansoura"] },
  { name: "طلخا", type: "CITY", parent: "الدقهلية", aliases: ["Talha"] },
  { name: "ميت غمر", type: "CITY", parent: "الدقهلية", aliases: ["Mit Ghamr"] },
  { name: "الزقازيق", type: "CITY", parent: "الشرقية", aliases: ["Zagazig"] },
  { name: "السنبلاوين", type: "CITY", parent: "الدقهلية", aliases: ["Sinbillawin"] },
  { name: "دكرنس", type: "CITY", parent: "الدقهلية", aliases: ["Dekernes"] },

  // Red Sea cities
  { name: "الغردقة", type: "CITY", parent: "البحر الأحمر", aliases: ["Hurghada"] },
  { name: "سفاجا", type: "CITY", parent: "البحر الأحمر", aliases: ["Safaga"] },
  { name: "القصير", type: "CITY", parent: "البحر الأحمر", aliases: ["Quseer"] },
  { name: "مرسى علم", type: "CITY", parent: "البحر الأحمر", aliases: ["Marsa Alam"] },

  // Beheira cities
  { name: "دمنهور", type: "CITY", parent: "البحيرة", aliases: ["Damanhur"] },
  { name: "كفر الدوار", type: "CITY", parent: "البحيرة", aliases: ["Kafr el-Dawar"] },
  { name: "الرحمانية", type: "CITY", parent: "البحيرة", aliases: ["Rahmaniya"] },
  { name: "أبو المطامير", type: "CITY", parent: "البحيرة", aliases: ["Abu el-Matamir"] },

  // Fayoum cities
  { name: "الفيوم المدينة", type: "CITY", parent: "الفيوم", aliases: ["Fayoum City"] },
  { name: "سنورس", type: "CITY", parent: "الفيوم", aliases: ["Sinuris"] },
  { name: "طامية", type: "CITY", parent: "الفيوم", aliases: ["Tamiya"] },

  // Gharbia cities
  { name: "طنطا", type: "CITY", parent: "الغربية", aliases: ["Tanta"] },
  { name: "المحلة الكبرى", type: "CITY", parent: "الغربية", aliases: ["Mahalla al-Kubra"] },
  { name: "كفر الزيات", type: "CITY", parent: "الغربية", aliases: ["Kafr el-Zayat"] },
  { name: "زفتى", type: "CITY", parent: "الغربية", aliases: ["Zifta"] },
  { name: "بسيون", type: "CITY", parent: "الغربية", aliases: ["Basyoun"] },

  // Ismailia cities
  { name: "الإسماعيلية المدينة", type: "CITY", parent: "الإسماعيلية", aliases: ["Ismailia City"] },
  { name: "القنطرة", type: "CITY", parent: "الإسماعيلية", aliases: ["Qantara"] },
  { name: "فايد", type: "CITY", parent: "الإسماعيلية", aliases: ["Fayed"] },

  // Menofia cities
  { name: "شبين الكوم", type: "CITY", parent: "المنوفية", aliases: ["Shibin el-Kom"] },
  { name: "مينوف", type: "CITY", parent: "المنوفية", aliases: ["Menouf"] },
  { name: "طلا", type: "CITY", parent: "المنوفية", aliases: ["Tala"] },
  { name: "أشمون", type: "CITY", parent: "المنوفية", aliases: ["Ashmoun"] },

  // Minya cities
  { name: "المنيا المدينة", type: "CITY", parent: "المنيا", aliases: ["Minya City"] },
  { name: "مغاغة", type: "CITY", parent: "المنيا", aliases: ["Maghagha"] },
  { name: "بني مزار", type: "CITY", parent: "المنيا", aliases: ["Beni Mazar"] },
  { name: "ملوي", type: "CITY", parent: "المنيا", aliases: ["Mallawi"] },
  { name: "سمالوط", type: "CITY", parent: "المنيا", aliases: ["Samalut"] },

  // Qalyubia cities
  { name: "بنها", type: "CITY", parent: "القليوبية", aliases: ["Banha"] },
  { name: "قليوب", type: "CITY", parent: "القليوبية", aliases: ["Qalyub"] },
  { name: "شبرا الخيمة", type: "CITY", parent: "القليوبية", aliases: ["Shubra el-Kheima"] },
  { name: "الخانكة", type: "CITY", parent: "القليوبية", aliases: ["Khanka"] },
  { name: "العبور", type: "CITY", parent: "القليوبية", aliases: ["Obour"] },

  // New Valley cities
  { name: "الخارجة", type: "CITY", parent: "الوادي الجديد", aliases: ["Kharga"] },
  { name: "الداخلة", type: "CITY", parent: "الوادي الجديد", aliases: ["Dakhla"] },
  { name: "الفرافرة", type: "CITY", parent: "الوادي الجديد", aliases: ["Farafra"] },

  // Suez cities
  { name: "السويس المدينة", type: "CITY", parent: "السويس", aliases: ["Suez City"] },
  { name: "عتاقة", type: "CITY", parent: "السويس", aliases: ["Attaka"] },

  // Aswan cities
  { name: "أسوان المدينة", type: "CITY", parent: "اسوان", aliases: ["Aswan City"] },
  { name: "كوم أمبو", type: "CITY", parent: "اسوان", aliases: ["Kom Ombo"] },
  { name: "أبو سمبل", type: "CITY", parent: "اسوان", aliases: ["Abu Simbel"] },
  { name: "إدفو", type: "CITY", parent: "اسوان", aliases: ["Edfu"] },

  // Asyut cities
  { name: "أسيوط المدينة", type: "CITY", parent: "اسيوط", aliases: ["Asyut City"] },
  { name: "ديروط", type: "CITY", parent: "اسيوط", aliases: ["Dairut"] },
  { name: "القوصية", type: "CITY", parent: "اسيوط", aliases: ["Qusiya"] },
  { name: "أبنوب", type: "CITY", parent: "اسيوط", aliases: ["Abnoub"] },
  { name: "منفلوط", type: "CITY", parent: "اسيوط", aliases: ["Manfalut"] },

  // Beni Suef cities
  { name: "بني سويف المدينة", type: "CITY", parent: "بني سويف", aliases: ["Beni Suef City"] },
  { name: "الفشن", type: "CITY", parent: "بني سويف", aliases: ["Fashn"] },
  { name: "ببا", type: "CITY", parent: "بني سويف", aliases: ["Beba"] },
  { name: "إهناسيا", type: "CITY", parent: "بني سويف", aliases: ["Ihnasya"] },

  // Port Said cities
  { name: "بورسعيد المدينة", type: "CITY", parent: "بورسعيد", aliases: ["Port Said City"] },
  { name: "بورفؤاد", type: "CITY", parent: "بورسعيد", aliases: ["Port Fouad"] },

  // Damietta cities
  { name: "دمياط المدينة", type: "CITY", parent: "دمياط", aliases: ["Damietta City"] },
  { name: "رأس البر", type: "CITY", parent: "دمياط", aliases: ["Ras el-Bar"] },
  { name: "فارسكور", type: "CITY", parent: "دمياط", aliases: ["Faraskur"] },
  { name: "الزرقا", type: "CITY", parent: "دمياط", aliases: ["Zarqa"] },

  // South Sinai cities
  { name: "شرم الشيخ", type: "CITY", parent: "جنوب سيناء", aliases: ["Sharm el-Sheikh"] },
  { name: "دهب", type: "CITY", parent: "جنوب سيناء", aliases: ["Dahab"] },
  { name: "طابا", type: "CITY", parent: "جنوب سيناء", aliases: ["Taba"] },
  { name: "نويبع", type: "CITY", parent: "جنوب سيناء", aliases: ["Nuweiba"] },
  { name: "الطور", type: "CITY", parent: "جنوب سيناء", aliases: ["El-Tor"] },
  { name: "أبو رديس", type: "CITY", parent: "جنوب سيناء", aliases: ["Abu Rudeis"] },

  // North Sinai cities
  { name: "العريش", type: "CITY", parent: "شمال سيناء", aliases: ["Arish"] },
  { name: "رفح", type: "CITY", parent: "شمال سيناء", aliases: ["Rafah"] },
  { name: "الشيخ زويد", type: "CITY", parent: "شمال سيناء", aliases: ["Sheikh Zuweid"] },
  { name: "بئر العبد", type: "CITY", parent: "شمال سيناء", aliases: ["Bir el-Abd"] },

  // Sohag cities
  { name: "سوهاج المدينة", type: "CITY", parent: "سوهاج", aliases: ["Sohag City"] },
  { name: "أخميم", type: "CITY", parent: "سوهاج", aliases: ["Akhmim"] },
  { name: "طهطا", type: "CITY", parent: "سوهاج", aliases: ["Tahta"] },
  { name: "جرجا", type: "CITY", parent: "سوهاج", aliases: ["Gerga"] },
  { name: "المراغة", type: "CITY", parent: "سوهاج", aliases: ["Maragha"] },

  // Qena cities
  { name: "قنا المدينة", type: "CITY", parent: "قنا", aliases: ["Qena City"] },
  { name: "نجع حمادي", type: "CITY", parent: "قنا", aliases: ["Nag Hammadi"] },
  { name: "دشنا", type: "CITY", parent: "قنا", aliases: ["Dishna"] },
  { name: "إسنا", type: "CITY", parent: "قنا", aliases: ["Esna"] },

  // Kafr el-Sheikh cities
  { name: "كفر الشيخ المدينة", type: "CITY", parent: "كفر الشيخ", aliases: ["Kafr el-Sheikh City"] },
  { name: "دسوق", type: "CITY", parent: "كفر الشيخ", aliases: ["Desouq"] },
  { name: "فوه", type: "CITY", parent: "كفر الشيخ", aliases: ["Fuwwa"] },
  { name: "بيلا", type: "CITY", parent: "كفر الشيخ", aliases: ["Bila"] },

  // Matrouh cities
  { name: "مرسى مطروح", type: "CITY", parent: "مطروح", aliases: ["Marsa Matrouh"] },
  { name: "سيوة", type: "CITY", parent: "مطروح", aliases: ["Siwa"] },
  { name: "الحمام", type: "CITY", parent: "مطروح", aliases: ["Hamam"] },

  // Luxor cities
  { name: "الأقصر المدينة", type: "CITY", parent: "الأقصر", aliases: ["Luxor City"] },
  { name: "الكرنك", type: "CITY", parent: "الأقصر", aliases: ["Karnak"] },
  { name: "أرمنت", type: "CITY", parent: "الأقصر", aliases: ["Armant"] },

  // Sharqia cities
  { name: "الزقازيق المدينة", type: "CITY", parent: "الشرقية", aliases: ["Zagazig City"] },
  { name: "العاشر من رمضان", type: "CITY", parent: "الشرقية", aliases: ["10th of Ramadan"] },
  { name: "بلبيس", type: "CITY", parent: "الشرقية", aliases: ["Bilbeis"] },
  { name: "أبو كبير", type: "CITY", parent: "الشرقية", aliases: ["Abu Kabir"] },
  { name: "ميت أبو الكوم", type: "CITY", parent: "الشرقية" },
  { name: "ههيا", type: "CITY", parent: "الشرقية", aliases: ["Hihya"] },

  // ============================================================
  // الأردن (Jordan)
  // ============================================================
  { name: "الأردن", type: "COUNTRY", aliases: ["Jordan", "المملكة الأردنية الهاشمية"], sortOrder: 2 },

  // Governorates
  { name: "عمّان", type: "REGION", parent: "الأردن", aliases: ["Amman", "محافظة عمان"] },
  { name: "إربد", type: "REGION", parent: "الأردن", aliases: ["Irbid", "محافظة إربد"] },
  { name: "الزرقاء", type: "REGION", parent: "الأردن", aliases: ["Zarqa", "محافظة الزرقاء"] },
  { name: "البلقاء", type: "REGION", parent: "الأردن", aliases: ["Balqa", "محافظة البلقاء"] },
  { name: "الكرك", type: "REGION", parent: "الأردن", aliases: ["Karak", "محافظة الكرك"] },
  { name: "المفرق", type: "REGION", parent: "الأردن", aliases: ["Mafraq", "محافظة المفرق"] },
  { name: "جرش", type: "REGION", parent: "الأردن", aliases: ["Jerash", "محافظة جرش"] },
  { name: "عجلون", type: "REGION", parent: "الأردن", aliases: ["Ajloun", "محافظة عجلون"] },
  { name: "العقبة", type: "REGION", parent: "الأردن", aliases: ["Aqaba", "محافظة العقبة"] },
  { name: "الطفيلة", type: "REGION", parent: "الأردن", aliases: ["Tafilah", "محافظة الطفيلة"] },
  { name: "معان", type: "REGION", parent: "الأردن", aliases: ["Maan", "محافظة معان"] },
  { name: "مادبا", type: "REGION", parent: "الأردن", aliases: ["Madaba", "محافظة مادبا"] },

  // Amman cities
  { name: "عمّان المدينة", type: "CITY", parent: "عمّان", aliases: ["Amman City"] },
  { name: "الرابية", type: "CITY", parent: "عمّان", aliases: ["Rabieh"] },
  { name: "وادي السير", type: "CITY", parent: "عمّان", aliases: ["Wadi Seer"] },
  { name: "صويلح", type: "CITY", parent: "عمّان", aliases: ["Sweileh"] },
  { name: "أبو نصير", type: "CITY", parent: "عمّان", aliases: ["Abu Nsair"] },
  { name: "الجبيهة", type: "CITY", parent: "عمّان", aliases: ["Jubayhah"] },
  { name: "ماركا", type: "CITY", parent: "عمّان", aliases: ["Marka"] },
  { name: "الزهور", type: "CITY", parent: "عمّان", aliases: ["Zahour"] },
  { name: "ناعور", type: "CITY", parent: "عمّان", aliases: ["Naur"] },
  { name: "الرصيفة", type: "CITY", parent: "عمّان", aliases: ["Russeifa"] },

  // Irbid cities
  { name: "إربد المدينة", type: "CITY", parent: "إربد", aliases: ["Irbid City"] },
  { name: "الرمثا", type: "CITY", parent: "إربد", aliases: ["Ramtha"] },
  { name: "المفرق المدينة", type: "CITY", parent: "المفرق", aliases: ["Mafraq City"] },
  { name: "الحصن", type: "CITY", parent: "إربد", aliases: ["Husn"] },
  { name: "كفر يوبا", type: "CITY", parent: "إربد", aliases: ["Kafr Yuba"] },
  { name: "بيت راس", type: "CITY", parent: "إربد", aliases: ["Beit Ras"] },

  // Zarqa cities
  { name: "الزرقاء المدينة", type: "CITY", parent: "الزرقاء", aliases: ["Zarqa City"] },
  { name: "الهاشمية", type: "CITY", parent: "الزرقاء", aliases: ["Hashimiyya"] },
  { name: "الأزرق", type: "CITY", parent: "الزرقاء", aliases: ["Azraq"] },

  // Balqa cities
  { name: "السلط", type: "CITY", parent: "البلقاء", aliases: ["Salt"] },
  { name: "ماحص", type: "CITY", parent: "البلقاء", aliases: ["Mahis"] },
  { name: "عيون الباشا", type: "CITY", parent: "البلقاء", aliases: ["Uyun al-Basha"] },

  // Karak cities
  { name: "الكرك المدينة", type: "CITY", parent: "الكرك", aliases: ["Karak City"] },
  { name: "الغور", type: "CITY", parent: "الكرك", aliases: ["Ghawr"] },
  { name: "القطرانة", type: "CITY", parent: "الكرك", aliases: ["Qatranna"] },

  // Jerash cities
  { name: "جرش المدينة", type: "CITY", parent: "جرش", aliases: ["Jerash City"] },
  { name: "برما", type: "CITY", parent: "جرش", aliases: ["Burma"] },

  // Ajloun cities
  { name: "عجلون المدينة", type: "CITY", parent: "عجلون", aliases: ["Ajloun City"] },
  { name: "عنجرة", type: "CITY", parent: "عجلون", aliases: ["Anjara"] },

  // Aqaba cities
  { name: "العقبة المدينة", type: "CITY", parent: "العقبة", aliases: ["Aqaba City"] },
  { name: "وادي رم", type: "CITY", parent: "العقبة", aliases: ["Wadi Rum"] },

  // Maan cities
  { name: "معان المدينة", type: "CITY", parent: "معان", aliases: ["Maan City"] },
  { name: "البتراء", type: "CITY", parent: "معان", aliases: ["Petra"] },
  { name: "الشوبك", type: "CITY", parent: "معان", aliases: ["Shobak"] },

  // Madaba cities
  { name: "مادبا المدينة", type: "CITY", parent: "مادبا", aliases: ["Madaba City"] },
  { name: "ذيبان", type: "CITY", parent: "مادبا", aliases: ["Dhiban"] },

  // Tafilah cities
  { name: "الطفيلة المدينة", type: "CITY", parent: "الطفيلة", aliases: ["Tafilah City"] },
  { name: "بصيرا", type: "CITY", parent: "الطفيلة", aliases: ["Busayra"] },

  // ============================================================
  // سوريا (Syria)
  // ============================================================
  { name: "سوريا", type: "COUNTRY", aliases: ["Syria", "الجمهورية العربية السورية"], sortOrder: 3 },

  // Governorates
  { name: "دمشق", type: "REGION", parent: "سوريا", aliases: ["Damascus", "محافظة دمشق"] },
  { name: "ريف دمشق", type: "REGION", parent: "سوريا", aliases: ["Rural Damascus", "محافظة ريف دمشق"] },
  { name: "حلب", type: "REGION", parent: "سوريا", aliases: ["Aleppo", "محافظة حلب"] },
  { name: "حمص", type: "REGION", parent: "سوريا", aliases: ["Homs", "محافظة حمص"] },
  { name: "حماة", type: "REGION", parent: "سوريا", aliases: ["Hama", "محافظة حماة"] },
  { name: "اللاذقية", type: "REGION", parent: "سوريا", aliases: ["Latakia", "محافظة اللاذقية"] },
  { name: "دير الزور", type: "REGION", parent: "سوريا", aliases: ["Deir ez-Zor", "محافظة دير الزور"] },
  { name: "إدلب", type: "REGION", parent: "سوريا", aliases: ["Idlib", "محافظة إدلب"] },
  { name: "الرقة", type: "REGION", parent: "سوريا", aliases: ["Raqqa", "محافظة الرقة"] },
  { name: "الحسكة", type: "REGION", parent: "سوريا", aliases: ["Hasakah", "محافظة الحسكة"] },
  { name: "السويداء", type: "REGION", parent: "سوريا", aliases: ["Sweida", "محافظة السويداء"] },
  { name: "طرطوس", type: "REGION", parent: "سوريا", aliases: ["Tartus", "محافظة طرطوس"] },
  { name: "درعا", type: "REGION", parent: "سوريا", aliases: ["Daraa", "محافظة درعا"] },
  { name: "القنيطرة", type: "REGION", parent: "سوريا", aliases: ["Quneitra", "محافظة القنيطرة"] },

  // Damascus cities
  { name: "دمشق المدينة", type: "CITY", parent: "دمشق", aliases: ["Damascus City"] },
  { name: "المزة", type: "CITY", parent: "دمشق", aliases: ["Mazza"] },
  { name: "كفرسوسة", type: "CITY", parent: "دمشق", aliases: ["Kafr Sousa"] },
  { name: "المالكي", type: "CITY", parent: "دمشق", aliases: ["Malki"] },
  { name: "أبو رمانة", type: "CITY", parent: "دمشق", aliases: ["Abu Rummaneh"] },
  { name: "جرمانا", type: "CITY", parent: "ريف دمشق", aliases: ["Jaramana"] },
  { name: "القابون", type: "CITY", parent: "دمشق", aliases: ["Qabon"] },

  // Rural Damascus cities
  { name: "دوما", type: "CITY", parent: "ريف دمشق", aliases: ["Douma"] },
  { name: "يبرود", type: "CITY", parent: "ريف دمشق", aliases: ["Yabroud"] },
  { name: "القطيفة", type: "CITY", parent: "ريف دمشق", aliases: ["Qatifa"] },
  { name: "الزبداني", type: "CITY", parent: "ريف دمشق", aliases: ["Zabadani"] },
  { name: "التل", type: "CITY", parent: "ريف دمشق", aliases: ["Tell"] },
  { name: "داريا", type: "CITY", parent: "ريف دمشق", aliases: ["Darayya"] },
  { name: "عربين", type: "CITY", parent: "ريف دمشق", aliases: ["Arbin"] },
  { name: "سقبا", type: "CITY", parent: "ريف دمشق", aliases: ["Saqba"] },
  { name: "قدسيا", type: "CITY", parent: "ريف دمشق", aliases: ["Qudsaya"] },

  // Aleppo cities
  { name: "حلب المدينة", type: "CITY", parent: "حلب", aliases: ["Aleppo City"] },
  { name: "منبج", type: "CITY", parent: "حلب", aliases: ["Manbij"] },
  { name: "الباب", type: "CITY", parent: "حلب", aliases: ["Al-Bab"] },
  { name: "عفرين", type: "CITY", parent: "حلب", aliases: ["Afrin"] },
  { name: "أعزاز", type: "CITY", parent: "حلب", aliases: ["Azaz"] },
  { name: "جرابلس", type: "CITY", parent: "حلب", aliases: ["Jarabulus"] },
  { name: "السفيرة", type: "CITY", parent: "حلب", aliases: ["Safira"] },
  { name: "خان العسل", type: "CITY", parent: "حلب", aliases: ["Khan al-Asal"] },

  // Homs cities
  { name: "حمص المدينة", type: "CITY", parent: "حمص", aliases: ["Homs City"] },
  { name: "تدمر", type: "CITY", parent: "حمص", aliases: ["Palmyra", "Tadmur"] },
  { name: "الرستن", type: "CITY", parent: "حمص", aliases: ["Rastan"] },
  { name: "تلبيسة", type: "CITY", parent: "حمص", aliases: ["Talbisa"] },
  { name: "القصير", type: "CITY", parent: "حمص", aliases: ["Qusayr"] },

  // Hama cities
  { name: "حماة المدينة", type: "CITY", parent: "حماة", aliases: ["Hama City"] },
  { name: "مصياف", type: "CITY", parent: "حماة", aliases: ["Masyaf"] },
  { name: "سلمية", type: "CITY", parent: "حماة", aliases: ["Salamiyah"] },
  { name: "السقيلبية", type: "CITY", parent: "حماة", aliases: ["Sqaylabiyah"] },
  { name: "محردة", type: "CITY", parent: "حماة", aliases: ["Maharda"] },

  // Latakia cities
  { name: "اللاذقية المدينة", type: "CITY", parent: "اللاذقية", aliases: ["Latakia City"] },
  { name: "جبلة", type: "CITY", parent: "اللاذقية", aliases: ["Jableh"] },
  { name: "القرداحة", type: "CITY", parent: "اللاذقية", aliases: ["Qardaha"] },
  { name: "الحفة", type: "CITY", parent: "اللاذقية", aliases: ["Haffa"] },

  // Deir ez-Zor cities
  { name: "دير الزور المدينة", type: "CITY", parent: "دير الزور", aliases: ["Deir ez-Zor City"] },
  { name: "الميادين", type: "CITY", parent: "دير الزور", aliases: ["Mayadin"] },
  { name: "البوكمال", type: "CITY", parent: "دير الزور", aliases: ["Bukamal"] },

  // Idlib cities
  { name: "إدلب المدينة", type: "CITY", parent: "إدلب", aliases: ["Idlib City"] },
  { name: "معرة النعمان", type: "CITY", parent: "إدلب", aliases: ["Maarat al-Numan"] },
  { name: "جسر الشغور", type: "CITY", parent: "إدلب", aliases: ["Jisr al-Shughur"] },
  { name: "سراقب", type: "CITY", parent: "إدلب", aliases: ["Saraqib"] },
  { name: "كفرنبل", type: "CITY", parent: "إدلب", aliases: ["Kafranbel"] },

  // Raqqa cities
  { name: "الرقة المدينة", type: "CITY", parent: "الرقة", aliases: ["Raqqa City"] },
  { name: "الطبقة", type: "CITY", parent: "الرقة", aliases: ["Tabqa"] },
  { name: "تل أبيض", type: "CITY", parent: "الرقة", aliases: ["Tell Abyad"] },

  // Hasakah cities
  { name: "الحسكة المدينة", type: "CITY", parent: "الحسكة", aliases: ["Hasakah City"] },
  { name: "القامشلي", type: "CITY", parent: "الحسكة", aliases: ["Qamishli"] },
  { name: "رأس العين", type: "CITY", parent: "الحسكة", aliases: ["Ras al-Ayn", "Serêkaniyê"] },
  { name: "المالكية", type: "CITY", parent: "الحسكة", aliases: ["Malikiyah"] },

  // Sweida cities
  { name: "السويداء المدينة", type: "CITY", parent: "السويداء", aliases: ["Sweida City"] },
  { name: "شهبا", type: "CITY", parent: "السويداء", aliases: ["Shahba"] },
  { name: "صلخد", type: "CITY", parent: "السويداء", aliases: ["Salkhad"] },

  // Tartus cities
  { name: "طرطوس المدينة", type: "CITY", parent: "طرطوس", aliases: ["Tartus City"] },
  { name: "بانياس", type: "CITY", parent: "طرطوس", aliases: ["Baniyas"] },
  { name: "صافيتا", type: "CITY", parent: "طرطوس", aliases: ["Safita"] },
  { name: "دريكيش", type: "CITY", parent: "طرطوس", aliases: ["Dreikish"] },

  // Daraa cities
  { name: "درعا المدينة", type: "CITY", parent: "درعا", aliases: ["Daraa City"] },
  { name: "إزرع", type: "CITY", parent: "درعا", aliases: ["Izraa"] },
  { name: "الصنمين", type: "CITY", parent: "درعا", aliases: ["Sanamin"] },
  { name: "نوى", type: "CITY", parent: "درعا", aliases: ["Nawa"] },

  // Quneitra cities
  { name: "القنيطرة المدينة", type: "CITY", parent: "القنيطرة", aliases: ["Quneitra City"] },
  { name: "فيق", type: "CITY", parent: "القنيطرة", aliases: ["Fiq"] },

  // ============================================================
  // العراق (Iraq)
  // ============================================================
  { name: "العراق", type: "COUNTRY", aliases: ["Iraq", "جمهورية العراق"], sortOrder: 4 },

  // Governorates
  { name: "بغداد", type: "REGION", parent: "العراق", aliases: ["Baghdad", "محافظة بغداد"] },
  { name: "البصرة", type: "REGION", parent: "العراق", aliases: ["Basra", "محافظة البصرة"] },
  { name: "نينوى", type: "REGION", parent: "العراق", aliases: ["Nineveh", "Mosul", "محافظة نينوى"] },
  { name: "الأنبار", type: "REGION", parent: "العراق", aliases: ["Anbar", "محافظة الأنبار"] },
  { name: "كربلاء", type: "REGION", parent: "العراق", aliases: ["Karbala", "محافظة كربلاء"] },
  { name: "النجف", type: "REGION", parent: "العراق", aliases: ["Najaf", "محافظة النجف"] },
  { name: "ذي قار", type: "REGION", parent: "العراق", aliases: ["Dhi Qar", "Nasiriyah", "محافظة ذي قار"] },
  { name: "ديالى", type: "REGION", parent: "العراق", aliases: ["Diyala", "محافظة ديالى"] },
  { name: "كركوك", type: "REGION", parent: "العراق", aliases: ["Kirkuk", "محافظة كركوك"] },
  { name: "القادسية", type: "REGION", parent: "العراق", aliases: ["Qadisiyyah", "Diwaniyah", "محافظة القادسية"] },
  { name: "واسط", type: "REGION", parent: "العراق", aliases: ["Wasit", "Kut", "محافظة واسط"] },
  { name: "ميسان", type: "REGION", parent: "العراق", aliases: ["Maysan", "Amara", "محافظة ميسان"] },
  { name: "بابل", type: "REGION", parent: "العراق", aliases: ["Babylon", "Hilla", "محافظة بابل"] },
  { name: "صلاح الدين", type: "REGION", parent: "العراق", aliases: ["Salah ad-Din", "Tikrit", "محافظة صلاح الدين"] },
  { name: "المثنى", type: "REGION", parent: "العراق", aliases: ["Muthanna", "Samawa", "محافظة المثنى"] },
  { name: "أربيل", type: "REGION", parent: "العراق", aliases: ["Erbil", "Hawler", "محافظة أربيل"] },
  { name: "السليمانية", type: "REGION", parent: "العراق", aliases: ["Sulaymaniyah", "محافظة السليمانية"] },
  { name: "دهوك", type: "REGION", parent: "العراق", aliases: ["Duhok", "محافظة دهوك"] },
  { name: "حلبجة", type: "REGION", parent: "العراق", aliases: ["Halabja", "محافظة حلبجة"] },

  // Baghdad cities/districts
  { name: "بغداد المدينة", type: "CITY", parent: "بغداد", aliases: ["Baghdad City"] },
  { name: "الكاظمية", type: "CITY", parent: "بغداد", aliases: ["Kadhimiya"] },
  { name: "الكرخ", type: "CITY", parent: "بغداد", aliases: ["Karkh"] },
  { name: "الرصافة", type: "CITY", parent: "بغداد", aliases: ["Rusafa"] },
  { name: "المنصور", type: "CITY", parent: "بغداد", aliases: ["Mansour"] },
  { name: "الأعظمية", type: "CITY", parent: "بغداد", aliases: ["Adhamiyah"] },
  { name: "الكرادة", type: "CITY", parent: "بغداد", aliases: ["Karada"] },
  { name: "الزعفرانية", type: "CITY", parent: "بغداد", aliases: ["Zafaraniya"] },
  { name: "النهروان", type: "CITY", parent: "بغداد", aliases: ["Nahrawan"] },
  { name: "بغداد الجديدة", type: "CITY", parent: "بغداد", aliases: ["New Baghdad"] },
  { name: "المدائن", type: "CITY", parent: "بغداد", aliases: ["Madain"] },
  { name: "الصدر", type: "CITY", parent: "بغداد", aliases: ["Sadr City"] },

  // Basra cities
  { name: "البصرة المدينة", type: "CITY", parent: "البصرة", aliases: ["Basra City"] },
  { name: "الزبير", type: "CITY", parent: "البصرة", aliases: ["Zubair"] },
  { name: "أبو الخصيب", type: "CITY", parent: "البصرة", aliases: ["Abu al-Khasib"] },
  { name: "الفاو", type: "CITY", parent: "البصرة", aliases: ["Faw"] },
  { name: "شط العرب", type: "CITY", parent: "البصرة", aliases: ["Shatt al-Arab"] },
  { name: "المعقل", type: "CITY", parent: "البصرة", aliases: ["Muaqal"] },

  // Nineveh cities
  { name: "الموصل", type: "CITY", parent: "نينوى", aliases: ["Mosul"] },
  { name: "تلعفر", type: "CITY", parent: "نينوى", aliases: ["Tal Afar"] },
  { name: "سنجار", type: "CITY", parent: "نينوى", aliases: ["Sinjar"] },
  { name: "الحمدانية", type: "CITY", parent: "نينوى", aliases: ["Hamdaniya", "Bakhdida"] },
  { name: "ربيعة", type: "CITY", parent: "نينوى", aliases: ["Rabia"] },

  // Anbar cities
  { name: "الرمادي", type: "CITY", parent: "الأنبار", aliases: ["Ramadi"] },
  { name: "الفلوجة", type: "CITY", parent: "الأنبار", aliases: ["Fallujah"] },
  { name: "هيت", type: "CITY", parent: "الأنبار", aliases: ["Hit"] },
  { name: "حديثة", type: "CITY", parent: "الأنبار", aliases: ["Haditha"] },
  { name: "القائم", type: "CITY", parent: "الأنبار", aliases: ["Al-Qaim"] },

  // Karbala cities
  { name: "كربلاء المدينة", type: "CITY", parent: "كربلاء", aliases: ["Karbala City"] },
  { name: "الهندية", type: "CITY", parent: "كربلاء", aliases: ["Hindiya"] },

  // Najaf cities
  { name: "النجف المدينة", type: "CITY", parent: "النجف", aliases: ["Najaf City"] },
  { name: "الكوفة", type: "CITY", parent: "النجف", aliases: ["Kufa"] },

  // Dhi Qar cities
  { name: "الناصرية", type: "CITY", parent: "ذي قار", aliases: ["Nasiriyah"] },
  { name: "سوق الشيوخ", type: "CITY", parent: "ذي قار", aliases: ["Suq al-Shuykh"] },

  // Diyala cities
  { name: "بعقوبة", type: "CITY", parent: "ديالى", aliases: ["Baquba"] },
  { name: "المقدادية", type: "CITY", parent: "ديالى", aliases: ["Muqdadiyah"] },
  { name: "خانقين", type: "CITY", parent: "ديالى", aliases: ["Khanaqin"] },

  // Kirkuk cities
  { name: "كركوك المدينة", type: "CITY", parent: "كركوك", aliases: ["Kirkuk City"] },
  { name: "الحويجة", type: "CITY", parent: "كركوك", aliases: ["Hawija"] },

  // Qadisiyyah cities
  { name: "الديوانية", type: "CITY", parent: "القادسية", aliases: ["Diwaniyah"] },
  { name: "الشامية", type: "CITY", parent: "القادسية", aliases: ["Shamiya"] },

  // Wasit cities
  { name: "الكوت", type: "CITY", parent: "واسط", aliases: ["Kut"] },
  { name: "العزيزية", type: "CITY", parent: "واسط", aliases: ["Aziziyah"] },

  // Maysan cities
  { name: "العمارة", type: "CITY", parent: "ميسان", aliases: ["Amara"] },
  { name: "علي الغربي", type: "CITY", parent: "ميسان", aliases: ["Ali al-Gharbi"] },

  // Babylon cities
  { name: "الحلة", type: "CITY", parent: "بابل", aliases: ["Hilla"] },
  { name: "المسيب", type: "CITY", parent: "بابل", aliases: ["Musayyib"] },

  // Salah ad-Din cities
  { name: "تكريت", type: "CITY", parent: "صلاح الدين", aliases: ["Tikrit"] },
  { name: "سامراء", type: "CITY", parent: "صلاح الدين", aliases: ["Samarra"] },
  { name: "بيجي", type: "CITY", parent: "صلاح الدين", aliases: ["Baiji"] },

  // Muthanna cities
  { name: "السماوة", type: "CITY", parent: "المثنى", aliases: ["Samawa"] },

  // Erbil cities
  { name: "أربيل المدينة", type: "CITY", parent: "أربيل", aliases: ["Erbil City", "Hawler"] },
  { name: "شقلاوة", type: "CITY", parent: "أربيل", aliases: ["Shaqlawa"] },
  { name: "رانية", type: "CITY", parent: "أربيل", aliases: ["Rania"] },

  // Sulaymaniyah cities
  { name: "السليمانية المدينة", type: "CITY", parent: "السليمانية", aliases: ["Sulaymaniyah City"] },
  { name: "حلبجة المدينة", type: "CITY", parent: "حلبجة", aliases: ["Halabja City"] },

  // Duhok cities
  { name: "دهوك المدينة", type: "CITY", parent: "دهوك", aliases: ["Duhok City"] },
  { name: "زاخو", type: "CITY", parent: "دهوك", aliases: ["Zakho"] },
  { name: "عقرة", type: "CITY", parent: "دهوك", aliases: ["Aqrah"] },

  // ============================================================
  // لبنان (Lebanon)
  // ============================================================
  { name: "لبنان", type: "COUNTRY", aliases: ["Lebanon", "الجمهورية اللبنانية"], sortOrder: 5 },

  // Governorates
  { name: "بيروت", type: "REGION", parent: "لبنان", aliases: ["Beirut", "محافظة بيروت"] },
  { name: "جبل لبنان", type: "REGION", parent: "لبنان", aliases: ["Mount Lebanon", "محافظة جبل لبنان"] },
  { name: "الشمال", type: "REGION", parent: "لبنان", aliases: ["North Lebanon", "محافظة الشمال"] },
  { name: "الجنوب", type: "REGION", parent: "لبنان", aliases: ["South Lebanon", "محافظة الجنوب"] },
  { name: "النبطية", type: "REGION", parent: "لبنان", aliases: ["Nabatieh", "محافظة النبطية"] },
  { name: "البقاع", type: "REGION", parent: "لبنان", aliases: ["Beqaa", "محافظة البقاع"] },
  { name: "عكار", type: "REGION", parent: "لبنان", aliases: ["Akkar", "محافظة عكار"] },
  { name: "بعلبك الهرمل", type: "REGION", parent: "لبنان", aliases: ["Baalbek-Hermel", "محافظة بعلبك الهرمل"] },

  // Beirut districts
  { name: "بيروت المدينة", type: "CITY", parent: "بيروت", aliases: ["Beirut City"] },
  { name: "الحمرا", type: "CITY", parent: "بيروت", aliases: ["Hamra"] },
  { name: "الأشرفية", type: "CITY", parent: "بيروت", aliases: ["Ashrafieh"] },
  { name: "الرميل", type: "CITY", parent: "بيروت", aliases: ["Rmeil"] },
  { name: "المرفأ", type: "CITY", parent: "بيروت", aliases: ["Port district"] },
  { name: "الرأس", type: "CITY", parent: "بيروت", aliases: ["Ras Beirut"] },
  { name: "الصيفي", type: "CITY", parent: "بيروت", aliases: ["Saifi"] },
  { name: "الزيتونة", type: "CITY", parent: "بيروت", aliases: ["Zaytouna"] },

  // Mount Lebanon cities and villages
  { name: "جونية", type: "CITY", parent: "جبل لبنان", aliases: ["Jounieh"] },
  { name: "بيت مري", type: "CITY", parent: "جبل لبنان", aliases: ["Beit Mery"] },
  { name: "بروماني", type: "CITY", parent: "جبل لبنان", aliases: ["Broummana"] },
  { name: "بكفيا", type: "CITY", parent: "جبل لبنان", aliases: ["Bikfaya"] },
  { name: "زحلة", type: "CITY", parent: "البقاع", aliases: ["Zahle"] },
  { name: "ضبية", type: "CITY", parent: "جبل لبنان", aliases: ["Dbayeh"] },
  { name: "أنطلياس", type: "CITY", parent: "جبل لبنان", aliases: ["Antelias"] },
  { name: "الجديدة", type: "CITY", parent: "جبل لبنان", aliases: ["Jdeideh"] },
  { name: "بورج حمود", type: "CITY", parent: "جبل لبنان", aliases: ["Bourj Hammoud"] },
  { name: "الدكوانة", type: "CITY", parent: "جبل لبنان", aliases: ["Dekwaneh"] },
  { name: "سن الفيل", type: "CITY", parent: "جبل لبنان", aliases: ["Sin el Fil"] },
  { name: "حازمية", type: "CITY", parent: "جبل لبنان", aliases: ["Hazmiyeh"] },
  { name: "باتيه", type: "CITY", parent: "جبل لبنان", aliases: ["Baabda", "بعبدا"] },
  { name: "حارة صخر", type: "CITY", parent: "جبل لبنان", aliases: ["Haret Sakher"] },
  { name: "المعاملتين", type: "CITY", parent: "جبل لبنان", aliases: ["Maameltein"] },
  { name: "غزير", type: "CITY", parent: "جبل لبنان", aliases: ["Ghazir"] },
  { name: "ركيز", type: "CITY", parent: "جبل لبنان", aliases: ["Rkiz"] },
  { name: "جبيل", type: "CITY", parent: "جبل لبنان", aliases: ["Byblos", "بيبلوس"] },
  { name: "عاليه", type: "CITY", parent: "جبل لبنان", aliases: ["Aley"] },
  { name: "الشويفات", type: "CITY", parent: "جبل لبنان", aliases: ["Choueifat"] },
  { name: "خلدة", type: "CITY", parent: "جبل لبنان", aliases: ["Khalde"] },
  { name: "برجا", type: "CITY", parent: "جبل لبنان", aliases: ["Burja"] },
  { name: "كفرشيما", type: "CITY", parent: "جبل لبنان", aliases: ["Kfar Shima"] },
  { name: "بعبدا", type: "CITY", parent: "جبل لبنان", aliases: ["Baabda"] },
  { name: "حمانا", type: "CITY", parent: "جبل لبنان", aliases: ["Hammana"] },
  { name: "الصرفند", type: "CITY", parent: "جبل لبنان", aliases: ["Sarfand"] },
  { name: "دير القمر", type: "CITY", parent: "جبل لبنان", aliases: ["Deir el Qamar"] },
  { name: "بيت الدين", type: "CITY", parent: "جبل لبنان", aliases: ["Beiteddine"] },
  { name: "الدامور", type: "CITY", parent: "جبل لبنان", aliases: ["Damour"] },

  // North Lebanon cities and villages
  { name: "طرابلس", type: "CITY", parent: "الشمال", aliases: ["Tripoli"] },
  { name: "زغرتا", type: "CITY", parent: "الشمال", aliases: ["Zgharta"] },
  { name: "البترون", type: "CITY", parent: "الشمال", aliases: ["Batroun"] },
  { name: "الكورة", type: "CITY", parent: "الشمال", aliases: ["Koura"] },
  { name: "بشري", type: "CITY", parent: "الشمال", aliases: ["Bcharre"] },
  { name: "المنية الضنية", type: "CITY", parent: "الشمال", aliases: ["Miniyeh-Danniyeh"] },
  { name: "حلبا", type: "CITY", parent: "عكار", aliases: ["Halba"] },
  { name: "عنجر", type: "CITY", parent: "البقاع", aliases: ["Anjar"] },
  { name: "إهدن", type: "CITY", parent: "الشمال", aliases: ["Ehden"] },
  { name: "بشرّي المدينة", type: "CITY", parent: "الشمال", aliases: ["Bcharre City"] },
  { name: "الميناء", type: "CITY", parent: "الشمال", aliases: ["El Mina"] },
  { name: "القلمون", type: "CITY", parent: "الشمال", aliases: ["Qalamoun"] },
  { name: "برقا", type: "CITY", parent: "الشمال", aliases: ["Barqa"] },
  { name: "أميون", type: "CITY", parent: "الشمال", aliases: ["Amioun"] },
  { name: "شكا", type: "CITY", parent: "الشمال", aliases: ["Chekka"] },

  // South Lebanon cities and villages
  { name: "صيدا", type: "CITY", parent: "الجنوب", aliases: ["Sidon"] },
  { name: "صور", type: "CITY", parent: "الجنوب", aliases: ["Tyre", "Sour"] },
  { name: "جزين", type: "CITY", parent: "الجنوب", aliases: ["Jezzine"] },
  { name: "مرجعيون", type: "CITY", parent: "الجنوب", aliases: ["Marjeyoun"] },
  { name: "بنت جبيل", type: "CITY", parent: "الجنوب", aliases: ["Bint Jbeil"] },
  { name: "الخيام", type: "CITY", parent: "الجنوب", aliases: ["Khiam"] },
  { name: "قانا", type: "CITY", parent: "الجنوب", aliases: ["Qana"] },
  { name: "عيتا الشعب", type: "CITY", parent: "الجنوب", aliases: ["Ayta ash-Shaab"] },
  { name: "طيردبا", type: "CITY", parent: "الجنوب", aliases: ["Tyre region"] },
  { name: "عين إبل", type: "CITY", parent: "الجنوب", aliases: ["Ain Ebel"] },
  { name: "رميش", type: "CITY", parent: "الجنوب", aliases: ["Rmeish"] },
  { name: "عيترون", type: "CITY", parent: "الجنوب", aliases: ["Aytaroun"] },

  // Nabatieh cities and villages
  { name: "النبطية المدينة", type: "CITY", parent: "النبطية", aliases: ["Nabatieh City"] },
  { name: "حاصبيا", type: "CITY", parent: "النبطية", aliases: ["Hasbaya"] },
  { name: "شقيف", type: "CITY", parent: "النبطية", aliases: ["Beaufort", "Shqif"] },
  { name: "يحمر الشقيف", type: "CITY", parent: "النبطية", aliases: ["Yahmar al-Shaqif"] },
  { name: "كفررمان", type: "CITY", parent: "النبطية", aliases: ["Kfar Roman"] },
  { name: "طيرفيلسيه", type: "CITY", parent: "النبطية" },
  { name: "دير ميماس", type: "CITY", parent: "النبطية", aliases: ["Deir Mimas"] },

  // Beqaa cities and villages
  { name: "زحلة المدينة", type: "CITY", parent: "البقاع", aliases: ["Zahle City"] },
  { name: "بعلبك", type: "CITY", parent: "بعلبك الهرمل", aliases: ["Baalbek"] },
  { name: "الهرمل", type: "CITY", parent: "بعلبك الهرمل", aliases: ["Hermel"] },
  { name: "يونين", type: "CITY", parent: "البقاع", aliases: ["Younin"] },
  { name: "قب إلياس", type: "CITY", parent: "البقاع", aliases: ["Qab Elias"] },
  { name: "البر إلياس", type: "CITY", parent: "البقاع", aliases: ["Bar Elias"] },
  { name: "مجدل عنجر", type: "CITY", parent: "البقاع", aliases: ["Majdal Anjar"] },
  { name: "شتورة", type: "CITY", parent: "البقاع", aliases: ["Chtaura"] },
  { name: "يحمر", type: "CITY", parent: "البقاع", aliases: ["Yahmar"] },
  { name: "السعدنايل", type: "CITY", parent: "البقاع", aliases: ["Saadnayel"] },
  { name: "تعلبايا", type: "CITY", parent: "البقاع", aliases: ["Taalabaya"] },

  // Akkar cities
  { name: "عكار العتيقة", type: "CITY", parent: "عكار", aliases: ["Akkar el Atika"] },
  { name: "القبيات", type: "CITY", parent: "عكار", aliases: ["Qoubaiyat"] },
  { name: "القاع", type: "CITY", parent: "بعلبك الهرمل", aliases: ["Qaa"] },

  // ============================================================
  // اليمن (Yemen)
  // ============================================================
  { name: "اليمن", type: "COUNTRY", aliases: ["Yemen", "الجمهورية اليمنية"], sortOrder: 6 },

  // Governorates
  { name: "صنعاء", type: "REGION", parent: "اليمن", aliases: ["Sanaa", "محافظة صنعاء"] },
  { name: "عدن", type: "REGION", parent: "اليمن", aliases: ["Aden", "محافظة عدن"] },
  { name: "تعز", type: "REGION", parent: "اليمن", aliases: ["Taiz", "محافظة تعز"] },
  { name: "الحديدة", type: "REGION", parent: "اليمن", aliases: ["Hudaydah", "Hodeidah", "محافظة الحديدة"] },
  { name: "إب", type: "REGION", parent: "اليمن", aliases: ["Ibb", "محافظة إب"] },
  { name: "ذمار", type: "REGION", parent: "اليمن", aliases: ["Dhamar", "محافظة ذمار"] },
  { name: "حضرموت", type: "REGION", parent: "اليمن", aliases: ["Hadramawt", "Hadramout", "محافظة حضرموت"] },
  { name: "حجة", type: "REGION", parent: "اليمن", aliases: ["Hajjah", "محافظة حجة"] },
  { name: "شبوة", type: "REGION", parent: "اليمن", aliases: ["Shabwah", "محافظة شبوة"] },
  { name: "مأرب", type: "REGION", parent: "اليمن", aliases: ["Marib", "محافظة مأرب"] },
  { name: "البيضاء", type: "REGION", parent: "اليمن", aliases: ["Al-Bayda", "محافظة البيضاء"] },
  { name: "الجوف", type: "REGION", parent: "اليمن", aliases: ["Al-Jawf", "محافظة الجوف"] },
  { name: "الضالع", type: "REGION", parent: "اليمن", aliases: ["Ad Dali", "Dhale", "محافظة الضالع"] },
  { name: "أبين", type: "REGION", parent: "اليمن", aliases: ["Abyan", "محافظة أبين"] },
  { name: "لحج", type: "REGION", parent: "اليمن", aliases: ["Lahij", "محافظة لحج"] },
  { name: "المهرة", type: "REGION", parent: "اليمن", aliases: ["Al-Mahra", "محافظة المهرة"] },
  { name: "صعدة", type: "REGION", parent: "اليمن", aliases: ["Saada", "محافظة صعدة"] },
  { name: "المحويت", type: "REGION", parent: "اليمن", aliases: ["Mahwit", "محافظة المحويت"] },
  { name: "عمران", type: "REGION", parent: "اليمن", aliases: ["Amran", "محافظة عمران"] },
  { name: "ريمة", type: "REGION", parent: "اليمن", aliases: ["Raymah", "محافظة ريمة"] },
  { name: "سقطرى", type: "REGION", parent: "اليمن", aliases: ["Socotra", "محافظة سقطرى"] },
  { name: "أمانة العاصمة", type: "REGION", parent: "اليمن", aliases: ["Amanat al-Asimah", "Capital Secretariat"] },

  // Sanaa cities
  { name: "صنعاء المدينة", type: "CITY", parent: "صنعاء", aliases: ["Sanaa City"] },
  { name: "خولان", type: "CITY", parent: "صنعاء", aliases: ["Khawlan"] },
  { name: "سنحان", type: "CITY", parent: "صنعاء", aliases: ["Sanhan"] },
  { name: "همدان", type: "CITY", parent: "صنعاء", aliases: ["Hamdan"] },
  { name: "بني حشيش", type: "CITY", parent: "صنعاء", aliases: ["Bani Hashish"] },

  // Amana cities
  { name: "مدينة صنعاء القديمة", type: "CITY", parent: "أمانة العاصمة", aliases: ["Old Sanaa"] },
  { name: "شعوب", type: "CITY", parent: "أمانة العاصمة", aliases: ["Shuub"] },
  { name: "السبعين", type: "CITY", parent: "أمانة العاصمة", aliases: ["Sabain"] },
  { name: "الثورة", type: "CITY", parent: "أمانة العاصمة", aliases: ["Thawra"] },
  { name: "المعين", type: "CITY", parent: "أمانة العاصمة", aliases: ["Maain"] },

  // Aden cities
  { name: "عدن المدينة", type: "CITY", parent: "عدن", aliases: ["Aden City"] },
  { name: "كريتر", type: "CITY", parent: "عدن", aliases: ["Crater"] },
  { name: "الشيخ عثمان", type: "CITY", parent: "عدن", aliases: ["Sheikh Othman"] },
  { name: "المعلا", type: "CITY", parent: "عدن", aliases: ["Maalla"] },
  { name: "التواهي", type: "CITY", parent: "عدن", aliases: ["Tawahi"] },
  { name: "البريقة", type: "CITY", parent: "عدن", aliases: ["Bureiqah"] },
  { name: "دار سعد", type: "CITY", parent: "عدن", aliases: ["Dar Saad"] },

  // Taiz cities
  { name: "تعز المدينة", type: "CITY", parent: "تعز", aliases: ["Taiz City"] },
  { name: "المخا", type: "CITY", parent: "تعز", aliases: ["Mocha", "Mukha"] },
  { name: "الحوبان", type: "CITY", parent: "تعز", aliases: ["Hawban"] },
  { name: "الطرية", type: "CITY", parent: "تعز", aliases: ["Turba"] },

  // Hudaydah cities
  { name: "الحديدة المدينة", type: "CITY", parent: "الحديدة", aliases: ["Hudaydah City", "Hodeidah"] },
  { name: "الزيدية", type: "CITY", parent: "الحديدة", aliases: ["Zaidiya"] },
  { name: "باجل", type: "CITY", parent: "الحديدة", aliases: ["Bajil"] },
  { name: "بيت الفقيه", type: "CITY", parent: "الحديدة", aliases: ["Bayt al-Faqih"] },
  { name: "زبيد", type: "CITY", parent: "الحديدة", aliases: ["Zabid"] },

  // Ibb cities
  { name: "إب المدينة", type: "CITY", parent: "إب", aliases: ["Ibb City"] },
  { name: "يريم", type: "CITY", parent: "إب", aliases: ["Yarim"] },
  { name: "جبلة", type: "CITY", parent: "إب", aliases: ["Jiblah"] },
  { name: "السياني", type: "CITY", parent: "إب", aliases: ["Sayani"] },

  // Dhamar cities
  { name: "ذمار المدينة", type: "CITY", parent: "ذمار", aliases: ["Dhamar City"] },
  { name: "يفرس", type: "CITY", parent: "ذمار", aliases: ["Yafrush"] },

  // Hadramawt cities
  { name: "المكلا", type: "CITY", parent: "حضرموت", aliases: ["Mukalla"] },
  { name: "سيئون", type: "CITY", parent: "حضرموت", aliases: ["Seiyun"] },
  { name: "شبام", type: "CITY", parent: "حضرموت", aliases: ["Shibam"] },
  { name: "الغيضة", type: "CITY", parent: "المهرة", aliases: ["Ghaydah"] },
  { name: "تريم", type: "CITY", parent: "حضرموت", aliases: ["Tarim"] },

  // Hajjah cities
  { name: "حجة المدينة", type: "CITY", parent: "حجة", aliases: ["Hajjah City"] },
  { name: "ميدي", type: "CITY", parent: "حجة", aliases: ["Midi"] },
  { name: "عبس", type: "CITY", parent: "حجة", aliases: ["Abs"] },

  // Shabwah cities
  { name: "عتق", type: "CITY", parent: "شبوة", aliases: ["Ataq"] },
  { name: "حبان", type: "CITY", parent: "شبوة", aliases: ["Habban"] },

  // Marib cities
  { name: "مأرب المدينة", type: "CITY", parent: "مأرب", aliases: ["Marib City"] },

  // Abyan cities
  { name: "زنجبار", type: "CITY", parent: "أبين", aliases: ["Zinjibar"] },
  { name: "جعار", type: "CITY", parent: "أبين", aliases: ["Jaar"] },

  // Lahij cities
  { name: "الحوطة", type: "CITY", parent: "لحج", aliases: ["Hawta"] },
  { name: "الحبيلين", type: "CITY", parent: "لحج", aliases: ["Hablayn"] },

  // Saada cities
  { name: "صعدة المدينة", type: "CITY", parent: "صعدة", aliases: ["Saada City"] },
  { name: "رازح", type: "CITY", parent: "صعدة", aliases: ["Razih"] },

  // Amran cities
  { name: "عمران المدينة", type: "CITY", parent: "عمران", aliases: ["Amran City"] },
  { name: "حوث", type: "CITY", parent: "عمران", aliases: ["Huth"] },

  // ============================================================
  // الكويت (Kuwait)
  // ============================================================
  { name: "الكويت", type: "COUNTRY", aliases: ["Kuwait", "دولة الكويت"], sortOrder: 7 },

  // Governorates
  { name: "العاصمة", type: "REGION", parent: "الكويت", aliases: ["Capital Governorate", "Kuwait City Governorate"] },
  { name: "حولي", type: "REGION", parent: "الكويت", aliases: ["Hawalli", "محافظة حولي"] },
  { name: "الفروانية", type: "REGION", parent: "الكويت", aliases: ["Farwaniya", "محافظة الفروانية"] },
  { name: "الجهراء", type: "REGION", parent: "الكويت", aliases: ["Jahra", "محافظة الجهراء"] },
  { name: "مبارك الكبير", type: "REGION", parent: "الكويت", aliases: ["Mubarak Al-Kabeer", "محافظة مبارك الكبير"] },
  { name: "الأحمدي", type: "REGION", parent: "الكويت", aliases: ["Ahmadi", "محافظة الأحمدي"] },

  // Capital cities/areas
  { name: "مدينة الكويت", type: "CITY", parent: "العاصمة", aliases: ["Kuwait City"] },
  { name: "الشرق", type: "CITY", parent: "العاصمة", aliases: ["Sharq"] },
  { name: "الدسمة", type: "CITY", parent: "العاصمة", aliases: ["Dasma"] },
  { name: "الديسة", type: "CITY", parent: "العاصمة", aliases: ["Daiya"] },
  { name: "القبلة", type: "CITY", parent: "العاصمة", aliases: ["Qibla"] },
  { name: "كيفان", type: "CITY", parent: "العاصمة", aliases: ["Kaifan"] },
  { name: "المرقاب", type: "CITY", parent: "العاصمة", aliases: ["Mirqab"] },
  { name: "النزهة", type: "CITY", parent: "العاصمة", aliases: ["Nuzha"] },
  { name: "الروضة", type: "CITY", parent: "العاصمة", aliases: ["Rawda"] },
  { name: "الفيحاء", type: "CITY", parent: "العاصمة", aliases: ["Faiha"] },
  { name: "الدوحة", type: "CITY", parent: "العاصمة", aliases: ["Doha - Kuwait"] },

  // Hawalli cities/areas
  { name: "حولي المدينة", type: "CITY", parent: "حولي", aliases: ["Hawalli City"] },
  { name: "السالمية", type: "CITY", parent: "حولي", aliases: ["Salmiya"] },
  { name: "الرميثية", type: "CITY", parent: "حولي", aliases: ["Rumaithiya"] },
  { name: "بيان", type: "CITY", parent: "حولي", aliases: ["Bayan"] },
  { name: "مشرف", type: "CITY", parent: "حولي", aliases: ["Mishref"] },
  { name: "الجابرية", type: "CITY", parent: "حولي", aliases: ["Jabriya"] },
  { name: "الزهراء", type: "CITY", parent: "حولي", aliases: ["Zahra"] },
  { name: "الرقعي", type: "CITY", parent: "حولي", aliases: ["Ruqai"] },
  { name: "سلوى", type: "CITY", parent: "حولي", aliases: ["Salwa"] },
  { name: "النقرة", type: "CITY", parent: "حولي", aliases: ["Naqra"] },
  { name: "الشعب", type: "CITY", parent: "حولي", aliases: ["Shaab"] },

  // Farwaniya cities/areas
  { name: "الفروانية المدينة", type: "CITY", parent: "الفروانية", aliases: ["Farwaniya City"] },
  { name: "خيطان", type: "CITY", parent: "الفروانية", aliases: ["Khaitan"] },
  { name: "العارضية", type: "CITY", parent: "الفروانية", aliases: ["Ardhiya"] },
  { name: "الرابية", type: "CITY", parent: "الفروانية", aliases: ["Rab'iya - Kuwait"] },
  { name: "الأندلس", type: "CITY", parent: "الفروانية", aliases: ["Andalus"] },
  { name: "الإسكان", type: "CITY", parent: "الفروانية", aliases: ["Iskan"] },
  { name: "العمرية", type: "CITY", parent: "الفروانية", aliases: ["Omariya"] },
  { name: "الفردوس", type: "CITY", parent: "الفروانية", aliases: ["Firdous"] },
  { name: "جليب الشيوخ", type: "CITY", parent: "الفروانية", aliases: ["Jleeb al-Shuyoukh"] },
  { name: "الرقة", type: "CITY", parent: "الفروانية", aliases: ["Rega - Kuwait"] },

  // Jahra cities/areas
  { name: "الجهراء المدينة", type: "CITY", parent: "الجهراء", aliases: ["Jahra City"] },
  { name: "الصليبية", type: "CITY", parent: "الجهراء", aliases: ["Sulaibiya"] },
  { name: "الوهاب", type: "CITY", parent: "الجهراء", aliases: ["Wahab"] },
  { name: "العيون", type: "CITY", parent: "الجهراء", aliases: ["Uyoun"] },
  { name: "السالم", type: "CITY", parent: "الجهراء", aliases: ["Salem - Kuwait"] },
  { name: "الواحة", type: "CITY", parent: "الجهراء", aliases: ["Waha"] },
  { name: "النسيم", type: "CITY", parent: "الجهراء", aliases: ["Naseem"] },

  // Mubarak Al-Kabeer cities/areas
  { name: "مبارك الكبير المدينة", type: "CITY", parent: "مبارك الكبير", aliases: ["Mubarak Al-Kabeer City"] },
  { name: "صباح السالم", type: "CITY", parent: "مبارك الكبير", aliases: ["Sabah al-Salem"] },
  { name: "القصور", type: "CITY", parent: "مبارك الكبير", aliases: ["Qusor"] },
  { name: "الفنيطيس", type: "CITY", parent: "مبارك الكبير", aliases: ["Fnaitees"] },
  { name: "أبو الحصانية", type: "CITY", parent: "مبارك الكبير", aliases: ["Abu Hasaniya"] },
  { name: "المسيلة", type: "CITY", parent: "مبارك الكبير", aliases: ["Mesila"] },
  { name: "العدان", type: "CITY", parent: "مبارك الكبير", aliases: ["Adan"] },

  // Ahmadi cities/areas
  { name: "الأحمدي المدينة", type: "CITY", parent: "الأحمدي", aliases: ["Ahmadi City"] },
  { name: "الفحيحيل", type: "CITY", parent: "الأحمدي", aliases: ["Fahaheel"] },
  { name: "الزور", type: "CITY", parent: "الأحمدي", aliases: ["Zour"] },
  { name: "الوفرة", type: "CITY", parent: "الأحمدي", aliases: ["Wafra"] },
  { name: "المنقف", type: "CITY", parent: "الأحمدي", aliases: ["Mangaf"] },
  { name: "أبو حليفة", type: "CITY", parent: "الأحمدي", aliases: ["Abu Halifa"] },
  { name: "الرقة الأحمدي", type: "CITY", parent: "الأحمدي", aliases: ["Riqqa"] },
  { name: "الصباحية", type: "CITY", parent: "الأحمدي", aliases: ["Sabahiya"] },
  { name: "الظهر", type: "CITY", parent: "الأحمدي", aliases: ["Daher"] },
  { name: "ميناء عبدالله", type: "CITY", parent: "الأحمدي", aliases: ["Mina Abdullah"] },
];
