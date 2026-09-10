(function () {
  "use strict";

  const requestForm = document.querySelector("#recoveryRequestForm");
  const requestButton = document.querySelector("#recoveryRequestButton");
  const newPasswordForm = document.querySelector("#newPasswordForm");
  const newPasswordButton = document.querySelector("#newPasswordButton");
  const message = document.querySelector("#recoveryMessage");
  let recoveryReady = false;

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    if (!window.IFBA_SUPABASE_CONFIGURED || !window.IFBA_SUPABASE) {
      showMessage("Configure a conexão com o Supabase antes de recuperar a senha.", "error");
      requestButton.disabled = true;
      return;
    }

    requestForm.addEventListener("submit", requestRecovery);
    newPasswordForm.addEventListener("submit", saveNewPassword);

    window.IFBA_SUPABASE.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) activatePasswordForm();
    });

    const hashError = recoveryLinkError();
    if (hashError) {
      showMessage(hashError, "error");
      return;
    }

    if (new URLSearchParams(window.location.search).get("modo") === "nova-senha") {
      const { data, error } = await window.IFBA_SUPABASE.auth.getSession();
      if (!error && data.session) activatePasswordForm();
      else showMessage("O link de recuperação é inválido ou expirou. Solicite um novo link.", "error");
    }
  }

  async function requestRecovery(event) {
    event.preventDefault();
    if (!requestForm.checkValidity()) {
      requestForm.reportValidity();
      return;
    }

    const email = document.querySelector("#recoveryEmail").value.trim().toLowerCase();
    const redirectTo = new URL("recuperar-senha.html?modo=nova-senha", window.location.href).href;
    setButtonBusy(requestButton, true, "Enviando…");

    const { error } = await window.IFBA_SUPABASE.auth.resetPasswordForEmail(email, { redirectTo });
    setButtonBusy(requestButton, false, "Enviar link de recuperação");

    if (error) {
      if (error.code === "user_not_found") {
        showUnknownEmail(email);
        return;
      }
      showMessage(recoveryError(error), "error");
      return;
    }

    showAcceptedRequest(email);
  }

  function showAcceptedRequest(email) {
    requestForm.hidden = true;
    message.hidden = true;
    const panel = document.querySelector("#recoverySuccess");
    panel.hidden = false;
    panel.querySelector(".success-mark").textContent = "✓";
    document.querySelector("#recoverySuccessTitle").textContent = "Solicitação aceita";
    document.querySelector("#recoverySuccessText").textContent = `O Supabase aceitou o envio para ${email}. Verifique a caixa de entrada e o spam. Por segurança, alguns projetos não informam se o endereço está cadastrado.`;
    const link = document.querySelector("#recoverySuccessLink");
    link.href = "login.html";
    link.textContent = "Voltar para o acesso";
  }

  function showUnknownEmail(email) {
    requestForm.hidden = true;
    message.hidden = true;
    const panel = document.querySelector("#recoverySuccess");
    panel.hidden = false;
    panel.querySelector(".success-mark").textContent = "!";
    document.querySelector("#recoverySuccessTitle").textContent = "E-mail não cadastrado";
    document.querySelector("#recoverySuccessText").textContent = `Não encontramos uma conta vinculada a ${email}. Confira o endereço informado ou solicite um novo cadastro.`;
    const link = document.querySelector("#recoverySuccessLink");
    link.href = "recuperar-senha.html";
    link.textContent = "Informar outro e-mail";
  }

  function activatePasswordForm() {
    if (recoveryReady) return;
    recoveryReady = true;
    requestForm.hidden = true;
    document.querySelector("#recoverySuccess").hidden = true;
    newPasswordForm.hidden = false;
    message.hidden = false;
    document.querySelector("#recoveryKicker").textContent = "NOVA SENHA";
    document.querySelector("#recoveryTitle").textContent = "Defina uma nova senha";
    document.querySelector("#newPassword").focus();
    window.history.replaceState({}, document.title, "recuperar-senha.html?modo=nova-senha");
  }

  async function saveNewPassword(event) {
    event.preventDefault();
    if (!recoveryReady) {
      showMessage("Abra novamente o link enviado ao seu e-mail.", "error");
      return;
    }
    if (!newPasswordForm.checkValidity()) {
      newPasswordForm.reportValidity();
      return;
    }

    const password = document.querySelector("#newPassword").value;
    const confirmation = document.querySelector("#newPasswordConfirm").value;
    if (password !== confirmation) {
      showMessage("As senhas informadas não coincidem.", "error");
      document.querySelector("#newPasswordConfirm").focus();
      return;
    }

    setButtonBusy(newPasswordButton, true, "Salvando…");
    const { error } = await window.IFBA_SUPABASE.auth.updateUser({ password });
    if (error) {
      setButtonBusy(newPasswordButton, false, "Salvar nova senha");
      showMessage(passwordError(error), "error");
      return;
    }

    await window.IFBA_SUPABASE.auth.signOut();
    newPasswordForm.hidden = true;
    message.hidden = true;
    const success = document.querySelector("#recoverySuccess");
    success.hidden = false;
    document.querySelector("#recoverySuccessTitle").textContent = "Senha atualizada";
    document.querySelector("#recoverySuccessText").textContent = "Sua nova senha foi salva. Você já pode entrar novamente no painel.";
    document.querySelector("#recoverySuccessLink").textContent = "Entrar no painel";
    window.history.replaceState({}, document.title, "recuperar-senha.html?senha=atualizada");
  }

  function recoveryLinkError() {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (!params.get("error")) return "";
    return "O link de recuperação é inválido ou expirou. Solicite um novo link.";
  }

  function recoveryError(error) {
    const text = String(error && error.message || "");
    if (["over_email_send_rate_limit", "over_request_rate_limit"].includes(error.code) || /rate limit|security purposes/i.test(text)) return "Aguarde alguns minutos antes de solicitar outro link.";
    if (error.code === "email_address_not_authorized") return "O serviço de e-mail do Supabase ainda não está autorizado a enviar para este endereço. Configure um SMTP próprio no projeto.";
    if (error.code === "email_provider_disabled") return "A recuperação por e-mail está desativada no Supabase.";
    if (error.code === "email_address_invalid" || /email/i.test(text)) return "Verifique o formato do e-mail informado.";
    return "Não foi possível enviar o link. Tente novamente em instantes.";
  }

  function passwordError(error) {
    const text = String(error && error.message || "");
    if (/same password|different from the old/i.test(text)) return "Escolha uma senha diferente da anterior.";
    if (/password/i.test(text)) return "A senha não atende aos requisitos de segurança configurados no Supabase.";
    if (/session|expired|token/i.test(text)) return "O link expirou. Solicite uma nova recuperação.";
    return "Não foi possível atualizar a senha. Tente novamente.";
  }

  function setButtonBusy(button, active, label) {
    button.disabled = active;
    button.textContent = label;
  }

  function showMessage(text, type) {
    message.hidden = false;
    message.textContent = text;
    message.className = `form-message ${type || ""}`;
  }
})();
