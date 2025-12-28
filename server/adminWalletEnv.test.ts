import { describe, it, expect } from "vitest";

describe("Admin Wallet Address Environment Variable", () => {
  it("should have VITE_ADMIN_WALLET_ADDRESS configured", () => {
    const adminWallet = process.env.VITE_ADMIN_WALLET_ADDRESS;
    expect(adminWallet).toBeDefined();
    expect(adminWallet).not.toBe("");
    console.log("✅ VITE_ADMIN_WALLET_ADDRESS is configured!");
  });

  it("should be a valid Ethereum address format", () => {
    const adminWallet = process.env.VITE_ADMIN_WALLET_ADDRESS;
    expect(adminWallet).toBeDefined();
    // Ethereum address: 0x followed by 40 hex characters
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    expect(adminWallet).toMatch(ethAddressRegex);
    console.log("✅ Admin wallet address format is valid:", adminWallet);
  });
});
