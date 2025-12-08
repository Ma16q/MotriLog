document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");

        if (href.startsWith("#")) {
            e.preventDefault();
            document.querySelector(href).scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
});

fetch("/api/check-auth", { credentials: "include" })
    .then(res => res.json())
    .then(data => {
        const authBox = document.getElementById("auth-buttons");

        if (data.logged_in) {
            authBox.innerHTML = `<a href="/dashboard" class="login-btn">Dashboard</a>`;
        } else {
            authBox.innerHTML = `
                <a href="/login" class="login-btn">Login</a>
                <a href="/register" class="register-btn">Register</a>
            `;
        }
    })
    .catch(() => console.log("Auth check failed."));
