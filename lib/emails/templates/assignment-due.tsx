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

interface AssignmentDueEmailProps {
    firstName: string
    assignmentTitle: string
    className: string
    dueDate: Date
    hoursLeft: number
}

export default function AssignmentDueEmail({
    firstName,
    assignmentTitle,
    className,
    dueDate,
    hoursLeft,
}: AssignmentDueEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>Assignment due soon: {assignmentTitle}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>⏰ Assignment Due Soon!</Heading>

                    <Text style={text}>Hi {firstName},</Text>

                    <Text style={text}>
                        Your assignment <strong>{assignmentTitle}</strong> in{' '}
                        <strong>{className}</strong> is due soon.
                    </Text>

                    <Section style={dueBox}>
                        <Text style={dueText}>
                            {hoursLeft < 24
                                ? `${hoursLeft} hours left`
                                : `${Math.floor(hoursLeft / 24)} days left`
                            }
                        </Text>
                        <Text style={dueSubtext}>
                            Due: {dueDate.toLocaleDateString('en-IN', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                            })}
                        </Text>
                    </Section>

                    <Text style={text}>
                        Complete it now to earn XP and maintain your progress!
                    </Text>

                    <Section style={buttonContainer}>
                        <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/student`}>
                            Complete Assignment →
                        </Button>
                    </Section>

                    <Text style={footer}>
                        Good luck! 📚<br />
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

const dueBox = {
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
    margin: '24px 40px',
    padding: '24px',
    textAlign: 'center' as const,
    border: '2px solid #fecaca',
}

const dueText = {
    color: '#991b1b',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0',
}

const dueSubtext = {
    color: '#dc2626',
    fontSize: '14px',
    margin: '8px 0 0',
}

const buttonContainer = {
    padding: '27px 40px',
}

const button = {
    backgroundColor: '#ef4444',
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
