"use strict";

const SUPABASE_URL = "https://fgeubvabnjvbirikuuqz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_s2AKhaEdG2wG-_wnkx6QAA_xjReFini";

const supabaseClient = window.supabase?.createClient
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;

const themeToggle = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("quran-explorer-theme");

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark-theme", isDark);
  themeToggle.textContent = isDark ? "হালকা মোড" : "গাঢ় মোড";
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

applyTheme(savedTheme === "dark" ? "dark" : "light");

themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.contains("dark-theme");
  const nextTheme = isDark ? "light" : "dark";
  localStorage.setItem("quran-explorer-theme", nextTheme);
  applyTheme(nextTheme);
});

const surahBrowser = document.getElementById("surahBrowser");
const surahReader = document.getElementById("surahReader");
const surahListElement = document.getElementById("surahList");
const surahSearch = document.getElementById("surahSearch");
const paraSearch = document.getElementById("paraSearch");
const paraListElement = document.getElementById("paraList");
const showSurahIndexButton = document.getElementById("showSurahIndex");
const showParaIndexButton = document.getElementById("showParaIndex");
const surahIndexControls = document.getElementById("surahIndexControls");
const paraIndexPanel = document.getElementById("paraIndexPanel");
const surahCount = document.getElementById("surahCount");
const makkiCount = document.getElementById("makkiCount");
const madaniCount = document.getElementById("madaniCount");
const surahHeader = document.getElementById("surahHeader");
const ayahList = document.getElementById("ayahList");
const appMessage = document.getElementById("appMessage");

const backToSurahs = document.getElementById("backToSurahs");
const previousSurah = document.getElementById("previousSurah");
const nextSurah = document.getElementById("nextSurah");

const adminStatus = document.getElementById("adminStatus");
const adminLoginToggle = document.getElementById("adminLoginToggle");
const adminLogout = document.getElementById("adminLogout");
const adminLoginPanel = document.getElementById("adminLoginPanel");
const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");
const adminLoginSubmit = document.getElementById("adminLoginSubmit");
const adminLoginCancel = document.getElementById("adminLoginCancel");
const adminLoginMessage = document.getElementById("adminLoginMessage");
const homeView = document.getElementById("homeView");
const quranSection = document.getElementById("quranSection");
const topicsSection = document.getElementById("topicsSection");
const asmaulHusnaSection = document.getElementById("asmaulHusnaSection");
const openAsmaulHusnaCard = document.getElementById("openAsmaulHusnaCard");
const backHomeFromAsmaulHusna = document.getElementById("backHomeFromAsmaulHusna");
const asmaulHusnaSearch = document.getElementById("asmaulHusnaSearch");
const asmaulHusnaMessage = document.getElementById("asmaulHusnaMessage");
const asmaulHusnaList = document.getElementById("asmaulHusnaList");
const openQuranCard = document.getElementById("openQuranCard");
const openTopicsCard = document.getElementById("openTopicsCard");
const backHomeFromQuran = document.getElementById("backHomeFromQuran");
const backHomeFromReader = document.getElementById("backHomeFromReader");
const backHomeFromTopics = document.getElementById("backHomeFromTopics");
const topicAdminPanel = document.getElementById("topicAdminPanel");
const topicTitleInput = document.getElementById("topicTitleInput");
const topicCategorySelect = document.getElementById("topicCategorySelect");
const newTopicCategoryField = document.getElementById("newTopicCategoryField");
const newTopicCategoryInput = document.getElementById("newTopicCategoryInput");
const topicAyahCategorySelect = document.getElementById("topicAyahCategorySelect");
const topicSearchInput = document.getElementById("topicSearchInput");
const topicBackButton = document.getElementById("topicBackButton");
const selectedTopicCategoryLabel = document.getElementById("selectedTopicCategoryLabel");
const createTopicButton = document.getElementById("createTopicButton");
const topicAyahSelect = document.getElementById("topicAyahSelect");
const topicSurahSelect = document.getElementById("topicSurahSelect");
const topicAyahNumberSelect = document.getElementById("topicAyahNumberSelect");
const addTopicAyahButton = document.getElementById("addTopicAyahButton");
const topicsList = document.getElementById("topicsList");
const topicsMessage = document.getElementById("topicsMessage");

let surahs = [];
let paraIndex = [];
let currentListMode = "surah";
let currentStartAyah = 1;

let currentRevelationFilter = "all";
const sajdahAyahKeys = new Set([
  "7:206", "13:15", "16:50", "17:109",
  "19:58", "22:18", "25:60", "27:26",
  "32:15", "38:24", "41:38", "53:62",
  "84:21", "96:19"
]);

let currentSurahNumber = null;
let isQuranAdmin = false;
let isSurahEditing = false;
let currentSurahData = null;
let quranTopics = [];
let quranTopicCategories = [];
let topicAyahs = [];
let selectedTopicCategory = null;
let selectedQuranTopicId = null;
let topicSearchQuery = "";
let topicBrowseLevel = "categories";
let topicDetailRenderToken = 0;
const topicSurahDataCache = new Map();

function showMessage(message, isError = false) {
  appMessage.textContent = message;
  appMessage.classList.toggle("error-message", isError);
}


