// ===========================================
// THEME MODULE - Light/Dark Theme Management
// ===========================================

const ThemeModule = (function () {
    'use strict';

    // Semantic Theme System
    const themes = {
        dark: {
            // Base Backgrounds
            '--bg-body': '#030014',
            '--bg-panel': '#0a0a1a',
            '--bg-card': 'rgba(13, 14, 28, 0.7)', // Glassy card
            '--bg-input': 'rgba(255, 255, 255, 0.05)',
            '--bg-hover': 'rgba(255, 255, 255, 0.05)',

            // Typography
            '--text-main': '#ffffff',
            '--text-secondary': '#9ca3af', // gray-400
            '--text-muted': '#6b7280',     // gray-500

            // Borders
            '--border-subtle': 'rgba(255, 255, 255, 0.08)',
            '--border-focus': 'rgba(99, 102, 241, 0.5)',

            // Accents
            '--accent-primary': '#6366f1', // Indigo-500
            '--accent-glow': 'rgba(99, 102, 241, 0.5)',
            '--accent-text': '#818cf8',    // Indigo-400

            // Sidebar specifics
            '--sidebar-bg': 'rgba(10, 10, 26, 0.95)',
            '--sidebar-border': 'rgba(255, 255, 255, 0.05)',
            '--sidebar-item-active-bg': 'rgba(255, 255, 255, 0.05)',
        },
        light: {
            // Base Backgrounds
            '--bg-body': '#f3f4f6',        // gray-100
            '--bg-panel': '#ffffff',
            '--bg-card': '#ffffffff',       // Solid white for contrast
            '--bg-input': '#f9fafb',        // gray-50
            '--bg-hover': '#f3f4f6',        // gray-100

            // Typography
            '--text-main': '#111827',      // gray-900 (High Contrast)
            '--text-secondary': '#4b5563', // gray-600
            '--text-muted': '#9ca3af',     // gray-400

            // Borders
            '--border-subtle': '#e5e7eb',  // gray-200
            '--border-focus': '#4f46e5',   // Indigo-600

            // Accents
            '--accent-primary': '#4f46e5', // Indigo-600 (Darker for AA on light)
            '--accent-glow': 'rgba(79, 70, 229, 0.3)',
            '--accent-text': '#4338ca',    // Indigo-700

            // Sidebar specifics
            '--sidebar-bg': '#ffffff',
            '--sidebar-border': '#e5e7eb',
            '--sidebar-item-active-bg': '#f3f4f6',
        }
    };

    /**
     * Apply theme to document
     */
    function applyTheme(themeName) {
        const theme = themes[themeName];
        if (!theme) {
            console.error(`Theme "${themeName}" not found`);
            return;
        }

        const root = document.documentElement;

        // Apply all CSS variables
        Object.entries(theme).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        // Set data attribute for theme-specific styling
        root.setAttribute('data-theme', themeName);
    }

    /**
     * Toggle between light and dark theme
     */
    function toggleTheme() {
        const currentTheme = getCurrentTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        applyTheme(newTheme);
        saveTheme(newTheme);

        // Show toast notification
        const icon = newTheme === 'light' ? '☀️' : '🌙';
        const message = newTheme === 'light' ? 'Light mode activated' : 'Dark mode activated';
        window.ToastModule?.info(icon + ' Theme Changed', message);
    }

    /**
     * Get current theme
     */
    function getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'dark';
    }

    /**
     * Save theme preference to localStorage
     */
    function saveTheme(themeName) {
        try {
            localStorage.setItem('theme-preference', themeName);
        } catch (e) {
            console.warn('Failed to save theme preference:', e);
        }
    }

    /**
     * Load theme preference from localStorage
     */
    function loadTheme() {
        try {
            const savedTheme = localStorage.getItem('theme-preference');
            return savedTheme || 'dark'; // Default to dark
        } catch (e) {
            console.warn('Failed to load theme preference:', e);
            return 'dark';
        }
    }

    /**
     * Initialize theme system
     */
    function init() {
        console.log('ThemeModule: Initializing...');
        const theme = loadTheme();
        console.log('ThemeModule: Loaded theme:', theme);
        applyTheme(theme);

        // Set up toggle button listener
        const toggleButton = document.getElementById('theme-toggle');
        console.log('ThemeModule: Toggle button found:', !!toggleButton);
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                console.log('ThemeModule: Toggle clicked');
                toggleTheme();
            });
            console.log('ThemeModule: Event listener attached');
        } else {
            console.warn('ThemeModule: theme-toggle button not found in DOM');
        }
    }

    // Public API
    return {
        init,
        toggleTheme,
        applyTheme,
        getCurrentTheme,
        loadTheme,
        saveTheme
    };
})();

// Expose globally
window.ThemeModule = ThemeModule;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeModule.init());
} else {
    ThemeModule.init();
}
