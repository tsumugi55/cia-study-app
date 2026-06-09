const STORAGE_KEY = "ciaLastMinuteNotes";

const state = {
  memos: [],
  reviewItems: [],
  reviewIndex: 0
};

const elements = {
  form: document.getElementById("memoForm"),
  memoId: document.getElementById("memoId"),
  title: document.getElementById("title"),
  part: document.getElementById("part"),
  category: document.getElementById("category"),
  content: document.getElementById("content"),
  trap: document.getElementById("trap"),
  understanding: document.getElementById("understanding"),
  importance: document.getElementById("importance"),
  chatHistory: document.getElementById("chatHistory"),
  chatPart: document.getElementById("chatPart"),
  chatUnderstanding: document.getElementById("chatUnderstanding"),
  copyPromptButton: document.getElementById("copyPromptButton"),
  pasteChatButton: document.getElementById("pasteChatButton"),
  importChatButton: document.getElementById("importChatButton"),
  previewChatButton: document.getElementById("previewChatButton"),
  classificationPreview: document.getElementById("classificationPreview"),
  submitButton: document.getElementById("submitButton"),
  cancelEditButton: document.getElementById("cancelEditButton"),
  filterPart: document.getElementById("filterPart"),
  filterUnderstanding: document.getElementById("filterUnderstanding"),
  sortOrder: document.getElementById("sortOrder"),
  searchKeyword: document.getElementById("searchKeyword"),
  resetFiltersButton: document.getElementById("resetFiltersButton"),
  memoList: document.getElementById("memoList"),
  memoCount: document.getElementById("memoCount"),
  startReviewButton: document.getElementById("startReviewButton"),
  quickModeButton: document.getElementById("quickModeButton"),
  reviewCard: document.getElementById("reviewCard"),
  prevReviewButton: document.getElementById("prevReviewButton"),
  nextReviewButton: document.getElementById("nextReviewButton"),
  reviewCounter: document.getElementById("reviewCounter"),
  summaryBox: document.getElementById("summaryBox"),
  copySummaryButton: document.getElementById("copySummaryButton"),
  groupedNotes: document.getElementById("groupedNotes"),
  copyGroupedButton: document.getElementById("copyGroupedButton"),
  exportButton: document.getElementById("exportButton"),
  importFile: document.getElementById("importFile"),
  toast: document.getElementById("toast")
};

const CATEGORY_RULES = [
  { part: "Part1", category: "基準・倫理・独立性", keywords: ["基準", "iia", "倫理", "独立", "客観", "専門職", "品質", "内部監査の使命"] },
  { part: "Part1", category: "ガバナンス・リスク・統制", keywords: ["ガバナンス", "リスク", "統制", "コントロール", "erm", "3線", "三線", "取締役会", "リスクマネジメント"] },
  { part: "Part2", category: "監査計画・リスク評価", keywords: ["監査計画", "計画", "リスク評価", "監査範囲", "スコープ", "資源配分", "優先順位", "エンゲージメント計画"] },
  { part: "Part2", category: "監査実施・証拠・サンプリング", keywords: ["証拠", "サンプリング", "テスト", "監査手続", "調書", "観察", "確認", "分析的", "母集団", "サンプル"] },
  { part: "Part2", category: "報告・フォローアップ", keywords: ["報告", "発見事項", "改善", "勧告", "フォローアップ", "残余リスク", "受容", "コミュニケーション"] },
  { part: "Part3", category: "IT・情報セキュリティ", keywords: ["it", "システム", "セキュリティ", "アクセス", "クラウド", "暗号", "バックアップ", "データ", "サイバー", "変更管理"] },
  { part: "Part3", category: "会計・財務・ファイナンス", keywords: ["会計", "財務", "財務諸表", "原価", "予算", "npv", "irr", "キャッシュフロー", "比率", "在庫"] },
  { part: "Part3", category: "経営・戦略・業務", keywords: ["戦略", "経営", "マーケティング", "業務", "プロセス", "サプライ", "kpi", "組織", "プロジェクト"] },
  { part: "Part1", category: "不正リスク", keywords: ["不正", "fraud", "横領", "改ざん", "兆候", "職業的不正"] }
];

function loadMemos() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    state.memos = saved ? JSON.parse(saved) : [];
  } catch {
    state.memos = [];
    showToast("保存データの読み込みに失敗しました");
  }
}

function saveMemos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.memos));
}

