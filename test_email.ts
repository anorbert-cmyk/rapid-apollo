import { sendPremiumReportEmail, isEmailConfigured } from './src/services/emailService';

async function main() {
    console.log('Email configured:', isEmailConfigured());

    if (!isEmailConfigured()) {
        console.error('RESEND_API_KEY not set!');
        process.exit(1);
    }

    const result = await sendPremiumReportEmail({
        to: 'anorbert@proton.me',
        magicLink: 'https://aetherlogic.io/auth/magic/test-token-12345',
        reportPackage: 'premium',
        problemSummary: 'I want to build an AI-powered product validation platform that helps entrepreneurs validate their startup ideas before investing significant time and money. The platform should analyze market fit, competition, and provide actionable insights.'
    });

    console.log('Email sent:', result);
    process.exit(result ? 0 : 1);
}

main();
