// ==========================================================
// 全校讀報連線爭霸戰：題目與設定檔
// 老師只要改這個檔案，全校各班重新整理（Ctrl+F5）就會更新。
// ==========================================================
window.FLIP_CONFIG = {
  title: "全校讀報連線爭霸戰",
  subtitle: "拿出手中的報紙，全班一起闖關！",

  // 第 3、5 格（會拍到臉、錄到聲音）上傳到 Padlet；其他格上傳到自製「全校展示牆」
  padletUrl: "",            // 共用 Padlet（每題也可以在自己的 padletUrl 指定不同的 Padlet）
  padletHint: "貼文標題請寫：班級＋任務名稱，例如「801 全班標題接力賽」",

  // 第 4 格「網頁隨機抽議題」的籤筒
  topics: ["環境與氣候", "科技與 AI", "健康與醫療", "交通與安全", "教育與校園", "運動賽事",
           "國際新聞", "文化與藝術", "物價與經濟", "食品安全", "動物與生態", "社會關懷"],

  // 每張牌：
  //   id: 任務編號（上傳到展示牆時用來分類，不要重複）
  //   type: "q"（題目牌）或 "prize"（大獎牌，翻到會放彩帶）
  //   level: 3 / 2 / 1 → 難 3 分、中 2 分、易 1 分（大獎題分數在 config.js 的 prizePoints）
  //   fixed: 5 → 固定放在第 5 格（指定作答，各班相同，不會是大獎）；其他牌含大獎每班隨機
  //   title: 任務名稱；q: 任務內容
  //   share: "wall"（上傳到全校展示牆）或 "padlet"（上傳到 Padlet，網址寫在這題的 padletUrl）
  //   upload: 展示牆要收的東西，"photo"（照片）、"text"（文字）
  //   tool: "draw"（抽籤機）或 "timer"（倒數計時，秒數寫在 seconds）
  cards: [
    { id: 1, type: "prize", prize: "🏆 大獎！頭條精選大推薦", title: "頭條精選大推薦",
      q: "各組從手中報紙挑出一則最重磅的新聞，討論後選出「全班最推薦頭條」，用 iPad 拍下該則新聞版面，再寫一句推薦原因。",
      share: "wall", upload: ["photo", "text"], textHint: "我們推薦這則頭條，因為……" },

    { id: 7, type: "prize", prize: "🏆 大獎！人物焦點關鍵字", title: "人物焦點關鍵字",
      q: "從報紙中找出一位代表性人物，用 iPad 拍下該人物的新聞照片／版面，並寫出「3 個最能代表他的關鍵字」。",
      share: "wall", upload: ["photo", "text"], textHint: "#關鍵字1 #關鍵字2 #關鍵字3" },

    { id: 5, type: "q", level: 3, fixed: 5, title: "全班標題接力賽",
      q: "全班每人從自己報紙挑出一則新聞標題大聲朗讀接力（至少 10 句、每句 7 個字以上），用 iPad 錄音（或錄影）上傳 Padlet。",
      share: "padlet", padletUrl: "https://padlet.com/littlejocelyn2/breakout-room/Vnr04VOW7oJX2BdW-jA7rbndJw9LLX498" },

    { id: 2, type: "q", level: 1, title: "新聞人物小檔案",
      q: "找出報紙上的一位人物，拍下他（或打上名字），寫出「他的身分 ＋ 一件重要事蹟」即可過關。",
      share: "wall", upload: ["photo", "text"], textHint: "他是……，他做了……" },

    { id: 3, type: "q", level: 3, title: "便利貼觀點牆",
      q: "每人從自己報紙找一則最有感的新聞，用 20 字內寫下「新聞重點＋一句心得」在便利貼上並貼滿黑板，最後用 iPad 拍一張全班黑板大合照上傳 Padlet。",
      share: "padlet", padletUrl: "https://padlet.com/littlejocelyn2/breakout-room/kZDR4LR7XPYaql9a-jA7rbndJw9LLX498" },

    { id: 4, type: "q", level: 2, title: "網頁隨機抽議題", tool: "draw",
      q: "按下抽籤機抽出一個關鍵議題，全班翻找各自報紙中相關的報導，拍下找到的報紙標題（或打字摘要重點）上傳。",
      share: "wall", upload: ["photo", "text"], textHint: "我們找到的相關報導是……" },

    { id: 6, type: "q", level: 2, title: "數字密碼大搜查", tool: "timer", seconds: 120,
      q: "限時 2 分鐘！從報紙裡找出一則含有「特殊或驚人數據」的新聞，拍下該段落並寫出這個數字代表什麼意義。",
      share: "wall", upload: ["photo", "text"], textHint: "這個數字是……，代表……" },

    { id: 8, type: "q", level: 2, title: "生活雷達站",
      q: "找出一則「跟學生日常生活最有關」的新聞（例如飲食、交通、校園、3C 規範），寫下它會如何影響我們。",
      share: "wall", upload: ["photo", "text"], textHint: "這則新聞會影響我們……" },

    { id: 9, type: "q", level: 1, title: "新聞情緒溫度計",
      q: "找出一則讓你覺得「最開心／暖心」或「最驚訝／生氣」的新聞，拍下新聞標題並附上一個代表心情的 Emoji ＋ 一句感想。",
      share: "wall", upload: ["photo", "text"], textHint: "😊 這則新聞讓我們覺得……" }
  ]
};
