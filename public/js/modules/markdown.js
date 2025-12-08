/**
 * Markdown Renderer Module
 * Handles markdown rendering with security and UX enhancements
 */
const MarkdownModule = (function () {
    /**
     * Render markdown content safely
     * @param {string} content - Markdown content
     * @param {string|HTMLElement} container - Container element or ID
     */
    function render(content, container) {
        const el = typeof container === 'string'
            ? document.getElementById(container)
            : container;

        if (!el) {
            console.warn('Container not found for markdown rendering');
            return;
        }

        // Parse markdown
        let html = content;
        if (window.marked) {
            html = marked.parse(content);
        }

        // Sanitize HTML (XSS protection)
        if (window.DOMPurify) {
            html = DOMPurify.sanitize(html);
        }

        el.innerHTML = html;

        // Add copy buttons to code blocks
        addCopyButtons(el);
    }

    /**
     * Add copy buttons to code blocks
     * @param {HTMLElement} container - Container with code blocks
     */
    function addCopyButtons(container) {
        container.querySelectorAll('pre code').forEach((block) => {
            const pre = block.parentElement;

            // Check if button already exists
            if (pre.querySelector('.copy-btn')) return;

            pre.style.position = 'relative';

            const btn = document.createElement('button');
            btn.className = 'absolute top-2 right-2 px-2 py-1 bg-white/10 text-gray-400 text-[10px] rounded hover:bg-white/20 transition cursor-pointer copy-btn';
            btn.innerText = 'Copy';
            btn.onclick = async () => {
                try {
                    await navigator.clipboard.writeText(block.innerText);
                    btn.innerText = 'Copied!';
                    btn.classList.add('text-green-400');
                    setTimeout(() => {
                        btn.innerText = 'Copy';
                        btn.classList.remove('text-green-400');
                    }, 2000);
                } catch (err) {
                    console.error('Copy failed:', err);
                    btn.innerText = 'Failed';
                }
            };

            pre.appendChild(btn);
        });
    }

    // Public API
    return {
        render,
        addCopyButtons
    };
})();

// Expose to global scope
window.MarkdownModule = MarkdownModule;
