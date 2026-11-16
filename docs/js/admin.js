"use strict";

/* Al-Quran & Ayat Explorer — Admin Dashboard */

const SUPABASE_URL = "https://fgeubvabnjvbirikuuqz.supabase.co";
const SUPABASE_KEY = "sb_publishable_s2AKhaEdG2wG-_wnkx6QAA_xjReFini";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const $ = (id) => document.getElementById(id);

const loginSection = $("adminLoginSection");
const dashboard = $("adminDashboard");
const loginForm = $("adminLoginForm");
const loginMessage = $("adminLoginMessage");
const editorMessage = $("adminEditorMessage");
const surahSelect = $("adminSurahSelect");
const ayahSelect = $("adminAyahSelect");
const arabicText = $("adminArabicText");
const translationInput = $("adminTranslation");
const footnotesInput = $("adminFootnotes");
const reasonInput = $("adminReason");
const publishButton = $("adminPublishButton");
const historyList = $("adminHistoryList");

let currentUser = null;
let currentSurah = null;
let currentAyah = null;
let loadedValues = {
  translation: "",
  footnotes: ""
};

/* ---------- Common helpers ---------- */

function showMessage(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("error-message", isError);
}

function setEditorEnabled(enabled) {
  translationInput.disabled = !enabled;
  footnotesInput.disabled = !enabled;
  reasonInput.disabled = !enabled;
  publishButton.disabled = !enabled;
}

function setLoggedIn(user) {
  currentUser = user;
  loginSection.hidden = true;
  dashboard.hidden = false;
  $("adminAccountInfo").textContent = user.email || "Admin Account";
}

function setLoggedOut() {
  currentUser = null;
  currentSurah = null;
  currentAyah = null;
  dashboard.hidden = true;
  loginSection.hidden = false;
  setEditorEnabled(false);
}

/* ---------- Theme ---------- */

function applyAdminTheme() {
  const dark = localStorage.getItem("quran-explorer-theme") === "dark";
  document.body.classList.toggle("dark-theme", dark);
  $("adminThemeToggle").textContent = dark ? "Light Mode" : "Dark Mode";
}

$("adminThemeToggle").addEventListener("click", () => {
  const dark = !document.body.classList.contains("dark-theme");
  localStorage.setItem("quran-explorer-theme", dark ? "dark" : "light");
  applyAdminTheme();
});

applyAdminTheme();

/* ---------- Admin authorization ---------- */

async function verifyQuranAdmin(user) {
  const { data, error } = await supabaseClient
    .from("quran_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return false;
  }

  return true;
}

async function restoreAdminSession() {
  showMessage(loginMessage, "Session যাচাই হচ্ছে...");

  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    showMessage(loginMessage, "Session যাচাই করা যায়নি: " + error.message, true);
    return;
  }

  const user = data.session?.user;

  if (!user) {
    showMessage(loginMessage, "");
    setLoggedOut();
    return;
  }

  try {
    const isAdmin = await verifyQuranAdmin(user);

    if (!isAdmin) {
      await supabaseClient.auth.signOut();
      setLoggedOut();
      showMessage(loginMessage, "এই Account-এর Quran Admin অনুমতি নেই।", true);
      return;
    }

    setLoggedIn(user);
    await loadSurahOptions();
    await loadCorrectionHistory();
  } catch (error) {
    setLoggedOut();
    showMessage(loginMessage, "Admin যাচাই ব্যর্থ: " + error.message, true);
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = $("adminEmail").value.trim();
  const password = $("adminPassword").value;

  const button = $("adminLoginButton");
  button.disabled = true;
  showMessage(loginMessage, "Login যাচাই হচ্ছে...");

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    const user = data.user;

    if (!user) {
      throw new Error("Login Account পাওয়া যায়নি।");
    }

    const isAdmin = await verifyQuranAdmin(user);

    if (!isAdmin) {
      await supabaseClient.auth.signOut();
      throw new Error("এই Account-এর Quran Admin অনুমতি নেই।");
    }

    loginForm.reset();
    showMessage(loginMessage, "");
    setLoggedIn(user);

    await loadSurahOptions();
    await loadCorrectionHistory();
  } catch (error) {
    showMessage(loginMessage, error.message || "Login ব্যর্থ হয়েছে।", true);
  } finally {
    button.disabled = false;
  }
});

$("adminLogoutButton").addEventListener("click", async () => {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    showMessage(editorMessage, "Logout ব্যর্থ: " + error.message, true);
    return;
  }

  setLoggedOut();
  showMessage(loginMessage, "আপনি Logout করেছেন।");
});

/* ---------- Surah and Ayah data ---------- */

