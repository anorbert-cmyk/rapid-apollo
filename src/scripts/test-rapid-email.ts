import dotenv from 'dotenv';
import { sendRapidApolloEmail } from '../services/emailService';

// Load env vars
dotenv.config();

const email = process.argv[2];

if (!email) {
    console.error('⚠️  Usage: npx ts-node src/scripts/test-rapid-email.ts <email>');
    console.error('   (Make sure RESEND_API_KEY is set in .env or passed inline)');
    process.exit(1);
}

if (!process.env.RESEND_API_KEY) {
    console.error('❌ Error: RESEND_API_KEY environment variable is missing.');
    process.exit(1);
}

console.log(`🚀 Sending Rapid Apollo test email to: ${email}`);
console.log(`from: ${process.env.RESEND_FROM_EMAIL || 'default'}`);

// Send with mock data simulating a Medium tier purchase
sendRapidApolloEmail({
    to: email,
    userName: email.split('@')[0], // Use email prefix as name
    magicLinkUrl: 'https://rapid-apollo-production.up.railway.app/auth/magic/TEST-TOKEN-MANUAL-CHECK',
    transactionId: 'test_tx_' + Date.now().toString().slice(-6),
    amount: '49',
    currency: 'USD'
}).then((success) => {
    if (success) {
        console.log('✅ Email sent successfully!');
        console.log('📬 Check your inbox (and spam folder) for "🚀 Fizetés elfogadva"');
        process.exit(0);
    } else {
        console.error('❌ Failed to send email via Resend API.');
        process.exit(1);
    }
}).catch((err) => {
    console.error('❌ Exception sending email:', err);
    process.exit(1);
});
