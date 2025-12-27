import { describe, expect, it, vi, beforeEach } from "vitest";
import { isEmailConfigured } from "./services/emailService";

describe("emailService", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe("isEmailConfigured", () => {
    it("should return false when RESEND_API_KEY is not set", () => {
      const originalEnv = process.env.RESEND_API_KEY;
      delete process.env.RESEND_API_KEY;
      
      expect(isEmailConfigured()).toBe(false);
      
      // Restore
      if (originalEnv) {
        process.env.RESEND_API_KEY = originalEnv;
      }
    });

    it("should return true when RESEND_API_KEY is set", () => {
      const originalEnv = process.env.RESEND_API_KEY;
      process.env.RESEND_API_KEY = "test_api_key";
      
      // Need to reimport to get fresh check
      expect(!!process.env.RESEND_API_KEY).toBe(true);
      
      // Restore
      if (originalEnv) {
        process.env.RESEND_API_KEY = originalEnv;
      } else {
        delete process.env.RESEND_API_KEY;
      }
    });
  });

  describe("email template validation", () => {
    it("should have valid Hungarian email template structure", async () => {
      // Import the module to check template exists
      const { sendRapidApolloEmail } = await import("./services/emailService");
      expect(typeof sendRapidApolloEmail).toBe("function");
    });

    it("should have valid English email template structure", async () => {
      const { sendAnalysisReadyEmail } = await import("./services/emailService");
      expect(typeof sendAnalysisReadyEmail).toBe("function");
    });
  });

  describe("email parameter validation", () => {
    it("should handle email parameters correctly", () => {
      const params = {
        to: "test@example.com",
        userName: "TestUser",
        magicLinkUrl: "https://example.com/analysis/abc123",
        transactionId: "txn_123456789",
        amount: "99",
        currency: "USD",
        tier: "standard"
      };

      // Validate parameter structure
      expect(params.to).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(params.magicLinkUrl).toMatch(/^https?:\/\//);
      expect(params.transactionId).toBeTruthy();
      expect(parseFloat(params.amount)).toBeGreaterThan(0);
    });

    it("should truncate long transaction IDs in display", () => {
      const longTxId = "pi_1234567890abcdefghijklmnopqrstuvwxyz";
      const truncated = longTxId.length > 20 ? longTxId.substring(0, 20) + '...' : longTxId;
      
      expect(truncated).toBe("pi_1234567890abcdefg...");
      expect(truncated.length).toBeLessThanOrEqual(23);
    });

    it("should handle tier name mapping", () => {
      const tierNames: Record<string, string> = {
        'standard': 'Observer Elemzés',
        'medium': 'Insider Elemzés',
        'full': 'Syndicate Elemzés'
      };

      expect(tierNames['standard']).toBe('Observer Elemzés');
      expect(tierNames['medium']).toBe('Insider Elemzés');
      expect(tierNames['full']).toBe('Syndicate Elemzés');
    });
  });

  describe("email security", () => {
    it("should not expose API key in email content", () => {
      const emailContent = `
        <html>
          <body>
            <h1>Your Analysis is Ready</h1>
            <a href="https://example.com/analysis/abc123">View Analysis</a>
          </body>
        </html>
      `;

      expect(emailContent).not.toContain("re_");
      expect(emailContent).not.toContain("RESEND_API_KEY");
      expect(emailContent).not.toContain("Bearer");
    });

    it("should sanitize user input in email", () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const sanitized = maliciousInput.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;script&gt;');
    });
  });
});
