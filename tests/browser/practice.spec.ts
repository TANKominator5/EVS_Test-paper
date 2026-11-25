import { expect, test } from '@playwright/test';

test('answer, resume, finish, review and retake', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const set = () => page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'প্র্যাকটিস সেট ১', exact: true }) });
  await set().getByRole('button', { name: 'অনুশীলন শুরু করুন' }).click();
  await page.getByRole('button', { name: /^A:/ }).click();
  await expect(page.getByRole('heading', { name: 'উত্তরটি মেলেনি' })).toBeVisible();
  await expect(page.getByText('মনে রাখুন (Study Note)')).toBeVisible();
  await expect(page.locator('.reasons li')).toHaveCount(4);
  await expect(page.getByRole('button', { name: /^B:/ })).toBeDisabled();
  await page.getByRole('button', { name: 'পরের প্রশ্ন' }).click();
  await page.getByRole('button', { name: /^A:/ }).click();
  await expect(page.getByRole('heading', { name: 'সঠিক উত্তর!' })).toBeVisible();

  await page.reload();
  await set().getByRole('button', { name: 'অনুশীলন চালিয়ে যান' }).click();
  await expect(page.getByRole('heading', { name: 'সঠিক উত্তর!' })).toBeVisible();
  await page.getByRole('button', { name: 'সেট শেষ করুন' }).click();
  const confirmation = page.getByRole('dialog');
  await expect(confirmation).toContainText('২৮টি প্রশ্নের উত্তর দেননি');
  await confirmation.getByRole('button', { name: 'অনুশীলনে ফিরুন' }).click();
  await expect(confirmation).toBeHidden();
  await page.getByRole('button', { name: 'সেট শেষ করুন' }).click();
  await confirmation.getByRole('button', { name: 'শেষ করুন', exact: true }).click();
  await expect(page.locator('.score-card')).toContainText('১ / ৩০');
  await expect(page.getByRole('heading', { name: 'বিষয়ভিত্তিক বিশ্লেষণ' })).toBeVisible();
  await page.getByRole('button', { name: 'ভুল', exact: true }).click();
  await expect(page.locator('.review-grid button')).toHaveCount(1);
  await page.getByRole('button', { name: 'প্রশ্ন ১, ভুল', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'উত্তরটি মেলেনি' })).toBeVisible();
  await page.getByRole('button', { name: 'ফলাফলে ফিরুন' }).click();
  await page.getByRole('button', { name: 'অনুত্তরিত', exact: true }).click();
  await page.getByRole('button', { name: 'প্রশ্ন ২৯, অনুত্তরিত', exact: true }).click();
  await expect(page.getByText('উত্তরসূচিতে অসঙ্গতি (Anomaly)')).toBeVisible();
  await page.getByRole('button', { name: 'ফলাফলে ফিরুন' }).click();
  await page.getByRole('button', { name: 'আবার অনুশীলন করুন' }).click();
  await expect(page.getByRole('button', { name: /^A:/ })).toBeEnabled();
  await page.getByRole('button', { name: 'আমার ফলাফল' }).click();
  await expect(page.locator('.history-row')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(errors).toEqual([]);
});

test('duplicated printed labels keep independent scoring positions', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'প্র্যাকটিস সেট ৪', exact: true }) }).getByRole('button', { name: 'অনুশীলন শুরু করুন' }).click();
  await page.getByRole('button', { name: 'প্রশ্ন ৪, উত্তর দেওয়া হয়নি', exact: true }).click();
  await expect(page.getByRole('button', { name: /^B:/ })).toHaveCount(4);
  await page.getByRole('button', { name: 'B: গল্পবলা পদ্ধতি', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'সঠিক উত্তর!' })).toBeVisible();
  await expect(page.getByText('C · গল্পবলা পদ্ধতি')).toBeVisible();
  await expect(page.getByText('উত্তরসূচিতে অসঙ্গতি (Anomaly)')).toBeVisible();
});

test('all 15 papers are playable and Set 15 Q12 uses the printed C', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'অনুশীলন শুরু করুন' })).toHaveCount(15);
  await page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'প্র্যাকটিস সেট ১৫', exact: true }) }).getByRole('button', { name: 'অনুশীলন শুরু করুন' }).click();
  await page.getByRole('button', { name: 'প্রশ্ন ১২, উত্তর দেওয়া হয়নি', exact: true }).click();
  await page.getByRole('button', { name: 'C: 300 দিন', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'সঠিক উত্তর!' })).toBeVisible();
  await expect(page.getByText('উত্তরসূচিতে অসঙ্গতি (Anomaly)')).toBeVisible();
});
