(function () {
  "use strict";

  var root = document.documentElement;
  var themeButtons = Array.from(document.querySelectorAll("[data-theme-choice]"));
  var filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  var projectCards = Array.from(document.querySelectorAll("[data-categories]"));
  var validThemes = ["industrial", "if", "mec"];

  function readSavedTheme() {
    try {
      var saved = window.localStorage.getItem("danilo-portfolio-theme");
      return validThemes.indexOf(saved) >= 0 ? saved : "industrial";
    } catch (error) {
      return "industrial";
    }
  }

  function saveTheme(theme) {
    try {
      window.localStorage.setItem("danilo-portfolio-theme", theme);
    } catch (error) {
      /* O portfólio continua funcionando caso o navegador bloqueie o armazenamento. */
    }
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    themeButtons.forEach(function (button) {
      var active = button.getAttribute("data-theme-choice") === theme;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-checked", String(active));
    });
    saveTheme(theme);
  }

  function filterProjects(category) {
    filterButtons.forEach(function (button) {
      var active = button.getAttribute("data-filter") === category;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });

    projectCards.forEach(function (card) {
      var categories = (card.getAttribute("data-categories") || "").split(" ");
      card.hidden = category !== "todos" && categories.indexOf(category) === -1;
    });
  }

  themeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      applyTheme(button.getAttribute("data-theme-choice"));
    });
  });

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      filterProjects(button.getAttribute("data-filter"));
    });
  });

  applyTheme(readSavedTheme());
  filterProjects("todos");
})();
