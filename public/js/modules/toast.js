/**
 * Toast Notification Module
 * Handles all toast notifications in the application
 */
const ToastModule = (function () {
    const DURATION = window.APP_CONFIG?.TOAST_DURATION_MS || 8000;

    /**
     * Show a toast notification
     * @param {string} title - Toast title
     * @param {string} message - Toast message
     * @param {string} type - Toast type: 'success', 'error', 'info' (default)
     */
    function show(title, message, type = 'info') {
        const toast = document.getElementById('toastNotification');
        const toastTitle = document.getElementById('toastTitle');
        const toastMessage = document.getElementById('toastMessage');
        const toastIcon = document.getElementById('toastIcon');

        if (!toast || !toastTitle || !toastMessage) {
            console.warn('Toast elements not found');
            return;
        }

        toastTitle.innerText = title;
        toastMessage.innerText = message;

        // Update icon based on type
        if (toastIcon) {
            toastIcon.className = 'ph-bold text-xl ';
            switch (type) {
                case 'success':
                    toastIcon.className += 'ph-check-circle text-green-400';
                    break;
                case 'error':
                    toastIcon.className += 'ph-warning-circle text-red-400';
                    break;
                case 'warning':
                    toastIcon.className += 'ph-warning text-yellow-400';
                    break;
                default:
                    toastIcon.className += 'ph-info text-blue-400';
            }
        }

        // Show toast
        toast.classList.remove('hidden', 'translate-x-full');
        toast.classList.add('flex', 'translate-x-0');

        // Auto-hide after duration
        setTimeout(() => {
            hide();
        }, DURATION);
    }

    /**
     * Hide the toast notification
     */
    function hide() {
        const toast = document.getElementById('toastNotification');
        if (toast) {
            toast.classList.add('translate-x-full');
            setTimeout(() => {
                toast.classList.add('hidden');
                toast.classList.remove('flex');
            }, 300);
        }
    }

    /**
     * Show success toast
     */
    function success(title, message) {
        show(title, message, 'success');
    }

    /**
     * Show error toast
     */
    function error(title, message) {
        show(title, message, 'error');
    }

    /**
     * Show warning toast
     */
    function warning(title, message) {
        show(title, message, 'warning');
    }

    /**
     * Show info toast
     */
    function info(title, message) {
        show(title, message, 'info');
    }

    // Public API
    return {
        show,
        hide,
        success,
        error,
        warning,
        info
    };
})();

// Expose to global scope for backward compatibility
window.ToastModule = ToastModule;