async function loadSurahOptions() {
  surahSelect.innerHTML = '<option value="">সূরা নির্বাচন করুন</option>';
  ayahSelect.innerHTML = '<option value="">প্রথমে সূরা নির্বাচন করুন</option>';
  ayahSelect.disabled = true;
  setEditorEnabled(false);

  try {
    const response = await fetch("data/surah-list.json");

    if (!response.ok) {
      throw new Error("সূরার তালিকা লোড করা যায়নি।");
    }

    const data = await response.json();
    const surahs = data.surahs;

    if (!Array.isArray(surahs) || surahs.length !== 114) {
      throw new Error("সূরার তালিকায় ১১৪টি সূরা পাওয়া যায়নি।");
    }

    surahs.forEach((surah) => {
      const option = document.createElement("option");
      option.value = String(surah.surah);
      option.textContent = `${surah.surah}. ${surah.name_bn}`;
      surahSelect.appendChild(option);
    });
  } catch (error) {
    showMessage(editorMessage, error.message, true);
  }
}

surahSelect.addEventListener("change", async () => {
  const surahNo = Number(surahSelect.value);

  currentSurah = null;
  currentAyah = null;
  ayahSelect.innerHTML = '<option value="">আয়াত নির্বাচন করুন</option>';
  ayahSelect.disabled = true;
  arabicText.textContent = "আয়াত নির্বাচন করুন";
  translationInput.value = "";
  footnotesInput.value = "";
  reasonInput.value = "";
  setEditorEnabled(false);
  showMessage(editorMessage, "");

  if (!surahNo) {
    return;
  }

  try {
    const fileName = `data/surahs/surah-${String(surahNo).padStart(3, "0")}.json`;
    const response = await fetch(fileName);

    if (!response.ok) {
      throw new Error("এই সূরার JSON ফাইল পাওয়া যায়নি।");
    }

    const data = await response.json();

    if (
      !data.metadata ||
      Number(data.metadata.surah) !== surahNo ||
      !Array.isArray(data.ayahs) ||
      data.ayahs.length === 0
    ) {
      throw new Error("সূরার JSON Data সঠিক নয়।");
    }

    currentSurah = {
      number: surahNo,
      ayahs: data.ayahs
    };

    data.ayahs.forEach((ayah) => {
      const option = document.createElement("option");
      option.value = String(ayah.aya);
      option.textContent = `আয়াত ${ayah.aya}`;
      ayahSelect.appendChild(option);
    });

    ayahSelect.disabled = false;
    showMessage(editorMessage, "আয়াত নির্বাচন করুন।");
  } catch (error) {
    showMessage(editorMessage, error.message, true);
  }
});

/* ---------- Load approved corrections ---------- */

async function getApprovedCorrections(surahNo, ayahNo) {
  const { data, error } = await supabaseClient
    .from("quran_bn_correction_proposals")
    .select("surah_no,ayah_no,field_name,proposed_text")
    .eq("surah_no", surahNo)
    .eq("ayah_no", ayahNo)
    .eq("status", "approved");

  if (error) {
    throw error;
  }

  const corrections = {};

  (data || []).forEach((row) => {
    corrections[row.field_name] = row.proposed_text;
  });

  return corrections;
}

ayahSelect.addEventListener("change", async () => {
  const ayahNo = Number(ayahSelect.value);

  currentAyah = null;
  setEditorEnabled(false);
  translationInput.value = "";
  footnotesInput.value = "";
  reasonInput.value = "";
  arabicText.textContent = "লোড হচ্ছে...";
  showMessage(editorMessage, "আয়াতের তথ্য লোড হচ্ছে...");

  if (!ayahNo || !currentSurah) {
    arabicText.textContent = "আয়াত নির্বাচন করুন";
    return;
  }

  const sourceAyah = currentSurah.ayahs.find(
    (ayah) => Number(ayah.aya) === ayahNo
  );

  if (!sourceAyah) {
    showMessage(editorMessage, "নির্বাচিত আয়াত পাওয়া যায়নি।", true);
    arabicText.textContent = "আয়াত পাওয়া যায়নি";
    return;
  }

  try {
    const corrections = await getApprovedCorrections(
      currentSurah.number,
      ayahNo
    );

    currentAyah = sourceAyah;

    arabicText.textContent = sourceAyah.arabic || "";

    loadedValues = {
      translation: corrections.translation ?? sourceAyah.translation ?? "",
      footnotes: corrections.footnotes ?? sourceAyah.footnotes ?? ""
    };

    translationInput.value = loadedValues.translation;
    footnotesInput.value = loadedValues.footnotes;

    setEditorEnabled(true);
    showMessage(editorMessage, "আয়াত সম্পাদনার জন্য প্রস্তুত।");
  } catch (error) {
    currentAyah = null;
    arabicText.textContent = sourceAyah.arabic || "";
    showMessage(
      editorMessage,
      "সংশোধিত Data লোড করা যায়নি। নিরাপত্তার কারণে Editor চালু করা হয়নি: " + error.message,
      true
    );
  }
});

/* ---------- Save and publish ---------- */

