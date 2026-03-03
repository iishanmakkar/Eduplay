import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Contact Us - EduPlay',
    description: 'Get in touch with the EduPlay team.',
}

export default function ContactPage() {
    return (
        <div className="prose prose-emerald dark:prose-invert max-w-none">
            <h1>Contact Us</h1>
            <p className="lead">We&apos;re here to help! Reach out to us with any questions or feedback.</p>

            <div className="grid md:grid-cols-2 gap-8 my-12 not-prose">
                <div className="bg-surface dark:bg-fixed-medium p-6 rounded-xl border border-border">
                    <div className="text-2xl mb-2">👋</div>
                    <h3 className="text-lg font-bold text-ink dark:text-white mb-2">General Support</h3>
                    <p className="text-mist text-sm mb-4">For account issues, technical problems, or general inquiries.</p>
                    <a href="mailto:support@eduplay.com" className="text-emerald font-semibold hover:underline">support@eduplay.com</a>
                </div>

                <div className="bg-surface dark:bg-fixed-medium p-6 rounded-xl border border-border">
                    <div className="text-2xl mb-2">💼</div>
                    <h3 className="text-lg font-bold text-ink dark:text-white mb-2">Sales & Partnerships</h3>
                    <p className="text-mist text-sm mb-4">For district usage, custom plans, and partnership opportunities.</p>
                    <a href="mailto:sales@eduplay.com" className="text-emerald font-semibold hover:underline">sales@eduplay.com</a>
                </div>
            </div>

            <h2>Send us a Message</h2>
            <form className="bg-surface dark:bg-fixed-medium p-8 rounded-2xl border border-border not-prose space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-ink dark:text-white mb-1">Name</label>
                        <input type="text" className="w-full px-4 py-2 rounded-lg border border-border bg-white dark:bg-fixed-dark focus:ring-2 focus:ring-emerald outline-none transition" placeholder="Jane Doe" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-ink dark:text-white mb-1">Email</label>
                        <input type="email" className="w-full px-4 py-2 rounded-lg border border-border bg-white dark:bg-fixed-dark focus:ring-2 focus:ring-emerald outline-none transition" placeholder="jane@school.edu" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-ink dark:text-white mb-1">Subject</label>
                    <select className="w-full px-4 py-2 rounded-lg border border-border bg-white dark:bg-fixed-dark focus:ring-2 focus:ring-emerald outline-none transition">
                        <option>General Inquiry</option>
                        <option>Technical Support</option>
                        <option>Billing Question</option>
                        <option>Feature Request</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-ink dark:text-white mb-1">Message</label>
                    <textarea rows={4} className="w-full px-4 py-2 rounded-lg border border-border bg-white dark:bg-fixed-dark focus:ring-2 focus:ring-emerald outline-none transition" placeholder="How can we help you?"></textarea>
                </div>
                <button type="submit" className="px-6 py-2 bg-emerald text-white font-semibold rounded-lg hover:bg-emerald-dark transition">
                    Send Message
                </button>
            </form>

            <h2 className="mt-12">Office</h2>
            <p>
                <strong>EduPlay Headquarters</strong><br />
                123 Innovation Drive, Suite 400<br />
                Tech City, TC 90210<br />
                United States
            </p>
        </div>
    )
}
