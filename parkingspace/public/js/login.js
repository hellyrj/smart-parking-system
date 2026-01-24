const passwordInput = document.getElementById("password");
const passwordMessage = document.getElementById("passwordMessage");

passwordInput.addEventListener("input", () => {
  const value = passwordInput.value;

  passwordInput.classList.remove("weak", "medium", "strong");
  passwordMessage.textContent = "";

  if (value.length < 6) {
    passwordInput.classList.add("weak");
    passwordMessage.textContent = "Password must be at least 6 characters long.";
  } else if (/[A-Z]/.test(value) && /\d/.test(value) && /[!@#$%^&*]/.test(value)) {
    passwordInput.classList.add("strong");
    passwordMessage.textContent = "Strong password!";
    passwordMessage.style.color = "green";
  } else if (/[A-Z]/.test(value) && /\d/.test(value)) {
    passwordInput.classList.add("medium");
    passwordMessage.textContent = "Medium password. Add a special character for strong password.";
    passwordMessage.style.color = "orange";
  } else {
    passwordInput.classList.add("weak");
    passwordMessage.textContent = "Weak password. Use uppercase, number, and special character.";
    passwordMessage.style.color = "red";
  }
});

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const emailInput = document.getElementById("email");
  const email = emailInput.value;
  const password = passwordInput.value;
  const role = document.getElementById("role").value;

  // HTML5 email validation
  if (!emailInput.checkValidity()) {
    passwordMessage.textContent = "Please enter a valid email address.";
    passwordMessage.style.color = "red";
    return;
  }

  // Password validation before submitting
  if (password.length < 6 || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    passwordMessage.textContent = "Password must be at least 6 characters long and include an uppercase letter and a number.";
    passwordMessage.style.color = "red";
    return;
  }

  const res = await fetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });

  const data = await res.json();

  if (!res.ok) {
    passwordMessage.textContent = data.message;
    passwordMessage.style.color = "red";
    return;
  }

  localStorage.setItem("token", data.token);
  window.location.href = "dashboard.html";
});
