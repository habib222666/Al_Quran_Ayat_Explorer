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

const adminStatus = document.getElementById("adminStatus");
const adminLoginToggle = document.getElementById("adminLoginToggle");
const adminLogout = document.getElementById("adminLogout");
const adminLoginPanel = document.getElementById("adminLoginPanel");
const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");
const adminLoginSubmit = document.getElementById("adminLoginSubmit");
const adminLoginCancel = document.getElementById("adminLoginCancel");
const adminLoginMessage = document.getElementById("adminLoginMessage");

let surahs = [];
let currentSurahNumber = null;
let isQuranAdmin = false;
let isSurahEditing = false;
let currentSurahData = null;

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
    let data;
    if (window.location.protocol === "file:") {
      data = window.QuranOfflineData?.surahList;
    } else {
      const response = await fetch("data/surah-list.json");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      data = await response.json();
    }

    const data = await response.json();

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
  arabic.lang = "ar";
  arabic.dir = "rtl";
  arabic.textContent = ayah.arabic;

  const translationLabel = document.createElement("h3");
  translationLabel.className = "translation-label";
  translationLabel.textContent = "বাংলা অনুবাদ";

  article.append(top, arabic, translationLabel);

  if (isSurahEditing) {
    article.appendChild(
      createEditField("বাংলা অনুবাদ", ayah.translation, ayah._sourceAya, "translation")
    );
  } else {
    const translation = document.createElement("p");
    translation.className = "ayah-translation";
    translation.textContent = ayah.translation;
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
          "Footnotes (HTML সমর্থিত)",
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
  editButton.textContent = isSurahEditing ? "সম্পাদনা চালু আছে" : "Edit";

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
    saveButton.textContent = "Save & Publish";
    saveButton.addEventListener("click", saveCurrentSurah);
    toolbar.appendChild(saveButton);

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "surah-cancel-button";
    cancelButton.textContent = "Cancel";
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

  const heading = document.createElement("h2");
  heading.textContent = `সূরা ${currentSurahNumber.toLocaleString("bn-BD")} — ${surah.name_bn}`;

  let displayAyahs = currentSurahData.ayahs.map((ayah) => ({ ...ayah }));
  let fatihaIntro = null;

  if (currentSurahNumber === 1) {
    fatihaIntro = displayAyahs.shift();
    displayAyahs = displayAyahs.map((ayah, index) => ({
      ...ayah,
      aya: index + 1
    }));
  } else if (currentSurahNumber !== 9) {
    displayAyahs[0].arabic = removeBismillahPrefix(displayAyahs[0].arabic);
  }

  const count = document.createElement("p");
  count.textContent = `${displayAyahs.length.toLocaleString("bn-BD")} আয়াত`;

  const headerItems = isQuranAdmin
    ? [createSurahEditToolbar(), heading, count]
    : [heading, count];

  if (currentSurahNumber !== 9) {
    const bismillah = document.createElement("p");
    bismillah.className = "surah-bismillah";
    bismillah.lang = "ar";
    bismillah.dir = "rtl";
    bismillah.textContent = "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ";
    headerItems.push(bismillah);
  }

  if (fatihaIntro) {
    if (isSurahEditing) {
      headerItems.push(
        createEditField(
          "প্রথম আয়াতের বাংলা অনুবাদ",
          fatihaIntro.translation,
          fatihaIntro._sourceAya,
          "translation"
        )
      );
    } else {
      const introTranslationLabel = document.createElement("h3");
      introTranslationLabel.className = "translation-label";
      introTranslationLabel.textContent = "প্রথম আয়াতের বাংলা অনুবাদ";

      const introTranslation = document.createElement("p");
      introTranslation.className = "ayah-translation";
      introTranslation.textContent = fatihaIntro.translation;

      headerItems.push(introTranslationLabel, introTranslation);
    }

    if ((fatihaIntro.footnotes && fatihaIntro.footnotes.trim()) || isSurahEditing) {
      const details = document.createElement("details");
      details.className = "footnote-details surah-intro-details";
      details.open = isSurahEditing;

      const summary = document.createElement("summary");
      summary.textContent = "সূরা পরিচিতি ও ব্যাখ্যা দেখুন";

      const content = document.createElement("div");
      content.className = "footnote-content";

      if (isSurahEditing) {
        content.appendChild(
          createEditField(
            "প্রথম আয়াতের Footnotes (HTML সমর্থিত)",
            fatihaIntro.footnotes,
            fatihaIntro._sourceAya,
            "footnotes",
            "ayah-edit-footnotes"
          )
        );
      } else {
        content.appendChild(sanitizeFootnotes(fatihaIntro.footnotes));
      }

      details.append(summary, content);
      headerItems.push(details);
    }
  }
  surahHeader.replaceChildren(...headerItems);

  const fragment = document.createDocumentFragment();
  displayAyahs.forEach((ayah) => fragment.appendChild(createAyahCard(ayah)));
  ayahList.replaceChildren(fragment);
}

