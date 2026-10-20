// ✏️ Sửa toàn bộ chữ trên trang ở đây.
export const CONFIG = {
  herName: "Linh",
  myName: "anh",
  startDate: "2021-01-27", // Ngày quen nhau (YYYY-MM-DD). Để "" nếu không muốn hiện bộ đếm
  heroLead: "Hôm nay là ngày của phụ nữ Việt Nam, và là ngày anh muốn nói lời cảm ơn em.",
  counterPrefix: "Mình quen nhau đã được",

  letterGreeting: "Em thương,",
  letter: [
    "Hôm nay là 20/10, ngày cả nước dành để nói lời cảm ơn với những người phụ nữ. Nhưng với anh, ngày nào có em cũng đáng được trân trọng như hôm nay.",
    "Cảm ơn em vì đã kiên nhẫn với anh những lúc anh bận rộn, vì những tin nhắn hỏi han mỗi tối, vì những lần em giận rồi lại thương, và vì đã chọn ở bên anh.",
    "Anh không giỏi nói những lời hoa mỹ, nên anh làm trang web nhỏ này. Mỗi dòng code trong đây là một lần anh nghĩ về em.",
    "Chúc em luôn xinh đẹp, khỏe mạnh, làm gì cũng thuận lợi, và quan trọng nhất là ngày nào cũng có thật nhiều lý do để cười.",
  ],
  signOff: "Yêu em, hôm nay và cả những ngày sau,",

  reasonsTitle: "Những điều anh cảm nhận được",
  reasons: [
    { title: "Nụ cười của em", text: "Chỉ cần em cười một cái là anh quên sạch mệt mỏi cả ngày." },
    { title: "Sự quan tâm", text: "Em luôn nhớ những điều nhỏ nhặt nhất về anh, kể cả những điều anh tự quên." },
    { title: "Sự kiên nhẫn", text: "Em vẫn ở đó cả những lúc anh ngập trong deadline và trả lời tin nhắn chậm." },
    { title: "Sự mạnh mẽ", text: "Em dịu dàng, nhưng chưa bao giờ yếu đuối. Anh học được ở em nhiều lắm." },
    { title: "Giọng nói ấy", text: "Một cuộc gọi của em là đủ để ngày dài bỗng ngắn lại." },
    { title: "Là chính em", text: "Anh thương em vì em là em, không cần thay đổi điều gì cả." },
  ],

  photosTitle: "Những khoảnh khắc của mình",
  photosHelp: "Vuốt sang để xem, chạm vào ảnh để xem lớn.",

  wishes: [
    "Luôn khỏe mạnh, ăn ngon và ngủ đủ giấc.",
    "Mọi dự định đều suôn sẻ, mọi cố gắng đều được đền đáp.",
    "Mỗi ngày đều có ít nhất một điều khiến em mỉm cười.",
    "Và có anh ở bên, lâu thật lâu.",
  ],

  finalTitle: "Anh yêu em",
  finalMessage: "Cảm ơn em vì đã là phần đẹp nhất trong cuộc sống của anh. Chúc em một ngày 20/10 thật ngọt ngào.",

  music: true, // Tự phát nhạc hộp nhạc khi mở thư

  // Repo GitHub chứa source trang này. Dùng khi sửa ảnh ngay trên trang đã deploy:
  // ảnh được commit thẳng vào public/photos của repo, rồi trang tự build lại.
  // Có thể để trống và nhập trong bảng "Cài đặt GitHub" sau khi đăng nhập.
  github: { owner: "", repo: "", branch: "main" },
};
