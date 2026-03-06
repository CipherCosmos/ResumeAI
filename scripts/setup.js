/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function setup() {
    console.log('[Setup] Starting environment checks...');

    // 1. Handle CA Certificate from Env
    const cert = process.env.DATABASE_CA_CERT;
    if (cert) {
        let formattedCert = cert;
        // Handle cases where newlines are literal \n strings
        if (formattedCert.includes('\\n')) {
            formattedCert = formattedCert.replace(/\\n/g, '\n');
        }
        // Remove wrapping quotes if present
        if (formattedCert.startsWith('"') && formattedCert.endsWith('"')) {
            formattedCert = formattedCert.slice(1, -1);
        }

        const certDir = path.join(__dirname, '..', 'prisma');
        if (!fs.existsSync(certDir)) {
            fs.mkdirSync(certDir, { recursive: true });
        }

        const certPath = path.join(certDir, 'ca.pem');
        try {
            fs.writeFileSync(certPath, formattedCert);
            console.log('✅ DATABASE_CA_CERT generated at prisma/ca.pem successfully.');
        } catch (err) {
            console.error('❌ Failed to write CA cert:', err);
        }
    } else {
        console.log('ℹ️ No DATABASE_CA_CERT found in environment. Skipping cert generation.');
    }

    console.log('[Setup] Complete.');
}

setup();