function createSurahTable(items) {
  const table = document.createElement("table");
  table.className = "surah-index-table";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  ["সূরা নং", "সূরার নাম", "পারা", "আয়াত সংখ্যা", "অবতীর্ণ"].forEach((label) => {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = label;
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  if (items.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.textContent = "কোনো সূরা পাওয়া যায়নি";
    row.appendChild(cell);
    tbody.appendChild(row);
  } else {
    items.forEach((surah) => {
      const row = document.createElement("tr");
      row.className = surah.revelation_bn === "মাক্কী"
        ? "surah-row-makki"
        : "surah-row-madani";

      const numberCell = document.createElement("td");
      numberCell.textContent = surah.surah.toLocaleString("bn-BD");

      const nameCell = document.createElement("td");
      nameCell.className = "surah-name-cell";

      const nameButton = document.createElement("button");
      nameButton.type = "button";
      nameButton.className = "surah-table-link";
      nameButton.textContent = surah.name_bn;
      nameButton.setAttribute("aria-label", `সূরা ${surah.surah}: ${surah.name_bn} খুলুন`);
      nameButton.addEventListener("click", () => openSurah(surah.surah));
      nameCell.appendChild(nameButton);

      const paraCell = document.createElement("td");
      paraCell.className = "surah-para-cell";
      paraCell.textContent = (surah.para_numbers || [])
        .map((para) => Number(para).toLocaleString("bn-BD"))
        .join(", ") || "—";

      const ayahCell = document.createElement("td");
      ayahCell.textContent = surah.total_ayahs.toLocaleString("bn-BD");

      const revelationCell = document.createElement("td");
      revelationCell.textContent = surah.revelation_bn || "—";

      row.append(numberCell, nameCell, paraCell, ayahCell, revelationCell);
      tbody.appendChild(row);
    });
  }

  table.appendChild(tbody);
  return table;
}

function renderSurahList(query = "") {
  const normalizedQuery = query.trim().toLocaleLowerCase("bn");
  const englishQuery = normalizedQuery.replace(/[০-৯]/g, (digit) =>
    "০১২৩৪৫৬৭৮৯".indexOf(digit).toString()
  );
  const isNumericQuery = /^\d+$/.test(englishQuery);

  const filtered = surahs.filter((surah) => {
    const matchesQuery = isNumericQuery
      ? Number(surah.surah) === Number(englishQuery)
      : surah.name_bn.toLocaleLowerCase("bn").includes(normalizedQuery);

    const matchesRevelation =
      currentRevelationFilter === "all" ||
      surah.revelation_bn === currentRevelationFilter;

    return matchesQuery && matchesRevelation;
  });

  surahListElement.replaceChildren();

  if (filtered.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-message";
    empty.textContent = "কোনো সূরা পাওয়া যায়নি। অন্য নাম বা নম্বর দিয়ে খুঁজুন।";
    surahListElement.appendChild(empty);
    return;
  }

  const layout = document.createElement("div");
  layout.className = "surah-tables";

  layout.append(
    createSurahTable(filtered.filter((surah) => surah.surah <= 57)),
    createSurahTable(filtered.filter((surah) => surah.surah >= 58))
  );

  surahListElement.appendChild(layout);
}


function renderParaList(query = "") {
  if (!paraListElement) return;

  const normalizedQuery = query.trim().toLocaleLowerCase("bn");
  const englishQuery = normalizedQuery.replace(/[০-৯]/g, (digit) =>
    "০১২৩৪৫৬৭৮৯".indexOf(digit).toString()
  );

  const isNumericQuery = /^\d+$/.test(englishQuery);

  const filtered = paraIndex.filter((para) => {
    return isNumericQuery
      ? Number(para.para) === Number(englishQuery)
      : false;
  });

  paraListElement.replaceChildren();

  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.className = "empty-message";
    empty.textContent = "কোনো পারা পাওয়া যায়নি। অন্য নম্বর দিয়ে খুঁজুন।";
    paraListElement.appendChild(empty);
    return;
  }

  const layout = document.createElement("div");
  layout.className = "para-list";

  filtered.forEach((para) => {
    const card = document.createElement("article");
    card.className = "para-card";

    const heading = document.createElement("h3");
    heading.textContent = `পারা ${Number(para.para).toLocaleString("bn-BD")}`;

    const totalAyahs = para.segments.reduce(
      (total, segment) =>
        total + Number(segment.end_ayah) - Number(segment.start_ayah) + 1,
      0
    );

    const summary = document.createElement("p");
    summary.className = "para-summary";
    summary.textContent =
      `${para.segments.length.toLocaleString("bn-BD")}টি সূরা অংশ · ` +
      `${totalAyahs.toLocaleString("bn-BD")}টি আয়াত`;

    const segmentList = document.createElement("ul");
    segmentList.className = "para-segments";

    para.segments.forEach((segment) => {
      const surah = surahs.find(
        (item) => Number(item.surah) === Number(segment.surah)
      );
      const item = document.createElement("li");
      const surahName = surah
        ? surah.name_bn
        : `সূরা ${Number(segment.surah).toLocaleString("bn-BD")}`;

      item.textContent =
        `${surahName} — আয়াত ` +
        `${Number(segment.start_ayah).toLocaleString("bn-BD")}–` +
        `${Number(segment.end_ayah).toLocaleString("bn-BD")}`;

      segmentList.appendChild(item);
    });

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "para-open-button";
    openButton.textContent = "পারা খুলুন";
    openButton.addEventListener("click", () => {
      const firstSegment = para.segments[0];
      if (firstSegment) {
        openSurah(
          Number(firstSegment.surah),
          Number(firstSegment.start_ayah)
        );
      }
    });

    card.append(heading, summary, segmentList, openButton);
    layout.appendChild(card);
  });

  paraListElement.appendChild(layout);
}

async function loadParaIndex() {
  try {
    let data;

    if (window.location.protocol === "file:") {
      data = window.QuranOfflineData?.paraIndex;
    } else {
      const response = await fetch("data/para-index.json");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      data = await response.json();
    }

    if (!data || !Array.isArray(data.paras) || data.paras.length !== 30) {
      throw new Error("৩০ পারার সম্পূর্ণ তালিকা পাওয়া যায়নি।");
    }

    paraIndex = data.paras;

    if (
      paraIndex.some(
        (para, index) =>
          Number(para.para) !== index + 1 ||
          !Array.isArray(para.segments) ||
          para.segments.length === 0
      )
    ) {
      throw new Error("পারা তালিকার ডেটা সঠিক নয়।");
    }

    renderParaList(paraSearch?.value || "");
    console.info("৩০ পারার তালিকা সফলভাবে লোড হয়েছে।");
  } catch (error) {
    console.error("Para index loading failed:", error);
    if (paraListElement) {
      paraListElement.textContent =
        "পারা তালিকা লোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।";
    }
  }
}

function setIndexMode(mode) {
  currentListMode = mode === "para" ? "para" : "surah";

  if (surahIndexControls) {
    surahIndexControls.hidden = currentListMode !== "surah";
  }
  if (paraIndexPanel) {
    paraIndexPanel.hidden = currentListMode !== "para";
  }

  const countGroup = document.querySelector(".surah-count-group");
  if (countGroup) {
    countGroup.hidden = currentListMode !== "surah";
  }

  if (showSurahIndexButton) {
    showSurahIndexButton.setAttribute(
      "aria-pressed",
      String(currentListMode === "surah")
    );
  }
  if (showParaIndexButton) {
    showParaIndexButton.setAttribute(
      "aria-pressed",
      String(currentListMode === "para")
    );
  }

  if (currentListMode === "para") {
    renderParaList(paraSearch?.value || "");
  } else {
    renderSurahList(surahSearch?.value || "");
  }
}

showSurahIndexButton?.addEventListener("click", () => setIndexMode("surah"));
showParaIndexButton?.addEventListener("click", () => setIndexMode("para"));
paraSearch?.addEventListener("input", () => renderParaList(paraSearch.value));

async function loadSurahList() {
  try {
    let data;
    if (window.location.protocol === "file:") {
      data = window.QuranOfflineData?.surahList;
    } else {
      const response = await fetch("data/surah-list.json");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      data = await response.json();
    }
    if (!data) throw new Error("সূরার তালিকার স্থানীয় তথ্য পাওয়া যায়নি।");

    if (!Array.isArray(data.surahs) || data.surahs.length !== 114) {
      throw new Error("সূরার তালিকা সঠিক নয়।");
    }

    surahs = data.surahs;

    if (supabaseClient) {
      try {
        const { data: nameRows, error } = await supabaseClient
          .from("quran_surah_names_bn")
          .select("surah_no,name_bn")
          .eq("is_published", true)
          .order("surah_no", { ascending: true });

        if (error) {
          throw error;
        }

        if (!Array.isArray(nameRows) || nameRows.length !== 114) {
          throw new Error("Supabase থেকে সম্পূর্ণ ১১৪টি প্রকাশিত সূরার নাম পাওয়া যায়নি।");
        }

        const nameMap = new Map(
          nameRows.map((row) => [Number(row.surah_no), row.name_bn])
        );

        if (!surahs.every((surah) => nameMap.has(surah.surah))) {
          throw new Error("Supabase সূরার নামের তালিকা অসম্পূর্ণ।");
        }

        surahs = surahs.map((surah) => ({
          ...surah,
          name_bn: nameMap.get(surah.surah)
        }));

        console.info("Supabase থেকে ১১৪টি সূরার নাম লোড হয়েছে।");
      } catch (supabaseError) {
        console.warn(
          "Supabase name loading failed; local names are being used:",
          supabaseError
        );
      }
    } else {
      console.warn("Supabase library unavailable; local names are being used.");
    }

    surahCount.textContent = `${surahs.length.toLocaleString("bn-BD")}টি সূরা`;
    const makkiTotal = surahs.filter((surah) => surah.revelation_bn === "মাক্কী").length;
    const madaniTotal = surahs.filter((surah) => surah.revelation_bn === "মাদানী").length;
    makkiCount.textContent = `মাক্কী সূরা: ${makkiTotal.toLocaleString("bn-BD")}টি`;
    madaniCount.textContent = `মাদানী সূরা: ${madaniTotal.toLocaleString("bn-BD")}টি`;
    renderSurahList();
    await loadParaIndex();
    renderTopicAdminControls();
  } catch (error) {
    console.error("Surah list loading failed:", error);
    surahListElement.textContent = "সূরার তালিকা লোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করে পেজটি আবার খুলুন।";
    showMessage("সূরার তালিকা লোড করতে সমস্যা হয়েছে।", true);
  }
}
function sanitizeFootnotes(html) {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(String(html || ""), "text/html");
  const allowedTags = new Set(["B", "STRONG", "I", "EM", "BR", "P", "UL", "OL", "LI"]);

  function cleanNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      const pattern = /\[([\d\u09E6-\u09EF]+)\]/g;
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let match;

      while ((match = pattern.exec(text)) !== null) {
        if (match.index > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        }

        const reference = document.createElement("span");
        reference.className = "footnote-reference";
        reference.textContent = match[0];
        fragment.appendChild(reference);
        lastIndex = pattern.lastIndex;
      }

      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      return fragment;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return document.createDocumentFragment();
    }

    if (!allowedTags.has(node.tagName)) {
      const fragment = document.createDocumentFragment();
      node.childNodes.forEach((child) => fragment.appendChild(cleanNode(child)));
      return fragment;
    }

    const cleanElement = document.createElement(node.tagName.toLowerCase());
    node.childNodes.forEach((child) => cleanElement.appendChild(cleanNode(child)));
    return cleanElement;
  }

  const result = document.createDocumentFragment();
  parsed.body.childNodes.forEach((node) => result.appendChild(cleanNode(node)));
  return result;
}

function createEditField(labelText, value, sourceAya, fieldName, extraClass = "") {
  const wrapper = document.createElement("div");
  wrapper.className = "ayah-edit-field";

  const label = document.createElement("label");
  label.textContent = labelText;

  const input = document.createElement("textarea");
  input.className = `ayah-edit-input ${extraClass}`.trim();
  input.value = value || "";
  input.dataset.sourceAya = String(sourceAya);
  input.dataset.field = fieldName;
  input.dataset.original = value || "";

  wrapper.append(label, input);
  return wrapper;
}

