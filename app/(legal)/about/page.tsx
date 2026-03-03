import { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
    title: 'About Us - EduPlay',
    description: 'Our mission to transform education through play.',
}

export default function AboutPage() {
    return (
        <div className="prose prose-emerald dark:prose-invert max-w-none">
            <h1>About EduPlay</h1>
            <p className="lead">
                We are on a mission to make learning irresistible.
            </p>

            <div className="my-12 not-prose p-8 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl text-white text-center">
                <h2 className="text-3xl font-display font-bold mb-4">Our Vision</h2>
                <p className="text-xl opacity-90 max-w-2xl mx-auto">
                    To build a world where every student wakes up excited to go to school, because learning feels like an adventure, not a chore.
                </p>
            </div>

            <h2>Who We Are</h2>
            <p>
                EduPlay was founded in 2024 by a team of educators, game designers, and engineers who shared a common frustration: educational software was boring. We saw students disengaged, teachers overwhelmed, and technology being used as a digital worksheet rather than a transformative tool.
            </p>
            <p>
                We believed there was a better way. By combining principles of game design with rigorous pedagogical standards, we created a platform that doesn&apos;t just teach—it captivates.
            </p>

            <h2>Our Values</h2>
            <div className="grid md:grid-cols-3 gap-6 my-8 not-prose">
                {[
                    { icon: '🚀', title: 'Fun First', desc: 'If it’s not fun, it won’t stick. Engagement is the prerequisite for deep learning.' },
                    { icon: '🤝', title: 'Every Student', desc: 'We design for accessibility and inclusivity, ensuring no learner is left behind.' },
                    { icon: '🛡️', title: 'Data Privacy', desc: 'We treat student data with the highest level of security and respect. No compromises.' }
                ].map((val, i) => (
                    <div key={i} className="bg-surface dark:bg-fixed-medium p-6 rounded-xl border border-border">
                        <div className="text-3xl mb-3">{val.icon}</div>
                        <h3 className="font-bold text-ink dark:text-white mb-2">{val.title}</h3>
                        <p className="text-sm text-mist">{val.desc}</p>
                    </div>
                ))}
            </div>

            <h2>Join Us</h2>
            <p>
                We are always looking for passionate people to join our team. Whether you are a developer, a designer, or a former teacher, if you care about the future of education, we want to hear from you.
            </p>
            <p>
                Check out our <a href="#">Careers page</a> or say hello at <a href="mailto:hello@eduplay.com">hello@eduplay.com</a>.
            </p>
        </div>
    )
}
