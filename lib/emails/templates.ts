import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_fallback_key')
const FROM_EMAIL = process.env.EMAIL_FROM || 'EduPlay Pro <noreply@eduplay.com>'

/**
 * Send welcome email to new teacher
 */
export async function sendTeacherWelcomeEmail(email: string, name: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Welcome to EduPlay Pro! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .feature { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #10b981; border-radius: 4px; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to EduPlay Pro!</h1>
                <p>Your Cognitive Development Platform</p>
              </div>
              <div class="content">
                <p>Hi ${name},</p>
                <p>Welcome to EduPlay Pro! We're excited to have you join our community of innovative educators.</p>
                
                <h3>🚀 Get Started:</h3>
                <div class="feature">
                  <strong>1. Create Your First Class</strong>
                  <p>Set up classes and invite students to start learning</p>
                </div>
                <div class="feature">
                  <strong>2. Explore 24 Brain Games</strong>
                  <p>Educational games + advanced brain training across 10 cognitive skills</p>
                </div>
                <div class="feature">
                  <strong>3. Assign Games & Track Progress</strong>
                  <p>Create assignments and monitor student cognitive development</p>
                </div>
                
                <center>
                  <a href="${process.env.NEXTAUTH_URL}/dashboard/teacher" class="button">Go to Dashboard →</a>
                </center>
                
                <p><strong>Need help?</strong> Check out our <a href="${process.env.NEXTAUTH_URL}/help">Help Center</a> or reply to this email.</p>
                
                <p>Happy teaching!<br>The EduPlay Pro Team</p>
              </div>
              <div class="footer">
                <p>EduPlay Pro - Where Learning Meets Brain Training</p>
                <p><a href="${process.env.NEXTAUTH_URL}/unsubscribe">Unsubscribe</a></p>
              </div>
            </div>
          </body>
        </html>
      `
    })
  } catch (error) {
    console.error('Failed to send teacher welcome email:', error)
  }
}

/**
 * Send welcome email to new student
 */
export async function sendStudentWelcomeEmail(email: string, name: string, className: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Welcome to ${className} on EduPlay Pro! 🎮`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .game-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 20px 0; }
              .game { background: white; padding: 15px; text-align: center; border-radius: 8px; font-size: 24px; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Welcome to EduPlay Pro!</h1>
                <p>Get ready to play, learn, and grow!</p>
              </div>
              <div class="content">
                <p>Hi ${name},</p>
                <p>You've been added to <strong>${className}</strong>! Get ready for an awesome learning adventure.</p>
                
                <h3>🎮 24 Games Waiting for You:</h3>
                <div class="game-grid">
                  <div class="game">🔢</div>
                  <div class="game">🔬</div>
                  <div class="game">🌍</div>
                  <div class="game">🧠</div>
                  <div class="game">🧩</div>
                  <div class="game">🎯</div>
                </div>
                
                <p><strong>What you can do:</strong></p>
                <ul>
                  <li>Play educational games and brain challenges</li>
                  <li>Earn XP and unlock achievements</li>
                  <li>Compete on the leaderboard</li>
                  <li>Complete daily challenges</li>
                  <li>Build your streak!</li>
                </ul>
                
                <center>
                  <a href="${process.env.NEXTAUTH_URL}/dashboard/student" class="button">Start Playing →</a>
                </center>
                
                <p>Have fun learning!<br>The EduPlay Pro Team</p>
              </div>
              <div class="footer">
                <p>EduPlay Pro - Where Learning Meets Brain Training</p>
              </div>
            </div>
          </body>
        </html>
      `
    })
  } catch (error) {
    console.error('Failed to send student welcome email:', error)
  }
}

/**
 * Send weekly progress report to teacher
 */
export async function sendWeeklyProgressReport(
  email: string,
  teacherName: string,
  stats: {
    totalStudents: number
    activeStudents: number
    gamesPlayed: number
    avgAccuracy: number
    topPerformers: Array<{ name: string; xp: number }>
  }
) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: '📊 Your Weekly Class Progress Report',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
              .stat { background: white; padding: 20px; border-radius: 8px; text-align: center; }
              .stat-value { font-size: 32px; font-weight: bold; color: #8b5cf6; }
              .stat-label { color: #6b7280; font-size: 14px; margin-top: 5px; }
              .leaderboard { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .leaderboard-item { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #e5e7eb; }
              .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📊 Weekly Progress Report</h1>
                <p>Your class insights for this week</p>
              </div>
              <div class="content">
                <p>Hi ${teacherName},</p>
                <p>Here's how your students performed this week:</p>
                
                <div class="stat-grid">
                  <div class="stat">
                    <div class="stat-value">${stats.activeStudents}/${stats.totalStudents}</div>
                    <div class="stat-label">Active Students</div>
                  </div>
                  <div class="stat">
                    <div class="stat-value">${stats.gamesPlayed}</div>
                    <div class="stat-label">Games Played</div>
                  </div>
                  <div class="stat">
                    <div class="stat-value">${stats.avgAccuracy}%</div>
                    <div class="stat-label">Avg Accuracy</div>
                  </div>
                  <div class="stat">
                    <div class="stat-value">${Math.round((stats.activeStudents / stats.totalStudents) * 100)}%</div>
                    <div class="stat-label">Engagement</div>
                  </div>
                </div>
                
                <div class="leaderboard">
                  <h3>🏆 Top Performers</h3>
                  ${stats.topPerformers.map((student, index) => `
                    <div class="leaderboard-item">
                      <span>${index + 1}. ${student.name}</span>
                      <strong>${student.xp} XP</strong>
                    </div>
                  `).join('')}
                </div>
                
                <center>
                  <a href="${process.env.NEXTAUTH_URL}/dashboard/teacher/analytics" class="button">View Full Analytics →</a>
                </center>
                
                <p>Keep up the great work!<br>The EduPlay Pro Team</p>
              </div>
              <div class="footer">
                <p><a href="${process.env.NEXTAUTH_URL}/settings/notifications">Manage Email Preferences</a></p>
              </div>
            </div>
          </body>
        </html>
      `
    })
  } catch (error) {
    console.error('Failed to send weekly progress report:', error)
  }
}