function createAyahCard(ayah) {
  const article = document.createElement("article");
  article.className = "ayah-card";
  article.dataset.sourceAya = String(ayah._sourceAya);

  const top = document.createElement("div");
  top.className = "ayah-top";

  const number = document.createElement("span");
  number.className = "ayah-number";
  number.textContent = `আয়াত ${ayah.aya.toLocaleString("bn-BD")}`;
  top.appendChild(number);

  const arabic = document.createElement("p");
  arabic.className = "ayah-arabic";
  if (sajdahAyahKeys.has(`${currentSurahNumber}:${ayah._sourceAya}`)) {
    arabic.classList.add("sajdah-ayah-highlight");
  }
  arabic.lang = "ar";
  arabic.dir = "rtl";
  const arabicAyahNumber = String(ayah._sourceAya).replace(
    /[0-9]/g,
    (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]
  );
  arabic.textContent = `${ayah.arabic} ﴿${arabicAyahNumber}﴾`;

  const translationLabel = document.createElement("h3");
  translationLabel.className = "translation-label";
  translationLabel.textContent = "বাংলা অনুবাদ :";

  article.append(top, arabic, translationLabel);

  if (isSurahEditing) {
    article.appendChild(
      createEditField("বাংলা অনুবাদ", ayah.translation, ayah._sourceAya, "translation")
    );
  } else {
    const translation = document.createElement("p");
    translation.className = "ayah-translation";
    translation.appendChild(sanitizeFootnotes(ayah.translation || ""));

    article.appendChild(translation);
  }

  if ((ayah.footnotes && ayah.footnotes.trim()) || isSurahEditing) {
    const details = document.createElement("details");
    details.className = "footnote-details";
    details.open = isSurahEditing;

    const summary = document.createElement("summary");
    summary.textContent = "ব্যাখ্যা ও ফুটনোট দেখুন";

    const content = document.createElement("div");
    content.className = "footnote-content";

    if (isSurahEditing) {
      content.appendChild(
        createEditField(
          "ব্যাখ্যামূলক টীকা (লেখার বিন্যাস সমর্থিত)",
          ayah.footnotes,
          ayah._sourceAya,
          "footnotes",
          "ayah-edit-footnotes"
        )
      );
    } else {
      content.appendChild(sanitizeFootnotes(ayah.footnotes));
    }

    details.append(summary, content);
    article.appendChild(details);
  }

  return article;
}

function removeBismillahPrefix(arabic) {
  const words = arabic.trim().split(/\s+/);
  const normalized = words.slice(0, 4).join(" ").replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "");

  if (normalized !== "بسم الله الرحمن الرحيم") {
    throw new Error("প্রথম আয়াত থেকে বিসমিল্লাহ আলাদা করা যায়নি।");
  }

  return words.slice(4).join(" ");
}

function createSurahEditToolbar() {
  const toolbar = document.createElement("div");
  toolbar.className = "surah-edit-toolbar";

  if (!isQuranAdmin) return toolbar;

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "surah-edit-button";
  editButton.textContent = isSurahEditing ? "সম্পাদনা চালু আছে" : "সম্পাদনা";

  editButton.addEventListener("click", () => {
    if (!isSurahEditing) {
      isSurahEditing = true;
      renderCurrentSurah();
    }
  });

  toolbar.appendChild(editButton);

  if (isSurahEditing) {
    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "surah-save-button";
    saveButton.textContent = "সংরক্ষণ ও প্রকাশ";
    saveButton.addEventListener("click", saveCurrentSurah);
    toolbar.appendChild(saveButton);

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "surah-cancel-button";
    cancelButton.textContent = "বাতিল";
    cancelButton.addEventListener("click", () => {
      isSurahEditing = false;
      renderCurrentSurah();
      showMessage("সম্পাদনা বাতিল করা হয়েছে।");
    });
    toolbar.appendChild(cancelButton);
  }

  return toolbar;
}

function renderCurrentSurah() {
  if (!currentSurahData || currentSurahNumber === null) return;

  const surah = surahs.find((item) => item.surah === currentSurahNumber);
  if (!surah) return;

  const toolbarLeft = document.querySelector(".reader-toolbar-left");
  toolbarLeft.querySelector(".surah-edit-toolbar")?.remove();
  if (isQuranAdmin) {
    toolbarLeft.appendChild(createSurahEditToolbar());
  }

  const heading = document.createElement("h2");
  heading.textContent = `সূরা ${currentSurahNumber.toLocaleString("bn-BD")} — ${surah.name_bn}`;

  let displayAyahs = currentSurahData.ayahs.map((ayah) => ({ ...ayah }));
  let fatihaIntro = null;
  let surahIntroFootnotes = null;

  if (currentSurahNumber === 1) {
    fatihaIntro = displayAyahs.shift();
    displayAyahs = displayAyahs.map((ayah, index) => ({
      ...ayah,
      aya: index + 1
    }));

    if (!isSurahEditing) {
      const finalAyah = displayAyahs[5];
      const arabicSplit = "غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ";
      const translationSplit = "যাদের উপর আপনার ক্রোধ আপতিত হয়নি [২]";

      if (!finalAyah || !finalAyah.arabic.includes(arabicSplit)) {
        throw new Error("সূরা ফাতিহার শেষ আয়াত বিভক্ত করা যায়নি।");
      }

      const arabicParts = finalAyah.arabic.split(arabicSplit);
      const translationParts = (finalAyah.translation || "").split(translationSplit);
      const translationCanSplit = translationParts.length === 2;

      displayAyahs = [
        ...displayAyahs.slice(0, 5),
        {
          ...finalAyah,
          aya: 6,
          arabic: arabicParts[0].trim(),
          translation: translationCanSplit ? translationParts[0].trim() : "",
          footnotes: ""
        },
        {
          ...finalAyah,
          aya: 7,
          arabic: arabicSplit,
          translation: translationCanSplit
            ? `${translationSplit}${translationParts[1]}`
            : finalAyah.translation
        }
      ];
    }
  } else if (currentSurahNumber !== 9) {
    displayAyahs[0].arabic = removeBismillahPrefix(displayAyahs[0].arabic);
  }

    if (currentSurahNumber !== 1 && !isSurahEditing) {
    const firstAyah = displayAyahs[0];
    const notes = firstAyah?.footnotes?.trim();

    if (notes) {
      surahIntroFootnotes = notes;
      firstAyah.footnotes = "";
    }
  }

if (!isSurahEditing && currentStartAyah > 1) {
  displayAyahs = displayAyahs.filter(
    (ayah) => Number(ayah.aya) >= currentStartAyah
  );
}

const count = document.createElement("p");
  count.textContent = currentSurahNumber === 1 && isSurahEditing
    ? "৭টি আয়াত (প্রশাসনিক সম্পাদনায় মূল ৬টি কুরআনএনক রেকর্ড)"
    : currentStartAyah > 1 && !isSurahEditing
      ? `আয়াত ${currentStartAyah.toLocaleString("bn-BD")}–${surah.total_ayahs.toLocaleString("bn-BD")}`
      : `${displayAyahs.length.toLocaleString("bn-BD")} আয়াত`;
  const headerItems = [heading, count];

  if (currentSurahNumber !== 9) {
    const bismillah = document.createElement("p");
    bismillah.className = "surah-bismillah";
    bismillah.lang = "ar";
    bismillah.dir = "rtl";
    bismillah.textContent = "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ";
    headerItems.push(bismillah);
  }

  const introFootnotes = fatihaIntro
    ? fatihaIntro.footnotes
    : surahIntroFootnotes;

  if (
    (introFootnotes && introFootnotes.trim()) ||
    (fatihaIntro && isSurahEditing)
  ) {
    const details = document.createElement("details");
    details.className = "footnote-details surah-intro-details";
    details.open = isSurahEditing;

    const summary = document.createElement("summary");
    summary.textContent = "সূরা পরিচিতি ও ব্যাখ্যা দেখুন";

    const content = document.createElement("div");
    content.className = "footnote-content";

    if (fatihaIntro && isSurahEditing) {
      content.appendChild(
        createEditField(
          "প্রথম আয়াতের ব্যাখ্যামূলক টীকা (লেখার বিন্যাস সমর্থিত)",
          fatihaIntro.footnotes,
          fatihaIntro._sourceAya,
          "footnotes",
          "ayah-edit-footnotes"
        )
      );
    } else {
      content.appendChild(sanitizeFootnotes(introFootnotes));
    }

    details.append(summary, content);
    headerItems.push(details);
  }
surahHeader.replaceChildren(...headerItems);

  const fragment = document.createDocumentFragment();
  displayAyahs.forEach((ayah) => fragment.appendChild(createAyahCard(ayah)));
  ayahList.replaceChildren(fragment);
}

