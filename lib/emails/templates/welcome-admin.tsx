import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
} from '@react-email/components'

interface WelcomeAdminEmailProps {
    firstName: string
    schoolName: string
    trialEndsAt: Date
}

export default function WelcomeAdminEmail({
    firstName,
    schoolName,
    trialEndsAt,
}: WelcomeAdminEmailProps) {
    const trialDays = Math.ceil(
        (trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )

    return (
        <Html>
            <Head />
            <Preview>Welcome to EduPlay Pro! Your 14-day trial has started.</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>🎉 Welcome to EduPlay Pro!</Heading>

                    <Text style={text}>Hi {firstName},</Text>

                    <Text style={text}>
                        Congratulations on creating <strong>{schoolName}</strong> on EduPlay Pro!
                        You&apos;re about to transform how your students learn through gamification.
                    </Text>

                    <Section style={highlightBox}>
                        <Text style={highlightText}>
                            ✨ Your 14-day trial is now active
                        </Text>
                        <Text style={highlightSubtext}>
                            {trialDays} days remaining to explore all features
                        </Text>
                    </Section>

                    <Heading style={h2}>🚀 Get Started in 3 Steps:</Heading>

                    <Text style={stepText}>
                        <strong>1. Invite Teachers</strong><br />
                        Go to your admin dashboard and invite teachers to join your school.
                    </Text>

                    <Text style={stepText}>
                        <strong>2. Create Classes</strong><br />
                        Teachers can create classes and share class codes with students.
                    </Text>

                    <Text style={stepText}>
                        <strong>3. Assign Games</strong><br />
                        Create assignments and watch students earn XP while learning!
                    </Text>

                    <Section style={buttonContainer}>
                        <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin`}>
                            Go to Dashboard →
                        </Button>
                    </Section>

                    <Text style={text}>
                        Need help? Reply to this email or check out our{' '}
                        <a href={`${process.env.NEXT_PUBLIC_APP_URL}/docs`} style={link}>
                            documentation
                        </a>.
                    </Text>

                    <Text style={footer}>
                        Happy teaching! 🎮<br />
                        The EduPlay Pro Team
                    </Text>
                </Container>
            </Body>
        </Html>
    )
}

const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
    maxWidth: '600px',
}

const h1 = {
    color: '#1a1a1a',
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '40px 0',
    padding: '0 40px',
}

const h2 = {
    color: '#1a1a1a',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '30px 0 20px',
    padding: '0 40px',
}

const text = {
    color: '#484848',
    fontSize: '16px',
    lineHeight: '26px',
    padding: '0 40px',
}

const stepText = {
    color: '#484848',
    fontSize: '16px',
    lineHeight: '26px',
    padding: '0 40px',
    marginBottom: '16px',
}

const highlightBox = {
    backgroundColor: '#10b981',
    borderRadius: '8px',
    margin: '24px 40px',
    padding: '24px',
    textAlign: 'center' as const,
}

const highlightText = {
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '0',
}

const highlightSubtext = {
    color: '#d1fae5',
    fontSize: '14px',
    margin: '8px 0 0',
}

const buttonContainer = {
    padding: '27px 40px',
}

const button = {
    backgroundColor: '#10b981',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    padding: '14px 20px',
}

const link = {
    color: '#10b981',
    textDecoration: 'underline',
}

const footer = {
    color: '#9ca3af',
    fontSize: '14px',
    lineHeight: '24px',
    padding: '0 40px',
    marginTop: '32px',
}
