// Comprehensive PlaceEntry seed data for Palestine and Saudi Arabia
// Used in Arab family tree genealogy application

export const placesData: {
  name: string;
  type: "COUNTRY" | "REGION" | "CITY";
  parent?: string;
  aliases?: string[];
  sortOrder?: number;
}[] = [
  // ============================================================
  // فلسطين — COUNTRY
  // ============================================================
  {
    name: "فلسطين",
    type: "COUNTRY",
    aliases: ["Palestine", "Filastin", "فلسطين التاريخية"],
  },

  // ============================================================
  // الأقضية الفلسطينية — REGIONS (16 historical qadhas)
  // ============================================================
  { name: "قضاء عكا", type: "REGION", parent: "فلسطين", aliases: ["Acre District", "liwaa akka"] },
  { name: "قضاء حيفا", type: "REGION", parent: "فلسطين", aliases: ["Haifa District"] },
  { name: "قضاء طبرية", type: "REGION", parent: "فلسطين", aliases: ["Tiberias District"] },
  { name: "قضاء صفد", type: "REGION", parent: "فلسطين", aliases: ["Safad District", "Safed District"] },
  { name: "قضاء جنين", type: "REGION", parent: "فلسطين", aliases: ["Jenin District"] },
  { name: "قضاء نابلس", type: "REGION", parent: "فلسطين", aliases: ["Nablus District"] },
  { name: "قضاء طولكرم", type: "REGION", parent: "فلسطين", aliases: ["Tulkarm District"] },
  { name: "قضاء القدس", type: "REGION", parent: "فلسطين", aliases: ["Jerusalem District", "al-Quds District"] },
  { name: "قضاء يافا", type: "REGION", parent: "فلسطين", aliases: ["Jaffa District", "Yafo District"] },
  { name: "قضاء الرملة", type: "REGION", parent: "فلسطين", aliases: ["Ramle District", "Ramla District"] },
  { name: "قضاء غزة", type: "REGION", parent: "فلسطين", aliases: ["Gaza District"] },
  { name: "قضاء بئر السبع", type: "REGION", parent: "فلسطين", aliases: ["Beersheba District", "Beer al-Saba District"] },
  { name: "قضاء الخليل", type: "REGION", parent: "فلسطين", aliases: ["Hebron District"] },
  { name: "قضاء بيت لحم", type: "REGION", parent: "فلسطين", aliases: ["Bethlehem District"] },
  { name: "قضاء الناصرة", type: "REGION", parent: "فلسطين", aliases: ["Nazareth District"] },
  { name: "قضاء بيسان", type: "REGION", parent: "فلسطين", aliases: ["Beisan District", "Beit She'an District"] },

  // ============================================================
  // قضاء يافا — CITIES
  // ============================================================
  { name: "يافا", type: "CITY", parent: "قضاء يافا", aliases: ["Jaffa", "Yafo", "Tel Aviv-Yafo"] },
  { name: "العباسية", type: "CITY", parent: "قضاء يافا", aliases: ["al-Abbasiyya", "Yehud"] },
  { name: "بيت دجن", type: "CITY", parent: "قضاء يافا", aliases: ["Beit Dajan", "Bet Dagan"] },
  { name: "الخيرية", type: "CITY", parent: "قضاء يافا", aliases: ["al-Kheiriyya", "al-Khayriyya"] },
  { name: "الجلمة", type: "CITY", parent: "قضاء يافا", aliases: ["al-Jalama", "Jalama (Jaffa)"] },
  { name: "سلمة", type: "CITY", parent: "قضاء يافا", aliases: ["Salama", "Salameh"] },
  { name: "ساقية", type: "CITY", parent: "قضاء يافا", aliases: ["Saqiya", "Saqqiya"] },
  { name: "الطيرة", type: "CITY", parent: "قضاء يافا", aliases: ["al-Tira (Jaffa)", "al-Tayra"] },
  { name: "قاقون", type: "CITY", parent: "قضاء يافا", aliases: ["Qaqun", "Qaqoun"] },
  { name: "الرنتيسية", type: "CITY", parent: "قضاء يافا", aliases: ["al-Rantisiyya", "Rantis"] },
  { name: "الكيرة", type: "CITY", parent: "قضاء يافا", aliases: ["al-Kayra", "al-Kira"] },
  { name: "أبو كشك", type: "CITY", parent: "قضاء يافا", aliases: ["Abu Kishk", "Abu Kishek"] },
  { name: "الشيخ مونس", type: "CITY", parent: "قضاء يافا", aliases: ["Sheikh Munis", "Tell Aviv University area"] },
  { name: "كفر عانة", type: "CITY", parent: "قضاء يافا", aliases: ["Kafr 'Ana", "Kfar Ana"] },
  { name: "البرج", type: "CITY", parent: "قضاء يافا", aliases: ["al-Burj (Jaffa)"] },
  { name: "يازور", type: "CITY", parent: "قضاء يافا", aliases: ["Yazur", "Azur"] },
  { name: "عياليا", type: "CITY", parent: "قضاء يافا", aliases: ["Iyaliya", "Ayaliya"] },
  { name: "صرفند العمار", type: "CITY", parent: "قضاء يافا", aliases: ["Sarfand al-Ammar", "Sarfand al-'Ammar"] },
  { name: "صرفند الخراب", type: "CITY", parent: "قضاء يافا", aliases: ["Sarfand al-Kharab"] },
  { name: "الجبل", type: "CITY", parent: "قضاء يافا", aliases: ["al-Jabal (Jaffa)"] },
  { name: "النبي روبين", type: "CITY", parent: "قضاء يافا", aliases: ["al-Nabi Rubin", "Nabi Rubin"] },
  { name: "العزون", type: "CITY", parent: "قضاء يافا", aliases: ["al-'Azun (Jaffa)", "Azzun (Jaffa)"] },
  { name: "بشيت", type: "CITY", parent: "قضاء يافا", aliases: ["Bashit"] },
  { name: "الدميرة", type: "CITY", parent: "قضاء يافا", aliases: ["al-Dumayra", "Dmeire"] },
  { name: "بيت عجا", type: "CITY", parent: "قضاء يافا", aliases: ["Beit 'Aja"] },
  { name: "مسعودية", type: "CITY", parent: "قضاء يافا", aliases: ["Mas'udiyya"] },
  { name: "جفنة (يافا)", type: "CITY", parent: "قضاء يافا", aliases: ["Jifna (Jaffa)"] },
  { name: "كفر ليام", type: "CITY", parent: "قضاء يافا", aliases: ["Kafr Liyyam"] },
  { name: "بياضة", type: "CITY", parent: "قضاء يافا", aliases: ["Bayadiyya", "Biyada"] },
  { name: "وادي حنين", type: "CITY", parent: "قضاء يافا", aliases: ["Wadi Hunin", "Nes Ziona area"] },
  { name: "القبيبة (يافا)", type: "CITY", parent: "قضاء يافا", aliases: ["al-Qubeiba (Jaffa)"] },
  { name: "ظهير المشارق", type: "CITY", parent: "قضاء يافا", aliases: ["Dhahir al-Mashariq"] },

  // ============================================================
  // قضاء حيفا — CITIES
  // ============================================================
  { name: "حيفا", type: "CITY", parent: "قضاء حيفا", aliases: ["Haifa", "Khefa"] },
  { name: "عين حوض", type: "CITY", parent: "قضاء حيفا", aliases: ["Ein Hod", "'Ayn Hawd"] },
  { name: "المنشية (حيفا)", type: "CITY", parent: "قضاء حيفا", aliases: ["al-Manshiyya (Haifa)"] },
  { name: "تل الصمام", type: "CITY", parent: "قضاء حيفا", aliases: ["Tell al-Saman", "Tel Samam"] },
  { name: "أم الزينات", type: "CITY", parent: "قضاء حيفا", aliases: ["Umm al-Zinat", "Umm Zinnat"] },
  { name: "الدالية", type: "CITY", parent: "قضاء حيفا", aliases: ["Daliyat al-Rawha", "Daliyya"] },
  { name: "بلد الشيخ", type: "CITY", parent: "قضاء حيفا", aliases: ["Balad al-Sheikh", "Nesher area"] },
  { name: "صرفند (حيفا)", type: "CITY", parent: "قضاء حيفا", aliases: ["Sarfand (Haifa)", "Sarafand al-Kharab (Haifa)"] },
  { name: "الطنطورة", type: "CITY", parent: "قضاء حيفا", aliases: ["al-Tantura", "Tantura", "Dor"] },
  { name: "الكبارة", type: "CITY", parent: "قضاء حيفا", aliases: ["al-Kabara", "Kabbara"] },
  { name: "صبارين", type: "CITY", parent: "قضاء حيفا", aliases: ["Sabbarin", "Sabarin"] },
  { name: "البرج (حيفا)", type: "CITY", parent: "قضاء حيفا", aliases: ["al-Burj (Haifa)"] },
  { name: "عين غزال", type: "CITY", parent: "قضاء حيفا", aliases: ["'Ayn Ghazal", "Ein Ghazal"] },
  { name: "إجزم", type: "CITY", parent: "قضاء حيفا", aliases: ["Ijzim", "Igzim"] },
  { name: "جبع (حيفا)", type: "CITY", parent: "قضاء حيفا", aliases: ["Jab'a (Haifa)", "Jeba (Haifa)"] },
  { name: "كفر لام", type: "CITY", parent: "قضاء حيفا", aliases: ["Kafr Lam", "Kfar Lam"] },
  { name: "شفا عمرو", type: "CITY", parent: "قضاء حيفا", aliases: ["Shefa-'Amr", "Shfaram"] },
  { name: "الشيخ بريك", type: "CITY", parent: "قضاء حيفا", aliases: ["Sheikh Burayk", "al-Sheikh Barayk"] },
  { name: "قيساريا", type: "CITY", parent: "قضاء حيفا", aliases: ["Qisarya", "Caesarea", "Kisarya"] },
  { name: "الهارثية", type: "CITY", parent: "قضاء حيفا", aliases: ["al-Harithiyya"] },
  { name: "الغبية التحتا", type: "CITY", parent: "قضاء حيفا", aliases: ["al-Ghubayya al-Tahta"] },
  { name: "الغبية الفوقا", type: "CITY", parent: "قضاء حيفا", aliases: ["al-Ghubayya al-Fawqa"] },
  { name: "خبيزة", type: "CITY", parent: "قضاء حيفا", aliases: ["Khubeiza", "Khubbeiza"] },
  { name: "كفر مصر", type: "CITY", parent: "قضاء حيفا", aliases: ["Kafr Misr"] },
  { name: "دالية الكرمل", type: "CITY", parent: "قضاء حيفا", aliases: ["Daliyat al-Karmel", "Daliyat el-Karmel"] },
  { name: "عسفيا", type: "CITY", parent: "قضاء حيفا", aliases: ["'Isfiya", "Isfiya", "Usifiyya"] },
  { name: "أم الشوف", type: "CITY", parent: "قضاء حيفا", aliases: ["Umm al-Shawf"] },
  { name: "كفر سميع", type: "CITY", parent: "قضاء حيفا", aliases: ["Kafr Sami'", "Kafr Sumi"] },
  { name: "جدو", type: "CITY", parent: "قضاء حيفا", aliases: ["Jiddu"] },

  // ============================================================
  // قضاء عكا — CITIES
  // ============================================================
  { name: "عكا", type: "CITY", parent: "قضاء عكا", aliases: ["Acre", "Akka", "Akko"] },
  { name: "الكابري", type: "CITY", parent: "قضاء عكا", aliases: ["al-Kabri", "Kabri"] },
  { name: "الكويكات", type: "CITY", parent: "قضاء عكا", aliases: ["al-Kuwaykat", "Kuweikat"] },
  { name: "الشيخ دنون", type: "CITY", parent: "قضاء عكا", aliases: ["Sheikh Dannun", "al-Sheikh Danun"] },
  { name: "المجدل (عكا)", type: "CITY", parent: "قضاء عكا", aliases: ["al-Majdal (Acre)", "Majdal Krum"] },
  { name: "معلول", type: "CITY", parent: "قضاء عكا", aliases: ["Ma'lul", "Malul"] },
  { name: "الجش", type: "CITY", parent: "قضاء عكا", aliases: ["al-Jish", "Gush Halav", "Jish"] },
  { name: "ترشيحا", type: "CITY", parent: "قضاء عكا", aliases: ["Tarshiha", "Mi'ilya area", "Tarchiha"] },
  { name: "المكر", type: "CITY", parent: "قضاء عكا", aliases: ["al-Makr", "Maker"] },
  { name: "سحماتا", type: "CITY", parent: "قضاء عكا", aliases: ["Sahmata", "Suhmata"] },
  { name: "أبو سنان", type: "CITY", parent: "قضاء عكا", aliases: ["Abu Sinan", "Abu Snan"] },
  { name: "البروة", type: "CITY", parent: "قضاء عكا", aliases: ["al-Birwa", "al-Barwa"] },
  { name: "دير القاسي", type: "CITY", parent: "قضاء عكا", aliases: ["Dayr al-Qasi", "Deir al-Qassi"] },
  { name: "الرامة", type: "CITY", parent: "قضاء عكا", aliases: ["al-Rama", "Rama (Galilee)"] },
  { name: "دير الأسد", type: "CITY", parent: "قضاء عكا", aliases: ["Dayr al-Asad", "Deir al-Assad"] },
  { name: "البعنة", type: "CITY", parent: "قضاء عكا", aliases: ["al-Ba'na", "Bi'na"] },
  { name: "عرابة (عكا)", type: "CITY", parent: "قضاء عكا", aliases: ["'Arraba (Acre)", "Arrabe"] },
  { name: "كفر ياسيف", type: "CITY", parent: "قضاء عكا", aliases: ["Kafr Yasif", "Kfar Yasif"] },
  { name: "الزيب", type: "CITY", parent: "قضاء عكا", aliases: ["al-Zeeb", "al-Zib", "Achziv"] },
  { name: "الغابسية", type: "CITY", parent: "قضاء عكا", aliases: ["al-Ghabisiyya", "al-Ghabsiyye"] },
  { name: "عمقا", type: "CITY", parent: "قضاء عكا", aliases: ["'Amqa", "Amka"] },
  { name: "الدامون", type: "CITY", parent: "قضاء عكا", aliases: ["al-Damun", "Damoon"] },
  { name: "شعب", type: "CITY", parent: "قضاء عكا", aliases: ["Sha'ab", "Sha'b"] },
  { name: "ميعار", type: "CITY", parent: "قضاء عكا", aliases: ["Mi'ar", "Meiaar"] },
  { name: "كفر يحنا", type: "CITY", parent: "قضاء عكا", aliases: ["Kafr Yuhna", "Kafr Yuna"] },
  { name: "المنسي", type: "CITY", parent: "قضاء عكا", aliases: ["al-Mansi", "Menasi"] },
  { name: "المية مية", type: "CITY", parent: "قضاء عكا", aliases: ["Miyya Miyya", "Ein al-Mieh"] },
  { name: "اليحودية", type: "CITY", parent: "قضاء عكا", aliases: ["al-Yahudiyya (Acre)"] },
  { name: "الجديدة (عكا)", type: "CITY", parent: "قضاء عكا", aliases: ["al-Jadida (Acre)"] },
  { name: "صفورية", type: "CITY", parent: "قضاء عكا", aliases: ["Saffuriyya", "Sepphoris", "Zippori"] },
  { name: "نحف", type: "CITY", parent: "قضاء عكا", aliases: ["Nahf"] },
  { name: "دير حنا", type: "CITY", parent: "قضاء عكا", aliases: ["Dayr Hanna", "Deir Hanna"] },
  { name: "معوية", type: "CITY", parent: "قضاء عكا", aliases: ["Mu'awiya", "Maawiya (Acre)"] },

  // ============================================================
  // قضاء صفد — CITIES
  // ============================================================
  { name: "صفد", type: "CITY", parent: "قضاء صفد", aliases: ["Safad", "Safed", "Zefat", "Tzfat"] },
  { name: "الخالصة", type: "CITY", parent: "قضاء صفد", aliases: ["al-Khalisa", "Kiryat Shmona area"] },
  { name: "جاعونة", type: "CITY", parent: "قضاء صفد", aliases: ["Ja'una", "Ja'una al-Kadima"] },
  { name: "دلاتا", type: "CITY", parent: "قضاء صفد", aliases: ["Dalata", "Dalton area"] },
  { name: "الزنغرية", type: "CITY", parent: "قضاء صفد", aliases: ["al-Zangariyya", "Kfar Hanassi area"] },
  { name: "الزاوية (صفد)", type: "CITY", parent: "قضاء صفد", aliases: ["al-Zawiya (Safad)"] },
  { name: "قدس (صفد)", type: "CITY", parent: "قضاء صفد", aliases: ["Qadas (Safad)", "Kedesh"] },
  { name: "لوبية", type: "CITY", parent: "قضاء صفد", aliases: ["Lubya", "Lavi area"] },
  { name: "عيلبون", type: "CITY", parent: "قضاء صفد", aliases: ["'Eilabun", "Ilabun"] },
  { name: "عين الزيتون", type: "CITY", parent: "قضاء صفد", aliases: ["'Ayn al-Zaytun", "Ein Zeitun"] },
  { name: "الجاهدية", type: "CITY", parent: "قضاء صفد", aliases: ["al-Jahidiyya"] },
  { name: "الطيرة (صفد)", type: "CITY", parent: "قضاء صفد", aliases: ["al-Tira (Safad)"] },
  { name: "مزرعة كنعان", type: "CITY", parent: "قضاء صفد", aliases: ["Mazra'at Kana'an", "Mazra Kana'an"] },
  { name: "علما (صفد)", type: "CITY", parent: "قضاء صفد", aliases: ["'Alma (Safad)", "Alma el-Sha'b"] },
  { name: "ميرون", type: "CITY", parent: "قضاء صفد", aliases: ["Meiron", "Meron"] },
  { name: "حيطين", type: "CITY", parent: "قضاء صفد", aliases: ["Hittin", "Hattin"] },
  { name: "البيرة (صفد)", type: "CITY", parent: "قضاء صفد", aliases: ["al-Bira (Safad)"] },
  { name: "قيتية", type: "CITY", parent: "قضاء صفد", aliases: ["Qeytiyya", "Qaytiyya"] },
  { name: "زبد", type: "CITY", parent: "قضاء صفد", aliases: ["Zabud (Safad)"] },
  { name: "عمير", type: "CITY", parent: "قضاء صفد", aliases: ["'Umayr (Safad)"] },
  { name: "صفورية (صفد)", type: "CITY", parent: "قضاء صفد", aliases: ["Saffuriyya (Safad)"] },
  { name: "نبي يوشع", type: "CITY", parent: "قضاء صفد", aliases: ["Nabi Yusha", "Nabi Yusha'", "Metula area"] },
  { name: "هونين", type: "CITY", parent: "قضاء صفد", aliases: ["Hunin", "Honin", "Margaliot area"] },
  { name: "المالكية", type: "CITY", parent: "قضاء صفد", aliases: ["al-Malikiyya", "Malkiyya"] },
  { name: "تربيخا", type: "CITY", parent: "قضاء صفد", aliases: ["Tarbiha"] },
  { name: "بيت جن", type: "CITY", parent: "قضاء صفد", aliases: ["Bayt Jan", "Beit Jann"] },
  { name: "أبو سيناء", type: "CITY", parent: "قضاء صفد", aliases: ["Abu Sina (Safad)"] },
  { name: "عين سكرة", type: "CITY", parent: "قضاء صفد", aliases: ["'Ayn Sakra"] },
  { name: "الدوارة", type: "CITY", parent: "قضاء صفد", aliases: ["al-Dawwara (Safad)"] },
  { name: "كفرة", type: "CITY", parent: "قضاء صفد", aliases: ["Kafra (Safad)"] },

  // ============================================================
  // قضاء طبرية — CITIES
  // ============================================================
  { name: "طبرية", type: "CITY", parent: "قضاء طبرية", aliases: ["Tiberias", "Tabariyya", "Teveria"] },
  { name: "الطابغة", type: "CITY", parent: "قضاء طبرية", aliases: ["al-Tabgha", "Tabgha", "Ein Gev area"] },
  { name: "مجدل (طبرية)", type: "CITY", parent: "قضاء طبرية", aliases: ["Majdal (Tiberias)", "Migdal"] },
  { name: "غنوسار", type: "CITY", parent: "قضاء طبرية", aliases: ["Ghunayysar", "Ginosar", "Ginnosar"] },
  { name: "سمخ", type: "CITY", parent: "قضاء طبرية", aliases: ["Samakh", "Zemach"] },
  { name: "شرقية", type: "CITY", parent: "قضاء طبرية", aliases: ["Sharqiyya (Tiberias)", "al-Sharqiyya"] },
  { name: "المنارة", type: "CITY", parent: "قضاء طبرية", aliases: ["al-Manara (Tiberias)"] },
  { name: "مسكنة", type: "CITY", parent: "قضاء طبرية", aliases: ["Miskana", "Mishkenot area"] },
  { name: "الشجرة", type: "CITY", parent: "قضاء طبرية", aliases: ["al-Shajara (Tiberias)", "Ilaniyya"] },
  { name: "لوبية (طبرية)", type: "CITY", parent: "قضاء طبرية", aliases: ["Lubya (Tiberias)"] },
  { name: "حطين", type: "CITY", parent: "قضاء طبرية", aliases: ["Hattin", "Hittin (Tiberias)", "Kfar Hittin"] },
  { name: "كفر سبت", type: "CITY", parent: "قضاء طبرية", aliases: ["Kafr Sabt", "Kfar Sabet"] },
  { name: "عربة (طبرية)", type: "CITY", parent: "قضاء طبرية", aliases: ["'Arabba (Tiberias)"] },
  { name: "العبيدية (طبرية)", type: "CITY", parent: "قضاء طبرية", aliases: ["al-'Ubeidiyya (Tiberias)"] },
  { name: "المجاور", type: "CITY", parent: "قضاء طبرية", aliases: ["al-Mujawar (Tiberias)"] },
  { name: "وادي الحمام", type: "CITY", parent: "قضاء طبرية", aliases: ["Wadi al-Hamam", "Wadi Hamam"] },
  { name: "كفر قنا", type: "CITY", parent: "قضاء طبرية", aliases: ["Kafr Kanna", "Kfar Kana", "Cana of Galilee"] },
  { name: "مشهد (طبرية)", type: "CITY", parent: "قضاء طبرية", aliases: ["Mashhad (Tiberias)"] },
  { name: "رينة", type: "CITY", parent: "قضاء طبرية", aliases: ["Reineh", "Rina"] },

  // ============================================================
  // قضاء الناصرة — CITIES
  // ============================================================
  { name: "الناصرة", type: "CITY", parent: "قضاء الناصرة", aliases: ["Nazareth", "al-Nasira", "Natsrat"] },
  { name: "ميعار (الناصرة)", type: "CITY", parent: "قضاء الناصرة", aliases: ["Mi'ar (Nazareth)"] },
  { name: "البطوف", type: "CITY", parent: "قضاء الناصرة", aliases: ["al-Battuf", "Beit Netofa area"] },
  { name: "عين ماهل", type: "CITY", parent: "قضاء الناصرة", aliases: ["'Ein Mahel", "Ein Mahil"] },
  { name: "المشهد (الناصرة)", type: "CITY", parent: "قضاء الناصرة", aliases: ["al-Mashhad (Nazareth)", "Mashad"] },
  { name: "كفر مندا", type: "CITY", parent: "قضاء الناصرة", aliases: ["Kafr Manda", "Kfar Manda"] },
  { name: "دبورية", type: "CITY", parent: "قضاء الناصرة", aliases: ["Daburiyya", "Daburiyye"] },
  { name: "عيلوط", type: "CITY", parent: "قضاء الناصرة", aliases: ["'Illut", "Eilut"] },
  { name: "الرينة", type: "CITY", parent: "قضاء الناصرة", aliases: ["al-Raina", "Reineh (Nazareth)"] },
  { name: "يافة الناصرة", type: "CITY", parent: "قضاء الناصرة", aliases: ["Yafa al-Nasira", "Jaffa of Nazareth"] },
  { name: "ترعان", type: "CITY", parent: "قضاء الناصرة", aliases: ["Tur'an", "Turan"] },
  { name: "نحف (الناصرة)", type: "CITY", parent: "قضاء الناصرة", aliases: ["Nahf (Nazareth)"] },
  { name: "سخنين", type: "CITY", parent: "قضاء الناصرة", aliases: ["Sakhnin", "Suhnin"] },
  { name: "عرابة (الناصرة)", type: "CITY", parent: "قضاء الناصرة", aliases: ["'Arraba (Nazareth)", "Arraba"] },
  { name: "البعنة (الناصرة)", type: "CITY", parent: "قضاء الناصرة", aliases: ["al-Ba'na (Nazareth)"] },
  { name: "شعب (الناصرة)", type: "CITY", parent: "قضاء الناصرة", aliases: ["Sha'ab (Nazareth)"] },

  // ============================================================
  // قضاء بيسان — CITIES
  // ============================================================
  { name: "بيسان", type: "CITY", parent: "قضاء بيسان", aliases: ["Beisan", "Beit She'an", "Beit Shean"] },
  { name: "بيت شان", type: "CITY", parent: "قضاء بيسان", aliases: ["Beit Shan", "Beit Shean (old)"] },
  { name: "الغور", type: "CITY", parent: "قضاء بيسان", aliases: ["al-Ghawr", "Jordan Valley area"] },
  { name: "الزرارية", type: "CITY", parent: "قضاء بيسان", aliases: ["al-Zarariyya"] },
  { name: "العرقة", type: "CITY", parent: "قضاء بيسان", aliases: ["al-'Arqa (Beisan)", "'Arqa"] },
  { name: "خربة المناصف", type: "CITY", parent: "قضاء بيسان", aliases: ["Khirbat al-Manasif"] },
  { name: "الهيدة", type: "CITY", parent: "قضاء بيسان", aliases: ["al-Hayda"] },
  { name: "المنسي (بيسان)", type: "CITY", parent: "قضاء بيسان", aliases: ["al-Mansi (Beisan)"] },
  { name: "جسر المجامع", type: "CITY", parent: "قضاء بيسان", aliases: ["Jisr al-Majami'", "Gesher area"] },
  { name: "طيبة الزرزير", type: "CITY", parent: "قضاء بيسان", aliases: ["Tayba al-Zarzir"] },
  { name: "صندلة", type: "CITY", parent: "قضاء بيسان", aliases: ["Sandalah"] },
  { name: "كوكب الهوا", type: "CITY", parent: "قضاء بيسان", aliases: ["Kawkab al-Hawa", "Belvoir area"] },
  { name: "بيت ألفا", type: "CITY", parent: "قضاء بيسان", aliases: ["Beit Alfa", "Beth Alpha"] },
  { name: "جلبون", type: "CITY", parent: "قضاء بيسان", aliases: ["Jalbon", "Gilboa area"] },

  // ============================================================
  // قضاء جنين — CITIES
  // ============================================================
  { name: "جنين", type: "CITY", parent: "قضاء جنين", aliases: ["Jenin", "Janin"] },
  { name: "يعبد", type: "CITY", parent: "قضاء جنين", aliases: ["Ya'bad", "Yaabad"] },
  { name: "الزبابدة", type: "CITY", parent: "قضاء جنين", aliases: ["al-Zababda", "Zababda"] },
  { name: "طمرة (جنين)", type: "CITY", parent: "قضاء جنين", aliases: ["Tamra (Jenin)"] },
  { name: "المشهد (جنين)", type: "CITY", parent: "قضاء جنين", aliases: ["al-Mashhad (Jenin)", "Mashhad (Jenin)"] },
  { name: "الجلمة (جنين)", type: "CITY", parent: "قضاء جنين", aliases: ["al-Jalama (Jenin)", "Jalama"] },
  { name: "فرعون", type: "CITY", parent: "قضاء جنين", aliases: ["Far'un", "Far'on"] },
  { name: "قباطية", type: "CITY", parent: "قضاء جنين", aliases: ["Qabatya", "Qabatiya"] },
  { name: "المغير (جنين)", type: "CITY", parent: "قضاء جنين", aliases: ["al-Mughayir (Jenin)"] },
  { name: "ميشر", type: "CITY", parent: "قضاء جنين", aliases: ["Mishar", "Mushar"] },
  { name: "عرانة", type: "CITY", parent: "قضاء جنين", aliases: ["'Arana", "Arrana"] },
  { name: "صيدا (جنين)", type: "CITY", parent: "قضاء جنين", aliases: ["Sayda (Jenin)", "Sida"] },
  { name: "برطعة", type: "CITY", parent: "قضاء جنين", aliases: ["Bartaa", "Bartah"] },
  { name: "عرابة الباطن", type: "CITY", parent: "قضاء جنين", aliases: ["'Arraba al-Batin"] },
  { name: "سيلة الحارثية", type: "CITY", parent: "قضاء جنين", aliases: ["Sila al-Harithiyya"] },
  { name: "سيلة الظهر", type: "CITY", parent: "قضاء جنين", aliases: ["Sila al-Dhaher"] },
  { name: "مثلث الضفة", type: "CITY", parent: "قضاء جنين", aliases: ["Muthallath al-Diffa"] },
  { name: "طوباس", type: "CITY", parent: "قضاء جنين", aliases: ["Tubas"] },
  { name: "زرعين", type: "CITY", parent: "قضاء جنين", aliases: ["Zir'in", "Jezreel"] },
  { name: "الفولة", type: "CITY", parent: "قضاء جنين", aliases: ["al-Fula", "Afula area"] },
  { name: "نوريس", type: "CITY", parent: "قضاء جنين", aliases: ["Nuris"] },
  { name: "المزار (جنين)", type: "CITY", parent: "قضاء جنين", aliases: ["al-Mazar (Jenin)"] },
  { name: "إم الفحم", type: "CITY", parent: "قضاء جنين", aliases: ["Umm al-Fahm", "Um al-Fahm"] },
  { name: "معاوية (جنين)", type: "CITY", parent: "قضاء جنين", aliases: ["Mu'awiya (Jenin)"] },

  // ============================================================
  // قضاء نابلس — CITIES
  // ============================================================
  { name: "نابلس", type: "CITY", parent: "قضاء نابلس", aliases: ["Nablus", "Shechem", "Shekem"] },
  { name: "بيتا", type: "CITY", parent: "قضاء نابلس", aliases: ["Bayta", "Beita"] },
  { name: "دير شرف", type: "CITY", parent: "قضاء نابلس", aliases: ["Dayr Sharaf", "Deir Sharaf"] },
  { name: "حواره", type: "CITY", parent: "قضاء نابلس", aliases: ["Hawara", "Huwwara"] },
  { name: "رافات", type: "CITY", parent: "قضاء نابلس", aliases: ["Rafat", "Rafa (Nablus)"] },
  { name: "قريوت", type: "CITY", parent: "قضاء نابلس", aliases: ["Qaryut", "Qariut"] },
  { name: "ترمسعيا", type: "CITY", parent: "قضاء نابلس", aliases: ["Turmus'ayya", "Turmusayya"] },
  { name: "كفر قدوم", type: "CITY", parent: "قضاء نابلس", aliases: ["Kafr Qaddum", "Kfar Qadom"] },
  { name: "سبسطية", type: "CITY", parent: "قضاء نابلس", aliases: ["Sebastia", "Sabastia", "Samaria"] },
  { name: "عقربا", type: "CITY", parent: "قضاء نابلس", aliases: ["'Aqraba", "Aqraba"] },
  { name: "بيت فوريك", type: "CITY", parent: "قضاء نابلس", aliases: ["Beit Furik", "Beit Foureik"] },
  { name: "بيتلو", type: "CITY", parent: "قضاء نابلس", aliases: ["Baytillu", "Beitullo"] },
  { name: "بلاطة", type: "CITY", parent: "قضاء نابلس", aliases: ["Balata", "Balata al-Balad"] },
  { name: "رامين (نابلس)", type: "CITY", parent: "قضاء نابلس", aliases: ["Ramin (Nablus)"] },
  { name: "الزواتة", type: "CITY", parent: "قضاء نابلس", aliases: ["al-Zawata", "Zawatta"] },
  { name: "المجدلة (نابلس)", type: "CITY", parent: "قضاء نابلس", aliases: ["al-Majdala (Nablus)"] },
  { name: "رفيدية", type: "CITY", parent: "قضاء نابلس", aliases: ["Rafidya", "Rafidiyya"] },
  { name: "طلوزة", type: "CITY", parent: "قضاء نابلس", aliases: ["Talluza", "Talloza"] },
  { name: "بيت وزن", type: "CITY", parent: "قضاء نابلس", aliases: ["Beit Wazan", "Bayt Wazan"] },
  { name: "دير حاتم", type: "CITY", parent: "قضاء نابلس", aliases: ["Dayr Hatim", "Deir Hatim"] },
  { name: "صرة", type: "CITY", parent: "قضاء نابلس", aliases: ["Surra (Nablus)", "Surra"] },
  { name: "روجيب", type: "CITY", parent: "قضاء نابلس", aliases: ["Rujayb", "Rujeib"] },
  { name: "بيت امرين", type: "CITY", parent: "قضاء نابلس", aliases: ["Beit Imrin", "Beit 'Imrin"] },
  { name: "قصرة", type: "CITY", parent: "قضاء نابلس", aliases: ["Qusra"] },
  { name: "كفر حارس", type: "CITY", parent: "قضاء نابلس", aliases: ["Kafr Haris", "Kfar Haris"] },

  // ============================================================
  // قضاء طولكرم — CITIES
  // ============================================================
  { name: "طولكرم", type: "CITY", parent: "قضاء طولكرم", aliases: ["Tulkarm", "Tulkarem"] },
  { name: "قلقيلية", type: "CITY", parent: "قضاء طولكرم", aliases: ["Qalqilya", "Qalqiliyya", "Kalkilya"] },
  { name: "قفين", type: "CITY", parent: "قضاء طولكرم", aliases: ["Qaffin", "Qafin"] },
  { name: "بلعا", type: "CITY", parent: "قضاء طولكرم", aliases: ["Bal'a", "Bal'aa"] },
  { name: "خربثا", type: "CITY", parent: "قضاء طولكرم", aliases: ["Khirbet Kharbutha", "Khirbat Kharbutha"] },
  { name: "بني زيد", type: "CITY", parent: "قضاء طولكرم", aliases: ["Bani Zayd", "Beni Zeid"] },
  { name: "كفر ثلث", type: "CITY", parent: "قضاء طولكرم", aliases: ["Kafr Thulth", "Kfar Thilth"] },
  { name: "العتيل", type: "CITY", parent: "قضاء طولكرم", aliases: ["al-'Attil", "al-Ateil"] },
  { name: "شويكة", type: "CITY", parent: "قضاء طولكرم", aliases: ["Shuweika", "Shweika"] },
  { name: "باقة الغربية", type: "CITY", parent: "قضاء طولكرم", aliases: ["Baqa al-Gharbiyya", "Baqa el-Gharbiyye"] },
  { name: "الطيرة (طولكرم)", type: "CITY", parent: "قضاء طولكرم", aliases: ["al-Tira (Tulkarm)", "al-Tayra (Tulkarm)"] },
  { name: "ققون", type: "CITY", parent: "قضاء طولكرم", aliases: ["Qaqqun", "Qaqun (Tulkarm)"] },
  { name: "ميسر", type: "CITY", parent: "قضاء طولكرم", aliases: ["Maysar (Tulkarm)"] },
  { name: "إيلوط", type: "CITY", parent: "قضاء طولكرم", aliases: ["Ilut (Tulkarm)"] },
  { name: "خربة سركة", type: "CITY", parent: "قضاء طولكرم", aliases: ["Khirbat Sarka"] },
  { name: "الشيخ", type: "CITY", parent: "قضاء طولكرم", aliases: ["al-Sheikh (Tulkarm)"] },
  { name: "سفارين", type: "CITY", parent: "قضاء طولكرم", aliases: ["Safarin", "Saffareen"] },
  { name: "عنبتا", type: "CITY", parent: "قضاء طولكرم", aliases: ["'Anabta", "Anabta"] },
  { name: "دير الغصون", type: "CITY", parent: "قضاء طولكرم", aliases: ["Dayr al-Ghusun", "Deir al-Ghusun"] },
  { name: "كفر زيباد", type: "CITY", parent: "قضاء طولكرم", aliases: ["Kafr Zibad"] },

  // ============================================================
  // قضاء القدس — CITIES
  // ============================================================
  { name: "القدس", type: "CITY", parent: "قضاء القدس", aliases: ["Jerusalem", "al-Quds", "Yerushalayim"] },
  { name: "بيت صفافا", type: "CITY", parent: "قضاء القدس", aliases: ["Beit Safafa", "Bayt Safafa"] },
  { name: "بيت جالا", type: "CITY", parent: "قضاء القدس", aliases: ["Beit Jala", "Bayt Jala"] },
  { name: "شعفاط", type: "CITY", parent: "قضاء القدس", aliases: ["Shu'fat", "Sha'fat"] },
  { name: "قطنة", type: "CITY", parent: "قضاء القدس", aliases: ["Qatanna", "Qatna"] },
  { name: "بيت عنان", type: "CITY", parent: "قضاء القدس", aliases: ["Beit 'Anan", "Beit Anan"] },
  { name: "بيت نوبا", type: "CITY", parent: "قضاء القدس", aliases: ["Beit Nuba", "Bayt Nuba"] },
  { name: "دير ياسين", type: "CITY", parent: "قضاء القدس", aliases: ["Dayr Yasin", "Deir Yassin"] },
  { name: "ساريس", type: "CITY", parent: "قضاء القدس", aliases: ["Saris", "Sarees"] },
  { name: "الجورة (القدس)", type: "CITY", parent: "قضاء القدس", aliases: ["al-Jawra (Jerusalem)"] },
  { name: "لفتا", type: "CITY", parent: "قضاء القدس", aliases: ["Lifta", "Liftah"] },
  { name: "عين كارم", type: "CITY", parent: "قضاء القدس", aliases: ["'Ayn Karim", "Ein Karem"] },
  { name: "مالحة", type: "CITY", parent: "قضاء القدس", aliases: ["Maliha", "Malha"] },
  { name: "الشيخ جراح", type: "CITY", parent: "قضاء القدس", aliases: ["Sheikh Jarrah", "al-Sheikh Jarrah"] },
  { name: "بيت حنينا", type: "CITY", parent: "قضاء القدس", aliases: ["Beit Hanina", "Bayt Hanina"] },
  { name: "كالونيا", type: "CITY", parent: "قضاء القدس", aliases: ["Qalunya", "Colonia", "Motza area"] },
  { name: "دير أبو طور", type: "CITY", parent: "قضاء القدس", aliases: ["Dayr Abu Tur", "Abu Tor"] },
  { name: "أم طوبا", type: "CITY", parent: "قضاء القدس", aliases: ["Umm Tuba", "Om Tuba"] },
  { name: "السواحرة", type: "CITY", parent: "قضاء القدس", aliases: ["al-Sawahira", "Sawahreh"] },
  { name: "الطور (القدس)", type: "CITY", parent: "قضاء القدس", aliases: ["al-Tur (Jerusalem)", "Mount of Olives"] },
  { name: "سلوان", type: "CITY", parent: "قضاء القدس", aliases: ["Silwan", "Siloam"] },
  { name: "أبو ديس", type: "CITY", parent: "قضاء القدس", aliases: ["Abu Dis", "Abu Deis"] },
  { name: "بيت إكسا", type: "CITY", parent: "قضاء القدس", aliases: ["Beit Iksa", "Bayt Iksa"] },
  { name: "رام الله", type: "CITY", parent: "قضاء القدس", aliases: ["Ramallah", "Ram Allah"] },
  { name: "البيرة", type: "CITY", parent: "قضاء القدس", aliases: ["al-Bireh", "al-Bira", "Bireh"] },
  { name: "عناتا", type: "CITY", parent: "قضاء القدس", aliases: ["'Anata", "Anata", "Anatot"] },
  { name: "الرام", type: "CITY", parent: "قضاء القدس", aliases: ["al-Ram", "al-Ramm"] },
  { name: "بيت دقو", type: "CITY", parent: "قضاء القدس", aliases: ["Beit Duqqu", "Bayt Duqqu"] },
  { name: "بيدو", type: "CITY", parent: "قضاء القدس", aliases: ["Baytu", "Biddu"] },
  { name: "بيت سوريك", type: "CITY", parent: "قضاء القدس", aliases: ["Beit Sourik", "Bayt Surik"] },
  { name: "قطمون", type: "CITY", parent: "قضاء القدس", aliases: ["Qatamon", "Katamon"] },
  { name: "المصرارة", type: "CITY", parent: "قضاء القدس", aliases: ["al-Musrara", "Morasha area"] },
  { name: "الثوري", type: "CITY", parent: "قضاء القدس", aliases: ["al-Thuri", "Sur Baher area"] },
  { name: "صور باهر", type: "CITY", parent: "قضاء القدس", aliases: ["Sur Baher", "Zur Baher"] },
  { name: "الولجة", type: "CITY", parent: "قضاء القدس", aliases: ["al-Walaja", "Walaja (Jerusalem)"] },

  // ============================================================
  // قضاء الرملة — CITIES
  // ============================================================
  { name: "الرملة", type: "CITY", parent: "قضاء الرملة", aliases: ["Ramle", "Ramla"] },
  { name: "اللد", type: "CITY", parent: "قضاء الرملة", aliases: ["Lod", "Lydda", "Ludd"] },
  { name: "يبنه", type: "CITY", parent: "قضاء الرملة", aliases: ["Yibna", "Yavne", "Yabneh"] },
  { name: "زرنوقة", type: "CITY", parent: "قضاء الرملة", aliases: ["Zarruqa", "Zarnuqa"] },
  { name: "بيت نبالا", type: "CITY", parent: "قضاء الرملة", aliases: ["Beit Nabala", "Bayt Nuba la"] },
  { name: "الدارية", type: "CITY", parent: "قضاء الرملة", aliases: ["al-Dariyya", "al-Darriyya"] },
  { name: "القباب", type: "CITY", parent: "قضاء الرملة", aliases: ["al-Qubbab", "al-Qubbabe"] },
  { name: "الطيرة (الرملة)", type: "CITY", parent: "قضاء الرملة", aliases: ["al-Tira (Ramle)"] },
  { name: "دير طريف", type: "CITY", parent: "قضاء الرملة", aliases: ["Dayr Tarif", "Deir Tarif"] },
  { name: "أبو شوشة", type: "CITY", parent: "قضاء الرملة", aliases: ["Abu Shusha", "Abu Shosha"] },
  { name: "جمزو", type: "CITY", parent: "قضاء الرملة", aliases: ["Jimzu", "Gimzu"] },
  { name: "البرية", type: "CITY", parent: "قضاء الرملة", aliases: ["al-Barriyya (Ramle)", "al-Bariya"] },
  { name: "الكوفيخة", type: "CITY", parent: "قضاء الرملة", aliases: ["al-Kuwaykhah", "Kufeikha"] },
  { name: "بيت جيز", type: "CITY", parent: "قضاء الرملة", aliases: ["Beit Jiz", "Bayt Jiz"] },
  { name: "عمواس", type: "CITY", parent: "قضاء الرملة", aliases: ["'Amwas", "Emmaus", "Canada Park area"] },
  { name: "يالو", type: "CITY", parent: "قضاء الرملة", aliases: ["Yalu", "Ayalon area"] },
  { name: "إمواس", type: "CITY", parent: "قضاء الرملة", aliases: ["Imwas", "Emmaus Nicopolis"] },
  { name: "قلونيا", type: "CITY", parent: "قضاء الرملة", aliases: ["Qalunya (Ramle)", "Colonia (Ramle)"] },
  { name: "صرعة", type: "CITY", parent: "قضاء الرملة", aliases: ["Sar'a", "Saraa", "Zorah area"] },
  { name: "دير أيوب", type: "CITY", parent: "قضاء الرملة", aliases: ["Dayr Ayyub", "Deir Ayub"] },
  { name: "عقير (الرملة)", type: "CITY", parent: "قضاء الرملة", aliases: ["'Aqir", "Aqir (Ramle)"] },
  { name: "البرج (الرملة)", type: "CITY", parent: "قضاء الرملة", aliases: ["al-Burj (Ramle)"] },
  { name: "سجد", type: "CITY", parent: "قضاء الرملة", aliases: ["Sajad", "Sadjad"] },
  { name: "كفر أنا", type: "CITY", parent: "قضاء الرملة", aliases: ["Kafr 'Ana (Ramle)", "Kafrana"] },
  { name: "مزرعة (الرملة)", type: "CITY", parent: "قضاء الرملة", aliases: ["Mazra'a (Ramle)"] },

  // ============================================================
  // قضاء غزة — CITIES
  // ============================================================
  { name: "غزة", type: "CITY", parent: "قضاء غزة", aliases: ["Gaza", "Ghazza"] },
  { name: "خان يونس", type: "CITY", parent: "قضاء غزة", aliases: ["Khan Yunis", "Khan Younis"] },
  { name: "رفح", type: "CITY", parent: "قضاء غزة", aliases: ["Rafah", "Rafakh"] },
  { name: "دير البلح", type: "CITY", parent: "قضاء غزة", aliases: ["Dayr al-Balah", "Deir al-Balah"] },
  { name: "المجدل (غزة)", type: "CITY", parent: "قضاء غزة", aliases: ["al-Majdal (Gaza)", "Majdal Asqalan", "Ashkelon"] },
  { name: "فالوجة", type: "CITY", parent: "قضاء غزة", aliases: ["Falluja", "al-Faluja", "Kiryat Gat area"] },
  { name: "بيت جرجا", type: "CITY", parent: "قضاء غزة", aliases: ["Beit Jirja", "Bayt Jirja"] },
  { name: "هربيا", type: "CITY", parent: "قضاء غزة", aliases: ["Hirbiyya", "Herbiyya"] },
  { name: "حمامة", type: "CITY", parent: "قضاء غزة", aliases: ["Hamamah", "Hmama"] },
  { name: "الجية", type: "CITY", parent: "قضاء غزة", aliases: ["al-Jiyya", "al-Jiyeh"] },
  { name: "برير", type: "CITY", parent: "قضاء غزة", aliases: ["Burayr", "Breer"] },
  { name: "عراق المنشية", type: "CITY", parent: "قضاء غزة", aliases: ["Iraq al-Manshiyya", "'Iraq al-Manshiyya", "Kiryat Gat"] },
  { name: "كوكبا (غزة)", type: "CITY", parent: "قضاء غزة", aliases: ["Kawkaba (Gaza)", "Kawkaba"] },
  { name: "بيت عفا", type: "CITY", parent: "قضاء غزة", aliases: ["Beit 'Affa", "Bayt 'Affa"] },
  { name: "النعمان (غزة)", type: "CITY", parent: "قضاء غزة", aliases: ["al-Nu'man (Gaza)"] },
  { name: "بيت تيما", type: "CITY", parent: "قضاء غزة", aliases: ["Beit Tima", "Bayt Tima"] },
  { name: "كرتيا", type: "CITY", parent: "قضاء غزة", aliases: ["Kartiyya", "Qastina"] },
  { name: "بربرة", type: "CITY", parent: "قضاء غزة", aliases: ["Barbara", "Barbarah"] },
  { name: "نعلي", type: "CITY", parent: "قضاء غزة", aliases: ["Na'ali (Gaza)", "Naali"] },
  { name: "بيت داراس", type: "CITY", parent: "قضاء غزة", aliases: ["Beit Daras", "Bayt Daras"] },
  { name: "الجورة (غزة)", type: "CITY", parent: "قضاء غزة", aliases: ["al-Jawra (Gaza)"] },
  { name: "هوج", type: "CITY", parent: "قضاء غزة", aliases: ["Hawj", "Huj"] },
  { name: "ايكريت (غزة)", type: "CITY", parent: "قضاء غزة", aliases: ["Iqrit (Gaza)"] },
  { name: "السمسمية", type: "CITY", parent: "قضاء غزة", aliases: ["al-Simsimiyya"] },
  { name: "الزوايدة", type: "CITY", parent: "قضاء غزة", aliases: ["al-Zawayda"] },
  { name: "البريج", type: "CITY", parent: "قضاء غزة", aliases: ["al-Bureij"] },

  // ============================================================
  // قضاء الخليل — CITIES
  // ============================================================
  { name: "الخليل", type: "CITY", parent: "قضاء الخليل", aliases: ["Hebron", "al-Khalil"] },
  { name: "بيت جبرين", type: "CITY", parent: "قضاء الخليل", aliases: ["Beit Jibrin", "Bayt Jibrin", "Beit Guvrin"] },
  { name: "بيت نتيف", type: "CITY", parent: "قضاء الخليل", aliases: ["Beit Nattif", "Bayt Nattif"] },
  { name: "إذنا", type: "CITY", parent: "قضاء الخليل", aliases: ["Idhna", "Dhahniyya"] },
  { name: "دورا", type: "CITY", parent: "قضاء الخليل", aliases: ["Dura", "Dora"] },
  { name: "يطا", type: "CITY", parent: "قضاء الخليل", aliases: ["Yatta", "Yata"] },
  { name: "الظاهرية", type: "CITY", parent: "قضاء الخليل", aliases: ["al-Dhahiriyya", "Dahiriyya"] },
  { name: "حلحول", type: "CITY", parent: "قضاء الخليل", aliases: ["Halhul", "Halhoul"] },
  { name: "سعير", type: "CITY", parent: "قضاء الخليل", aliases: ["Sa'ir", "Sa'eer"] },
  { name: "دير السامت", type: "CITY", parent: "قضاء الخليل", aliases: ["Dayr al-Samat", "Deir al-Asalt"] },
  { name: "الزبدة (الخليل)", type: "CITY", parent: "قضاء الخليل", aliases: ["al-Zubda (Hebron)"] },
  { name: "طرقومية", type: "CITY", parent: "قضاء الخليل", aliases: ["Tarqumiya", "Tarqumiyya"] },
  { name: "سمو", type: "CITY", parent: "قضاء الخليل", aliases: ["Sammu'", "Samoa"] },
  { name: "خرسا", type: "CITY", parent: "قضاء الخليل", aliases: ["Khursa", "Khorsa"] },
  { name: "بيت أمر", type: "CITY", parent: "قضاء الخليل", aliases: ["Beit Ummar", "Bayt 'Ummar"] },
  { name: "قيلة (الخليل)", type: "CITY", parent: "قضاء الخليل", aliases: ["Qayla (Hebron)", "Qeila"] },
  { name: "بيت عوه", type: "CITY", parent: "قضاء الخليل", aliases: ["Beit 'Awwa", "Bayt 'Awwa"] },
  { name: "دير الدبان", type: "CITY", parent: "قضاء الخليل", aliases: ["Dayr al-Dubban"] },
  { name: "ربطة", type: "CITY", parent: "قضاء الخليل", aliases: ["Rabata (Hebron)", "Rabta"] },
  { name: "خربة أم البرج", type: "CITY", parent: "قضاء الخليل", aliases: ["Khirbat Umm al-Burj"] },
  { name: "بيت كاحل", type: "CITY", parent: "قضاء الخليل", aliases: ["Beit Kahil", "Bayt Kahil"] },
  { name: "تفوح", type: "CITY", parent: "قضاء الخليل", aliases: ["Taffuh", "Tafuh"] },
  { name: "دير سامت", type: "CITY", parent: "قضاء الخليل", aliases: ["Dayr Samat"] },
  { name: "الكرمل (الخليل)", type: "CITY", parent: "قضاء الخليل", aliases: ["al-Karmil (Hebron)", "Khirbet al-Karmel"] },
  { name: "سكا", type: "CITY", parent: "قضاء الخليل", aliases: ["Sukka", "Suka (Hebron)"] },
  { name: "إفرات", type: "CITY", parent: "قضاء الخليل", aliases: ["Efrata", "Efrat"] },
  { name: "صوريف", type: "CITY", parent: "قضاء الخليل", aliases: ["Surif", "Surayf"] },
  { name: "بيت ميرسم", type: "CITY", parent: "قضاء الخليل", aliases: ["Beit Mirsim", "Tell Beit Mirsim"] },

  // ============================================================
  // قضاء بيت لحم — CITIES
  // ============================================================
  { name: "بيت لحم", type: "CITY", parent: "قضاء بيت لحم", aliases: ["Bethlehem", "Bayt Lahm"] },
  { name: "بيت ساحور", type: "CITY", parent: "قضاء بيت لحم", aliases: ["Beit Sahour", "Bayt Sahur"] },
  { name: "بيت جالا (بيت لحم)", type: "CITY", parent: "قضاء بيت لحم", aliases: ["Beit Jala (Bethlehem)", "Bayt Jala"] },
  { name: "أرطاس", type: "CITY", parent: "قضاء بيت لحم", aliases: ["Artas", "Irtas"] },
  { name: "الخضر", type: "CITY", parent: "قضاء بيت لحم", aliases: ["al-Khader", "al-Khadr"] },
  { name: "بيت أمر (بيت لحم)", type: "CITY", parent: "قضاء بيت لحم", aliases: ["Beit Ummar (Bethlehem)"] },
  { name: "العبيدية", type: "CITY", parent: "قضاء بيت لحم", aliases: ["al-'Ubeidiyya", "Ubeidiya"] },
  { name: "هوسان", type: "CITY", parent: "قضاء بيت لحم", aliases: ["Husan", "Housan"] },
  { name: "الولجة (بيت لحم)", type: "CITY", parent: "قضاء بيت لحم", aliases: ["al-Walaja (Bethlehem)"] },
  { name: "بتير", type: "CITY", parent: "قضاء بيت لحم", aliases: ["Battir", "Batteer"] },
  { name: "كيسان", type: "CITY", parent: "قضاء بيت لحم", aliases: ["Kisan", "Keisan"] },
  { name: "زكريا (بيت لحم)", type: "CITY", parent: "قضاء بيت لحم", aliases: ["Zakariyya (Bethlehem)", "Zakariyya"] },
  { name: "نعلين", type: "CITY", parent: "قضاء بيت لحم", aliases: ["Na'lin", "Nalin"] },
  { name: "جبل أبو غنيم", type: "CITY", parent: "قضاء بيت لحم", aliases: ["Jabal Abu Ghneim", "Har Homa area"] },
  { name: "وادي فوكين", type: "CITY", parent: "قضاء بيت لحم", aliases: ["Wadi Fukin", "Wadi Fuqeen"] },
  { name: "الخضرة", type: "CITY", parent: "قضاء بيت لحم", aliases: ["al-Khudra (Bethlehem)"] },
  { name: "نحالين", type: "CITY", parent: "قضاء بيت لحم", aliases: ["Nahalin", "Nahallin"] },
  { name: "الأغوار (بيت لحم)", type: "CITY", parent: "قضاء بيت لحم", aliases: ["al-Aghwar (Bethlehem)"] },

  // ============================================================
  // قضاء بئر السبع — CITIES
  // ============================================================
  { name: "بئر السبع", type: "CITY", parent: "قضاء بئر السبع", aliases: ["Beersheba", "Beer al-Saba", "Be'er Sheva"] },
  { name: "العوجا", type: "CITY", parent: "قضاء بئر السبع", aliases: ["al-'Awja", "Nitzana area"] },
  { name: "العسلوج", type: "CITY", parent: "قضاء بئر السبع", aliases: ["al-'Aslouj", "Aselouj"] },
  { name: "دمرة", type: "CITY", parent: "قضاء بئر السبع", aliases: ["Damara", "Dammara (Negev)"] },
  { name: "أم باطم", type: "CITY", parent: "قضاء بئر السبع", aliases: ["Umm Batin", "Om Batin"] },
  { name: "النقب", type: "CITY", parent: "قضاء بئر السبع", aliases: ["al-Naqab", "Negev", "Negev Desert"] },
  { name: "خربة المشاش", type: "CITY", parent: "قضاء بئر السبع", aliases: ["Khirbat al-Mashash"] },
  { name: "أبو رقيق", type: "CITY", parent: "قضاء بئر السبع", aliases: ["Abu Ruqayq"] },
  { name: "راهط", type: "CITY", parent: "قضاء بئر السبع", aliases: ["Rahat (modern Bedouin city)"] },
  { name: "تل السبع", type: "CITY", parent: "قضاء بئر السبع", aliases: ["Tell al-Saba'", "Tel Be'er Sheva"] },
  { name: "أم الفحم (النقب)", type: "CITY", parent: "قضاء بئر السبع", aliases: ["Umm al-Fahm (Negev)"] },
  { name: "كرنب", type: "CITY", parent: "قضاء بئر السبع", aliases: ["Karanub", "Mampsis area"] },
  { name: "الخالصة (الجنوب)", type: "CITY", parent: "قضاء بئر السبع", aliases: ["al-Khalisa (South)", "Khalisa (Negev)"] },
  { name: "الصبيحة", type: "CITY", parent: "قضاء بئر السبع", aliases: ["al-Subayha", "Subeihi"] },
  { name: "خربة المشاش (بئر السبع)", type: "CITY", parent: "قضاء بئر السبع", aliases: ["Khirbat al-Mashash (Beersheba)"] },

  // ============================================================
  // المملكة العربية السعودية — COUNTRY
  // ============================================================
  {
    name: "المملكة العربية السعودية",
    type: "COUNTRY",
    aliases: ["Saudi Arabia", "KSA", "المملكة", "السعودية"],
  },

  // ============================================================
  // المناطق السعودية — REGIONS (13 regions)
  // ============================================================
  { name: "منطقة الرياض", type: "REGION", parent: "المملكة العربية السعودية", aliases: ["Riyadh Region", "Riyadh Province"] },
  { name: "منطقة مكة المكرمة", type: "REGION", parent: "المملكة العربية السعودية", aliases: ["Makkah Region", "Mecca Region", "Western Region"] },
  { name: "منطقة المدينة المنورة", type: "REGION", parent: "المملكة العربية السعودية", aliases: ["Madinah Region", "Medina Region"] },
  { name: "منطقة القصيم", type: "REGION", parent: "المملكة العربية السعودية", aliases: ["Al-Qassim Region", "Qassim Province"] },
  { name: "المنطقة الشرقية", type: "REGION", parent: "المملكة العربية السعودية", aliases: ["Eastern Province", "Eastern Region", "al-Mintaqa al-Sharqiyya"] },
  { name: "منطقة عسير", type: "REGION", parent: "المملكة العربية السعودية", aliases: ["Asir Region", "Aseer Province"] },
  { name: "منطقة تبوك", type: "REGION", parent: "المملكة العربية السعودية", aliases: ["Tabuk Region", "Tabuk Province"] },
  { name: "منطقة حائل", type: "REGION", parent: "المملكة العربية السعودية", aliases: ["Hail Region", "Ha'il Province"] },
  { name: "منطقة الحدود الشمالية", type: "REGION", parent: "المملكة العربية السعودية", aliases: ["Northern Borders Region", "Northern Borders Province"] },
  { name: "منطقة جازان", type: "REGION", parent: "المملكة العربية السعودية", aliases: ["Jizan Region", "Jazan Province"] },
  { name: "منطقة نجران", type: "REGION", parent: "المملكة العربية السعودية", aliases: ["Najran Region", "Najran Province"] },
  { name: "منطقة الباحة", type: "REGION", parent: "المملكة العربية السعودية", aliases: ["Al-Bahah Region", "Baha Province"] },
  { name: "منطقة الجوف", type: "REGION", parent: "المملكة العربية السعودية", aliases: ["Al-Jawf Region", "Al-Jouf Province"] },

  // ============================================================
  // منطقة الرياض — CITIES
  // ============================================================
  { name: "الرياض", type: "CITY", parent: "منطقة الرياض", aliases: ["Riyadh", "ar-Riyad"] },
  { name: "الخرج", type: "CITY", parent: "منطقة الرياض", aliases: ["al-Kharj", "Al Kharj"] },
  { name: "الدوادمي", type: "CITY", parent: "منطقة الرياض", aliases: ["al-Dawadmi", "Dawadmi"] },
  { name: "المجمعة", type: "CITY", parent: "منطقة الرياض", aliases: ["al-Majma'a", "Majmaah"] },
  { name: "القويعية", type: "CITY", parent: "منطقة الرياض", aliases: ["al-Quway'iyya", "Quwayiyah"] },
  { name: "وادي الدواسر", type: "CITY", parent: "منطقة الرياض", aliases: ["Wadi al-Dawasir", "Wadi Dawasir"] },
  { name: "الأفلاج", type: "CITY", parent: "منطقة الرياض", aliases: ["al-Aflaj", "Aflaj"] },
  { name: "حوطة بني تميم", type: "CITY", parent: "منطقة الرياض", aliases: ["Hawtat Bani Tamim", "Hawtat Sudair"] },
  { name: "ضرما", type: "CITY", parent: "منطقة الرياض", aliases: ["Dharma", "Dirma"] },
  { name: "المزاحمية", type: "CITY", parent: "منطقة الرياض", aliases: ["al-Muzahimiyya", "Mazahmiyya"] },
  { name: "شقراء", type: "CITY", parent: "منطقة الرياض", aliases: ["Shaqra", "Shaqraa"] },
  { name: "عفيف", type: "CITY", parent: "منطقة الرياض", aliases: ["'Afif", "Afif"] },
  { name: "السليل", type: "CITY", parent: "منطقة الرياض", aliases: ["al-Sulayyil", "Sulayyil"] },
  { name: "الزلفي", type: "CITY", parent: "منطقة الرياض", aliases: ["al-Zulfi", "Zulfi"] },
  { name: "حريملاء", type: "CITY", parent: "منطقة الرياض", aliases: ["Hurayimla", "Huraimala"] },
  { name: "رماح", type: "CITY", parent: "منطقة الرياض", aliases: ["Rumah"] },
  { name: "ثادق", type: "CITY", parent: "منطقة الرياض", aliases: ["Thadiq"] },
  { name: "الغاط", type: "CITY", parent: "منطقة الرياض", aliases: ["al-Ghatt", "al-Ghat"] },
  { name: "صدير", type: "CITY", parent: "منطقة الرياض", aliases: ["Sudair"] },

  // ============================================================
  // منطقة مكة المكرمة — CITIES
  // ============================================================
  { name: "مكة المكرمة", type: "CITY", parent: "منطقة مكة المكرمة", aliases: ["Mecca", "Makkah", "Makkah al-Mukarramah"] },
  { name: "جدة", type: "CITY", parent: "منطقة مكة المكرمة", aliases: ["Jeddah", "Jidda", "Jiddah"] },
  { name: "الطائف", type: "CITY", parent: "منطقة مكة المكرمة", aliases: ["al-Ta'if", "Taif"] },
  { name: "رابغ", type: "CITY", parent: "منطقة مكة المكرمة", aliases: ["Rabigh"] },
  { name: "القنفذة", type: "CITY", parent: "منطقة مكة المكرمة", aliases: ["al-Qunfudhah", "Qunfudah"] },
  { name: "الليث", type: "CITY", parent: "منطقة مكة المكرمة", aliases: ["al-Lith", "Lith"] },
  { name: "خليص", type: "CITY", parent: "منطقة مكة المكرمة", aliases: ["Khulays", "Khulayyis"] },
  { name: "الجموم", type: "CITY", parent: "منطقة مكة المكرمة", aliases: ["al-Jumum", "Jumum"] },
  { name: "بحرة", type: "CITY", parent: "منطقة مكة المكرمة", aliases: ["Bahra", "Bahrah"] },
  { name: "العرضيات", type: "CITY", parent: "منطقة مكة المكرمة", aliases: ["al-'Ardiyat", "Ardiyat"] },
  { name: "تربة", type: "CITY", parent: "منطقة مكة المكرمة", aliases: ["Turba (Makkah)", "Turaba"] },
  { name: "الخرمة", type: "CITY", parent: "منطقة مكة المكرمة", aliases: ["al-Khurma", "Khorma"] },
  { name: "رنية", type: "CITY", parent: "منطقة مكة المكرمة", aliases: ["Ranyah", "Raniah"] },
  { name: "ميسان", type: "CITY", parent: "منطقة مكة المكرمة", aliases: ["Maysan (Makkah)"] },
  { name: "العقيق (مكة)", type: "CITY", parent: "منطقة مكة المكرمة", aliases: ["al-'Aqiq (Makkah)"] },

  // ============================================================
  // منطقة المدينة المنورة — CITIES
  // ============================================================
  { name: "المدينة المنورة", type: "CITY", parent: "منطقة المدينة المنورة", aliases: ["Medina", "Madinah", "al-Madinah al-Munawwarah"] },
  { name: "ينبع", type: "CITY", parent: "منطقة المدينة المنورة", aliases: ["Yanbu", "Yanbo"] },
  { name: "العلا", type: "CITY", parent: "منطقة المدينة المنورة", aliases: ["al-'Ula", "AlUla"] },
  { name: "العيص", type: "CITY", parent: "منطقة المدينة المنورة", aliases: ["al-'Is", "al-'Ays"] },
  { name: "المهد", type: "CITY", parent: "منطقة المدينة المنورة", aliases: ["al-Mahd", "Mahd al-Dhahab area"] },
  { name: "بدر", type: "CITY", parent: "منطقة المدينة المنورة", aliases: ["Badr", "Badr Hunayn"] },
  { name: "الحناكية", type: "CITY", parent: "منطقة المدينة المنورة", aliases: ["al-Hanakiyya", "Hanakiyah"] },
  { name: "وادي الفرع", type: "CITY", parent: "منطقة المدينة المنورة", aliases: ["Wadi al-Far'", "Wadi Alfar"] },
  { name: "خيبر", type: "CITY", parent: "منطقة المدينة المنورة", aliases: ["Khaybar"] },

  // ============================================================
  // منطقة القصيم — CITIES
  // ============================================================
  { name: "بريدة", type: "CITY", parent: "منطقة القصيم", aliases: ["Buraydah", "Buraidah"] },
  { name: "عنيزة", type: "CITY", parent: "منطقة القصيم", aliases: ["'Unayzah", "Onaizah", "Unaizah"] },
  { name: "الرس", type: "CITY", parent: "منطقة القصيم", aliases: ["al-Rass", "ar-Rass"] },
  { name: "المذنب", type: "CITY", parent: "منطقة القصيم", aliases: ["al-Mudhnab", "Mudhnab"] },
  { name: "البكيرية", type: "CITY", parent: "منطقة القصيم", aliases: ["al-Bukayriyya", "Bukayriyah"] },
  { name: "عيون الجواء", type: "CITY", parent: "منطقة القصيم", aliases: ["'Uyun al-Jiwa", "'Uyun al-Jawa"] },
  { name: "ضرية", type: "CITY", parent: "منطقة القصيم", aliases: ["Dariyya", "Dariyyah (Qassim)"] },
  { name: "الشماسية", type: "CITY", parent: "منطقة القصيم", aliases: ["al-Shammasiyya", "Shammasiyah"] },
  { name: "البدائع", type: "CITY", parent: "منطقة القصيم", aliases: ["al-Bada'i'", "Badai"] },
  { name: "ثرمدا", type: "CITY", parent: "منطقة القصيم", aliases: ["Tharmada"] },
  { name: "خب والشف", type: "CITY", parent: "منطقة القصيم", aliases: ["Khabb wa al-Sha'f"] },

  // ============================================================
  // المنطقة الشرقية — CITIES
  // ============================================================
  { name: "الدمام", type: "CITY", parent: "المنطقة الشرقية", aliases: ["Dammam"] },
  { name: "الخبر", type: "CITY", parent: "المنطقة الشرقية", aliases: ["al-Khubar", "Khobar"] },
  { name: "الظهران", type: "CITY", parent: "المنطقة الشرقية", aliases: ["al-Dhahran", "Dhahran"] },
  { name: "الأحساء", type: "CITY", parent: "المنطقة الشرقية", aliases: ["al-Ahsa", "al-Hasa", "Hofuf area"] },
  { name: "الهفوف", type: "CITY", parent: "المنطقة الشرقية", aliases: ["al-Hofuf", "Hofuf"] },
  { name: "القطيف", type: "CITY", parent: "المنطقة الشرقية", aliases: ["al-Qatif", "Qatif"] },
  { name: "الجبيل", type: "CITY", parent: "المنطقة الشرقية", aliases: ["al-Jubayl", "Jubail"] },
  { name: "حفر الباطن", type: "CITY", parent: "المنطقة الشرقية", aliases: ["Hafar al-Batin", "Hafr al-Batin"] },
  { name: "رأس تنورة", type: "CITY", parent: "المنطقة الشرقية", aliases: ["Ras Tanura", "Ras al-Tannurah"] },
  { name: "الخفجي", type: "CITY", parent: "المنطقة الشرقية", aliases: ["al-Khafji", "Khafji"] },
  { name: "بقيق", type: "CITY", parent: "المنطقة الشرقية", aliases: ["Buqayq", "Abqaiq"] },
  { name: "العقير", type: "CITY", parent: "المنطقة الشرقية", aliases: ["al-'Uqayr", "Uqair"] },
  { name: "سيهات", type: "CITY", parent: "المنطقة الشرقية", aliases: ["Saihat", "Sayhat"] },
  { name: "العوامية", type: "CITY", parent: "المنطقة الشرقية", aliases: ["al-'Awamiyya", "Awamiyah"] },
  { name: "صفوى", type: "CITY", parent: "المنطقة الشرقية", aliases: ["Safwa"] },

  // ============================================================
  // منطقة عسير — CITIES
  // ============================================================
  { name: "أبها", type: "CITY", parent: "منطقة عسير", aliases: ["Abha"] },
  { name: "خميس مشيط", type: "CITY", parent: "منطقة عسير", aliases: ["Khamis Mushait", "Khamis Mushyt"] },
  { name: "بيشة", type: "CITY", parent: "منطقة عسير", aliases: ["Bishah", "Bisha"] },
  { name: "النماص", type: "CITY", parent: "منطقة عسير", aliases: ["al-Namas", "Namas"] },
  { name: "محايل عسير", type: "CITY", parent: "منطقة عسير", aliases: ["Muhayil 'Asir", "Muhail Assir"] },
  { name: "تنومة", type: "CITY", parent: "منطقة عسير", aliases: ["Tanuma", "Tanuumah"] },
  { name: "سراة عبيدة", type: "CITY", parent: "منطقة عسير", aliases: ["Sarat 'Ubayda", "Saraat Abidah"] },
  { name: "البرك", type: "CITY", parent: "منطقة عسير", aliases: ["al-Birk", "Birk"] },
  { name: "رجال ألمع", type: "CITY", parent: "منطقة عسير", aliases: ["Rijal Alma'", "Rijal Almaa"] },
  { name: "أحد رفيدة", type: "CITY", parent: "منطقة عسير", aliases: ["Ahad Rufaydah", "Ahad Rafidah"] },
  { name: "قلوة", type: "CITY", parent: "منطقة عسير", aliases: ["Qilwah", "Qalwa"] },
  { name: "ظهران الجنوب", type: "CITY", parent: "منطقة عسير", aliases: ["Dhahran al-Janub", "Dhahran South"] },
  { name: "الحرجة", type: "CITY", parent: "منطقة عسير", aliases: ["al-Harja", "Harjah"] },

  // ============================================================
  // منطقة تبوك — CITIES
  // ============================================================
  { name: "تبوك", type: "CITY", parent: "منطقة تبوك", aliases: ["Tabuk", "Tabūk"] },
  { name: "تيماء", type: "CITY", parent: "منطقة تبوك", aliases: ["Tayma", "Tayma'"] },
  { name: "الوجه", type: "CITY", parent: "منطقة تبوك", aliases: ["al-Wajh", "Wajh"] },
  { name: "ضباء", type: "CITY", parent: "منطقة تبوك", aliases: ["Duba"] },
  { name: "أملج", type: "CITY", parent: "منطقة تبوك", aliases: ["Umluj", "Amlaj"] },
  { name: "حقل", type: "CITY", parent: "منطقة تبوك", aliases: ["Haql"] },
  { name: "شرما", type: "CITY", parent: "منطقة تبوك", aliases: ["Sharma (Tabuk)"] },
  { name: "قيال", type: "CITY", parent: "منطقة تبوك", aliases: ["Qayyil", "Qyal"] },

  // ============================================================
  // منطقة حائل — CITIES
  // ============================================================
  { name: "حائل", type: "CITY", parent: "منطقة حائل", aliases: ["Hail", "Ha'il"] },
  { name: "بقعاء", type: "CITY", parent: "منطقة حائل", aliases: ["Buq'a", "Buqa'a"] },
  { name: "الغزالة", type: "CITY", parent: "منطقة حائل", aliases: ["al-Ghazala", "Ghazala (Hail)"] },
  { name: "العقدة", type: "CITY", parent: "منطقة حائل", aliases: ["al-'Uqdah", "Uqda"] },
  { name: "الشنان", type: "CITY", parent: "منطقة حائل", aliases: ["al-Shanan", "Shinan"] },
  { name: "سميراء", type: "CITY", parent: "منطقة حائل", aliases: ["Samira'", "Sumaira"] },
  { name: "موقق", type: "CITY", parent: "منطقة حائل", aliases: ["Muwaqqaq", "Moqaq"] },
  { name: "الحائط", type: "CITY", parent: "منطقة حائل", aliases: ["al-Ha'it", "Hait"] },

  // ============================================================
  // منطقة الحدود الشمالية — CITIES
  // ============================================================
  { name: "عرعر", type: "CITY", parent: "منطقة الحدود الشمالية", aliases: ["Ar'ar", "Arar"] },
  { name: "رفحاء", type: "CITY", parent: "منطقة الحدود الشمالية", aliases: ["Rafha"] },
  { name: "طريف", type: "CITY", parent: "منطقة الحدود الشمالية", aliases: ["Turaif", "Turayf"] },
  { name: "العويقيلة", type: "CITY", parent: "منطقة الحدود الشمالية", aliases: ["al-'Uwayqila", "Uwayqilah"] },

  // ============================================================
  // منطقة جازان — CITIES
  // ============================================================
  { name: "جازان", type: "CITY", parent: "منطقة جازان", aliases: ["Jizan", "Jazan", "Gizan"] },
  { name: "صبيا", type: "CITY", parent: "منطقة جازان", aliases: ["Sabya"] },
  { name: "أبو عريش", type: "CITY", parent: "منطقة جازان", aliases: ["Abu 'Arish", "Abu Arish"] },
  { name: "صامطة", type: "CITY", parent: "منطقة جازان", aliases: ["Samitah", "Samtah"] },
  { name: "الدرب", type: "CITY", parent: "منطقة جازان", aliases: ["al-Darb (Jizan)"] },
  { name: "ضمد", type: "CITY", parent: "منطقة جازان", aliases: ["Damad", "Dhamad"] },
  { name: "العارضة", type: "CITY", parent: "منطقة جازان", aliases: ["al-'Aridah", "Aridah"] },
  { name: "بيش", type: "CITY", parent: "منطقة جازان", aliases: ["Baish"] },
  { name: "فيفاء", type: "CITY", parent: "منطقة جازان", aliases: ["Fifa", "Fifa Mountains"] },
  { name: "هروب", type: "CITY", parent: "منطقة جازان", aliases: ["Hurub", "Hurowb"] },
  { name: "الريث", type: "CITY", parent: "منطقة جازان", aliases: ["al-Rayth", "Rayth"] },
  { name: "أحد المسارحة", type: "CITY", parent: "منطقة جازان", aliases: ["Ahad al-Masarihah", "Ahad Almasarha"] },
  { name: "جزر فرسان", type: "CITY", parent: "منطقة جازان", aliases: ["Farasan Islands", "Juzur Farasan"] },

  // ============================================================
  // منطقة نجران — CITIES
  // ============================================================
  { name: "نجران", type: "CITY", parent: "منطقة نجران", aliases: ["Najran"] },
  { name: "شرورة", type: "CITY", parent: "منطقة نجران", aliases: ["Sharura", "Shararah"] },
  { name: "حبونا", type: "CITY", parent: "منطقة نجران", aliases: ["Habuna", "Habawnah"] },
  { name: "بدر الجنوب", type: "CITY", parent: "منطقة نجران", aliases: ["Badr al-Janub", "Badr South"] },
  { name: "يدمة", type: "CITY", parent: "منطقة نجران", aliases: ["Yadamah", "Yadama"] },
  { name: "ثار", type: "CITY", parent: "منطقة نجران", aliases: ["Thar (Najran)"] },

  // ============================================================
  // منطقة الباحة — CITIES
  // ============================================================
  { name: "الباحة", type: "CITY", parent: "منطقة الباحة", aliases: ["al-Bahah", "Bahah", "Baha"] },
  { name: "بلجرشي", type: "CITY", parent: "منطقة الباحة", aliases: ["Baljurashi", "Biljurshi"] },
  { name: "المندق", type: "CITY", parent: "منطقة الباحة", aliases: ["al-Mandaq", "Mandaq"] },
  { name: "العقيق (الباحة)", type: "CITY", parent: "منطقة الباحة", aliases: ["al-'Aqiq (Bahah)", "Aqiq (Bahah)"] },
  { name: "قلوة (الباحة)", type: "CITY", parent: "منطقة الباحة", aliases: ["Qalwa (Bahah)"] },
  { name: "غامد الزناد", type: "CITY", parent: "منطقة الباحة", aliases: ["Ghamid al-Zinad", "Ghamid"] },
  { name: "المخواة", type: "CITY", parent: "منطقة الباحة", aliases: ["al-Makhwah", "Makhwa"] },
  { name: "القرى", type: "CITY", parent: "منطقة الباحة", aliases: ["al-Qura (Bahah)"] },

  // ============================================================
  // منطقة الجوف — CITIES
  // ============================================================
  { name: "سكاكا", type: "CITY", parent: "منطقة الجوف", aliases: ["Sakaka"] },
  { name: "دومة الجندل", type: "CITY", parent: "منطقة الجوف", aliases: ["Dawmat al-Jandal", "Dumat al-Jandal"] },
  { name: "القريات", type: "CITY", parent: "منطقة الجوف", aliases: ["al-Qurayyat", "Qurayyat"] },
  { name: "طبرجل", type: "CITY", parent: "منطقة الجوف", aliases: ["Tabarjal"] },
  { name: "صوير", type: "CITY", parent: "منطقة الجوف", aliases: ["Suwair (Jouf)"] },
];
