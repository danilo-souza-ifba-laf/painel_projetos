const form = document.querySelector("#login-form");
const userInput = document.querySelector("#usuario");
const passwordInput = document.querySelector("#senha");
const loginButton = document.querySelector("#login-button");
const formMessage = document.querySelector("#form-message");

const fields = [
  { input: userInput, error: document.querySelector("#usuario-error"), message: "Informe o usuário." },
  { input: passwordInput, error: document.querySelector("#senha-error"), message: "Informe a senha." },
];

function validateField(field) {
  const isValid = field.input.value.trim().length > 0;
  field.input.setAttribute("aria-invalid", String(!isValid));
  field.error.textContent = isValid ? "" : field.message;
  return isValid;
}

fields.forEach((field) => {
  field.input.addEventListener("input", () => {
    if (field.input.getAttribute("aria-invalid") === "true") validateField(field);
    formMessage.textContent = "";
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const isValid = fields.map(validateField).every(Boolean);

  if (!isValid) {
    fields.find((field) => field.input.getAttribute("aria-invalid") === "true")?.input.focus();
    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = "Entrando...";
  formMessage.textContent = "";

  window.setTimeout(() => {
    loginButton.disabled = false;
    loginButton.textContent = "Login";
    formMessage.textContent = "Interface pronta para integração com o seu sistema de autenticação.";
  }, 700);
});
