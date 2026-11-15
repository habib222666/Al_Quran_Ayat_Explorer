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
