let loginButton = document.querySelector("button");
let errorDiv = document.getElementById("error");
let passInput = document.getElementById("password");

// Enter-Taste
passInput.addEventListener("keypress", (e) => {
	if (e.key === "Enter") login();
});

async function login() {
	const password = passInput.value.trim();
	if (!password) {
		showError("Passwort eingeben!");
		return;
	}

	// Loading-State
	loginButton.textContent = "Login...";
	loginButton.classList.add("loading");
	errorDiv.style.display = "none";

	try {
		const response = await fetch("/authorize", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ password: password })
		});

		if (!response.ok) {
			throw new Error(await response.text());
		}

		const data = await response.json();
		localStorage.setItem("token", data.token);
		window.location.href = "/fe";
	} catch (error) {
		showError(error.message || "Login fehlgeschlagen");
	} finally {
		loginButton.textContent = "Login";
		loginButton.classList.remove("loading");
	}
}

function showError(msg) {
	errorDiv.textContent = msg;
	errorDiv.style.display = "block";
	passInput.focus();
}

// Auto-Fokus
passInput.focus();
