// 為了避免 HTML 阻塞，將原始資料獨立為外部檔案
const RAW_DB = [
  {"id":"AV 01-01","hall":"偶劇院","loc":"控制台位置","sys":"視訊系統-BNC","conn":"BCJ-JRUK","qty":2,"dest":"5F","room":"GT相關支援室(05.02)","rack":"5F GT/MT-Video #1","dev":"GT/MT 75歐姆Patch #8"},
  // ... (請將您原本的資料貼於此處) ...
  {"id":"AV 09-14","hall":"鏡框式中劇院","loc":"排練室/後舞台(內部)","sys":"網路-RJ-45","conn":"NE8FDY-C6","qty":2,"dest":"7F","room":"機櫃後舞台包廂","rack":"AV 08-92","dev":"NET"}
]; 
// 已經為您修復原先 JSON 結尾被截斷導致的語法錯誤