/**
 * Send assignment notification to student
 */
export async function sendAssignmentNotification(
  email: string,
  studentName: string,
  assignmentTitle: string,
  dueDate: Date,
  teacherName: string
) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `📝 New Assignment: ${assignmentTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .assignment-box { background: white; padding: 20px; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 20px 0; }
              .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .due-date { color: #dc2626; font-weight: bold; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📝 New Assignment!</h1>
              </div>
              <div class="content">
                <p>Hi ${studentName},</p>
                <p>${teacherName} has assigned you a new task:</p>
                
                <div class="assignment-box">
                  <h3>${assignmentTitle}</h3>
                  <p><strong>Due:</strong> <span class="due-date">${dueDate.toLocaleDateString()}</span></p>
                </div>
                
                <center>
                  <a href="${process.env.NEXTAUTH_URL}/dashboard/student/assignments" class="button">View Assignment →</a>
                </center>
                
                <p>Good luck!<br>The EduPlay Pro Team</p>
              </div>
              <div class="footer">
                <p>EduPlay Pro - Where Learning Meets Brain Training</p>
              </div>
            </div>
          </body>
        </html>
      `
    })
  } catch (error) {
    console.error('Failed to send assignment notification:', error)
  }
}

/**
 * Send payment success email
 */
export async function sendPaymentSuccessEmail(email: string, name: string, plan: string, amount: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Receipt for your EduPlay Pro Subscription 🧾',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #10b981;">Payment Successful!</h1>
          <p>Hi ${name},</p>
          <p>Thank you for choosing EduPlay Pro. Your payment for the <strong>${plan}</strong> plan has been processed successfully.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Amount:</strong> ${amount}</p>
            <p><strong>Plan:</strong> ${plan}</p>
            <p><strong>Status:</strong> Active</p>
          </div>
          <p>You can manage your subscription and download invoices from your <a href="${process.env.NEXTAUTH_URL}/dashboard/admin/billing">Billing Dashboard</a>.</p>
          <p>Happy teaching!</p>
        </div>
      `
    })
  } catch (error) {
    console.error('Failed to send payment success email:', error)
  }
}

/**
 * Send trial expiration reminder
 */
export async function sendTrialExpiredEmail(email: string, name: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Your EduPlay Pro Trial has Expired ⌛',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ef4444;">Trial Expired</h1>
          <p>Hi ${name},</p>
          <p>Your trial for EduPlay Pro has ended. To continue using all premium features and preserving your data, please upgrade to a paid plan.</p>
          <center>
            <a href="${process.env.NEXTAUTH_URL}/dashboard/admin/billing" style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Upgrade Now</a>
          </center>
          <p>If you have any questions, feel free to contact our support team.</p>
        </div>
      `
    })
  } catch (error) {
    console.error('Failed to send trial expired email:', error)
  }
}

