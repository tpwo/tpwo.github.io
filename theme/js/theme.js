const themeStorageKey = "tpwo-blog-theme";
const themePreferences = ["auto", "light", "dark"];
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

function getEffectiveTheme() {
    if (themePreference === "auto") {
        return systemTheme.matches ? "dark" : "light";
    }

    return themePreference;
}

function readThemePreference() {
    try {
        const preference = window.localStorage.getItem(themeStorageKey);
        return themePreferences.includes(preference) ? preference : "auto";
    } catch (error) {
        console.warn("Could not read the theme preference from localStorage.", error);
        return "auto";
    }
}

function applyTheme() {
    document.documentElement.setAttribute("data-theme", getEffectiveTheme());
    updateThemeToggle();
}

function updateThemeToggle() {
    const themeToggle = document.getElementById("theme-toggle");
    if (!themeToggle) {
        return;
    }

    const nextTheme = getEffectiveTheme() === "dark" ? "light" : "dark";
    const label = `Switch to ${nextTheme} theme`;
    themeToggle.setAttribute("aria-label", label);
    themeToggle.setAttribute("title", label);
}

let themePreference = readThemePreference();
applyTheme();

document.addEventListener("DOMContentLoaded", () => {
    const themeToggle = document.getElementById("theme-toggle");
    if (!themeToggle) {
        return;
    }

    updateThemeToggle();
    themeToggle.addEventListener("click", () => {
        themePreference = getEffectiveTheme() === "dark" ? "light" : "dark";
        applyTheme();

        try {
            window.localStorage.setItem(themeStorageKey, themePreference);
        } catch (error) {
            console.warn("Could not save the theme preference to localStorage.", error);
        }
    });

    systemTheme.addEventListener("change", () => {
        if (themePreference === "auto") {
            applyTheme();
        }
    });
});
