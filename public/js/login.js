if (API.token()) location.href = "/";

const err = document.getElementById("err");
const manual = document.getElementById("manual");
const manualToggle = document.getElementById("manualToggle");
const u = document.getElementById("u");
const p = document.getElementById("p");
const btn = document.getElementById("signin");

function showError(msg) { err.textContent = msg; err.classList.add("show"); }

// Sign in with a username/password. `card` is the role button clicked (if any),
// so we can show a "opening…" state on it.
async function signIn(username, password, card) {
  err.classList.remove("show");
  if (!username || !password) return showError("Enter your username and password.");
  const revert = [];
  if (card) {
    document.querySelectorAll(".role-card").forEach(c => { c.disabled = true; });
    const go = card.querySelector(".role-go");
    const was = go.textContent; go.textContent = "Opening…";
    revert.push(() => { go.textContent = was; document.querySelectorAll(".role-card").forEach(c => c.disabled = false); });
  } else {
    btn.textContent = "Signing in…"; btn.disabled = true;
    revert.push(() => { btn.textContent = "Sign in"; btn.disabled = false; });
  }
  try {
    const data = await API.post("/api/login", { username, password });
    API.setSession(data.token, data.name, data.role);
    location.href = "/";
  } catch (e) {
    showError(e.message);
    revert.forEach(fn => fn());
  }
}

// Role cards — one click opens that dashboard.
document.querySelectorAll(".role-card").forEach(card => {
  card.addEventListener("click", () => signIn(card.dataset.u, card.dataset.p, card));
});

// Reveal the manual username/password form.
manualToggle.addEventListener("click", () => {
  const open = manual.hasAttribute("hidden");
  if (open) { manual.removeAttribute("hidden"); manualToggle.textContent = "Hide username sign-in"; u.focus(); }
  else { manual.setAttribute("hidden", ""); manualToggle.textContent = "Sign in with a username and password instead"; }
});

btn.addEventListener("click", () => signIn(u.value.trim(), p.value));
[u, p].forEach(el => el.addEventListener("keydown", e => { if (e.key === "Enter") signIn(u.value.trim(), p.value); }));
