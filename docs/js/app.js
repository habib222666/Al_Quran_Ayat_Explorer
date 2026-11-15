"use strict";

const themeToggle = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("quran-explorer-theme");

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark-theme", isDark);
  themeToggle.textContent = isDark ? "Light Mode" : "Dark Mode";
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
const surahCount = document.getElementById("surahCount");
const surahHeader = document.getElementById("surahHeader");
const ayahList = document.getElementById("ayahList");
const appMessage = document.getElementById("appMessage");

const backToSurahs = document.getElementById("backToSurahs");
const previousSurah = document.getElementById("previousSurah");
const nextSurah = document.getElementById("nextSurah");

let surahs = [];
let currentSurahNumber = null;

function showMessage(message, isError = false) {
  appMessage.textContent = message;
  appMessage.classList.toggle("error-message", isError);
}

function createSurahCard(surah) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "surah-card";
  button.setAttribute("aria-label", `সূরা ${surah.surah}: ${surah.name_bn}, ${surah.total_ayahs} আয়াত`);

  const number = document.createElement("span");
  number.className = "surah-number";
  number.textContent = surah.surah.toLocaleString("bn-BD");

  const details = document.createElement("span");
  details.className = "surah-card-details";

  const name = document.createElement("strong");
  name.className = "surah-card-name";
  name.textContent = surah.name_bn;

  const ayahs = document.createElement("small");
  ayahs.textContent = `${surah.total_ayahs.toLocaleString("bn-BD")} আয়াত`;

  details.append(name, ayahs);
  button.append(number, details);

  button.addEventListener("click", () => openSurah(surah.surah));
  return button;
}

function renderSurahList(query = "") {
  const normalizedQuery = query.trim().toLocaleLowerCase("bn");
  const filtered = surahs.filter((surah) => {
    return (
      surah.name_bn.toLocaleLowerCase("bn").includes(normalizedQuery) ||
      String(surah.surah).includes(normalizedQuery) ||
      surah.surah.toLocaleString("bn-BD").includes(normalizedQuery)
    );
  });

  surahListElement.replaceChildren();

  if (filtered.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-message";
    empty.textContent = "কোনো সূরা পাওয়া যায়নি। অন্য নাম বা নম্বর দিয়ে খুঁজুন।";
    surahListElement.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  filtered.forEach((surah) => fragment.appendChild(createSurahCard(surah)));
  surahListElement.appendChild(fragment);
}

async function loadSurahList() {
  try {
    const response = await fetch("data/surah-list.json");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data.surahs) || data.surahs.length !== 114) {
      throw new Error("সূরার তালিকা সঠিক নয়।");
    }

    surahs = data.surahs;
    surahCount.textContent = `${surahs.length.toLocaleString("bn-BD")}টি সূরা`;
    renderSurahList();
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
      return document.createTextNode(node.textContent);
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

function createAyahCard(ayah) {
  const article = document.createElement("article");
  article.className = "ayah-card";

  const top = document.createElement("div");
  top.className = "ayah-top";

  const number = document.createElement("span");
  number.className = "ayah-number";
  number.textContent = `আয়াত ${ayah.aya.toLocaleString("bn-BD")}`;
  top.appendChild(number);

  const arabic = document.createElement("p");
  arabic.className = "ayah-arabic";
  arabic.lang = "ar";
  arabic.dir = "rtl";
  arabic.textContent = ayah.arabic;

  const translationLabel = document.createElement("h3");
  translationLabel.className = "translation-label";
  translationLabel.textContent = "বাংলা অনুবাদ";

  const translation = document.createElement("p");
  translation.className = "ayah-translation";
  translation.textContent = ayah.translation;

  article.append(top, arabic, translationLabel, translation);

  if (ayah.footnotes && ayah.footnotes.trim()) {
    const details = document.createElement("details");
    details.className = "footnote-details";

    const summary = document.createElement("summary");
    summary.textContent = "ব্যাখ্যা ও ফুটনোট দেখুন";

    const content = document.createElement("div");
    content.className = "footnote-content";
    content.appendChild(sanitizeFootnotes(ayah.footnotes));

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

async function openSurah(surahNumber) {
  const surah = surahs.find((item) => item.surah === surahNumber);
  if (!surah) {
    showMessage("নির্বাচিত সূরাটি পাওয়া যায়নি।", true);
    return;
  }

  currentSurahNumber = surahNumber;
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
    const filename = `surah-${String(surahNumber).padStart(3, "0")}.json`;
    const response = await fetch(`data/surahs/${filename}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (
      data.metadata.surah !== surahNumber ||
      !Array.isArray(data.ayahs) ||
      data.ayahs.length !== surah.total_ayahs
    ) {
      throw new Error("সূরার ডেটা যাচাই করা যায়নি।");
    }

    const heading = document.createElement("h2");
    heading.textContent = `সূরা ${surahNumber.toLocaleString("bn-BD")} — ${surah.name_bn}`;

    let displayAyahs = data.ayahs.map((ayah) => ({ ...ayah }));

    let fatihaIntro = null;

    if (surahNumber === 1) {
      fatihaIntro = displayAyahs.shift();
      displayAyahs = displayAyahs.map((ayah, index) => ({
        ...ayah,
        aya: index + 1
      }));
    } else if (surahNumber !== 9) {
      displayAyahs[0].arabic = removeBismillahPrefix(displayAyahs[0].arabic);
    }

    const count = document.createElement("p");
    count.textContent = `${displayAyahs.length.toLocaleString("bn-BD")} আয়াত`;

    const headerItems = [heading, count];

    if (surahNumber !== 9) {
      const bismillah = document.createElement("p");
      bismillah.className = "surah-bismillah";
      bismillah.lang = "ar";
      bismillah.dir = "rtl";
      bismillah.textContent = "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ";
      headerItems.push(bismillah);
    }

    if (fatihaIntro && fatihaIntro.footnotes && fatihaIntro.footnotes.trim()) {
      const details = document.createElement("details");
      details.className = "footnote-details surah-intro-details";

      const summary = document.createElement("summary");
      summary.textContent = "সূরা পরিচিতি ও ব্যাখ্যা দেখুন";

      const content = document.createElement("div");
      content.className = "footnote-content";
      content.appendChild(sanitizeFootnotes(fatihaIntro.footnotes));

      details.append(summary, content);
      headerItems.push(details);
    }

    surahHeader.replaceChildren(...headerItems);

    const fragment = document.createDocumentFragment();
    displayAyahs.forEach((ayah) => fragment.appendChild(createAyahCard(ayah)));
    ayahList.replaceChildren(fragment);

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    console.error(`Surah ${surahNumber} loading failed:`, error);
    ayahList.textContent = "এই সূরার ডেটা লোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।";
    showMessage("সূরার ডেটা লোড করতে সমস্যা হয়েছে।", true);
  }
}

function showSurahList() {
  surahReader.hidden = true;
  surahBrowser.hidden = false;
  currentSurahNumber = null;
  showMessage("");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

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

loadSurahList();
