const passwordInput = document.getElementById("password");
const passwordMessage = document.getElementById("passwordMessage");



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
