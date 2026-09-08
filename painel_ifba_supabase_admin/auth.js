(function () {
  "use strict";

  const form = document.querySelector("#loginForm");
  const message = document.querySelector("#loginMessage");
  const button = document.querySelector("#loginButton");
  const allowedReturns = new Set(["index.html", "admin.html"]);

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    if (!window.IFBA_SUPABASE_CONFIGURED || !window.IFBA_SUPABASE) {
      showMessage("Configure a URL e a chave publicável em supabase-config.js antes de entrar.", "error");
      button.disabled = true;
      return;
    }

    const { data } = await window.IFBA_SUPABASE.auth.getSession();
    if (data.session) {
      window.location.replace(returnTarget());
      return;
    }

    form.addEventListener("submit", signIn);
  }

  async function signIn(event) {
    event.preventDefault();
    const email = document.querySelector("#loginEmail").value.trim();
    const password = document.querySelector("#loginPassword").value;
    if (!email || !password) {
      showMessage("Informe o e-mail e a senha.", "error");
      return;
    }

    setBusy(true);
    const { error } = await window.IFBA_SUPABASE.auth.signInWithPassword({ email, password });
    if (error) {
      showMessage(loginError(error), "error");
      setBusy(false);
      return;
    }

    showMessage("Acesso autorizado. Abrindo o painel…", "success");
    window.location.replace(returnTarget());
  }

  function returnTarget() {
    const value = new URLSearchParams(window.location.search).get("return") || "index.html";
    return allowedReturns.has(value) ? value : "index.html";
  }

  function loginError(error) {
    if (/invalid login credentials/i.test(error.message || "")) return "E-mail ou senha inválidos.";
    if (/email not confirmed/i.test(error.message || "")) return "Confirme o e-mail antes de entrar.";
    return "Não foi possível entrar. Verifique os dados e tente novamente.";
  }

  function setBusy(active) {
    button.disabled = active;
    button.textContent = active ? "Entrando…" : "Entrar";
  }

  function showMessage(text, type) {
    message.textContent = text;
    message.className = `form-message ${type || ""}`;
  }
})();

