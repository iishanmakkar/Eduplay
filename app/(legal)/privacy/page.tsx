import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Privacy Policy - EduPlay',
    description: 'Learn how EduPlay collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
    return (
        <div className="prose prose-emerald dark:prose-invert max-w-none">
            <h1>Privacy Policy</h1>
            <p className="lead">Last updated: {new Date().toLocaleDateString()}</p>

            <h2>1. Introduction</h2>
            <p>
                EduPlay Technologies Inc. (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclosure, and safeguard your information when you visit our website <strong>eduplay.com</strong>, including any other media form, media channel, mobile website, or mobile application related or connected thereto (collectively, the &quot;Site&quot;).
            </p>

            <h2>2. Information We Collect</h2>
            <h3>Personal Data</h3>
            <p>
                We may collect personally identifiable information, such as your name, email address, school affiliation, and telephone number when you register for an account or contact us.
            </p>
            <h3>Derivative Data</h3>
            <p>
                Information our servers automatically collect when you access the Site, such as your IP address, browser type, operating system, access times, and the pages you have viewed directly before and after accessing the Site.
            </p>

            <h2>3. Use of Your Information</h2>
            <p>
                Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:
            </p>
            <ul>
                <li>Create and manage your account.</li>
                <li>Process payments and refunds.</li>
                <li>Send you a newsletter.</li>
                <li>Email you regarding your account or order.</li>
                <li>Fulfill and manage purchases, orders, payments, and other transactions related to the Site.</li>
            </ul>

            <h2>4. Disclosure of Your Information</h2>
            <p>
                We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
            </p>
            <ul>
                <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.</li>
                <li><strong>Business Transfers:</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
            </ul>

            <h2>5. Security of Your Information</h2>
            <p>
                We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
            </p>

            <h2>6. Policy for Children</h2>
            <p>
                We collect information from children under the age of 13 only with the explicit consent of their school or educational institution, in compliance with COPPA (Children&apos;s Online Privacy Protection Act). We do not knowingly solicit information from or market to children under the age of 13 without such consent.
            </p>

            <h2>7. Contact Us</h2>
            <p>
                If you have questions or comments about this Privacy Policy, please contact us at:
            </p>
            <p>
                <strong>EduPlay Technologies Inc.</strong><br />
                Email: support@eduplay.com<br />
                Phone: +1 (555) 123-4567
            </p>
        </div>
    )
}