async function openSurah(surahNumber, startAyah = 1) {
  const surah = surahs.find((item) => item.surah === surahNumber);
  if (!surah) {
    showMessage("নির্বাচিত সূরাটি পাওয়া যায়নি।", true);
    return;
  }

  currentSurahNumber = surahNumber;
  currentStartAyah = Math.max(
    1,
    Math.min(Number(startAyah) || 1, surah.total_ayahs)
  );
  isSurahEditing = false;
  currentSurahData = null;
  surahBrowser.hidden = true;
  surahReader.hidden = false;
  surahHeader.replaceChildren();
  ayahList.replaceChildren();

  const loading = document.createElement("p");
  loading.className = "loading-message";
  loading.textContent = "আয়াত লোড হচ্ছে...";
  ayahList.appendChild(loading);

  previousSurah.disabled = surahNumber === 1;
  nextSurah.disabled = surahNumber === 114;
  showMessage("");

  try {
    let data;
    if (window.location.protocol === "file:") {
      const numberKey = String(surahNumber).padStart(3, "0");
      data = window.QuranOfflineData?.surahs?.[numberKey];

      if (!data) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = `data/offline/surahs/surah-${numberKey}.js`;
          script.onload = resolve;
          script.onerror = () => reject(new Error(`Offline সূরা ${surahNumber} লোড করা যায়নি।`));
          document.head.appendChild(script);
        });
        data = window.QuranOfflineData?.surahs?.[numberKey];
      }
    } else {
      const filename = `surah-${String(surahNumber).padStart(3, "0")}.json`;
      const response = await fetch(`data/surahs/${filename}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      data = await response.json();
    }
    if (!data) throw new Error("সূরার স্থানীয় তথ্য পাওয়া যায়নি।");

    if (
      data.metadata.surah !== surahNumber ||
      !Array.isArray(data.ayahs) ||
      data.ayahs.length !== surah.total_ayahs
    ) {
      throw new Error("সূরার ডেটা যাচাই করা যায়নি।");
    }

    currentSurahData = {
      metadata: data.metadata,
      ayahs: data.ayahs.map((ayah) => ({
        ...ayah,
        _sourceAya: Number(ayah.aya)
      }))
    };

    if (supabaseClient) {
      try {
        const { data: corrections, error } = await supabaseClient
          .from("quran_bn_corrections_public")
          .select("surah_no,ayah_no,field_name,proposed_text")
          .eq("surah_no", surahNumber);

        if (error) throw error;

        for (const correction of (corrections || [])) {
          const target = currentSurahData.ayahs.find(
            (ayah) => Number(ayah._sourceAya) === Number(correction.ayah_no)
          );

          if (
            target &&
            ["translation", "footnotes"].includes(correction.field_name)
          ) {
            target[correction.field_name] = correction.proposed_text;
          }
        }
      } catch (correctionError) {
        console.warn("Approved corrections could not be loaded:", correctionError);
        showMessage("অনলাইন সংশোধন আনা যায়নি; সংরক্ষিত অনুবাদ দেখানো হচ্ছে।", true);
      }
    }

    renderCurrentSurah();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    console.error(`Surah ${surahNumber} loading failed:`, error);
    ayahList.textContent = "এই সূরার ডেটা লোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।";
    showMessage("সূরার ডেটা লোড করতে সমস্যা হয়েছে।", true);
  }
}

async function saveCurrentSurah() {
  if (!isQuranAdmin || !currentSurahData || !isSurahEditing || !supabaseClient) {
    showMessage("প্রশাসকের অনুমতি ছাড়া সংরক্ষণ করা যাবে না।", true);
    return;
  }

  const fields = [
    ...surahHeader.querySelectorAll("textarea[data-field]"),
    ...ayahList.querySelectorAll("textarea[data-field]")
  ];

  const changes = fields.filter(
    (field) => field.value !== field.dataset.original
  );

  if (changes.length === 0) {
    showMessage("কোনো পরিবর্তন পাওয়া যায়নি।");
    return;
  }

  for (const field of changes) {
    if (!field.value.trim()) {
      showMessage("অনুবাদ বা পাদটীকা ফাঁকা রাখা যাবে না।", true);
      field.focus();
      return;
    }
  }

  const saveButton = surahHeader.querySelector(".surah-save-button");
  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent = "সংরক্ষণ করা হচ্ছে...";
  }

  let savedCount = 0;

  for (const field of changes) {
    const sourceAya = Number(field.dataset.sourceAya);
    const fieldName = field.dataset.field;
    const newText = field.value;
    const target = currentSurahData.ayahs.find(
      (ayah) => Number(ayah._sourceAya) === sourceAya
    );

    if (!target || !["translation", "footnotes"].includes(fieldName)) {
      showMessage("একটি আয়াতের তথ্য যাচাই করা যায়নি।", true);
      break;
    }

    try {
      const { error } = await supabaseClient.rpc(
        "publish_quran_bn_correction",
        {
          p_surah_no: currentSurahNumber,
          p_ayah_no: sourceAya,
          p_field_name: fieldName,
          p_new_text: newText,
          p_reason: null
        }
      );

      if (error) throw error;

      target[fieldName] = newText;
      field.dataset.original = newText;
      savedCount += 1;
    } catch (error) {
      console.error("Correction publish failed:", error);
      showMessage(
        `${savedCount}টি পরিবর্তন Publish হয়েছে। পরবর্তী পরিবর্তনে সমস্যা: ${error.message || "অজানা ত্রুটি"}। বাকি পরিবর্তনগুলো Edit Mode-এ রাখা হয়েছে।`,
        true
      );
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.textContent = "আবার সংরক্ষণ করুন";
      }
      return;
    }
  }

  isSurahEditing = false;
  renderCurrentSurah();
  showMessage(`${savedCount.toLocaleString("bn-BD")}টি পরিবর্তন Supabase-এ Publish হয়েছে এবং History-তে সংরক্ষিত হয়েছে।`);
}

function showHomeView() {
  isSurahEditing = false;
  surahReader.hidden = true;
  surahBrowser.hidden = false;
  quranSection.hidden = true;
  topicsSection.hidden = true;
  asmaulHusnaSection.hidden = true;
  homeView.hidden = false;
  currentSurahNumber = null;
  currentSurahData = null;
  showMessage("");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showQuranHome() {
  homeView.hidden = true;
  topicsSection.hidden = true;
  asmaulHusnaSection.hidden = true;
  quranSection.hidden = false;
  showSurahList();
}

function setTopicsMessage(message, isError = false) {
  topicsMessage.textContent = message;
  topicsMessage.classList.toggle("error-message", isError);
}

function renderTopicSelect() {
  if (!topicAyahSelect || !topicAyahCategorySelect) return;

  const previousValue = topicAyahSelect.value;
  const selectedCategory = topicAyahCategorySelect.value;
  topicAyahSelect.replaceChildren();

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = selectedCategory
    ? "বিষয় নির্বাচন করুন"
    : "আগে শ্রেণি নির্বাচন করুন";
  topicAyahSelect.appendChild(placeholder);

  const filteredTopics = selectedCategory
    ? quranTopics.filter(
        (topic) => (topic.category || "অন্যান্য বিষয়").trim() === selectedCategory
      )
    : [];

  filteredTopics.forEach((topic) => {
    const option = document.createElement("option");
    option.value = topic.id;
    option.textContent = topic.title;
    topicAyahSelect.appendChild(option);
  });

  if (filteredTopics.some((topic) => topic.id === previousValue)) {
    topicAyahSelect.value = previousValue;
  }

  topicAyahSelect.disabled = !isQuranAdmin || filteredTopics.length === 0;
  updateTopicAyahButton();
}

function updateTopicAyahButton() {
  if (!addTopicAyahButton) return;

  addTopicAyahButton.disabled = !(
    isQuranAdmin &&
    topicAyahSelect.value &&
    topicSurahSelect.value &&
    topicAyahNumberSelect.value
  );
}


function getTopicCategories() {
  return quranTopicCategories.map((category) => ({ ...category }));
}

function renderTopicCategorySelect() {
  const categories = getTopicCategories();

  if (topicCategorySelect) {
    const previousValue = topicCategorySelect.value;
    topicCategorySelect.replaceChildren();

    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.name;
      option.textContent = category.name;
      topicCategorySelect.appendChild(option);
    });

    const newOption = document.createElement("option");
    newOption.value = "__new_category__";
    newOption.textContent = "＋ নতুন শ্রেণি তৈরি করুন";
    topicCategorySelect.appendChild(newOption);

    if (Array.from(topicCategorySelect.options).some(
      (option) => option.value === previousValue
    )) {
      topicCategorySelect.value = previousValue;
    }
  }

  if (topicAyahCategorySelect) {
    const previousValue = topicAyahCategorySelect.value;
    topicAyahCategorySelect.replaceChildren();

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "শ্রেণি নির্বাচন করুন";
    topicAyahCategorySelect.appendChild(placeholder);

    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.name;
      option.textContent = category.name;
      topicAyahCategorySelect.appendChild(option);
    });

    if (Array.from(topicAyahCategorySelect.options).some(
      (option) => option.value === previousValue
    )) {
      topicAyahCategorySelect.value = previousValue;
    }
  }

  if (newTopicCategoryField && topicCategorySelect) {
    newTopicCategoryField.hidden =
      topicCategorySelect.value !== "__new_category__";
  }
}

function makeTopicActionButton(label, className, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function renderTopicCategoryCards() {
  topicsList.className = "topics-list topic-category-grid";

  getTopicCategories().forEach((category) => {
    const items = quranTopics.filter(
      (topic) => (topic.category || "অন্যান্য বিষয়") === category.name
    );
    const ayahCount = topicAyahs.filter(
      (ayah) => items.some((topic) => topic.id === ayah.topic_id)
    ).length;

    const card = document.createElement("article");
    card.className = "topic-category-card";

    const icon = document.createElement("span");
    icon.className = "topic-category-icon";
    icon.textContent = category.icon;

    const openButton = makeTopicActionButton(
      "",
      "topic-category-open-button",
      () => {
        selectedTopicCategory = category.name;
        selectedQuranTopicId = null;
        topicBrowseLevel = "topics";
        renderTopicsList();
      }
    );

    const title = document.createElement("h3");
    title.textContent = category.name;

    const description = document.createElement("p");
    description.textContent = category.description;
    openButton.append(title, description);

    const count = document.createElement("span");
    count.className = "topic-category-count";
    count.textContent =
      `${items.length.toLocaleString("bn-BD")}টি বিষয় · ${ayahCount.toLocaleString("bn-BD")}টি আয়াত`;

    card.append(icon, openButton, count);

    if (isQuranAdmin) {
      const managementActions = document.createElement("div");
      managementActions.className = "topic-category-management-actions";
      managementActions.hidden = true;

      const managementButton = makeTopicActionButton(
        "ব্যবস্থাপনা",
        "topic-category-manage-button",
        () => {
          managementActions.hidden = !managementActions.hidden;
          managementButton.textContent = managementActions.hidden
            ? "ব্যবস্থাপনা"
            : "বন্ধ করুন";
        }
      );

      const renameButton = makeTopicActionButton(
        "নাম পরিবর্তন",
        "topic-category-rename-button",
        () => renameQuranCategory(category, items)
      );
      renameButton.title = "এই বিষয় শ্রেণির নাম পরিবর্তন করুন";

      const deleteButton = makeTopicActionButton(
        "মুছে ফেলুন",
        "topic-category-delete-button",
        () => deleteQuranCategory(category, items)
      );
      deleteButton.disabled = false;
      deleteButton.title = items.length
        ? "মুছে ফেলার আগে এই শ্রেণির সব বিষয় অন্য শ্রেণিতে সরাতে হবে"
        : "খালি শ্রেণিটি মুছে ফেলুন";

      managementActions.append(renameButton, deleteButton);
      card.append(managementButton, managementActions);
    }

    topicsList.appendChild(card);
  });
}
function renderTopicCards(items) {
  topicsList.className = "topics-list topic-topic-grid";

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "loading-message";
    empty.textContent = "এই বিষয় শ্রেণিতে এখনো কোনো বিষয় যোগ করা হয়নি।";
    topicsList.appendChild(empty);
    return;
  }

  items.forEach((topic) => {
    const ayahCount = topicAyahs.filter(
      (item) => item.topic_id === topic.id
    ).length;

    const card = document.createElement("article");
    card.className = "topic-card topic-browser-card";

    const heading = document.createElement("h3");
    heading.textContent = topic.title;

    const count = document.createElement("p");
    count.className = "topic-card-count";
    count.textContent = `${ayahCount.toLocaleString("bn-BD")}টি আয়াত সংযুক্ত`;

    const openButton = makeTopicActionButton("বিষয়টি পড়ুন →", "topic-open-button", () => {
      selectedQuranTopicId = topic.id;
      topicBrowseLevel = "detail";
      renderTopicsList();
    });

    card.append(heading, count, openButton);

    if (isQuranAdmin) {
      const actions = document.createElement("div");
      actions.className = "topic-actions";
      actions.append(
        makeTopicActionButton("নাম পরিবর্তন", "secondary-button", () => renameQuranTopic(topic)),
        makeTopicActionButton("মুছে ফেলুন", "danger-button", () => deleteQuranTopic(topic))
      );
      card.appendChild(actions);
    }

    topicsList.appendChild(card);
  });
}

async function loadTopicSurahData(surahNumber) {
  const number = Number(surahNumber);
  if (topicSurahDataCache.has(number)) {
    return topicSurahDataCache.get(number);
  }

  const loadingPromise = (async () => {
    let data;

    if (window.location.protocol === "file:") {
      const numberKey = String(number).padStart(3, "0");
      data = window.QuranOfflineData?.surahs?.[numberKey];

      if (!data) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = `data/offline/surahs/surah-${numberKey}.js`;
          script.onload = resolve;
          script.onerror = () => reject(new Error(`Offline সূরা ${number} লোড করা যায়নি।`));
          document.head.appendChild(script);
        });
        data = window.QuranOfflineData?.surahs?.[numberKey];
      }
    } else {
      const filename = `surah-${String(number).padStart(3, "0")}.json`;
      const response = await fetch(`data/surahs/${filename}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      data = await response.json();
    }

    const surahInfo = surahs.find((item) => Number(item.surah) === number);
    if (
      !data ||
      Number(data.metadata?.surah) !== number ||
      !Array.isArray(data.ayahs) ||
      (surahInfo && data.ayahs.length !== Number(surahInfo.total_ayahs))
    ) {
      throw new Error(`সূরা ${number}-এর ডেটা যাচাই করা যায়নি।`);
    }

    const ayahs = data.ayahs.map((ayah) => ({ ...ayah }));

    if (supabaseClient) {
      try {
        const { data: corrections, error } = await supabaseClient
          .from("quran_bn_corrections_public")
          .select("surah_no,ayah_no,field_name,proposed_text")
          .eq("surah_no", number);

        if (error) throw error;

        for (const correction of (corrections || [])) {
          if (correction.field_name !== "translation") continue;
          const target = ayahs.find(
            (ayah) => Number(ayah.aya) === Number(correction.ayah_no)
          );
          if (target) target.translation = correction.proposed_text;
        }
      } catch (error) {
        console.warn("Topic translation corrections could not be loaded:", error);
      }
    }

    return { ayahs };
  })();

  topicSurahDataCache.set(number, loadingPromise);

  try {
    return await loadingPromise;
  } catch (error) {
    topicSurahDataCache.delete(number);
    throw error;
  }
}

