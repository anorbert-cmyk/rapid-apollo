// ===========================================
// EMAIL SERVICE - Resend Integration
// ===========================================

import { Resend } from 'resend';
import { logger } from '../utils/logger';

let resend: Resend | null = null;

/**
 * Get Resend client instance
 */
function getResendClient(): Resend | null {
    if (!process.env.RESEND_API_KEY) {
        logger.warn('RESEND_API_KEY not set - email service disabled');
        return null;
    }

    if (!resend) {
        resend = new Resend(process.env.RESEND_API_KEY);
    }

    return resend;
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
    return !!process.env.RESEND_API_KEY;
}

interface MagicLinkEmailParams {
    to: string;
    magicLink: string;
    tier: string;
    problemSummary: string;
}

/**
 * Send magic link email after successful payment
 */
export async function sendMagicLinkEmail(params: MagicLinkEmailParams): Promise<boolean> {
    const client = getResendClient();

    if (!client) {
        logger.error('Email service not configured');
        return false;
    }

    const tierNames: Record<string, string> = {
        'standard': 'Observer',
        'medium': 'Insider (Genesis)',
        'full': 'Syndicate'
    };

    const tierName = tierNames[params.tier] || params.tier;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@aetherlogic.io';

    try {
        const { data, error } = await client.emails.send({
            from: `Aether Logic <${fromEmail}>`,
            to: [params.to],
            subject: `🚀 Your ${tierName} Analysis is Ready!`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Analysis is Ready</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
                    <!-- Header -->
                    <tr>
                        <td style="text-align: center; padding: 30px 40px;">
                            <h1 style="margin: 0; font-size: 28px; color: #ffffff; font-weight: 700;">
                                ⚡ Aether Logic
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px;">
                            <h2 style="margin: 0 0 20px 0; font-size: 24px; color: #ffffff; font-weight: 600;">
                                Your Analysis is Ready! 🎉
                            </h2>
                            
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #a0aec0; line-height: 1.6;">
                                Thank you for your purchase! Your <strong style="color: #a78bfa;">${tierName} Tier</strong> analysis has been generated.
                            </p>
                            
                            <p style="margin: 0 0 30px 0; font-size: 14px; color: #718096; line-height: 1.5; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                                <strong style="color: #a0aec0;">Your question:</strong><br>
                                "${params.problemSummary.substring(0, 150)}${params.problemSummary.length > 150 ? '...' : ''}"
                            </p>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center">
                                        <a href="${params.magicLink}" 
                                           style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);">
                                            View My Analysis →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 30px 0 0 0; font-size: 13px; color: #718096; text-align: center;">
                                This link is unique to you and never expires.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center;">
                            <p style="margin: 0 0 10px 0; font-size: 12px; color: #4a5568;">
                                If you didn't make this purchase, please ignore this email.
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #4a5568;">
                                © ${new Date().getFullYear()} Aether Logic. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
            `,
            text: `Your ${tierName} Analysis is Ready!

Thank you for your purchase! Your analysis has been generated.

Your question: "${params.problemSummary.substring(0, 150)}${params.problemSummary.length > 150 ? '...' : ''}"

Click here to view your analysis:
${params.magicLink}

This link is unique to you and never expires.

If you didn't make this purchase, please ignore this email.

© ${new Date().getFullYear()} Aether Logic. All rights reserved.
            `
        });

        if (error) {
            logger.error('Failed to send magic link email', new Error(error.message));
            return false;
        }

        logger.info('Magic link email sent successfully', { to: params.to, emailId: data?.id });
        return true;

    } catch (error) {
        logger.error('Email sending failed', error instanceof Error ? error : new Error(String(error)));
        return false;
    }
}

interface PremiumReportEmailParams {
    to: string;
    magicLink: string;
    reportPackage: string;
    problemSummary: string;
}

/**
 * Send email after Premium report completion
 */
export async function sendPremiumReportEmail(params: PremiumReportEmailParams): Promise<boolean> {
    const client = getResendClient();

    if (!client) {
        logger.error('Email service not configured');
        return false;
    }

    const packageName = params.reportPackage === 'premium_figma' ? 'Premium + Figma' : 'Premium';
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@aetherlogic.io';

    try {
        const { data, error } = await client.emails.send({
            from: `Aether Logic <${fromEmail}>`,
            to: [params.to],
            subject: `🎯 Your ${packageName} Report is Ready!`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Premium Report is Ready</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
                    <!-- Header -->
                    <tr>
                        <td style="text-align: center; padding: 30px 40px;">
                            <h1 style="margin: 0; font-size: 28px; color: #ffffff; font-weight: 700;">
                                ⚡ Aether Logic
                            </h1>
                            <p style="margin: 10px 0 0 0; font-size: 14px; color: #a78bfa;">Premium Report</p>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(167, 139, 250, 0.3);">
                            <h2 style="margin: 0 0 20px 0; font-size: 26px; color: #ffffff; font-weight: 600;">
                                Your Report is Ready! 🎉
                            </h2>
                            
                            <p style="margin: 0 0 25px 0; font-size: 16px; color: #a0aec0; line-height: 1.6;">
                                Your comprehensive <strong style="color: #a78bfa;">${packageName}</strong> product analysis has been generated with AI-powered insights across 18 strategic sections.
                            </p>
                            
                            <div style="margin: 0 0 30px 0; padding: 20px; background: rgba(167, 139, 250, 0.1); border-radius: 12px; border-left: 4px solid #a78bfa;">
                                <p style="margin: 0 0 5px 0; font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 1px;">Your Problem Statement</p>
                                <p style="margin: 0; font-size: 15px; color: #e2e8f0; line-height: 1.5;">
                                    "${params.problemSummary.substring(0, 200)}${params.problemSummary.length > 200 ? '...' : ''}"
                                </p>
                            </div>

                            <table role="presentation" style="width: 100%; margin-bottom: 25px;">
                                <tr>
                                    <td style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 15px; text-align: center;">
                                        <p style="margin: 0 0 3px 0; font-size: 24px; color: #a78bfa; font-weight: 700;">18</p>
                                        <p style="margin: 0; font-size: 12px; color: #718096;">Sections</p>
                                    </td>
                                    <td style="width: 10px;"></td>
                                    <td style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 15px; text-align: center;">
                                        <p style="margin: 0 0 3px 0; font-size: 24px; color: #10b981; font-weight: 700;">✓</p>
                                        <p style="margin: 0; font-size: 12px; color: #718096;">AI Validated</p>
                                    </td>
                                    <td style="width: 10px;"></td>
                                    <td style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 15px; text-align: center;">
                                        <p style="margin: 0 0 3px 0; font-size: 24px; color: #f59e0b; font-weight: 700;">∞</p>
                                        <p style="margin: 0; font-size: 12px; color: #718096;">Access</p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center">
                                        <a href="${params.magicLink}" 
                                           style="display: inline-block; padding: 18px 50px; background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 17px; box-shadow: 0 4px 20px rgba(139, 92, 246, 0.5);">
                                            View My Report →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 30px 0 0 0; font-size: 13px; color: #718096; text-align: center;">
                                This link is unique to you and <strong>never expires</strong>.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center;">
                            <p style="margin: 0 0 10px 0; font-size: 12px; color: #4a5568;">
                                If you didn't make this purchase, please contact support.
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #4a5568;">
                                © ${new Date().getFullYear()} Aether Logic. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
            `,
            text: `Your ${packageName} Report is Ready!

Your comprehensive product analysis has been generated with AI-powered insights across 18 strategic sections.

Your problem statement: "${params.problemSummary.substring(0, 200)}${params.problemSummary.length > 200 ? '...' : ''}"

Click here to view your report:
${params.magicLink}

This link is unique to you and never expires.

© ${new Date().getFullYear()} Aether Logic. All rights reserved.
            `
        });

        if (error) {
            logger.error('Failed to send premium report email', new Error(error.message));
            return false;
        }

        logger.info('Premium report email sent successfully', { to: params.to, emailId: data?.id });
        return true;

    } catch (error) {
        logger.error('Premium email sending failed', error instanceof Error ? error : new Error(String(error)));
        return false;
    }
}

