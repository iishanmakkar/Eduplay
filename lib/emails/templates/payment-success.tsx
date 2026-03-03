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

interface PaymentSuccessEmailProps {
    firstName: string
    plan: string
    amount: number
    nextBillingDate: Date
}

export default function PaymentSuccessEmail({
    firstName,
    plan,
    amount,
    nextBillingDate,
}: PaymentSuccessEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>Payment successful! Your {plan} subscription is active.</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>✅ Payment Successful!</Heading>

                    <Text style={text}>Hi {firstName},</Text>

                    <Text style={text}>
                        Thank you for your payment! Your <strong>{plan}</strong> subscription is now active.
                    </Text>

                    <Section style={successBox}>
                        <Text style={successText}>
                            ${(amount / 100).toLocaleString('en-IN')} paid
                        </Text>
                        <Text style={successSubtext}>
                            Next billing: {nextBillingDate.toLocaleDateString('en-IN', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                            })}
                        </Text>
                    </Section>

                    <Section style={buttonContainer}>
                        <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/billing`}>
                            View Receipt →
                        </Button>
                    </Section>

                    <Text style={text}>
                        Your invoice has been sent to your email. You can also download it from your billing dashboard.
                    </Text>

                    <Text style={footer}>
                        Thank you for choosing EduPlay Pro! 🎉<br />
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

const successBox = {
    backgroundColor: '#10b981',
    borderRadius: '8px',
    margin: '24px 40px',
    padding: '24px',
    textAlign: 'center' as const,
}

const successText = {
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '0',
}

const successSubtext = {
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

const footer = {
    color: '#9ca3af',
    fontSize: '14px',
    lineHeight: '24px',
    padding: '0 40px',
    marginTop: '32px',
}
