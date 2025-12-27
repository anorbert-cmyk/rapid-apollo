import { describe, expect, it } from "vitest";
import { checkAdminStatus } from "./services/walletAuthService";

describe("Admin Wallet Configuration", () => {
  it("should recognize the configured admin wallet address", async () => {
    const adminAddress = "0xa14504ffe5E9A245c9d4079547Fa16fA0A823114";
    
    // Check if the admin wallet is properly configured
    const isAdmin = await checkAdminStatus(adminAddress);
    expect(isAdmin).toBe(true);
  });

  it("should reject non-admin wallet addresses", async () => {
    const randomAddress = "0x1234567890123456789012345678901234567890";
    
    const isAdmin = await checkAdminStatus(randomAddress);
    expect(isAdmin).toBe(false);
  });

  it("should handle case-insensitive address comparison", async () => {
    const adminAddressLower = "0xa14504ffe5e9a245c9d4079547fa16fa0a823114";
    const adminAddressUpper = "0xA14504FFE5E9A245C9D4079547FA16FA0A823114";
    
    const isAdminLower = await checkAdminStatus(adminAddressLower);
    const isAdminUpper = await checkAdminStatus(adminAddressUpper);
    
    expect(isAdminLower).toBe(true);
    expect(isAdminUpper).toBe(true);
  });
});
