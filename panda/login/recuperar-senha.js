const RECOVERY_ENDPOINT = "";

const form = document.querySelector("#recovery-form");
const userInput = document.querySelector("#recovery-user");
const emailInput = document.querySelector("#recovery-email");
const button = document.querySelector("#recovery-button");
const message = document.querySelector("#recovery-message");

const fields = [
  {
    input: userInput,
    error: document.querySelector("#recovery-user-error"),
    validate: (value) => value.trim().length >= 3,
    text: "Informe o usuário cadastrado.",
  },
  {
    input: emailInput,
    error: document.querySelector("#recovery-email-error"),
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
    text: "Informe um e-mail válido.",
  },
];

function validateField(field) {
  const valid = field.validate(field.input.value);
  field.input.setAttribute("aria-invalid", String(!valid));
  field.error.textContent = valid ? "" : field.text;
  return valid;
}

fields.forEach((field) => {
  field.input.addEventListener("input", () => {
    if (field.input.getAttribute("aria-invalid") === "true") validateField(field);
    message.classList.remove("is-visible");
  });
});

async function requestRecovery(payload) {
  if (!RECOVERY_ENDPOINT) {
    await new Promise((resolve) => window.setTimeout(resolve, 850));
    return;
  }

  await fetch(RECOVERY_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const valid = fields.map(validateField).every(Boolean);

  if (!valid) {
    fields.find((field) => field.input.getAttribute("aria-invalid") === "true")?.input.focus();
    return;
  }

  button.disabled = true;
  button.textContent = "Enviando...";
  message.classList.remove("is-visible");

  try {
    await requestRecovery({ usuario: userInput.value.trim(), email: emailInput.value.trim() });
  } finally {
    button.disabled = false;
    button.textContent = "Enviar instruções";
    message.textContent = "Se o usuário e o e-mail corresponderem a um cadastro, as instruções de recuperação serão enviadas. Verifique também a caixa de spam.";
    message.classList.add("is-visible");
    form.reset();
  }
});
