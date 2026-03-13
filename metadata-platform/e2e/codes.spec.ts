import { test, expect } from '@playwright/test'
import { testCodeGroup } from './fixtures/test-data'

test.use({ storageState: 'e2e/.auth/manager.json' })

test.describe('표준 코드', () => {
  test('코드 목록이 표시된다', async ({ page }) => {
    await page.goto('/codes')
    await expect(page.getByRole('heading', { name: '표준 코드' })).toBeVisible()
  })

  test('코드 그룹을 등록할 수 있다', async ({ page }) => {
    const codeGroup = testCodeGroup()

    await page.goto('/codes/new')
    await page.getByLabel('코드 그룹명 *').fill(codeGroup.groupName)
    await page.getByLabel('코드 그룹 영문명 *').fill(codeGroup.groupEnglishName)
    await page.getByLabel('코드 그룹 설명 *').fill(codeGroup.groupDescription)

    // Add code items
    for (const item of codeGroup.items) {
      await page.getByRole('button', { name: '항목 추가' }).click()
      const rows = page.locator('table tbody tr')
      const lastRow = rows.last()
      await lastRow.getByPlaceholder('코드값').fill(item.code)
      await lastRow.getByPlaceholder('코드명').fill(item.name)
    }

    await page.getByRole('button', { name: '등록' }).click()

    await expect(page).toHaveURL(/\/codes$/)
    await expect(page.getByText(codeGroup.groupName)).toBeVisible()
  })

  test('코드 그룹 상세를 조회할 수 있다', async ({ page }) => {
    // Create a code group first
    const codeGroup = testCodeGroup()
    await page.goto('/codes/new')
    await page.getByLabel('코드 그룹명 *').fill(codeGroup.groupName)
    await page.getByLabel('코드 그룹 영문명 *').fill(codeGroup.groupEnglishName)
    await page.getByLabel('코드 그룹 설명 *').fill(codeGroup.groupDescription)
    for (const item of codeGroup.items) {
      await page.getByRole('button', { name: '항목 추가' }).click()
      const lastRow = page.locator('table tbody tr').last()
      await lastRow.getByPlaceholder('코드값').fill(item.code)
      await lastRow.getByPlaceholder('코드명').fill(item.name)
    }
    await page.getByRole('button', { name: '등록' }).click()
    await expect(page).toHaveURL(/\/codes$/)

    // Click to view detail
    await page.getByText(codeGroup.groupName).click()
    await expect(page).toHaveURL(/\/codes\/[a-z0-9-]+$/)
    await expect(page.getByText(codeGroup.groupName)).toBeVisible()
    await expect(page.getByText(codeGroup.groupEnglishName)).toBeVisible()
    // Verify code items are shown
    await expect(page.getByText('항목A')).toBeVisible()
    await expect(page.getByText('항목B')).toBeVisible()
  })

  test('코드 그룹을 수정할 수 있다', async ({ page }) => {
    // Create a code group first
    const codeGroup = testCodeGroup()
    await page.goto('/codes/new')
    await page.getByLabel('코드 그룹명 *').fill(codeGroup.groupName)
    await page.getByLabel('코드 그룹 영문명 *').fill(codeGroup.groupEnglishName)
    await page.getByLabel('코드 그룹 설명 *').fill(codeGroup.groupDescription)
    for (const item of codeGroup.items) {
      await page.getByRole('button', { name: '항목 추가' }).click()
      const lastRow = page.locator('table tbody tr').last()
      await lastRow.getByPlaceholder('코드값').fill(item.code)
      await lastRow.getByPlaceholder('코드명').fill(item.name)
    }
    await page.getByRole('button', { name: '등록' }).click()
    await expect(page).toHaveURL(/\/codes$/)

    // Navigate to detail, then edit
    await page.getByText(codeGroup.groupName).click()
    await page.getByRole('link', { name: '수정' }).click()
    await expect(page).toHaveURL(/\/edit$/)

    const newDescription = '수정된 코드 그룹 설명 ' + Date.now()
    await page.getByLabel('코드 그룹 설명 *').clear()
    await page.getByLabel('코드 그룹 설명 *').fill(newDescription)
    await page.getByRole('button', { name: '수정' }).click()

    await expect(page).toHaveURL(/\/codes$/)
  })
})
