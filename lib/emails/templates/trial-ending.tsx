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

interface TrialEndingEmailProps {
    firstName: string
    schoolName: string
    daysLeft: number
    currentPlan: string
}

export default function TrialEndingEmail({
    firstName,
    schoolName,
    daysLeft,
    currentPlan,
}: TrialEndingEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>{`Your EduPlay Pro trial ends in ${daysLeft} days`}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>⏰ Your Trial is Ending Soon</Heading>

                    <Text style={text}>Hi {firstName},</Text>

                    <Text style={text}>
                        Your 14-day trial for <strong>{schoolName}</strong> ends in just{' '}
                        <strong>{daysLeft} days</strong>.
                    </Text>

                    <Section style={warningBox}>
                        <Text style={warningText}>
                            ⚠️ Don&apos;t lose access to your data
                        </Text>
                        <Text style={warningSubtext}>
                            Upgrade now to keep all your classes, students, and progress
                        </Text>
                    </Section>

                    <Heading style={h2}>📊 Your Usage So Far:</Heading>

                    <Text style={statsText}>
                        ✓ Classes created<br />
                        ✓ Students enrolled<br />
                        ✓ Games played<br />
                        ✓ XP earned
                    </Text>

                    <Text style={text}>
                        Continue building on this momentum! Upgrade to the{' '}
                        <strong>{currentPlan}</strong> plan to keep everything running smoothly.
                    </Text>

                    <Section style={buttonContainer}>
                        <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/billing`}>
                            Upgrade Now →
                        </Button>
                    </Section>

                    <Text style={text}>
                        Have questions? We&apos;re here to help. Reply to this email or schedule a call with our team.
                    </Text>

                    <Text style={footer}>
                        Best regards,<br />
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

const statsText = {
    color: '#484848',
    fontSize: '16px',
    lineHeight: '32px',
    padding: '0 40px',
    marginBottom: '24px',
}

const warningBox = {
    backgroundColor: '#fbbf24',
    borderRadius: '8px',
    margin: '24px 40px',
    padding: '24px',
    textAlign: 'center' as const,
}

const warningText = {
    color: '#78350f',
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '0',
}

const warningSubtext = {
    color: '#92400e',
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

const footer = {
    color: '#9ca3af',
    fontSize: '14px',
    lineHeight: '24px',
    padding: '0 40px',
    marginTop: '32px',
}
