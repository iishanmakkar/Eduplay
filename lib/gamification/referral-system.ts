import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

export class ReferralSystem {
    /**
     * Get or create a unique referral link for a user
     */
    static async getOrCreateLink(userId: string) {
        let link = await prisma.referralLink.findUnique({
            where: { userId }
        })

        if (!link) {
            link = await prisma.referralLink.create({
                data: {
                    userId,
                    code: nanoid(10) // e.g. "V1StGXR8_Z"
                }
            })
        }

        return link
    }

    /**
     * Validate a referral code and return the ID of the referrer
     */
    static async validateCode(code: string) {
        const link = await prisma.referralLink.findUnique({
            where: { code }
        })

        if (!link) return null

        // Increment click count (optional telemetry)
        await prisma.referralLink.update({
            where: { code },
            data: { clicks: { increment: 1 } }
        })

        return link.userId
    }

    /**
     * Process a successful signup via referral
     * Rewards the referrer with 1 month of independent subscription time
     */
    static async processSignup(newUserId: string, referralCode: string) {
        const referrerId = await this.validateCode(referralCode)
        if (!referrerId) return false // Invalid code

        // Atomically create the reward and extend the referrer's subscription
        try {
            await prisma.$transaction(async (tx) => {
                // 1. Get the link ID
                const link = await tx.referralLink.findUnique({
                    where: { code: referralCode },
                    select: { id: true }
                })

                if (!link) throw new Error("Link disappeared")

                // 2. Create the reward record
                await tx.referralReward.create({
                    data: {
                        referralId: link.id,
                        referredId: newUserId,
                        status: 'PAID_OUT',
                        rewardType: 'SUBSCRIPTION_MONTH',
                        amount: 1
                    }
                })

                // 3. Extend or create the referrer's independent subscription
                const existingSub = await tx.independentSubscription.findUnique({
                    where: { userId: referrerId }
                })

                const now = new Date()
                let newEndDate = new Date()

                if (existingSub && existingSub.currentPeriodEnd && existingSub.currentPeriodEnd > now) {
                    newEndDate = new Date(existingSub.currentPeriodEnd)
                }

                // Add 1 month (30 days approx)
                newEndDate.setDate(newEndDate.getDate() + 30)

                await tx.independentSubscription.upsert({
                    where: { userId: referrerId },
                    update: {
                        currentPeriodEnd: newEndDate,
                        status: 'ACTIVE'
                    },
                    create: {
                        userId: referrerId,
                        status: 'ACTIVE',
                        currentPeriodStart: now,
                        currentPeriodEnd: newEndDate,
                    }
                })
            })
            return true
        } catch (error) {
            console.error('Failed to process referral signup:', error)
            return false
        }
    }
}
