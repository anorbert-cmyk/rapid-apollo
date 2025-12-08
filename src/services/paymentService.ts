import { ethers } from 'ethers';
import { config } from '../config';
import { Tier, getTierPriceUSD, getEthPrice } from './priceService';

const provider = new ethers.JsonRpcProvider(config.RPC_URL);

export interface TransactionValidationResult {
    valid: boolean;
    message?: string;
    from?: string; // Address of the sender
}

// Helper function to get ETH price for a tier (derived from original logic)
const getTierPriceETH = async (tier: Tier): Promise<number> => {
    const usdPrice = getTierPriceUSD(tier);
    const ethRate = await getEthPrice();
    return usdPrice / ethRate;
};

export async function verifyTransaction(txHash: string, tier: Tier): Promise<TransactionValidationResult> {
    try {
        const tx = await provider.getTransaction(txHash);

        if (!tx) {
            return { valid: false, message: 'Transaction not found on chain yet.' };
        }

        // Check 1: Recipient
        if (tx.to?.toLowerCase() !== config.RECEIVER_WALLET_ADDRESS.toLowerCase()) {
            return { valid: false, message: 'Invalid recipient address.' };
        }

        // Check 2: Chain ID (Mainnet = 1)
        if (tx.chainId !== 1n) {
            return { valid: false, message: 'Incorrect network (must be Mainnet)' };
        }

        // Check Amount
        const requiredAmount = await getTierPriceETH(tier);
        const paidAmount = parseFloat(ethers.formatEther(tx.value));

        // Allow small slippage (e.g. 0.0001 or 1%) if needed, but strict is better for now
        if (paidAmount < requiredAmount * 0.995) {
            return { valid: false, message: `Insufficient amount. Sent: ${paidAmount}, Required: ${requiredAmount}` };
        }

        // Check confirmations
        const receipt = await tx.wait(1);
        if (!receipt) return { valid: false, message: "Transaction failed or pending" };

        return { valid: true, from: tx.from };

    } catch (error: any) {
        console.error('Payment verification failed:', error);
        return { valid: false, message: error.message || 'Verification error' };
    }
}