function createId() {
  return `memo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function starText(value) {
  return "★".repeat(Number(value)) + "☆".repeat(5 - Number(value));
}

function understandingClass(value) {
  if (value === "低") return "low";
  if (value === "中") return "mid";
  return "high";
}

function getFormMemo() {
  const now = new Date().toISOString();
  const existingId = elements.memoId.value;
  const current = state.memos.find((memo) => memo.id === existingId);

  return {
    id: existingId || createId(),
    title: elements.title.value.trim(),
    part: elements.part.value,
    category: elements.category.value.trim(),
    content: elements.content.value.trim(),
    trap: elements.trap.value.trim(),
    understanding: elements.understanding.value,
    importance: Number(elements.importance.value),
    question: current?.question || "",
    answer: current?.answer || "",
    source: current?.source || "",
    createdAt: current?.createdAt || now,
    updatedAt: now
  };
}

function pickValue(item, keys, fallback = "") {
  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null && String(item[key]).trim() !== "") {
      return item[key];
    }
  }
  return fallback;
}

function normalizePartValue(value, fallback = "Part1") {
  const text = String(value || fallback).trim();
  if (["Part1", "Part2", "Part3"].includes(text)) return text;
  if (/part\s*3/i.test(text) || text === "3" || text.includes("3")) return "Part3";
  if (/part\s*2/i.test(text) || text === "2" || text.includes("2")) return "Part2";
  if (/part\s*1/i.test(text) || text === "1" || text.includes("1")) return "Part1";
  return fallback;
}

function normalizeUnderstandingValue(value, fallback = "低") {
  const text = String(value || fallback).trim();
  if (["低", "中", "高"].includes(text)) return text;
  if (/(low|poor|弱|低い|まだ|不明|苦手)/i.test(text)) return "低";
  if (/(medium|middle|普通|中くらい|まあまあ)/i.test(text)) return "中";
  if (/(high|good|十分|高い|理解)/i.test(text)) return "高";
  return fallback;
}

function normalizeImportanceValue(value, fallback = 4) {
  const text = String(value || fallback).trim();
  const starCount = (text.match(/★/g) || []).length;
  const number = starCount || Number(text.replace(/[^\d.]/g, ""));
  return Math.min(5, Math.max(1, number || fallback));
}

function normalizeMemo(item, fallback = {}) {
  const title = pickValue(item, ["title", "タイトル", "題名", "論点", "用語"], fallback.title || "無題");
  const category = pickValue(item, ["category", "カテゴリ", "分野", "科目"], fallback.category || "");
  const content = pickValue(item, ["content", "memo", "内容メモ", "内容", "説明", "要点", "整理"], fallback.content || "");
  const trap = pickValue(item, ["trap", "trapPoint", "point", "ひっかけポイント", "試験でのひっかけポイント", "注意点", "迷いやすい点"], fallback.trap || "");
  const part = pickValue(item, ["part", "Part", "CIA Part", "CIAパート", "パート"], fallback.part || "Part1");
  const understanding = pickValue(item, ["understanding", "理解度"], fallback.understanding || "低");
  const importance = pickValue(item, ["importance", "重要度"], fallback.importance || 4);
  const question = pickValue(item, ["question", "質問", "不明点", "聞いたこと"], fallback.question || "");
  const answer = pickValue(item, ["answer", "回答", "AI回答", "ChatGPT回答"], fallback.answer || "");
  const source = pickValue(item, ["source", "chatLog", "チャット履歴", "ログ", "原文"], fallback.source || answer || question || "");

  return {
    id: item.id || createId(),
    title: String(title),
    part: normalizePartValue(part, fallback.part || "Part1"),
    category: String(category),
    content: String(content),
    trap: String(trap),
    understanding: normalizeUnderstandingValue(understanding, fallback.understanding || "低"),
    importance: normalizeImportanceValue(importance, fallback.importance || 4),
    question: String(question),
    answer: String(answer),
    source: String(source),
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString()
  };
}

function detectPart(text) {
  const selected = elements.chatPart.value;
  if (selected !== "auto") return selected;

  const source = text.toLowerCase();
  if (source.includes("part3") || source.includes("part 3")) return "Part3";
  if (source.includes("part2") || source.includes("part 2")) return "Part2";
  if (source.includes("part1") || source.includes("part 1")) return "Part1";
  return "Part1";
}

function extractSection(text, labels) {
  const lines = text.split(/\r?\n/);
  const indexes = [];

  lines.forEach((line, index) => {
    if (/^\s*[-*#\d.）)]*\s*[^:：]{1,24}[:：]/.test(line)) {
      indexes.push(index);
    }
  });

  for (const label of labels) {
    const start = lines.findIndex((line) => line.includes(label) && line.includes(":") || line.includes(label) && line.includes("："));
    if (start === -1) continue;

    const current = lines[start].replace(/^.*?[:：]\s*/, "").trim();
    const next = indexes.find((index) => index > start) || lines.length;
    const rest = lines.slice(start + 1, next).join("\n").trim();
    return [current, rest].filter(Boolean).join("\n").trim();
  }

  return "";
}

function compactText(text, maxLength) {
  const clean = text.replace(/\n{3,}/g, "\n\n").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1)}…`;
}

