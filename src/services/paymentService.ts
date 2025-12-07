import { ethers } from 'ethers';
import { config } from '../config';
import { Tier, getTierPriceUSD, getEthPrice } from './priceService';

const provider = new ethers.JsonRpcProvider(config.RPC_URL);

interface ValidationResult {
    valid: boolean;
    message: string;
}

export const verifyTransaction = async (txHash: string, expectedTier: string): Promise<ValidationResult> => {
    try {
        const tx = await provider.getTransaction(txHash);

        if (!tx) {
            return { valid: false, message: 'Transaction not found on chain' };
        }

        // Check Recipient
        if (tx.to?.toLowerCase() !== config.RECEIVER_WALLET_ADDRESS.toLowerCase()) {
            return { valid: false, message: `Invalid recipient: sent to ${tx.to}` };
        }

        // Check Chain ID (Ethereum Mainnet = 1)
        if (tx.chainId !== 1n) {
            return { valid: false, message: `Invalid network. Expected Ethereum Mainnet (1), got ${tx.chainId}` };
        }

        // Check Amount logic with Price Service
        let tierEnum: Tier;
        if (expectedTier === 'standard') tierEnum = Tier.STANDARD;
        else if (expectedTier === 'medium') tierEnum = Tier.MEDIUM;
        else if (expectedTier === 'full') tierEnum = Tier.FULL;
        else return { valid: false, message: 'Invalid tier specified' };

        const usdPrice = getTierPriceUSD(tierEnum);
        const ethRate = await getEthPrice();
        const expectedEth = usdPrice / ethRate;

        // Allow 2% slippage because price might fluctuate between frontend load and backend check
        const minimumEth = expectedEth * 0.98;
        const txEthValue = Number(ethers.formatEther(tx.value));

        // console.log(`Debug: User sent ${txEthValue} ETH. Required ~${expectedEth} ETH (rate: ${ethRate})`);

        if (txEthValue < minimumEth) {
            return { valid: false, message: `Insufficient amount. Sent ${txEthValue} ETH, required approx ${expectedEth} ETH ($${usdPrice})` };
        }

        // Check Confirmations
        const receipt = await tx.wait(1);

        if (!receipt || receipt.status !== 1) {
            return { valid: false, message: 'Transaction failed or reverted' };
        }

        return { valid: true, message: 'Payment verified' };

    } catch (error) {
        console.error("Payment verification error:", error);
        return { valid: false, message: 'Internal verification error' };
    }
};