async function openSurah(surahNumber) {
  const surah = surahs.find((item) => item.surah === surahNumber);
  if (!surah) {
    showMessage("নির্বাচিত সূরাটি পাওয়া যায়নি।", true);
    return;
  }

  currentSurahNumber = surahNumber;
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

    const data = await response.json();

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
        showMessage("অনলাইন সংশোধন লোড করা যায়নি; স্থানীয় অনুবাদ দেখানো হচ্ছে।", true);
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
    showMessage("Admin অনুমতি ছাড়া Save করা যাবে না।", true);
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
      showMessage("অনুবাদ বা Footnotes খালি রাখা যাবে না।", true);
      field.focus();
      return;
    }
  }

  const saveButton = surahHeader.querySelector(".surah-save-button");
  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";
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
        saveButton.textContent = "আবার Save করুন";
      }
      return;
    }
  }

  isSurahEditing = false;
  renderCurrentSurah();
  showMessage(`${savedCount.toLocaleString("bn-BD")}টি পরিবর্তন Supabase-এ Publish হয়েছে এবং History-তে সংরক্ষিত হয়েছে।`);
}

function showSurahList() {
  surahReader.hidden = true;
  surahBrowser.hidden = false;
  currentSurahNumber = null;
  currentSurahData = null;
  isSurahEditing = false;
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

function updateAdminUI() {
  adminStatus.hidden = !isQuranAdmin;
  adminLoginToggle.hidden = isQuranAdmin;
  adminLogout.hidden = !isQuranAdmin;
  adminLoginPanel.hidden = true;

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
    adminLoginMessage.textContent = "Supabase সংযোগ পাওয়া যায়নি।";
    return;
  }

  adminLoginSubmit.disabled = true;
  adminLoginMessage.textContent = "Login যাচাই হচ্ছে...";

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: adminEmail.value.trim(),
      password: adminPassword.value
    });

    if (error) throw error;

    const allowed = await verifyQuranAdmin(data.user);

    if (!allowed) {
      await supabaseClient.auth.signOut();
      throw new Error("এই Account-এর Quran Admin অনুমতি নেই।");
    }

    isQuranAdmin = true;
    adminPassword.value = "";
    adminLoginMessage.textContent = "";
    updateAdminUI();
    showMessage("Admin Login সফল হয়েছে।");
  } catch (error) {
    console.error("Admin login failed:", error);
    adminLoginMessage.textContent = error.message || "Login ব্যর্থ হয়েছে।";
  } finally {
    adminLoginSubmit.disabled = false;
  }
});

adminLogout.addEventListener("click", async () => {
  if (supabaseClient) {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      showMessage("Logout করা যায়নি: " + error.message, true);
      return;
    }
  }

  isQuranAdmin = false;
  isSurahEditing = false;
  updateAdminUI();
  showMessage("Admin Logout সম্পন্ন হয়েছে।");
});

async function restoreAdminSession() {
  if (!supabaseClient) {
    adminLoginToggle.disabled = true;
    adminLoginToggle.textContent = "Login unavailable";
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
