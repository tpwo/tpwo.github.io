(() => {
    const preferenceKey = "tpwo-blog-theme";
    const root = document.documentElement;
    const darkMode = window.matchMedia("(prefers-color-scheme: dark)");
    let preference = null;

    try {
        const storedPreference = window.localStorage.getItem(preferenceKey);
        if (storedPreference === "light" || storedPreference === "dark") {
            preference = storedPreference;
        }
    } catch (error) {
        console.warn("Could not read the theme preference from localStorage.", error);
    }

    function updateTheme() {
        const theme = preference || (darkMode.matches ? "dark" : "light");
        root.dataset.theme = theme;

        const toggle = document.getElementById("theme-toggle");
        if (toggle) {
            const nextTheme = theme === "dark" ? "light" : "dark";
            toggle.setAttribute("aria-label", `Switch to ${nextTheme} theme`);
            toggle.setAttribute("title", `Switch to ${nextTheme} theme`);
        }
    }

    updateTheme();

    document.addEventListener("DOMContentLoaded", () => {
        const toggle = document.getElementById("theme-toggle");
        if (!toggle) {
            return;
        }

        toggle.addEventListener("click", () => {
            preference = root.dataset.theme === "dark" ? "light" : "dark";
            updateTheme();

            try {
                window.localStorage.setItem(preferenceKey, preference);
            } catch (error) {
                console.warn("Could not save the theme preference to localStorage.", error);
            }
        });
    });

    darkMode.addEventListener("change", () => {
        if (!preference) {
            updateTheme();
        }
    });
})();