function stripSpeaker(line) {
  return line
    .replace(/^\s*(user|you|human|me|ユーザー|あなた|自分|私|質問|問い|q\d*|chatgpt|assistant|ai|回答|返答|a\d*)\s*(said)?\s*[:：]\s*/i, "")
    .replace(/^\s*[-*#\d.．）)]+\s*/, "")
    .trim();
}

function speakerOf(line) {
  const trimmed = line.trim();
  if (/^(user|you|human|me|ユーザー|あなた|自分|私|質問|問い|q\d*)\s*(said)?\s*[:：]/i.test(trimmed)) return "user";
  if (/^(chatgpt|assistant|ai|回答|返答|a\d*)\s*(said)?\s*[:：]/i.test(trimmed)) return "assistant";
  if (/^(user|you|human|me|ユーザー|あなた|自分|私|質問|問い|q\d*)$/i.test(trimmed)) return "user";
  if (/^(chatgpt|assistant|ai|回答|返答|a\d*)$/i.test(trimmed)) return "assistant";
  return "";
}

function looksLikeUserQuestion(line) {
  const trimmed = stripSpeaker(line);
  if (trimmed.length < 8 || trimmed.length > 180) return false;
  if (/^(chatgpt|assistant|ai|回答|返答)\b/i.test(trimmed)) return false;
  return /[?？]$/.test(trimmed) ||
    /(とは|違い|なぜ|どれ|どちら|どう|どのよう|教えて|分から|わから|不明|迷った|理解でき|覚え方|整理して|解説して|説明して|ですか|ますか)/.test(trimmed);
}

function isTopicBoundary(line) {
  return speakerOf(line) === "user";
}

function splitChatHistory(history) {
  const lines = history.replace(/\r\n/g, "\n").split("\n");
  const turnBlocks = splitByConversationTurns(lines);
  if (turnBlocks.length > 0) return turnBlocks;

  const hardBlocks = history
    .split(/\n\s*(?:-{3,}|={3,}|#{3,}|---\s*論点\s*---)\s*\n/i)
    .map((block) => block.trim())
    .filter((block) => block.length > 60);
  if (hardBlocks.length > 1) return hardBlocks;

  const blocks = [];
  let current = [];

  lines.forEach((line) => {
    const startsNew = isTopicBoundary(line);
    if (startsNew && current.join("\n").trim().length > 80) {
      blocks.push(current.join("\n").trim());
      current = [];
    }
    current.push(line);
  });

  if (current.join("\n").trim()) blocks.push(current.join("\n").trim());
  if (blocks.length > 1) return blocks;

  const paragraphBlocks = history
    .split(/\n{3,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 120);

  if (paragraphBlocks.length >= 2) return paragraphBlocks;
  return [history.trim()];
}

function splitByConversationTurns(lines) {
  const blocks = [];
  let current = [];
  let hasSeenUserTurn = false;

  lines.forEach((line, index) => {
    const speaker = speakerOf(line);
    const markerOnly = speaker && stripSpeaker(line) === "";
    const startsUserTurn = speaker === "user" || (!hasSeenUserTurn && looksLikeUserQuestion(line)) ||
      (!speaker && looksLikeUserQuestion(line) && current.join("\n").trim().length > 120);

    if (startsUserTurn) {
      if (hasSeenUserTurn && current.join("\n").trim()) {
        blocks.push(current.join("\n").trim());
        current = [];
      }
      hasSeenUserTurn = true;
    }

    if (hasSeenUserTurn && !markerOnly) {
      current.push(line);
    }
  });

  if (hasSeenUserTurn && current.join("\n").trim()) {
    blocks.push(current.join("\n").trim());
  }

  return blocks;
}

function classifyBlock(text) {
  const normalized = text.toLowerCase();
  let best = { part: detectPart(text), category: "未分類", score: 0 };

  CATEGORY_RULES.forEach((rule) => {
    const score = rule.keywords.reduce((total, keyword) => {
      return total + (normalized.includes(keyword.toLowerCase()) ? 1 : 0);
    }, 0);

    if (score > best.score) {
      best = { part: rule.part, category: rule.category, score };
    }
  });

  return best;
}

function extractTitleFromBlock(block) {
  const lines = block.split(/\n/).map((line) => line.trim()).filter(Boolean);
  const questionLine = lines.find((line) => speakerOf(line) === "user") ||
    lines.find((line) => /^(質問|q\d*|不明点|論点|テーマ|topic)\s*[:：]/i.test(line));
  const headingLine = lines.find((line) => /^\s*(#{1,3}\s+|【[^】]+】|\d+[.．）)]\s+).{4,80}$/.test(line));
  const source = questionLine || headingLine || lines[0] || "学習ログ";
  return compactText(stripSpeaker(source).replace(/^【|】$/g, ""), 48);
}

function extractAnswerText(block) {
  const lines = block.split(/\n/);
  const answerStart = lines.findIndex((line) => speakerOf(line) === "assistant");
  if (answerStart === -1) return block;
  return lines.slice(answerStart).map(stripSpeaker).join("\n").trim();
}

function extractQuestionText(block) {
  const lines = block.split(/\n/);
  const questionStart = lines.findIndex((line) => speakerOf(line) === "user");
  if (questionStart === -1) return extractTitleFromBlock(block);
  const answerStart = lines.findIndex((line, index) => index > questionStart && speakerOf(line) === "assistant");
  const end = answerStart === -1 ? lines.length : answerStart;
  return lines.slice(questionStart, end).map(stripSpeaker).join("\n").trim();
}

function makeMemoFromBlock(block) {
  const classification = classifyBlock(block);
  const answerText = extractAnswerText(block);
  const questionText = extractQuestionText(block);
  const trap = extractSection(answerText, ["ひっかけポイント", "試験でのひっかけポイント", "注意点", "迷いやすい点"]) ||
    extractSection(block, ["ひっかけポイント", "試験でのひっかけポイント", "注意点", "迷いやすい点"]) ||
    "試験直前に、選択肢で混同しやすい語句・前提条件・優先順位を確認する。";
  const importantWords = ["重要", "頻出", "ひっかけ", "間違え", "苦手", "覚える", "注意"];

  return normalizeMemo({}, {
    title: extractTitleFromBlock(block),
    part: classification.part,
    category: classification.category,
    content: compactText(answerText || block, 1200),
    trap: compactText(trap, 500),
    understanding: elements.chatUnderstanding.value,
    importance: importantWords.some((word) => block.includes(word)) ? 5 : 4,
    question: questionText,
    answer: answerText,
    source: block
  });
}

function parseChatInput() {
  const history = elements.chatHistory.value.trim();

  if (!history) {
    showToast("整理済みJSONまたはチャット履歴を貼り付けてください");
    return null;
  }

  try {
    const parsed = parseJsonRelaxed(extractJsonCandidate(history));
    const rawItems = getImportItems(parsed);
    return rawItems.map((item) => normalizeMemo(item, {
      part: detectPart(history),
      understanding: elements.chatUnderstanding.value,
      source: history
    }));
  } catch (error) {
    const structuredItems = parseLooseStructuredMemos(history);
    if (structuredItems.length > 0) return structuredItems;
    return [makeUnstructuredLogMemo(history, error)];
  }
}

function extractJsonCandidate(text) {
  const cleanText = text
    .replace(/^\uFEFF/, "")
    .replace(/\u00A0/g, " ")
    .trim();
  const fenced = cleanText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();

  const firstObject = cleanText.indexOf("{");
  const lastObject = cleanText.lastIndexOf("}");
  const firstArray = cleanText.indexOf("[");
  const lastArray = cleanText.lastIndexOf("]");

  const objectCandidate = firstObject >= 0 && lastObject > firstObject
    ? cleanText.slice(firstObject, lastObject + 1)
    : "";
  const arrayCandidate = firstArray >= 0 && lastArray > firstArray
    ? cleanText.slice(firstArray, lastArray + 1)
    : "";

  if (objectCandidate && (!arrayCandidate || firstObject < firstArray)) return objectCandidate;
  if (arrayCandidate) return arrayCandidate;
  return cleanText;
}

function parseJsonRelaxed(text) {
  const candidates = [
    text,
    text
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/，/g, ",")
      .replace(/：/g, ":"),
    text
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/，/g, ",")
      .replace(/：/g, ":")
      .replace(/,\s*([}\]])/g, "$1")
  ];

  let lastError;
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function parseLooseStructuredMemos(text) {
  const blocks = text
    .split(/\n\s*(?=(?:[-*]\s*)?(?:\d+[.．）)]\s*)?(?:タイトル|title)\s*[:：])/i)
    .map((block) => block.trim())
    .filter((block) => /(タイトル|title)\s*[:：]/i.test(block));

  return blocks.map((block) => {
    const title = extractLooseField(block, ["タイトル", "title"]);
    const part = extractLooseField(block, ["part", "Part", "CIA Part", "パート"]);
    const category = extractLooseField(block, ["category", "カテゴリ", "分野"]);
    const content = extractLooseField(block, ["content", "内容", "内容メモ", "要点"]);
    const trap = extractLooseField(block, ["trap", "ひっかけポイント", "注意点", "迷いやすい点"]);
    const importance = extractLooseField(block, ["importance", "重要度"]);

    if (!title && !content) return null;

    return normalizeMemo({}, {
      title: title || compactText(block, 48),
      part: part || detectPart(block),
      category: category || "未分類",
      content: content || compactText(block, 1200),
      trap: trap || "試験直前に、選択肢で混同しやすい語句・前提条件・優先順位を確認する。",
      understanding: elements.chatUnderstanding.value,
      importance: importance || 4,
      source: block
    });
  }).filter(Boolean);
}

function extractLooseField(text, labels) {
  const escaped = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const pattern = new RegExp(`(?:^|\\n)\\s*(?:[-*]\\s*)?(?:${escaped})\\s*[:：]\\s*([\\s\\S]*?)(?=\\n\\s*(?:[-*]\\s*)?(?:タイトル|title|part|Part|CIA Part|パート|category|カテゴリ|分野|content|内容|内容メモ|要点|trap|ひっかけポイント|注意点|迷いやすい点|importance|重要度)\\s*[:：]|$)`, "i");
  const match = text.match(pattern);
  return match ? match[1].trim().replace(/^["“”]|["“”]$/g, "") : "";
}

function makeUnstructuredLogMemo(history, error) {
  const classification = classifyBlock(history);
  return normalizeMemo({}, {
    title: `未整理チャットログ ${new Date().toLocaleDateString("ja-JP")}`,
    part: classification.part,
    category: "未整理ログ",
    content: compactText(history, 1800),
    trap: `JSONとして読み取れませんでした。${error?.message ? `理由: ${error.message}` : "ChatGPTに整理済みJSONを作成してもらうと、分野別資料として正確に保存できます。"}`,
    understanding: elements.chatUnderstanding.value,
    importance: 3,
    source: history
  });
}

function resetForm() {
  elements.form.reset();
  elements.memoId.value = "";
  elements.importance.value = "3";
  elements.submitButton.textContent = "登録する";
  elements.cancelEditButton.classList.add("hidden");
}

function putMemoIntoForm(memo) {
  elements.memoId.value = "";
  elements.title.value = memo.title;
  elements.part.value = memo.part;
  elements.category.value = memo.category;
  elements.content.value = memo.content;
  elements.trap.value = memo.trap;
  elements.understanding.value = memo.understanding;
  elements.importance.value = String(memo.importance);
  elements.submitButton.textContent = "登録する";
  elements.cancelEditButton.classList.add("hidden");
  elements.form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 2300);
}

function filteredMemos() {
  const keyword = elements.searchKeyword.value.trim().toLowerCase();
  const part = elements.filterPart.value;
  const understanding = elements.filterUnderstanding.value;

  const results = state.memos.filter((memo) => {
    const matchesPart = part === "all" || memo.part === part;
    const matchesUnderstanding = understanding === "all" || memo.understanding === understanding;
    const searchable = [
      memo.title,
      memo.part,
      memo.category,
      memo.content,
      memo.trap,
      memo.question,
      memo.answer,
      memo.source,
      memo.understanding,
      starText(memo.importance)
    ].join(" ").toLowerCase();
    return matchesPart && matchesUnderstanding && searchable.includes(keyword);
  });

  if (elements.sortOrder.value === "importanceDesc") {
    results.sort((a, b) => b.importance - a.importance || new Date(b.updatedAt) - new Date(a.updatedAt));
  } else if (elements.sortOrder.value === "importanceAsc") {
    results.sort((a, b) => a.importance - b.importance || new Date(b.updatedAt) - new Date(a.updatedAt));
  } else {
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  return results;
}

function renderMemoCard(memo) {
  const trapHtml = memo.trap
    ? `<div class="trap-box"><strong>ひっかけポイント</strong><div>${escapeHtml(memo.trap)}</div></div>`
    : "";
  const categoryHtml = memo.category ? `<span class="tag">${escapeHtml(memo.category)}</span>` : "";
  const sourceText = memo.source || [memo.question, memo.answer].filter(Boolean).join("\n\n");
  const logHtml = sourceText
    ? `<details class="log-box"><summary>元のチャット抜粋を表示</summary><p>${escapeHtml(sourceText)}</p></details>`
    : "";

  return `
    <article class="memo-card ${memo.importance >= 4 ? "high-importance" : ""}">
      <div class="memo-card-header">
        <h3 class="memo-title">${escapeHtml(memo.title)}</h3>
        <span class="tag">${escapeHtml(memo.part)}</span>
      </div>
      <div class="tag-row">
        ${categoryHtml}
        <span class="tag ${understandingClass(memo.understanding)}">理解度 ${escapeHtml(memo.understanding)}</span>
        <span class="tag">重要度 ${starText(memo.importance)}</span>
      </div>
      <p class="memo-text">${escapeHtml(memo.content)}</p>
      ${trapHtml}
      ${logHtml}
      <div class="card-actions">
        <button class="secondary-button" type="button" data-action="edit" data-id="${memo.id}">編集</button>
        <button class="danger-button" type="button" data-action="delete" data-id="${memo.id}">削除</button>
      </div>
    </article>
  `;
}

function renderList() {
  const memos = filteredMemos();
  elements.memoCount.textContent = `${memos.length}件`;
  renderSummary();
  renderGroupedNotes();

  if (memos.length === 0) {
    elements.memoList.innerHTML = '<p class="empty-message">条件に合うメモがありません。</p>';
    return;
  }

  elements.memoList.innerHTML = memos.map(renderMemoCard).join("");
}

function buildSummaryText() {
  const total = state.memos.length;
  const parts = ["Part1", "Part2", "Part3"].map((part) => {
    const count = state.memos.filter((memo) => memo.part === part).length;
    return `${part}: ${count}件`;
  });
  const weak = state.memos.filter((memo) => memo.understanding === "低");
  const important = state.memos.filter((memo) => memo.importance >= 4);
  const reviewItems = state.memos
    .filter((memo) => memo.understanding === "低" || memo.importance >= 4)
    .sort((a, b) => b.importance - a.importance || new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 8);

  const lines = [
    "CIA直前確認ノート 学習まとめ",
    `総メモ数: ${total}件`,
    ...parts,
    `理解度が低い: ${weak.length}件`,
    `重要度★4以上: ${important.length}件`,
    "",
    "優先して見直す項目:"
  ];

  if (reviewItems.length === 0) {
    lines.push("なし");
  } else {
    reviewItems.forEach((memo, index) => {
      lines.push(`${index + 1}. [${memo.part}] ${memo.title} / 理解度${memo.understanding} / ${starText(memo.importance)}`);
      if (memo.trap) lines.push(`   ひっかけ: ${memo.trap}`);
    });
  }

  return lines.join("\n");
}

function renderSummary() {
  if (!elements.summaryBox) return;

  const total = state.memos.length;
  const low = state.memos.filter((memo) => memo.understanding === "低").length;
  const highImportance = state.memos.filter((memo) => memo.importance >= 4).length;
  const savedAnswers = state.memos.filter((memo) => memo.answer || memo.source).length;
  const reviewItems = state.memos
    .filter((memo) => memo.understanding === "低" || memo.importance >= 4)
    .sort((a, b) => b.importance - a.importance || new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  const itemsHtml = reviewItems.length
    ? `<ol class="summary-list">${reviewItems.map((memo) => `<li>${escapeHtml(memo.title)} <span class="tag">${escapeHtml(memo.part)}</span></li>`).join("")}</ol>`
    : '<p class="empty-message">優先見直し項目はまだありません。</p>';

  elements.summaryBox.innerHTML = `
    <div class="summary-stat-grid">
      <div class="summary-stat"><strong>${total}</strong><span>保存メモ</span></div>
      <div class="summary-stat"><strong>${savedAnswers}</strong><span>チャット保存</span></div>
      <div class="summary-stat"><strong>${low}</strong><span>理解度 低</span></div>
      <div class="summary-stat"><strong>${highImportance}</strong><span>重要度★4以上</span></div>
    </div>
    <div>
      <h3>優先して見直す項目</h3>
      ${itemsHtml}
    </div>
  `;
}

function groupedMemos() {
  const groups = new Map();
  state.memos.forEach((memo) => {
    const key = `${memo.part}__${memo.category || "未分類"}`;
    if (!groups.has(key)) {
      groups.set(key, {
        part: memo.part,
        category: memo.category || "未分類",
        memos: []
      });
    }
    groups.get(key).memos.push(memo);
  });

  return Array.from(groups.values()).sort((a, b) => {
    return a.part.localeCompare(b.part) || a.category.localeCompare(b.category);
  });
}

function buildGroupedText() {
  const groups = groupedMemos();
  if (groups.length === 0) return "保存済みメモはまだありません。";

  return groups.map((group) => {
    const lines = [`【${group.part} / ${group.category}】`];
    group.memos
      .sort((a, b) => b.importance - a.importance || new Date(b.updatedAt) - new Date(a.updatedAt))
      .forEach((memo, index) => {
        lines.push(`${index + 1}. ${memo.title}（理解度${memo.understanding} / ${starText(memo.importance)}）`);
        lines.push(`   ${memo.content}`);
        if (memo.trap) lines.push(`   ひっかけ: ${memo.trap}`);
      });
    return lines.join("\n");
  }).join("\n\n");
}

function renderGroupedNotes() {
  if (!elements.groupedNotes) return;
  const groups = groupedMemos();

  if (groups.length === 0) {
    elements.groupedNotes.innerHTML = '<p class="empty-message">保存すると、ここにPart・分野別の確認資料が表示されます。</p>';
    return;
  }

  elements.groupedNotes.innerHTML = groups.map((group) => {
    const items = group.memos
      .sort((a, b) => b.importance - a.importance || new Date(b.updatedAt) - new Date(a.updatedAt))
      .map((memo) => `
        <li>
          <strong>${escapeHtml(memo.title)}</strong>
          <span class="tag ${understandingClass(memo.understanding)}">理解度 ${escapeHtml(memo.understanding)}</span>
          <span class="tag">重要度 ${starText(memo.importance)}</span>
          <p>${escapeHtml(memo.content)}</p>
        </li>
      `).join("");

    return `
      <details class="group-block" open>
        <summary>${escapeHtml(group.part)} / ${escapeHtml(group.category)} <span>${group.memos.length}件</span></summary>
        <ol class="group-list">${items}</ol>
      </details>
    `;
  }).join("");
}

function editMemo(id) {
  const memo = state.memos.find((item) => item.id === id);
  if (!memo) return;

  elements.memoId.value = memo.id;
  elements.title.value = memo.title;
  elements.part.value = memo.part;
  elements.category.value = memo.category;
  elements.content.value = memo.content;
  elements.trap.value = memo.trap;
  elements.understanding.value = memo.understanding;
  elements.importance.value = String(memo.importance);
  elements.submitButton.textContent = "更新する";
  elements.cancelEditButton.classList.remove("hidden");
  elements.form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteMemo(id) {
  const memo = state.memos.find((item) => item.id === id);
  if (!memo) return;

  if (!window.confirm(`「${memo.title}」を削除しますか？`)) return;

  state.memos = state.memos.filter((item) => item.id !== id);
  saveMemos();
  renderList();
  startReview(false);
  showToast("削除しました");
}

function startReview(announce = true) {
  state.reviewItems = state.memos
    .filter((memo) => memo.understanding === "低" || memo.importance >= 4)
    .sort((a, b) => b.importance - a.importance || new Date(b.updatedAt) - new Date(a.updatedAt));
  state.reviewIndex = 0;
  renderReview();
  if (announce) {
    showToast(state.reviewItems.length > 0 ? "直前確認を開始しました" : "確認対象のメモがありません");
  }
}

function renderReview() {
  const total = state.reviewItems.length;
  const memo = state.reviewItems[state.reviewIndex];
  elements.reviewCounter.textContent = total ? `${state.reviewIndex + 1} / ${total}` : "0 / 0";
  elements.prevReviewButton.disabled = state.reviewIndex <= 0;
  elements.nextReviewButton.disabled = state.reviewIndex >= total - 1;

  if (!memo) {
    elements.reviewCard.innerHTML = '<p class="empty-message">理解度「低」または重要度★4以上のメモはありません。</p>';
    return;
  }

  elements.reviewCard.innerHTML = `
    <article class="review-card-inner ${memo.importance >= 4 ? "high-importance" : ""}">
      <div class="memo-card-header">
        <h3 class="memo-title">${escapeHtml(memo.title)}</h3>
        <span class="tag">${escapeHtml(memo.part)}</span>
      </div>
      <div class="tag-row">
        ${memo.category ? `<span class="tag">${escapeHtml(memo.category)}</span>` : ""}
        <span class="tag ${understandingClass(memo.understanding)}">理解度 ${escapeHtml(memo.understanding)}</span>
        <span class="tag">重要度 ${starText(memo.importance)}</span>
      </div>
      <p class="memo-text">${escapeHtml(memo.content)}</p>
      ${memo.trap ? `<div class="trap-box"><strong>ひっかけポイント</strong><div>${escapeHtml(memo.trap)}</div></div>` : ""}
      <button class="understood-button" type="button" data-action="understood" data-id="${memo.id}">理解できた</button>
    </article>
  `;
}

function raiseUnderstanding(id) {
  const memo = state.memos.find((item) => item.id === id);
  if (!memo) return;

  if (memo.understanding === "低") {
    memo.understanding = "中";
  } else if (memo.understanding === "中") {
    memo.understanding = "高";
  }

  memo.updatedAt = new Date().toISOString();
  saveMemos();
  renderList();
  startReview(false);
  showToast("理解度を上げました");
}

function exportJson() {
  const data = JSON.stringify({
    app: "CIA直前確認ノート",
    version: 2,
    exportedAt: new Date().toISOString(),
    memos: state.memos
  }, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `cia-notes-${date}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("JSONをエクスポートしました");
}

function getImportItems(imported) {
  if (Array.isArray(imported)) return imported;
  if (Array.isArray(imported.memos)) return imported.memos;
  if (Array.isArray(imported.notes)) return imported.notes;
  if (Array.isArray(imported.items)) return imported.items;
  if (Array.isArray(imported.data)) return imported.data;
  if (Array.isArray(imported["メモ"])) return imported["メモ"];
  if (Array.isArray(imported["学習メモ"])) return imported["学習メモ"];
  if (imported && typeof imported === "object" && (
    imported.title || imported["タイトル"] ||
    imported.content || imported["内容メモ"] ||
    imported.memo || imported.answer || imported["回答"] ||
    imported.source || imported.chatLog || imported["チャット履歴"]
  )) {
    return [imported];
  }
  throw new Error("取り込めるメモが見つかりません");
}

function parseImportText(text) {
  const cleanText = extractJsonCandidate(text);
  if (!cleanText) throw new Error("JSONファイルが空です");

  const parsed = parseJsonRelaxed(cleanText);
  const items = getImportItems(parsed);
  if (items.length === 0) throw new Error("取り込めるメモがありません");
  return items;
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const importedItems = parseImportText(String(reader.result || ""));
      const normalized = importedItems.map((item) => normalizeMemo(item, { importance: 3 }));

      const merged = new Map(state.memos.map((memo) => [memo.id, memo]));
      normalized.forEach((memo) => merged.set(memo.id, memo));
      state.memos = Array.from(merged.values());
      saveMemos();
      renderList();
      startReview(false);
      showToast(`${normalized.length}件インポートしました`);
    } catch (error) {
      showToast(error.message || "JSONの形式を確認してください");
    } finally {
      elements.importFile.value = "";
    }
  };
  reader.readAsText(file);
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const memo = getFormMemo();

  if (!memo.title || !memo.content) {
    showToast("タイトルと内容メモを入力してください");
    return;
  }

  const existingIndex = state.memos.findIndex((item) => item.id === memo.id);
  if (existingIndex >= 0) {
    state.memos[existingIndex] = memo;
    showToast("更新しました");
  } else {
    state.memos.unshift(memo);
    showToast("登録しました");
  }

  saveMemos();
  resetForm();
  renderList();
  startReview(false);
});

elements.copyPromptButton.addEventListener("click", async () => {
  const prompt = `このチャットで私が質問したCIA試験の不明点を、試験直前に見返すための学習メモとして整理してください。

必ず次のJSONだけを返してください。説明文やMarkdownは不要です。

{
  "memos": [
    {
      "title": "論点名を短く",
      "part": "Part1 / Part2 / Part3 のどれか",
      "category": "分野名。例: 監査計画・リスク評価、監査実施・証拠、報告・フォローアップ、ガバナンス・統制、IT、会計・財務など",
      "content": "要点。試験直前に読み返せるように簡潔に整理",
      "trap": "試験でのひっかけポイント、選択肢で迷いやすい点",
      "understanding": "低",
      "importance": 4
    }
  ]
}

条件:
- 私の質問1つにつき、原則1メモにしてください。
- 同じ論点は統合してください。
- partは必ず Part1 / Part2 / Part3 の表記にしてください。
- importanceは1から5の数字にしてください。
- JSONとしてそのままパースできる形にしてください。`;

  try {
    await navigator.clipboard.writeText(prompt);
    showToast("ChatGPTへの依頼文をコピーしました");
  } catch {
    elements.chatHistory.value = prompt;
    showToast("依頼文を入力欄に入れました");
  }
});

elements.pasteChatButton.addEventListener("click", async () => {
  try {
    elements.chatHistory.value = await navigator.clipboard.readText();
    showToast("貼り付けました");
  } catch {
    showToast("貼り付けは手動で行ってください");
  }
});

elements.previewChatButton.addEventListener("click", () => {
  const memos = parseChatInput();
  if (!memos) return;
  const isUnstructured = memos.length === 1 && memos[0].category === "未整理ログ";
  elements.classificationPreview.innerHTML = `
    <p class="section-note">${isUnstructured ? "JSONとして認識できなかったため、未整理ログ1件として扱います。" : `${memos.length}件のJSONメモとして認識しました。`}</p>
    ${memos.map((memo) => `
      <article class="preview-item">
        <strong>${escapeHtml(memo.title)}</strong>
        <div class="tag-row">
          <span class="tag">${escapeHtml(memo.part)}</span>
        <span class="tag">${escapeHtml(memo.category)}</span>
        <span class="tag">重要度 ${starText(memo.importance)}</span>
      </div>
      <p>${escapeHtml(compactText(memo.content, 160))}</p>
      ${isUnstructured ? `<div class="trap-box"><strong>読み取り状態</strong><div>${escapeHtml(memo.trap)}</div></div>` : ""}
    </article>
  `).join("")}
  `;
  showToast(`${memos.length}件を認識しました`);
});

elements.importChatButton.addEventListener("click", () => {
  const memos = parseChatInput();
  if (!memos) return;

  state.memos = [...memos, ...state.memos];
  saveMemos();
  renderList();
  startReview(false);
  elements.chatHistory.value = "";
  elements.classificationPreview.innerHTML = '<p class="empty-message">分類結果のプレビューがここに表示されます。</p>';
  showToast(`${memos.length}件登録しました`);
});

elements.copySummaryButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(buildSummaryText());
    showToast("学習まとめをコピーしました");
  } catch {
    showToast("コピーできませんでした");
  }
});

elements.copyGroupedButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(buildGroupedText());
    showToast("分野別資料をコピーしました");
  } catch {
    showToast("コピーできませんでした");
  }
});

elements.memoList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  if (button.dataset.action === "edit") editMemo(button.dataset.id);
  if (button.dataset.action === "delete") deleteMemo(button.dataset.id);
});

elements.reviewCard.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action='understood']");
  if (!button) return;
  raiseUnderstanding(button.dataset.id);
});

[elements.filterPart, elements.filterUnderstanding, elements.sortOrder, elements.searchKeyword].forEach((input) => {
  input.addEventListener("input", renderList);
});

elements.resetFiltersButton.addEventListener("click", () => {
  elements.filterPart.value = "all";
  elements.filterUnderstanding.value = "all";
  elements.sortOrder.value = "newest";
  elements.searchKeyword.value = "";
  renderList();
});

elements.cancelEditButton.addEventListener("click", resetForm);
elements.startReviewButton.addEventListener("click", () => startReview(true));
elements.quickModeButton.addEventListener("click", () => {
  document.getElementById("reviewTitle").scrollIntoView({ behavior: "smooth", block: "start" });
  startReview(true);
});
elements.prevReviewButton.addEventListener("click", () => {
  state.reviewIndex = Math.max(0, state.reviewIndex - 1);
  renderReview();
});
elements.nextReviewButton.addEventListener("click", () => {
  state.reviewIndex = Math.min(state.reviewItems.length - 1, state.reviewIndex + 1);
  renderReview();
});
elements.exportButton.addEventListener("click", exportJson);
elements.importFile.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) importJson(file);
});

loadMemos();
renderList();
renderReview();
renderSummary();
renderGroupedNotes();
