import { test, expect } from '@playwright/test'
import { testTerm } from './fixtures/test-data'

test.use({ storageState: 'e2e/.auth/manager.json' })

test.describe('표준 용어', () => {
  test('용어 목록이 표시된다', async ({ page }) => {
    await page.goto('/standards')
    await expect(page.getByRole('heading', { name: '표준 용어' })).toBeVisible()
  })

  test('새 용어를 등록할 수 있다', async ({ page }) => {
    const term = testTerm()

    await page.goto('/standards/new')
    await page.getByLabel('용어명 *').fill(term.termName)
    await page.getByLabel('영문 용어명 *').fill(term.termEnglishName)
    await page.getByLabel('용어 설명 *').fill(term.termDescription)

    // Select domain (seed domain "한글명" should be available)
    await page.getByText('도메인을 선택하세요').click()
    await page.getByRole('option', { name: '한글명' }).click()

    await page.getByRole('button', { name: '등록' }).click()

    await expect(page).toHaveURL(/\/standards$/)
    await expect(page.getByText(term.termName)).toBeVisible()
  })

  test('용어 상세를 조회할 수 있다', async ({ page }) => {
    // Create a term first
    const term = testTerm()
    await page.goto('/standards/new')
    await page.getByLabel('용어명 *').fill(term.termName)
    await page.getByLabel('영문 용어명 *').fill(term.termEnglishName)
    await page.getByLabel('용어 설명 *').fill(term.termDescription)
    await page.getByText('도메인을 선택하세요').click()
    await page.getByRole('option', { name: '한글명' }).click()
    await page.getByRole('button', { name: '등록' }).click()
    await expect(page).toHaveURL(/\/standards$/)

    // Click to view detail
    await page.getByText(term.termName).click()
    await expect(page).toHaveURL(/\/standards\/[a-z0-9-]+$/)
    await expect(page.getByText(term.termName)).toBeVisible()
    await expect(page.getByText(term.termEnglishName)).toBeVisible()
  })

  test('용어를 수정할 수 있다', async ({ page }) => {
    // Create a term first
    const term = testTerm()
    await page.goto('/standards/new')
    await page.getByLabel('용어명 *').fill(term.termName)
    await page.getByLabel('영문 용어명 *').fill(term.termEnglishName)
    await page.getByLabel('용어 설명 *').fill(term.termDescription)
    await page.getByText('도메인을 선택하세요').click()
    await page.getByRole('option', { name: '한글명' }).click()
    await page.getByRole('button', { name: '등록' }).click()
    await expect(page).toHaveURL(/\/standards$/)

    // Navigate to detail, then edit
    await page.getByText(term.termName).click()
    await page.getByRole('link', { name: '수정' }).click()
    await expect(page).toHaveURL(/\/edit$/)

    const newDescription = '수정된 용어 설명 ' + Date.now()
    await page.getByLabel('용어 설명 *').clear()
    await page.getByLabel('용어 설명 *').fill(newDescription)
    await page.getByRole('button', { name: '수정' }).click()

    await expect(page).toHaveURL(/\/standards$/)
  })
})