function renderTopicDetail(topic) {
  const renderToken = ++topicDetailRenderToken;
  topicsList.className = "topics-list topic-detail-view";

  if (!topic) {
    topicBrowseLevel = "categories";
    renderTopicCategoryCards();
    return;
  }

  const card = document.createElement("article");
  card.className = "topic-card topic-detail-card";

  const category = document.createElement("p");
  category.className = "topic-card-category";
  category.textContent = topic.category || "অন্যান্য বিষয়";

  const heading = document.createElement("h3");
  heading.textContent = topic.title;

  const items = topicAyahs.filter((item) => item.topic_id === topic.id);

  const summary = document.createElement("p");
  summary.className = "topic-detail-summary";
  summary.textContent = `${items.length.toLocaleString("bn-BD")}টি আয়াত এই বিষয়ের সঙ্গে সংযুক্ত`;

  card.append(category, heading, summary);

  if (!items.length) {
    const empty = document.createElement("p");
    empty.textContent = "এই বিষয়ে এখনো কোনো আয়াত সংযুক্ত করা হয়নি।";
    card.appendChild(empty);
  } else {
    const loading = document.createElement("p");
    loading.className = "loading-message";
    loading.textContent = "আয়াতের আরবি ও বাংলা অনুবাদ লোড হচ্ছে...";
    card.appendChild(loading);
  }

  if (isQuranAdmin) {
    const actions = document.createElement("div");
    actions.className = "topic-actions topic-detail-actions";
    actions.append(
      makeTopicActionButton("নাম পরিবর্তন", "secondary-button", () => renameQuranTopic(topic)),
      makeTopicActionButton("মুছে ফেলুন", "danger-button", () => deleteQuranTopic(topic))
    );
    card.appendChild(actions);
  }

  topicsList.appendChild(card);

  if (!items.length) return;

  Promise.all(
    items.map(async (item) => {
      try {
        const data = await loadTopicSurahData(item.surah_no);
        const ayah = data.ayahs.find(
          (entry) => Number(entry.aya) === Number(item.ayah_no)
        );
        return { item, ayah };
      } catch (error) {
        console.error("Topic ayah loading failed:", error);
        return { item, error };
      }
    })
  ).then((results) => {
    if (
      renderToken !== topicDetailRenderToken ||
      topicBrowseLevel !== "detail" ||
      selectedQuranTopicId !== topic.id ||
      !topicsList.contains(card)
    ) return;

    const list = document.createElement("ul");
    list.className = "topic-ayah-list topic-inline-ayah-list";

    results.forEach(({ item, ayah, error }) => {
      const row = document.createElement("li");
      row.className = "topic-ayah-row topic-ayah-card";

      const surah = surahs.find(
        (entry) => Number(entry.surah) === Number(item.surah_no)
      );
      const surahName = surah ? surah.name_bn : `সূরা ${item.surah_no}`;

      const reference = document.createElement("p");
      reference.className = "topic-ayah-reference";
      reference.textContent =
        `সূরা : ${surahName} — আয়াত ${Number(item.surah_no).toLocaleString("bn-BD")} : ${Number(item.ayah_no).toLocaleString("bn-BD")}`;
      if (ayah) {
        const arabic = document.createElement("p");
        arabic.className = "topic-ayah-arabic";
        arabic.lang = "ar";
        arabic.dir = "rtl";
        arabic.textContent = ayah.arabic || "আরবি আয়াত পাওয়া যায়নি।";

        const translation = document.createElement("p");
        translation.className = "topic-ayah-translation";
        translation.textContent = ayah.translation || "বাংলা অনুবাদ পাওয়া যায়নি।";

        row.append(arabic, translation);
        row.appendChild(reference);
      } else {
        const unavailable = document.createElement("p");
        unavailable.className = "topic-ayah-translation";
        unavailable.textContent = error
          ? "এই আয়াতের ডেটা লোড করা যায়নি।"
          : "নির্বাচিত আয়াতটি পাওয়া যায়নি।";
        row.append(unavailable, reference);
      }

      if (isQuranAdmin) {
        row.appendChild(makeTopicActionButton(
          "সরিয়ে ফেলুন",
          "danger-button topic-ayah-remove",
          () => removeTopicAyah(item)
        ));
      }

      list.appendChild(row);
    });

    const oldLoading = card.querySelector(".loading-message");
    if (oldLoading) oldLoading.remove();
    card.insertBefore(list, card.querySelector(".topic-detail-actions"));
  });
}

