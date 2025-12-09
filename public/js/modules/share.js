// ===========================================
// SHARE MODULE - Result Sharing Functionality
// ===========================================

const ShareModule = (function () {
    'use strict';

    /**
     * Share current result with signed authentication
     */
    async function shareResult(currentTxHash, signer, userAddress) {
        console.log("Share button clicked", { currentTxHash, signer: !!signer });

        if (!currentTxHash) {
            window.ToastModule?.warning("Cannot Share", "No active result to share. Please view a result first.");
            return null;
        }
        if (!signer) {
            window.ToastModule?.warning("Cannot Share", "Wallet not connected. Please connect wallet first.");
            return null;
        }

        const btn = document.getElementById('btn-share');

        try {
            const timestamp = Date.now();
            const message = `Authorize Share for TX ${currentTxHash} at ${timestamp}`;

            if (btn) btn.innerText = "Signing...";

            const signature = await signer.signMessage(message);
            if (btn) btn.innerText = "Generating...";

            const res = await fetch('/api/share/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    txHash: currentTxHash,
                    address: userAddress,
                    signature,
                    timestamp
                })
            });

            if (!res.ok) throw new Error("Share creation failed");
            const { link } = await res.json();

            // Show Link
            const shareUrl = `${window.location.origin}/view.html?id=${link}`;
            prompt("Copy your secure share link:", shareUrl);

            return shareUrl;

        } catch (e) {
            console.error(e);
            window.ToastModule?.error("Share Error", "Failed to share result.");
            return null;
        } finally {
            if (btn) btn.innerHTML = '<i class="ph-bold ph-share-network"></i> Share';
        }
    }

    // Public API
    return {
        shareResult
    };
})();

// Expose globally
window.ShareModule = ShareModule;
