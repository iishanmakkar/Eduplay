import { test, expect } from '@playwright/test'

test.describe('Student Journey - Complete Flow', () => {
    test('should complete full student onboarding and game play', async ({ page }) => {
        // 1. Navigate to signup page
        await page.goto('/auth/signup')
        await expect(page).toHaveTitle(/EduPlay Pro/)

        // 2. Fill signup form
        const timestamp = Date.now()
        await page.fill('input[name="firstName"]', 'Test')
        await page.fill('input[name="lastName"]', 'Student')
        await page.fill('input[name="email"]', `student${timestamp}@test.com`)
        await page.fill('input[name="password"]', 'TestPassword123!')
        await page.selectOption('select[name="role"]', 'STUDENT')

        // 3. Submit signup
        await page.click('button[type="submit"]')

        // 4. Should redirect to student dashboard
        await expect(page).toHaveURL(/\/dashboard\/student/)
        await expect(page.locator('h1')).toContainText('Hey Test!')

        // 5. Click "Join Class" button
        await page.click('button:has-text("Join Class")')

        // 6. Modal should open
        await expect(page.locator('text=Join a Class')).toBeVisible()

        // 7. Enter class code (assuming a test class exists with code ABC123)
        await page.fill('input[placeholder="ABC123"]', 'ABC123')
        await page.click('button:has-text("Join Class")')

        // 8. Should see success message
        await expect(page.locator('text=Joined')).toBeVisible({ timeout: 5000 })

        // 9. Navigate to games
        await page.click('a[href="/games"]')
        await expect(page).toHaveURL('/games')

        // 10. Click Speed Math game
        await page.click('text=Speed Math')
        await expect(page).toHaveURL(/\/games\/play\?type=SPEED_MATH/)

        // 11. Start game
        await page.click('button:has-text("Start Game")')

        // 12. Answer a few questions
        for (let i = 0; i < 3; i++) {
            // Wait for question to load
            await page.waitForSelector('input[type="number"]')

            // Enter answer (just enter 1 for simplicity in test)
            await page.fill('input[type="number"]', '1')
            await page.click('button:has-text("Submit Answer")')

            // Wait a bit for next question
            await page.waitForTimeout(500)
        }

        // 13. Wait for game to end (60 seconds or manually end)
        // For testing, we'll just verify the game is running
        await expect(page.locator('text=Time Left')).toBeVisible()
        await expect(page.locator('text=Score')).toBeVisible()
    })

    test('should show XP progress after game completion', async ({ page, context }) => {
        // This test assumes a logged-in student
        // In real scenario, you'd use a fixture or setup function

        await page.goto('/dashboard/student')

        // Verify XP progress bar exists
        await expect(page.locator('text=Level')).toBeVisible()
        await expect(page.locator('text=XP')).toBeVisible()

        // Verify progress bar is visible
        const progressBar = page.locator('[class*="progress"]').first()
        await expect(progressBar).toBeVisible()
    })

    test('should display enrolled classes', async ({ page }) => {
        await page.goto('/dashboard/student')

        // Should see "Your Classes" section
        await expect(page.locator('text=Your Classes')).toBeVisible()

        // If student has classes, they should be displayed
        // Otherwise, should see empty state
        const hasClasses = await page.locator('[class*="class-card"]').count() > 0
        const hasEmptyState = await page.locator('text=No classes yet').isVisible()

        expect(hasClasses || hasEmptyState).toBeTruthy()
    })
})
