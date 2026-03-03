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

interface StreakReminderEmailProps {
    firstName: string
    currentStreak: number
    xpMultiplier: number
}

export default function StreakReminderEmail({
    firstName,
    currentStreak,
    xpMultiplier,
}: StreakReminderEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>{`Don't break your ${currentStreak}-day streak! Play today.`}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>🔥 Keep Your Streak Alive!</Heading>

                    <Text style={text}>Hi {firstName},</Text>

                    <Text style={text}>
                        You&apos;re on a <strong>{currentStreak}-day streak</strong>! Don&apos;t let it end today.
                    </Text>

                    <Section style={streakBox}>
                        <Text style={streakEmoji}>🔥</Text>
                        <Text style={streakText}>
                            {currentStreak} Day Streak
                        </Text>
                        <Text style={streakSubtext}>
                            {xpMultiplier}x XP Multiplier Active
                        </Text>
                    </Section>

                    <Text style={text}>
                        Play any game today to maintain your streak and keep earning bonus XP!
                    </Text>

                    <Section style={buttonContainer}>
                        <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/games`}>
                            Play Now →
                        </Button>
                    </Section>

                    <Text style={text}>
                        <strong>Reminder:</strong> You need to play at least one game every 24 hours to maintain your streak.
                    </Text>

                    <Text style={footer}>
                        Keep learning! 🎮<br />
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

const text = {
    color: '#484848',
    fontSize: '16px',
    lineHeight: '26px',
    padding: '0 40px',
}

const streakBox = {
    backgroundColor: '#fef3c7',
    borderRadius: '8px',
    margin: '24px 40px',
    padding: '24px',
    textAlign: 'center' as const,
}

const streakEmoji = {
    fontSize: '64px',
    margin: '0 0 16px',
}

const streakText = {
    color: '#92400e',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0',
}

const streakSubtext = {
    color: '#b45309',
    fontSize: '14px',
    margin: '8px 0 0',
}

const buttonContainer = {
    padding: '27px 40px',
}

const button = {
    backgroundColor: '#f59e0b',
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