/**
 * Send streak reminder
 */
export async function sendStreakReminderEmail(email: string, name: string, currentStreak: number) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Don't lose your ${currentStreak} day streak! 🔥`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #f59e0b;">Keep the Fire Burning! 🔥</h1>
          <p>Hi ${name},</p>
          <p>You have an amazing <strong>${currentStreak} day streak</strong> going! Don't let it reset.</p>
          <p>Play just one game today to keep your streak alive and earn your daily XP bonus.</p>
          <center>
              <a href="${process.env.NEXTAUTH_URL}/dashboard/student" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Play Now →</a>
          </center>
        </div>
      `
    })
  } catch (error) {
    console.error('Failed to send streak reminder email:', error)
  }
}

/**
 * Send subscription cancellation confirmation
 */
export async function sendCancellationConfirmationEmail(email: string, name: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Subscription Cancelled - EduPlay Pro 🕊️',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1>Subscription Cancelled</h1>
          <p>Hi ${name},</p>
          <p>Your subscription to EduPlay Pro has been cancelled as per your request.</p>
          <p>You will continue to have access to premium features until the end of your current billing period.</p>
          <p>We're sad to see you go! If you change your mind, you can reactivate anytime from your dashboard.</p>
          <p>The EduPlay Pro Team</p>
        </div>
      `
    })
  } catch (error) {
    console.error('Failed to send cancellation email:', error)
  }
}

/**
 * Send payment failure alert
 */
export async function sendPaymentFailedEmail(email: string, name: string, plan: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Urgent: Payment Failed for your EduPlay Pro Subscription ⚠️',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ef4444;">Payment Failed</h1>
          <p>Hi ${name},</p>
          <p>We were unable to process your payment for the <strong>${plan}</strong> plan.</p>
          <p>Please update your payment method to avoid any interruption in service.</p>
          <center>
            <a href="${process.env.NEXTAUTH_URL}/dashboard/admin/billing" style="display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Update Payment Method</a>
          </center>
          <p>If you need assistance, please reply to this email.</p>
        </div>
      `
    })
  } catch (error) {
    console.error('Failed to send payment failed email:', error)
  }
}

/**
 * Send assignment due reminder
 */
export async function sendAssignmentDueEmail(email: string, name: string, assignmentTitle: string, dueDate: Date) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Reminder: ${assignmentTitle} is due soon! ⏰`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #f59e0b;">Upcoming Deadline! ⏰</h1>
          <p>Hi ${name},</p>
          <p>This is a quick reminder that your assignment <strong>"${assignmentTitle}"</strong> is due on <strong>${dueDate.toLocaleDateString()}</strong>.</p>
          <p>Make sure to complete it on time to keep your progress going!</p>
          <center>
            <a href="${process.env.NEXTAUTH_URL}/dashboard/student/assignments" style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Complete Assignment →</a>
          </center>
        </div>
      `
    })
  } catch (error) {
    console.error('Failed to send assignment due email:', error)
  }
}
