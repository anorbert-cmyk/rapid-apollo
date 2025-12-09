// ===========================================
// SIDEBAR MODULE - Collapsible Sidebar Management
// ===========================================

const SidebarModule = (function () {
    'use strict';

    let isCollapsed = false;

    /**
     * Toggle sidebar collapsed/expanded state
     */
    function toggleSidebar() {
        const sidebar = document.getElementById('app-sidebar');
        if (!sidebar) return;

        isCollapsed = !isCollapsed;

        if (isCollapsed) {
            sidebar.setAttribute('data-collapsed', 'true');
            sidebar.classList.remove('w-72', 'lg:w-72');
            sidebar.classList.add('w-20');
        } else {
            sidebar.setAttribute('data-collapsed', 'false');
            sidebar.classList.remove('w-20');
            sidebar.classList.add('w-72', 'lg:w-72');
        }

        // Update toggle button icon
        const toggleIcon = document.querySelector('#sidebar-toggle i');
        if (toggleIcon) {
            if (isCollapsed) {
                toggleIcon.classList.remove('ph-caret-left');
                toggleIcon.classList.add('ph-caret-right');
            } else {
                toggleIcon.classList.remove('ph-caret-right');
                toggleIcon.classList.add('ph-caret-left');
            }
        }

        // Save state
        saveSidebarState(isCollapsed);
    }

    /**
     * Save sidebar state to localStorage
     */
    function saveSidebarState(collapsed) {
        try {
            localStorage.setItem('sidebar-collapsed', collapsed ? 'true' : 'false');
        } catch (e) {
            console.warn('Failed to save sidebar state:', e);
        }
    }

    /**
     * Load sidebar state from localStorage
     */
    function loadSidebarState() {
        try {
            const saved = localStorage.getItem('sidebar-collapsed');
            return saved === 'true';
        } catch (e) {
            console.warn('Failed to load sidebar state:', e);
            return false;
        }
    }

    /**
     * Initialize sidebar
     */
    function init() {
        // Load saved state
        const savedCollapsed = loadSidebarState();
        if (savedCollapsed) {
            isCollapsed = false; // Set to false so toggle() will make it true
            toggleSidebar();
        }

        // Set up toggle button listener
        const toggleButton = document.getElementById('sidebar-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', toggleSidebar);
        }
    }

    // Public API
    return {
        init,
        toggleSidebar,
        isCollapsed: () => isCollapsed
    };
})();

// Expose globally
window.SidebarModule = SidebarModule;
