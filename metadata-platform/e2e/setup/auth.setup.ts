import { test as setup, expect } from '@playwright/test'
import { USERS } from '../fixtures/test-data'

const authDir = 'e2e/.auth'

async function loginAndSave(
  page: import('@playwright/test').Page,
  email: string,
  password: string,
  outputPath: string,
) {
  await page.goto('/login')
  await page.getByLabel('이메일').fill(email)
  await page.getByLabel('비밀번호').fill(password)
  await page.getByRole('button', { name: '로그인' }).click()
  await expect(page).toHaveURL(/\/standards/)
  await page.context().storageState({ path: outputPath })
}

setup('authenticate as admin', async ({ page }) => {
  await loginAndSave(page, USERS.admin.email, USERS.admin.password, `${authDir}/admin.json`)
})

setup('authenticate as manager', async ({ page }) => {
  await loginAndSave(page, USERS.manager.email, USERS.manager.password, `${authDir}/manager.json`)
})

setup('authenticate as approver', async ({ page }) => {
  await loginAndSave(page, USERS.approver.email, USERS.approver.password, `${authDir}/approver.json`)
})
