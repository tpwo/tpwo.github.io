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

    function initializeToc() {
        const content = document.querySelector(".post-content");
        const toc = content?.querySelector("nav#toc");
        const header = document.querySelector(".post-header");
        const title = toc?.querySelector("#toc-title");
        const list = toc?.querySelector(".toc-list.level-1");
        if (!toc || !header || !title || !list) {
            return;
        }

        header.append(toc);
        const mobileLayout = window.matchMedia("(max-width: 640px)");
        list.id = "toc-list";
        const titleText = title.textContent.trim();

        const toggle = document.createElement("button");
        toggle.className = "toc-toggle";
        toggle.type = "button";
        toggle.textContent = titleText;
        toggle.setAttribute("aria-controls", list.id);

        function setMobileLayout(isMobile) {
            if (isMobile) {
                title.replaceChildren(toggle);
            } else {
                title.textContent = titleText;
            }
            list.hidden = isMobile;
            if (isMobile) {
                toggle.setAttribute("aria-expanded", "false");
            }
        }

        toggle.addEventListener("click", () => {
            list.hidden = !list.hidden;
            toggle.setAttribute("aria-expanded", String(!list.hidden));
        });

        document.addEventListener("click", (event) => {
            if (
                mobileLayout.matches &&
                event.target instanceof Node &&
                !toc.contains(event.target) &&
                !list.hidden
            ) {
                list.hidden = true;
                toggle.setAttribute("aria-expanded", "false");
            }
        });

        mobileLayout.addEventListener("change", (event) => {
            setMobileLayout(event.matches);
        });

        setMobileLayout(mobileLayout.matches);
    }

    function initializeCodeCopy() {
        for (const code of document.querySelectorAll(
            ".post-content .listing-block pre code[data-lang]",
        )) {
            const block = code.closest(".listing-block");
            const pre = code.closest("pre");
            const language = code.dataset.lang;
            if (!block || !pre || !language) {
                continue;
            }

            const toolbox = document.createElement("span");
            toolbox.className = "source-toolbox";

            const languageLabel = document.createElement("span");
            languageLabel.className = "source-lang";
            languageLabel.textContent = language.toUpperCase();
            toolbox.append(languageLabel);

            const separator = document.createElement("span");
            separator.className = "source-separator";
            separator.setAttribute("aria-hidden", "true");
            separator.textContent = "|";
            toolbox.append(separator);

            const button = document.createElement("button");
            button.className = "copy-button";
            button.type = "button";
            button.title = "Copy to clipboard";
            button.setAttribute("aria-label", "Copy code to clipboard");

            const toast = document.createElement("span");
            toast.className = "copy-toast";
            toast.setAttribute("aria-live", "polite");
            toast.hidden = true;
            toolbox.append(toast, button);

            let feedbackTimeout;
            button.addEventListener("click", async () => {
                const source = code.cloneNode(true);
                source.querySelectorAll(".conum").forEach((conum) => conum.remove());
                const text = source.textContent.replace(/[ \t]+$/gm, "").trimEnd();

                try {
                    await navigator.clipboard.writeText(text);
                    toast.textContent = "Copied!";
                } catch (error) {
                    console.error("Could not copy code listing to clipboard.", error);
                    toast.textContent = "Copy failed";
                }

                toast.hidden = false;
                window.clearTimeout(feedbackTimeout);
                feedbackTimeout = window.setTimeout(() => {
                    toast.hidden = true;
                }, 1500);
            });

            pre.classList.add("has-copy-button");
            pre.prepend(toolbox);
        }
    }

    function initializeContextualFootnotes() {
        const content = document.querySelector(".post-content");
        const footnotesSection = content?.querySelector("section.footnotes");
        if (!content || !footnotesSection) {
            return;
        }

        const mobileLayout = window.matchMedia("(max-width: 640px)");
        const contextualNotes = [];
        const notesById = new Map();
        const toc = document.querySelector(".post-header #toc");
        const references = Array.from(content.querySelectorAll("a.footnote-ref"));

        for (const definition of footnotesSection.querySelectorAll("li.footnote")) {
            const noteId = definition.id;
            const reference = references.find(
                (candidate) => candidate.getAttribute("href") === `#${noteId}`,
            );
            const paragraph = reference?.closest("p");
            if (!noteId || !reference || !paragraph?.parentElement) {
                continue;
            }

            let context = paragraph.parentElement;
            if (!context.classList.contains("footnote-context")) {
                context = document.createElement("div");
                context.className = "footnote-context";
                paragraph.before(context);
                context.append(paragraph);
            }

            const note = document.createElement("aside");
            note.className = "contextual-footnote";
            note.id = noteId;
            note.setAttribute("role", definition.getAttribute("role") || "doc-endnote");
            note.hidden = mobileLayout.matches;

            const label = reference.textContent.trim().replace(/^\[|\]$/g, "");
            const number = document.createElement("span");
            number.className = "footnote-number";
            number.textContent = label;
            note.append(number);

            const body = document.createElement("div");
            body.className = "contextual-footnote-content";
            for (const backref of definition.querySelectorAll("a.footnote-backref")) {
                backref.remove();
            }
            while (definition.firstChild) {
                body.append(definition.firstChild);
            }
            definition.remove();
            note.append(body);
            context.append(note);

            const referenceControl = document.createElement("span");
            referenceControl.className = "footnote-ref";
            referenceControl.id = reference.id;
            referenceControl.textContent = label;
            reference.replaceWith(referenceControl);
            const contextualNote = { note, referenceControl, label };
            contextualNotes.push(contextualNote);
            notesById.set(noteId, contextualNote);
        }

        if (contextualNotes.length === 0) {
            return;
        }

        function setMobileLayout(isMobile) {
            for (const contextualNote of contextualNotes) {
                contextualNote.note.hidden = isMobile;
                if (isMobile) {
                    const button = document.createElement("button");
                    button.className = "footnote-ref";
                    button.id = contextualNote.referenceControl.id;
                    button.type = "button";
                    button.textContent = contextualNote.label;
                    button.setAttribute("aria-controls", contextualNote.note.id);
                    button.setAttribute("aria-expanded", "false");
                    button.setAttribute("aria-label", `Show note ${contextualNote.label}`);
                    contextualNote.referenceControl.replaceWith(button);
                    contextualNote.referenceControl = button;
                } else {
                    const reference = document.createElement("span");
                    reference.className = "footnote-ref";
                    reference.id = contextualNote.referenceControl.id;
                    reference.textContent = contextualNote.label;
                    contextualNote.referenceControl.replaceWith(reference);
                    contextualNote.referenceControl = reference;
                }
            }
        }

        function spaceNotesBelowToc() {
            for (const contextualNote of contextualNotes) {
                contextualNote.note.style.marginTop = "";
            }

            if (!toc || mobileLayout.matches) {
                return;
            }

            const tocBounds = toc.getBoundingClientRect();
            const gap = Number.parseFloat(getComputedStyle(root).fontSize) * 0.75;
            for (const contextualNote of contextualNotes) {
                const noteBounds = contextualNote.note.getBoundingClientRect();
                const overlapsHorizontally =
                    noteBounds.left < tocBounds.right && noteBounds.right > tocBounds.left;
                if (overlapsHorizontally && noteBounds.top < tocBounds.bottom + gap) {
                    contextualNote.note.style.marginTop =
                        `${tocBounds.bottom + gap - noteBounds.top}px`;
                }
            }
        }

        function closeNote(contextualNote) {
            contextualNote.note.hidden = true;
            contextualNote.referenceControl.setAttribute("aria-expanded", "false");
        }

        function openNote(contextualNote) {
            contextualNote.note.hidden = false;
            contextualNote.referenceControl.setAttribute("aria-expanded", "true");
        }

        document.addEventListener("click", (event) => {
            if (!(event.target instanceof Element) || !mobileLayout.matches) {
                return;
            }

            const reference = event.target.closest("button.footnote-ref");
            const noteId = reference?.getAttribute("aria-controls");
            const contextualNote = noteId ? notesById.get(noteId) : undefined;
            if (contextualNote) {
                const shouldOpen = contextualNote.note.hidden;
                for (const otherNote of contextualNotes) {
                    closeNote(otherNote);
                }
                if (shouldOpen) {
                    openNote(contextualNote);
                }
                return;
            }

            if (event.target.closest(".contextual-footnote")) {
                return;
            }
            for (const note of contextualNotes) {
                if (!note.note.hidden) {
                    closeNote(note);
                }
            }
        });

        mobileLayout.addEventListener("change", (event) => {
            setMobileLayout(event.matches);
        });

        setMobileLayout(mobileLayout.matches);
        spaceNotesBelowToc();
        window.addEventListener("resize", spaceNotesBelowToc);
        window.addEventListener("load", spaceNotesBelowToc);

        if (!footnotesSection.querySelector("li.footnote")) {
            footnotesSection.remove();
        }
    }

    updateTheme();

    document.addEventListener("DOMContentLoaded", () => {
        initializeToc();
        initializeCodeCopy();
        initializeContextualFootnotes();

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