function renderTopicsList() {
  topicsList.replaceChildren();

  selectedTopicCategoryLabel.hidden =
    topicBrowseLevel !== "topics" || Boolean(topicSearchQuery);
  selectedTopicCategoryLabel.textContent =
    topicBrowseLevel === "topics" && !topicSearchQuery
      ? `বিষয় শ্রেণি: ${selectedTopicCategory || ""}`
      : "";

  topicBackButton.hidden =
    topicBrowseLevel === "categories" && !topicSearchQuery;

  topicBackButton.textContent =
    topicBrowseLevel === "detail" ? "← বিষয় তালিকায় ফিরুন" :
    topicBrowseLevel === "topics" ? "← বিষয় শ্রেণিতে ফিরুন" :
    "← সব বিষয় শ্রেণি";

  if (!quranTopics.length) {
    topicsList.className = "topics-list";
    const empty = document.createElement("p");
    empty.className = "loading-message";
    empty.textContent = "এখনো কোনো বিষয় যোগ করা হয়নি।";
    topicsList.appendChild(empty);
    return;
  }

  if (topicSearchQuery) {
    const query = topicSearchQuery.toLocaleLowerCase();
    const matches = quranTopics.filter((topic) =>
      `${topic.title} ${topic.category || "অন্যান্য বিষয়"}`
        .toLocaleLowerCase()
        .includes(query)
    );
    renderTopicCards(matches);
    return;
  }

  if (topicBrowseLevel === "detail") {
    renderTopicDetail(
      quranTopics.find((topic) => topic.id === selectedQuranTopicId)
    );
    return;
  }

  if (topicBrowseLevel === "topics") {
    renderTopicCards(
      quranTopics.filter(
        (topic) => (topic.category || "অন্যান্য বিষয়") === selectedTopicCategory
      )
    );
    return;
  }

  renderTopicCategoryCards();
}

async function openTopicAyah(item) {
  const surahNo = Number(item.surah_no);
  const ayahNo = Number(item.ayah_no);

  homeView.hidden = true;
  topicsSection.hidden = true;
  quranSection.hidden = false;

  await openSurah(surahNo);

  if (!currentSurahData || currentSurahNumber !== surahNo) return;

  const expectedLabel = `আয়াত ${ayahNo.toLocaleString("bn-BD")}`;
  const targetCard = Array.from(
    ayahList.querySelectorAll(".ayah-card")
  ).find((card) =>
    card.querySelector(".ayah-number")?.textContent.trim() === expectedLabel
  );

  if (!targetCard) {
    showMessage("নির্বাচিত আয়াতটি পাঠ অংশে পাওয়া যায়নি।", true);
    return;
  }

  targetCard.classList.add("topic-ayah-highlight");
  targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
}

async function removeTopicAyah(item) {
  if (!isQuranAdmin || !supabaseClient) return;

  const confirmed = window.confirm(
    "এই আয়াতটি বিষয় থেকে সরিয়ে ফেলতে চান?"
  );
  if (!confirmed) return;

  try {
    const { error } = await supabaseClient
      .from("quran_topic_ayahs")
      .delete()
      .eq("id", item.id);

    if (error) throw error;

    await loadTopics();
    setTopicsMessage("আয়াতটি বিষয় থেকে সরানো হয়েছে।");
  } catch (error) {
    console.error("Topic ayah removal failed:", error);
    setTopicsMessage("আয়াতটি সরানো যায়নি।", true);
  }
}

async function renameQuranCategory(category, items) {
  if (!isQuranAdmin || !supabaseClient) return;

  const response = window.prompt("নতুন বিষয় শ্রেণির নাম লিখুন:", category.name);
  if (response === null) return;

  const newName = response.trim();
  if (!newName) {
    setTopicsMessage("বিষয় শ্রেণির নাম ফাঁকা রাখা যাবে না।", true);
    return;
  }
  if (newName === category.name) return;

  const existingCategory = getTopicCategories().find(
    (item) => item.name.toLowerCase() === newName.toLowerCase()
  );

  if (
    existingCategory &&
    !window.confirm(
      `"${newName}" নামে একটি শ্রেণি আগে থেকেই আছে। এই শ্রেণির সব বিষয় সেখানে স্থানান্তর করবেন?`
    )
  ) return;

  try {
    const { error } = await supabaseClient.rpc(
      "rename_quran_topic_category",
      { p_old_name: category.name, p_new_name: newName }
    );
    if (error) throw error;

    await loadTopics();
    selectedTopicCategory = newName;
    topicBrowseLevel = "topics";
    renderTopicsList();
    setTopicsMessage("বিষয় শ্রেণির নাম সফলভাবে পরিবর্তন হয়েছে।");
  } catch (error) {
    console.error("Category rename failed:", error);
    setTopicsMessage("বিষয় শ্রেণির নাম পরিবর্তন করা যায়নি।", true);
  }
}

async function deleteQuranCategory(category, items) {
  if (!isQuranAdmin || !supabaseClient) return;

  if (items.length) {
    setTopicsMessage("আগে এই শ্রেণির সব বিষয় অন্য শ্রেণিতে সরান।", true);
    return;
  }

  if (!window.confirm(`"${category.name}" শ্রেণিটি মুছে ফেলতে চান?`)) return;

  try {
    const { error } = await supabaseClient.rpc(
      "delete_quran_topic_category",
      { p_category_name: category.name }
    );
    if (error) throw error;

    await loadTopics();
    setTopicsMessage("বিষয় শ্রেণিটি মুছে ফেলা হয়েছে।");
  } catch (error) {
    console.error("Category delete failed:", error);
    setTopicsMessage(
      error.message || "বিষয় শ্রেণিটি মুছে ফেলা যায়নি।",
      true
    );
  }
}

async function renameQuranTopic(topic) {
  if (!isQuranAdmin || !supabaseClient) return;

  const newTitle = window.prompt("নতুন বিষয়ের নাম লিখুন:", topic.title);
  if (newTitle === null) return;

  const title = newTitle.trim();

  if (!title) {
    setTopicsMessage("বিষয়ের নাম খালি রাখা যাবে না।", true);
    return;
  }

  if (title === topic.title) return;

  try {
    const { error } = await supabaseClient
      .from("quran_topics")
      .update({ title })
      .eq("id", topic.id);

    if (error) throw error;

    await loadTopics();
    setTopicsMessage("বিষয়ের নাম পরিবর্তন হয়েছে।");
  } catch (error) {
    console.error("Topic rename failed:", error);
    setTopicsMessage(
      error.code === "23505"
        ? "এই নামে অন্য একটি বিষয় আগে থেকেই রয়েছে।"
        : "বিষয়ের নাম পরিবর্তন করা যায়নি।",
      true
    );
  }
}

async function deleteQuranTopic(topic) {
  if (!isQuranAdmin || !supabaseClient) return;

  const confirmed = window.confirm(
    `"${topic.title}" বিষয়টি এবং এর সব সংযুক্ত আয়াত মুছে ফেলতে চান?`
  );
  if (!confirmed) return;

  try {
    const { error } = await supabaseClient
      .from("quran_topics")
      .delete()
      .eq("id", topic.id);

    if (error) throw error;

    await loadTopics();
    setTopicsMessage("বিষয় ও সংযুক্ত আয়াত মুছে ফেলা হয়েছে।");
  } catch (error) {
    console.error("Topic deletion failed:", error);
    setTopicsMessage("বিষয় মুছে ফেলা যায়নি।", true);
  }
}