publishButton.addEventListener("click", async () => {
  if (!currentUser || !currentSurah || !currentAyah) {
    showMessage(editorMessage, "প্রথমে Admin Login করে আয়াত নির্বাচন করুন।", true);
    return;
  }

  const newValues = {
    translation: translationInput.value,
    footnotes: footnotesInput.value
  };

  const changedFields = ["translation", "footnotes"].filter(
    (field) => newValues[field] !== loadedValues[field]
  );

  if (changedFields.length === 0) {
    showMessage(editorMessage, "কোনো পরিবর্তন করা হয়নি।");
    return;
  }

  if (changedFields.some((field) => !newValues[field].trim())) {
    showMessage(editorMessage, "অনুবাদ ও Footnotes ফাঁকা রাখা যাবে না।", true);
    return;
  }

  const confirmed = window.confirm(
    `সূরা ${currentSurah.number}, আয়াত ${currentAyah.aya}-এর ${changedFields.length}টি পরিবর্তন এখনই Publish করবেন?`
  );

  if (!confirmed) {
    return;
  }

  publishButton.disabled = true;
  showMessage(editorMessage, "সংশোধন Save & Publish হচ্ছে...");

  const savedFields = [];

  try {
    for (const field of changedFields) {
      const { error } = await supabaseClient.rpc(
        "publish_quran_bn_correction",
        {
          p_surah_no: currentSurah.number,
          p_ayah_no: currentAyah.aya,
          p_field_name: field,
          p_new_text: newValues[field],
          p_reason: reasonInput.value.trim() || null
        }
      );

      if (error) {
        throw new Error(
          `${field === "translation" ? "অনুবাদ" : "Footnotes"} Save ব্যর্থ: ${error.message}`
        );
      }

      loadedValues[field] = newValues[field];
      savedFields.push(field);
    }

    reasonInput.value = "";
    showMessage(editorMessage, "সংশোধন সফলভাবে Save & Publish হয়েছে।");

    await loadCorrectionHistory();
  } catch (error) {
    if (savedFields.length > 0) {
      showMessage(
        editorMessage,
        `${savedFields.length}টি Field Publish হয়েছে; পরবর্তী Field-এ সমস্যা: ${error.message}। আবার যাচাই করুন।`,
        true
      );
    } else {
      showMessage(editorMessage, error.message, true);
    }

    await loadCorrectionHistory();
  } finally {
    publishButton.disabled = false;
  }
});

/* ---------- Correction History ---------- */

function createHistoryCell(value) {
  const cell = document.createElement("td");
  cell.textContent = value == null || value === "" ? "—" : String(value);
  return cell;
}

async function loadCorrectionHistory() {
  if (!currentUser) {
    return;
  }

  historyList.textContent = "History লোড হচ্ছে...";

  try {
    const { data: history, error } = await supabaseClient
      .from("quran_bn_correction_history")
      .select("id,proposal_id,previous_text,new_text,changed_at")
      .order("changed_at", { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    if (!history || history.length === 0) {
      historyList.textContent = "এখনো কোনো Correction History নেই।";
      return;
    }

    const proposalIds = [...new Set(history.map((item) => item.proposal_id))];

    const { data: proposals, error: proposalError } = await supabaseClient
      .from("quran_bn_correction_proposals")
      .select("id,surah_no,ayah_no,field_name")
      .in("id", proposalIds);

    if (proposalError) {
      throw proposalError;
    }

    const proposalMap = new Map(
      (proposals || []).map((proposal) => [proposal.id, proposal])
    );

    const table = document.createElement("table");
    table.className = "admin-history-table";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    [
      "সময়",
      "সূরা",
      "আয়াত",
      "Field",
      "আগের লেখা",
      "নতুন লেখা"
    ].forEach((heading) => {
      const th = document.createElement("th");
      th.textContent = heading;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    history.forEach((item) => {
      const proposal = proposalMap.get(item.proposal_id);
      const row = document.createElement("tr");

      let dateText = item.changed_at || "";
      if (dateText) {
        const date = new Date(dateText);
        if (!Number.isNaN(date.getTime())) {
          dateText = date.toLocaleString("bn-BD");
        }
      }

      const fieldText = proposal
        ? proposal.field_name === "translation" ? "বাংলা অনুবাদ" : "Footnotes"
        : "—";

      [
        dateText,
        proposal ? proposal.surah_no : "—",
        proposal ? proposal.ayah_no : "—",
        fieldText,
        item.previous_text,
        item.new_text
      ].forEach((value) => {
        row.appendChild(createHistoryCell(value));
      });

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    historyList.replaceChildren(table);
  } catch (error) {
    historyList.textContent = "Correction History লোড করা যায়নি: " + error.message;
  }
}

$("adminRefreshHistory").addEventListener("click", loadCorrectionHistory);

/* ---------- Start ---------- */

setEditorEnabled(false);
restoreAdminSession();
