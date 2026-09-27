const MUSEUM = {
  title: "معرض الفن الافتراضي",
  subtitle: "لطالبات الصف الثاني متوسط\nالمدرسة المتوسطة الثامنة بينبع البحر",
  classes: [
    { name: "الفصل الأول", number: 1 },
    { name: "الفصل الثاني", number: 2 },
    { name: "الفصل الثالث", number: 3 },
    { name: "الفصل الرابع", number: 4 },
    { name: "الفصل الخامس", number: 5 },
    { name: "الفصل السادس", number: 6 },
    { name: "الفصل السابع", number: 7 }
  ],
  rooms: [
    { slug: "drawing", name: "قاعة الرسم" },
    { slug: "decoration", name: "قاعة الزخرفة" },
    { slug: "printing", name: "قاعة الطباعة" },
    { slug: "ceramics", name: "قاعة الخزف" }
  ]
};

function artworkBase(classNumber, roomSlug, slot) {
  return `assets/artworks/class-${classNumber}/${roomSlug}/${String(slot).padStart(2,"0")}`;
}