async function addAyahToTopic() {
  if (!isQuranAdmin || !supabaseClient) return;

  const topicId = topicAyahSelect.value;
  const surahNo = Number(topicSurahSelect.value);
  const ayahNo = Number(topicAyahNumberSelect.value);

  const selectedSurah = surahs.find(
    (surah) => Number(surah.surah) === surahNo
  );

  if (
    !topicId ||
    !selectedSurah ||
    !Number.isInteger(ayahNo) ||
    ayahNo < 1 ||
    ayahNo > Number(selectedSurah.total_ayahs)
  ) {
    setTopicsMessage("বিষয়, সূরা ও সঠিক আয়াত নির্বাচন করুন।", true);
    return;
  }

  addTopicAyahButton.disabled = true;
  setTopicsMessage("আয়াত যোগ হচ্ছে...");

  try {
    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser();

    if (userError || !userData.user) {
      throw userError || new Error("প্রশাসকের অধিবেশন পাওয়া যায়নি।");
    }

    const { error } = await supabaseClient
      .from("quran_topic_ayahs")
      .insert({
        topic_id: topicId,
        surah_no: surahNo,
        ayah_no: ayahNo,
        created_by: userData.user.id
      });

    if (error) throw error;

    await loadTopics();
    topicSurahSelect.value = String(surahNo);
    renderTopicAyahOptions();
    topicAyahNumberSelect.value = "";
    updateTopicAyahButton();
    setTopicsMessage("নির্বাচিত আয়াত সফলভাবে বিষয়ে যোগ হয়েছে।");
  } catch (error) {
    console.error("Adding topic ayah failed:", error);
    setTopicsMessage(
      error.code === "23505"
        ? "এই আয়াতটি এই বিষয়ে আগেই যোগ করা হয়েছে।"
        : "আয়াত যোগ করা যায়নি। প্রশাসক হিসেবে প্রবেশ এবং ইন্টারনেট সংযোগ পরীক্ষা করুন।",
      true
    );
  } finally {
    updateTopicAyahButton();
  }
}

addTopicAyahButton.addEventListener("click", addAyahToTopic);
topicAyahCategorySelect.addEventListener("change", renderTopicSelect);
topicAyahSelect.addEventListener("change", updateTopicAyahButton);
topicAyahNumberSelect.addEventListener("change", updateTopicAyahButton);

topicCategorySelect.addEventListener("change", () => {
  const isNewCategory = topicCategorySelect.value === "__new_category__";
  newTopicCategoryField.hidden = !isNewCategory;
  if (isNewCategory) newTopicCategoryInput.focus();
});

async function createQuranTopic() {
  if (!isQuranAdmin || !supabaseClient) return;

  const title = topicTitleInput.value.trim();
  const isNewCategory = topicCategorySelect.value === "__new_category__";
  const category = isNewCategory
    ? newTopicCategoryInput.value.trim()
    : topicCategorySelect.value;

  if (!category) {
    setTopicsMessage("অনুগ্রহ করে শ্রেণির নাম নির্বাচন বা লিখুন।", true);
    if (isNewCategory) newTopicCategoryInput.focus();
    else topicCategorySelect.focus();
    return;
  }

  if (!title) {
    setTopicsMessage("অনুগ্রহ করে বিষয়ের নাম লিখুন।", true);
    topicTitleInput.focus();
    return;
  }

  createTopicButton.disabled = true;
  setTopicsMessage("বিষয় তৈরি হচ্ছে...");

  try {
    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser();

    if (userError || !userData.user) {
      throw userError || new Error("প্রশাসকের অধিবেশন পাওয়া যায়নি।");
    }

    if (isNewCategory) {
      const { error: categoryError } = await supabaseClient
        .from("quran_topic_categories")
        .upsert(
          {
            name: category,
            icon: "📚",
            description: "কুরআনের গুরুত্বপূর্ণ বিষয়সমূহ",
            sort_order: 100
          },
          { onConflict: "name", ignoreDuplicates: true }
        );
      if (categoryError) throw categoryError;
    }

    const { error } = await supabaseClient
      .from("quran_topics")
      .insert({
        title,
        category,
        created_by: userData.user.id
      });

    if (error) throw error;

    topicTitleInput.value = "";
    await loadTopics();
    if (isNewCategory) {
      topicCategorySelect.value = category;
      newTopicCategoryInput.value = "";
      newTopicCategoryField.hidden = true;
    }
    setTopicsMessage("বিষয় সফলভাবে তৈরি হয়েছে।");
  } catch (error) {
    console.error("Topic creation failed:", error);
    setTopicsMessage(
      error.code === "23505"
        ? "এই নামে একটি বিষয় আগে থেকেই রয়েছে।"
        : "বিষয় তৈরি করা যায়নি। প্রশাসক হিসেবে প্রবেশ এবং ইন্টারনেট সংযোগ পরীক্ষা করুন।",
      true
    );
  } finally {
    createTopicButton.disabled = !isQuranAdmin;
  }
}

createTopicButton.addEventListener("click", createQuranTopic);

async function loadTopics() {
  if (!supabaseClient) {
    setTopicsMessage("সুপাবেজ সংযোগ পাওয়া যায়নি।", true);
    return;
  }

  topicsList.textContent = "বিষয়গুলো লোড হচ্ছে...";
  setTopicsMessage("");

  const [categoriesResult, topicsResult, ayahsResult] = await Promise.all([
    supabaseClient
      .from("quran_topic_categories")
      .select("id, name, icon, description, sort_order, created_at")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabaseClient
      .from("quran_topics")
      .select("id, title, category, created_at")
      .order("title", { ascending: true }),
    supabaseClient
      .from("quran_topic_ayahs")
      .select("id, topic_id, surah_no, ayah_no, created_at")
      .order("surah_no", { ascending: true })
      .order("ayah_no", { ascending: true })
  ]);

  if (categoriesResult.error || topicsResult.error || ayahsResult.error) {
    console.error(
      "Topic loading failed:",
      categoriesResult.error || topicsResult.error || ayahsResult.error
    );
    setTopicsMessage("বিষয়, শ্রেণি বা আয়াত লোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।", true);
    topicsList.replaceChildren();
    return;
  }

  quranTopicCategories = categoriesResult.data || [];
  quranTopics = topicsResult.data || [];
  topicAyahs = ayahsResult.data || [];

  renderTopicCategorySelect();
  renderTopicSelect();
  renderTopicsList();
}


let asmaulHusnaRows = [];

function setAsmaulHusnaMessage(message, isError = false) {
  asmaulHusnaMessage.textContent = message;
  asmaulHusnaMessage.classList.toggle("error-message", isError);
}

function renderAsmaulHusna() {
  const query = asmaulHusnaSearch.value.trim().toLocaleLowerCase();
  const filteredRows = asmaulHusnaRows.filter((row) => {
    const searchable = [
      row.arabic_name,
      row.bangla_pronunciation,
      row.meaning_bn,
      row.english_name
    ].filter(Boolean).join(" ").toLocaleLowerCase();
    return searchable.includes(query);
  });

  asmaulHusnaList.replaceChildren();

  if (!filteredRows.length) {
    setAsmaulHusnaMessage(
      query ? "আপনার অনুসন্ধানের সঙ্গে মেলে এমন কোনো নাম পাওয়া যায়নি।" : "কোনো নাম পাওয়া যায়নি।"
    );
    return;
  }

  setAsmaulHusnaMessage(
    `${filteredRows.length.toLocaleString("bn-BD")}টি নাম দেখানো হচ্ছে`
  );

  filteredRows.forEach((row, index) => {
    const card = document.createElement("article");
    card.className = "asmaul-name-card";

    const number = document.createElement("span");
    number.className = "asmaul-name-number";
    number.textContent = Number(row.serial_no) > 0
      ? Number(row.serial_no).toLocaleString("bn-BD")
      : (index + 1).toLocaleString("bn-BD");

    const arabic = document.createElement("h3");
    arabic.className = "asmaul-name-arabic";
    arabic.dir = "rtl";
    arabic.textContent = row.arabic_name || "";

    const english = document.createElement("p");
    english.className = "asmaul-name-english";
    english.textContent = row.english_name || "";

    const pronunciation = document.createElement("p");
    pronunciation.className = "asmaul-name-pronunciation";
    pronunciation.textContent = row.bangla_pronunciation || "";

    const meaning = document.createElement("p");
    meaning.className = "asmaul-name-meaning";
    meaning.textContent = row.meaning_bn || "বাংলা অর্থ যোগ করা হয়নি";

    card.append(number, arabic, english, pronunciation, meaning);
    asmaulHusnaList.append(card);
  });
}

