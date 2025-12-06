import axios from 'axios';
import { config } from '../config';

export enum Tier {
    STANDARD = 'standard',
    MEDIUM = 'medium',
    FULL = 'full'
}

// Simple Caching
let cachedPrice: number | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export const getEthPrice = async (): Promise<number> => {
    const now = Date.now();

    if (cachedPrice && (now - lastFetchTime < CACHE_TTL_MS)) {
        return cachedPrice;
    }

    try {
        const response = await axios.get(config.ETH_PRICE_API_URL);
        // CoinGecko structure: { ethereum: { usd: 3500.50 } }
        const price = response.data.ethereum.usd;

        cachedPrice = price;
        lastFetchTime = now;

        return price;
    } catch (error) {
        console.error("Failed to fetch ETH price:", error);

        // Return stale cache if available and error occurs
        if (cachedPrice) {
            console.warn("Returning stale cached price due to API failure");
            return cachedPrice;
        }

        throw new Error("Price service unavailable");
    }
};

export const getTierPriceUSD = (tier: Tier): number => {
    switch (tier) {
        case Tier.STANDARD: return config.TIER_STANDARD_USD;
        case Tier.MEDIUM: return config.TIER_MEDIUM_USD;
        case Tier.FULL: return config.TIER_FULL_USD;
        default: throw new Error("Invalid Tier");
    }
};

export const getTierPriceETH = async (tier: Tier): Promise<string> => {
    const priceUSD = getTierPriceUSD(tier);
    const ethRate = await getEthPrice();

    // Convert USD to ETH (with 6 decimal places for precision/rounding safety in display)
    const ethAmount = (priceUSD / ethRate).toFixed(6);
    return ethAmount;
};
