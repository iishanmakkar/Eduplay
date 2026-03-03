import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Terms of Service - EduPlay',
    description: 'Terms and conditions for using the EduPlay platform.',
}

export default function TermsPage() {
    return (
        <div className="prose prose-emerald dark:prose-invert max-w-none">
            <h1>Terms of Service</h1>
            <p className="lead">Last updated: {new Date().toLocaleDateString()}</p>

            <h2>1. Agreement to Terms</h2>
            <p>
                These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity (&quot;you&quot;) and EduPlay Technologies Inc. (&quot;we,&quot; &quot;us&quot; or &quot;our&quot;), concerning your access to and use of the <strong>eduplay.com</strong> website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the &quot;Site&quot;).
            </p>

            <h2>2. Intellectual Property Rights</h2>
            <p>
                Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the &quot;Content&quot;) and the trademarks, service marks, and logos contained therein (the &quot;Marks&quot;) are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.
            </p>

            <h2>3. User Representations</h2>
            <p>
                By using the Site, you represent and warrant that:
            </p>
            <ul>
                <li>All registration information you submit will be true, accurate, current, and complete.</li>
                <li>You will maintain the accuracy of such information and promptly update such registration information as necessary.</li>
                <li>You have the legal capacity and you agree to comply with these Terms of Service.</li>
                <li>You are not a minor in the jurisdiction in which you reside, or if a minor, you have received parental permission to use the Site.</li>
            </ul>

            <h2>4. Prohibited Activities</h2>
            <p>
                You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
            </p>

            <h2>5. Subscription validity</h2>
            <p>
                Fees for our services are billed on a subscription basis. You will be billed in advance on a recurring, periodic basis (each a &quot;Billing Cycle&quot;). Billing cycles are set either on a monthly or annual basis, depending on the type of subscription plan you select when purchasing a Subscription.
            </p>

            <h2>6. Termination</h2>
            <p>
                We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
            </p>

            <h2>7. Limitation of Liability</h2>
            <p>
                In no event shall EduPlay Technologies Inc., nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
            </p>

            <h2>8. Contact Us</h2>
            <p>
                In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at:
            </p>
            <p>
                <strong>EduPlay Technologies Inc.</strong><br />
                Email: support@eduplay.com
            </p>
        </div>
    )
}