async function loadAsmaulHusna() {
  if (!supabaseClient) {
    asmaulHusnaList.replaceChildren();
    setAsmaulHusnaMessage("সুপাবেজ সংযোগ পাওয়া যায়নি।", true);
    return;
  }

  asmaulHusnaList.replaceChildren();
  setAsmaulHusnaMessage("আসমাউল হুসনার নামগুলো লোড হচ্ছে...");

  const { data, error } = await supabaseClient
    .from("asmaul_husna")
    .select("serial_no,arabic_name,bangla_pronunciation,meaning_bn,english_name")
    .order("serial_no", { ascending: true });

  if (error) {
    console.error("Asmaul Husna loading failed:", error);
    setAsmaulHusnaMessage(
      "নামগুলো লোড করা যায়নি। Supabase table ও internet connection পরীক্ষা করুন।",
      true
    );
    return;
  }

  asmaulHusnaRows = data || [];
  renderAsmaulHusna();
}

function showAsmaulHusnaHome() {
  homeView.hidden = true;
  quranSection.hidden = true;
  topicsSection.hidden = true;
  asmaulHusnaSection.hidden = false;
  isSurahEditing = false;
  surahReader.hidden = true;
  asmaulHusnaSearch.value = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
  loadAsmaulHusna();
}

function showTopicsHome() {
  selectedTopicCategory = null;
  selectedQuranTopicId = null;
  topicBrowseLevel = "categories";
  topicSearchQuery = "";
  topicSearchInput.value = "";

  homeView.hidden = true;
  quranSection.hidden = true;
  topicsSection.hidden = false;
  asmaulHusnaSection.hidden = true;
  isSurahEditing = false;
  surahReader.hidden = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
  loadTopics();
}

openQuranCard.addEventListener("click", showQuranHome);
openAsmaulHusnaCard.addEventListener("click", showAsmaulHusnaHome);
backHomeFromAsmaulHusna.addEventListener("click", showHomeView);
asmaulHusnaSearch.addEventListener("input", renderAsmaulHusna);
openTopicsCard.addEventListener("click", showTopicsHome);
backHomeFromQuran.addEventListener("click", showHomeView);
backHomeFromReader.addEventListener("click", showHomeView);
backHomeFromTopics.addEventListener("click", showHomeView);

topicSearchInput.addEventListener("input", () => {
  topicSearchQuery = topicSearchInput.value.trim();
  renderTopicsList();
});

topicBackButton.addEventListener("click", () => {
  if (topicSearchQuery) {
    topicSearchQuery = "";
    topicSearchInput.value = "";
  } else if (topicBrowseLevel === "detail") {
    topicBrowseLevel = "topics";
    selectedQuranTopicId = null;
  } else if (topicBrowseLevel === "topics") {
    topicBrowseLevel = "categories";
    selectedTopicCategory = null;
  }

  renderTopicsList();
});

function showSurahList() {
  surahReader.hidden = true;
  surahBrowser.hidden = false;
  currentSurahNumber = null;
  currentStartAyah = 1;
  currentSurahData = null;
  isSurahEditing = false;
  showMessage("");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setRevelationFilter(filter) {
  currentRevelationFilter = filter;
  surahCount.setAttribute("aria-pressed", String(filter === "all"));
  makkiCount.setAttribute("aria-pressed", String(filter === "মাক্কী"));
  madaniCount.setAttribute("aria-pressed", String(filter === "মাদানী"));
  renderSurahList(surahSearch.value);
}

surahCount.addEventListener("click", () => setRevelationFilter("all"));
makkiCount.addEventListener("click", () => setRevelationFilter("মাক্কী"));
madaniCount.addEventListener("click", () => setRevelationFilter("মাদানী"));

surahSearch.addEventListener("input", () => {
  renderSurahList(surahSearch.value);
});

backToSurahs.addEventListener("click", showSurahList);

previousSurah.addEventListener("click", () => {
  if (currentSurahNumber > 1) {
    openSurah(currentSurahNumber - 1);
  }
});

nextSurah.addEventListener("click", () => {
  if (currentSurahNumber < 114) {
    openSurah(currentSurahNumber + 1);
  }
});

async function verifyQuranAdmin(user) {
  if (!supabaseClient || !user) return false;

  const { data, error } = await supabaseClient
    .from("quran_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Quran admin verification failed:", error);
    return false;
  }

  return Boolean(data);
}

function renderTopicAdminControls() {
  if (!topicAdminPanel || !topicSurahSelect) return;

  topicAdminPanel.hidden = !isQuranAdmin;

  const expectedCount = surahs.length + 1;
  if (topicSurahSelect.options.length === expectedCount) return;

  const previousValue = topicSurahSelect.value;
  topicSurahSelect.replaceChildren();

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "সূরা নির্বাচন করুন";
  topicSurahSelect.appendChild(placeholder);

  surahs.forEach((surah) => {
    const option = document.createElement("option");
    option.value = String(surah.surah);
    option.textContent = `${surah.surah.toLocaleString("bn-BD")}. ${surah.name_bn}`;
    topicSurahSelect.appendChild(option);
  });

  if (previousValue && surahs.some((surah) => String(surah.surah) === previousValue)) {
    topicSurahSelect.value = previousValue;
  }
}

function renderTopicAyahOptions() {
  if (!topicSurahSelect || !topicAyahNumberSelect) return;

  const selectedSurahNo = Number(topicSurahSelect.value);
  const selectedSurah = surahs.find(
    (surah) => Number(surah.surah) === selectedSurahNo
  );

  topicAyahNumberSelect.replaceChildren();

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = selectedSurah
    ? "আয়াত নির্বাচন করুন"
    : "আগে সূরা নির্বাচন করুন";
  topicAyahNumberSelect.appendChild(placeholder);

  if (!selectedSurah) {
    topicAyahNumberSelect.disabled = true;
    return;
  }

  const totalAyahs = Number(selectedSurah.total_ayahs);

  for (let ayahNo = 1; ayahNo <= totalAyahs; ayahNo += 1) {
    const option = document.createElement("option");
    option.value = String(ayahNo);
    option.textContent = ayahNo.toLocaleString("bn-BD");
    topicAyahNumberSelect.appendChild(option);
  }

  topicAyahNumberSelect.disabled = false;
  updateTopicAyahButton();
}

topicSurahSelect.addEventListener("change", renderTopicAyahOptions);

function updateAdminUI() {
  adminStatus.hidden = !isQuranAdmin;
  adminLoginToggle.hidden = isQuranAdmin;
  adminLogout.hidden = !isQuranAdmin;
  adminLoginPanel.hidden = true;
  renderTopicAdminControls();

  if (currentSurahData) {
    isSurahEditing = false;
    renderCurrentSurah();
  }
}

adminLoginToggle.addEventListener("click", () => {
  adminLoginPanel.hidden = !adminLoginPanel.hidden;
  adminLoginMessage.textContent = "";
  if (!adminLoginPanel.hidden) adminEmail.focus();
});

adminLoginCancel.addEventListener("click", () => {
  adminLoginPanel.hidden = true;
  adminPassword.value = "";
  adminLoginMessage.textContent = "";
});

adminLoginPanel.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!supabaseClient) {
    adminLoginMessage.textContent = "সুপাবেজ সংযোগ পাওয়া যায়নি।";
    return;
  }

  adminLoginSubmit.disabled = true;
  adminLoginMessage.textContent = "প্রবেশের তথ্য যাচাই করা হচ্ছে...";

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: adminEmail.value.trim(),
      password: adminPassword.value
    });

    if (error) throw error;

    const allowed = await verifyQuranAdmin(data.user);

    if (!allowed) {
      await supabaseClient.auth.signOut();
      throw new Error("এই অ্যাকাউন্টে কুরআন প্রশাসকের অনুমতি নেই।");
    }

    isQuranAdmin = true;
    adminPassword.value = "";
    adminLoginMessage.textContent = "";
    updateAdminUI();
    showMessage("প্রশাসক হিসেবে সফলভাবে প্রবেশ করেছেন।");
  } catch (error) {
    console.error("Admin login failed:", error);
    adminLoginMessage.textContent = error.message || "প্রবেশ করা যায়নি।";
  } finally {
    adminLoginSubmit.disabled = false;
  }
});

adminLogout.addEventListener("click", async () => {
  if (supabaseClient) {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      showMessage("প্রস্থান করা যায়নি: " + error.message, true);
      return;
    }
  }

  isQuranAdmin = false;
  isSurahEditing = false;
  updateAdminUI();
  showMessage("প্রশাসক হিসেবে প্রস্থান সম্পন্ন হয়েছে।");
});

async function restoreAdminSession() {
  if (!supabaseClient) {
    adminLoginToggle.disabled = true;
    adminLoginToggle.textContent = "প্রবেশের ব্যবস্থা পাওয়া যাচ্ছে না";
    return;
  }

  try {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;

    if (data.session && await verifyQuranAdmin(data.session.user)) {
      isQuranAdmin = true;
      updateAdminUI();
    } else if (data.session) {
      await supabaseClient.auth.signOut();
    }
  } catch (error) {
    console.warn("Admin session restore failed:", error);
  }
}

updateAdminUI();
restoreAdminSession();
loadSurahList();
