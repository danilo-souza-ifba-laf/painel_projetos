(function () {
  "use strict";

  const form = document.querySelector("#registerForm");
  const button = document.querySelector("#registerButton");
  const message = document.querySelector("#registerMessage");

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    if (!window.IFBA_SUPABASE_CONFIGURED || !window.IFBA_SUPABASE) {
      showMessage("Configure a conexão com o Supabase antes de solicitar acesso.", "error");
      button.disabled = true;
      return;
    }
    form.addEventListener("submit", register);
  }

  async function register(event) {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const name = document.querySelector("#registerName").value.trim();
    const email = document.querySelector("#registerEmail").value.trim().toLowerCase();
    const password = document.querySelector("#registerPassword").value;
    const confirmation = document.querySelector("#registerPasswordConfirm").value;

    if (password !== confirmation) {
      showMessage("As senhas informadas não coincidem.", "error");
      document.querySelector("#registerPasswordConfirm").focus();
      return;
    }

    setBusy(true);
    const redirectUrl = new URL("login.html?cadastro=confirmado", window.location.href).href;
    const { data, error } = await window.IFBA_SUPABASE.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { name, origem: "solicitacao_painel" }
      }
    });

    if (error) {
      showMessage(registerError(error), "error");
      setBusy(false);
      return;
    }

    if (data.session) await window.IFBA_SUPABASE.auth.signOut();
    form.hidden = true;
    message.hidden = true;
    document.querySelector("#registerSuccess").hidden = false;
    document.querySelector("#registerSuccessText").textContent = data.session
      ? "Sua conta foi criada e aguarda a aprovação do administrador."
      : "Verifique seu e-mail para confirmar a conta. Depois da confirmação, a solicitação seguirá aguardando a aprovação do administrador.";
  }

  function registerError(error) {
    const text = String(error && error.message || "");
    if (/already registered|already been registered|user already exists/i.test(text)) return "Este e-mail já possui uma conta. Utilize a página de acesso.";
    if (/password/i.test(text)) return "A senha não atende aos requisitos de segurança configurados no Supabase.";
    if (/email/i.test(text)) return "O e-mail informado não pôde ser utilizado.";
    return "Não foi possível enviar a solicitação. Tente novamente.";
  }

  function setBusy(active) {
    button.disabled = active;
    button.textContent = active ? "Enviando…" : "Enviar solicitação";
  }

  function showMessage(text, type) {
    message.hidden = false;
    message.textContent = text;
    message.className = `form-message ${type || ""}`;
  }
})();

