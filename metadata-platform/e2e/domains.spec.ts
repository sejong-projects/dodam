import { test, expect } from '@playwright/test'
import { testDomain } from './fixtures/test-data'

test.describe('표준 도메인', () => {
  test('도메인 목록이 표시된다', async ({ page }) => {
    await page.goto('/domains')
    await expect(page.getByRole('heading', { name: '표준 도메인' })).toBeVisible()
    // Seed domain "한글명" should be in the table
    await expect(page.getByText('한글명')).toBeVisible()
  })

  test('새 도메인을 등록할 수 있다', async ({ page }) => {
    const domain = testDomain()

    await page.goto('/domains/new')
    await page.getByLabel('도메인명 *').fill(domain.name)
    await page.getByLabel('도메인 설명 *').fill(domain.description)

    // Select data type
    await page.getByText('데이터 타입을 선택하세요').click()
    await page.getByRole('option', { name: domain.dataType }).click()

    await page.getByRole('button', { name: '등록' }).click()

    // Should redirect to list and show the new domain
    await expect(page).toHaveURL(/\/domains$/)
    await expect(page.getByText(domain.name)).toBeVisible()
  })

  test('도메인 상세를 조회할 수 있다', async ({ page }) => {
    await page.goto('/domains')

    // Click seed domain row
    await page.getByText('한글명').click()
    await expect(page).toHaveURL(/\/domains\/[a-z0-9-]+$/)

    // Detail page should show domain info
    await expect(page.getByText('한글명')).toBeVisible()
    await expect(page.getByText('VARCHAR')).toBeVisible()
  })

  test('도메인을 수정할 수 있다', async ({ page }) => {
    // First create a domain to edit
    const domain = testDomain()
    await page.goto('/domains/new')
    await page.getByLabel('도메인명 *').fill(domain.name)
    await page.getByLabel('도메인 설명 *').fill(domain.description)
    await page.getByText('데이터 타입을 선택하세요').click()
    await page.getByRole('option', { name: domain.dataType }).click()
    await page.getByRole('button', { name: '등록' }).click()
    await expect(page).toHaveURL(/\/domains$/)

    // Navigate to detail, then edit
    await page.getByText(domain.name).click()
    await expect(page).toHaveURL(/\/domains\/[a-z0-9-]+$/)
    await page.getByRole('link', { name: '수정' }).click()
    await expect(page).toHaveURL(/\/edit$/)

    // Change description
    const newDescription = '수정된 설명 ' + Date.now()
    await page.getByLabel('도메인 설명 *').clear()
    await page.getByLabel('도메인 설명 *').fill(newDescription)
    await page.getByRole('button', { name: '수정' }).click()

    await expect(page).toHaveURL(/\/domains$/)
  })

  test('도메인을 검색할 수 있다', async ({ page }) => {
    await page.goto('/domains')

    // Search for seed domain
    await page.getByPlaceholder('도메인명 검색...').fill('한글명')

    // Wait for debounce (300ms) + network
    await expect(page.getByText('한글명')).toBeVisible()

    // Search for non-existent domain
    await page.getByPlaceholder('도메인명 검색...').clear()
    await page.getByPlaceholder('도메인명 검색...').fill('존재하지않는도메인xyz')

    await expect(page.getByText('등록된 도메인이 없습니다')).toBeVisible()
  })
})
