import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // SECURITY: Reduced default payload limit to 1MB (was 50MB - DoS risk)
  // Specific routes that need larger payloads should override this
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));
  
  // SECURITY: Global rate limiting (100 requests per 15 minutes per IP)
  // Specific routes have stricter limits defined in middleware/security.ts
  const { apiRateLimit, securityHeaders, requestLogger } = await import("../middleware/security");
  app.use(apiRateLimit);
  app.use(securityHeaders);
  
  // Request logging for security monitoring
  if (process.env.NODE_ENV === "production") {
    app.use(requestLogger);
  }
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Email tracking pixel endpoint
  app.get("/api/track/email-open/:trackingId", async (req, res) => {
    try {
      const { trackingId } = req.params;
      const userAgent = req.headers["user-agent"] || "";
      const ipAddress = req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.socket.remoteAddress || "";
      
      // Record the email open
      const { recordEmailOpen } = await import("../emailTracking");
      await recordEmailOpen(trackingId, userAgent, ipAddress);
      
      // Return a 1x1 transparent GIF
      const transparentGif = Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
      );
      
      res.set({
        "Content-Type": "image/gif",
        "Content-Length": transparentGif.length,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      });
      
      res.send(transparentGif);
    } catch (error) {
      console.error("[EmailTracking] Error recording email open:", error);
      // Still return the pixel even if tracking fails
      const transparentGif = Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
      );
      res.set("Content-Type", "image/gif");
      res.send(transparentGif);
    }
  });
  
  // Cron endpoint for email sequence processing (called by scheduled task)
  app.get("/api/cron/process-emails", async (req, res) => {
    try {
      // Verify cron secret to prevent unauthorized access
      const cronSecret = req.headers["x-cron-secret"] || req.query.secret;
      const expectedSecret = process.env.CRON_SECRET || "manus-email-cron-2024";
      
      if (cronSecret !== expectedSecret) {
        console.log("[Cron] Unauthorized cron request");
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      console.log("[Cron] Processing email sequence...");
      const { runEmailSequenceCron } = await import("../emailCron");
      const result = await runEmailSequenceCron();
      
      console.log(`[Cron] Email sequence completed: ${result.sent} sent, ${result.errors} errors`);
      res.json(result);
    } catch (error) {
      console.error("[Cron] Email sequence error:", error);
      res.status(500).json({ error: "Failed to process email sequence" });
    }
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Auto-start retry queue processor after server is ready
    try {
      const { startRetryQueueProcessor } = await import("../services/retryQueueProcessor");
      startRetryQueueProcessor();
      console.log("[Startup] Retry queue processor started automatically");
    } catch (error) {
      console.error("[Startup] Failed to start retry queue processor:", error);
    }
    
    // Start periodic metrics aggregation (every hour)
    try {
      const { aggregateHourlyMetrics } = await import("../services/metricsPersistence");
      setInterval(async () => {
        try {
          // Aggregate the previous hour's metrics
          const hourStart = new Date();
          hourStart.setMinutes(0, 0, 0);
          hourStart.setHours(hourStart.getHours() - 1);
          await aggregateHourlyMetrics(hourStart);
          console.log("[Metrics] Hourly aggregation completed");
        } catch (error) {
          console.error("[Metrics] Hourly aggregation failed:", error);
        }
      }, 60 * 60 * 1000); // Every hour
      console.log("[Startup] Metrics aggregation scheduler started");
    } catch (error) {
      console.error("[Startup] Failed to start metrics aggregation scheduler:", error);
    }
  });
}

startServer().catch(console.error);
