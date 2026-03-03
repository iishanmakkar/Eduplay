import { Resend } from 'resend'
import { render } from '@react-email/render'

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_fallback_key')

export interface EmailOptions {
    to: string | string[]
    subject: string
    react: React.ReactElement
}

/**
 * Send an email using Resend
 */
export async function sendEmail({ to, subject, react }: EmailOptions) {
    try {
        const html = await render(react)

        const { data, error } = await resend.emails.send({
            from: 'EduPlay Pro <noreply@eduplaypro.com>',
            to,
            subject,
            html,
        })

        if (error) {
            console.error('Email send error:', error)
            throw new Error(`Failed to send email: ${error.message}`)
        }

        console.log('Email sent successfully:', data?.id)
        return { success: true, id: data?.id }
    } catch (error) {
        console.error('Email send exception:', error)
        throw error
    }
}

/**
 * Send welcome email to new admin
 */
export async function sendWelcomeAdminEmail(
    email: string,
    firstName: string,
    schoolName: string,
    trialEndsAt: Date
) {
    const WelcomeAdminEmail = (await import('./templates/welcome-admin')).default

    return sendEmail({
        to: email,
        subject: `Welcome to EduPlay Pro, ${firstName}! 🎉`,
        react: WelcomeAdminEmail({ firstName, schoolName, trialEndsAt }),
    })
}

/**
 * Send trial ending reminder
 */
export async function sendTrialEndingEmail(
    email: string,
    firstName: string,
    schoolName: string,
    daysLeft: number,
    currentPlan: string
) {
    const TrialEndingEmail = (await import('./templates/trial-ending')).default

    return sendEmail({
        to: email,
        subject: `⏰ Your trial ends in ${daysLeft} days`,
        react: TrialEndingEmail({ firstName, schoolName, daysLeft, currentPlan }),
    })
}

/**
 * Log email to database for tracking
 */
export async function logEmail(
    userId: string,
    type: string,
    status: 'sent' | 'failed',
    error?: string
) {
    // This would save to EmailLog model
    // Implementation depends on your database setup
    console.log('Email logged:', { userId, type, status, error })
}
