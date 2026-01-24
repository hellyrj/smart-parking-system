document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  // Email validation
  if (!emailInput.checkValidity()) {
    alert("Please enter a valid email address.");
    return;
  }

  const password = passwordInput.value;

  // Strong password requirement
  if (
    password.length < 6 ||
    !/[A-Z]/.test(password) ||
    !/\d/.test(password)
  ) {
    alert(
      "Password must be at least 6 characters and include one uppercase letter and one number."
    );
    return;
  }

  const email = emailInput.value;

  const res = await fetch("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  alert(data.message);

  if (res.ok) {
    window.location.href = "login.html";
  }
});

/* Password strength UI */
document.getElementById("password").addEventListener("input", () => {
  const input = document.getElementById("password");
  const value = input.value;

  input.classList.remove("weak", "medium", "strong");

  if (value.length < 6) {
    input.classList.add("weak");
  } else if (/[A-Z]/.test(value) && /\d/.test(value)) {
    input.classList.add("strong");
  } else {
    input.classList.add("medium");
  }
});
