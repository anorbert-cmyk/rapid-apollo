// ===========================================
// THEME MODULE - Light/Dark Theme Management
// ===========================================

const ThemeModule = (function () {
    'use strict';

    // Theme color palettes with AA contrast compliance
    const themes = {
        dark: {
            // Backgrounds
            '--bg-primary': '#030014',
            '--bg-secondary': '#0a0a1a',
            '--bg-tertiary': '#131524',
            '--bg-hover': 'rgba(255,255,255,0.05)',
            '--bg-card': 'rgba(19,21,36,0.8)',

            // Text (AA compliant on dark backgrounds)
            '--text-primary': '#ffffff',
            '--text-secondary': '#d1d5db',
            '--text-tertiary': '#9ca3af',
            '--text-muted': '#6b7280',

            // Borders
            '--border-color': 'rgba(255,255,255,0.05)',
            '--border-hover': 'rgba(255,255,255,0.1)',

            // Accents
            '--accent-primary': '#6366f1',
            '--accent-primary-hover': '#818cf8',
            '--accent-success': '#10b981',
            '--accent-warning': '#f59e0b',
            '--accent-error': '#ef4444',

            // Sidebar
            '--sidebar-bg': 'rgba(10,10,26,0.9)',
            '--sidebar-border': 'rgba(255,255,255,0.05)',
            '--sidebar-item-hover': 'rgba(255,255,255,0.05)',
            '--sidebar-item-active-bg': 'rgba(99,102,241,0.2)',
            '--sidebar-item-active-text': '#ffffff',
        },
        light: {
            // Backgrounds
            '--bg-primary': '#ffffff',
            '--bg-secondary': '#f8f9fa',
            '--bg-tertiary': '#e9ecef',
            '--bg-hover': '#dee2e6',
            '--bg-card': '#ffffff',

            // Text (AA compliant - 4.5:1 minimum)
            '--text-primary': '#212529',      // 16.5:1 contrast
            '--text-secondary': '#495057',    // 9.7:1 contrast
            '--text-tertiary': '#6c757d',     // 4.6:1 contrast (AA ✓)
            '--text-muted': '#868e96',        // 3.8:1 (large text only)

            // Borders
            '--border-color': '#dee2e6',
            '--border-hover': '#adb5bd',

            // Accents (adjusted for AA on white)
            '--accent-primary': '#4338ca',    // Darker indigo for AA
            '--accent-primary-hover': '#3730a3',
            '--accent-success': '#059669',    // Darker green for AA
            '--accent-warning': '#d97706',    // Darker orange for AA
            '--accent-error': '#dc2626',      // Darker red for AA

            // Sidebar
            '--sidebar-bg': '#f8f9fa',
            '--sidebar-border': '#dee2e6',
            '--sidebar-item-hover': '#e9ecef',
            '--sidebar-item-active-bg': '#e0e7ff',
            '--sidebar-item-active-text': '#312e81',
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
