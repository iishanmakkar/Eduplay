
import fs from 'fs';
import path from 'path';

const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'NEXT_PUBLIC_APP_URL',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'RAZORPAY_WEBHOOK_SECRET',
    'RAZORPAY_STARTER_PLAN_ID',
    'RAZORPAY_SCHOOL_PLAN_ID',
    'RAZORPAY_DISTRICT_PLAN_ID',
];

async function main() {
    console.log('🔍 Starting Pre-flight Check...');
    let errors: string[] = [];

    // 1. Check Env Vars
    console.log('\nChecking Environment Variables...');
    const envPath = path.join(process.cwd(), '.env');

    if (!fs.existsSync(envPath)) {
        console.warn('⚠️ .env file not found. checking process.env directly (assuming CI/CD or production environment)...');
    } else {
        console.log('✅ .env file found.');
    }

    // We read the file to check for existence in local dev, but for verification we should check process.env
    // creating a map of vars
    const envVars = { ...process.env };

    // If .env exists, we manually parse it to augment process.env if not already loaded
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
                if (!envVars[key]) {
                    envVars[key] = value;
                }
            }
        });
    }

    requiredEnvVars.forEach(varName => {
        if (!envVars[varName]) {
            errors.push(`❌ Missing Environment Variable: ${varName}`);
        } else {
            // Optional: Check for placeholder values
            if (envVars[varName]?.includes('your_') || envVars[varName]?.includes('xxxxx')) {
                console.warn(`⚠️  Warning: ${varName} appears to have a placeholder value: ${envVars[varName]?.substring(0, 10)}...`);
            } else {
                console.log(`✅ ${varName} is set`);
            }
        }
    });

    if (errors.length > 0) {
        console.error('\n❌ Pre-flight check failed with errors:');
        errors.forEach(e => console.error(e));
        process.exit(1);
    } else {
        console.log('\n✅ Pre-flight check passed! All required environment variables are present.');
    }
}

main().catch(console.error);
