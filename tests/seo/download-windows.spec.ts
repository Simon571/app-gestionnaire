import { test, expect } from '@playwright/test';

const LOCALES = [
  { code: 'fr', title: "Télécharger l'application Windows" },
  { code: 'en', title: 'Download the Windows app' },
];

for (const loc of LOCALES) {
  test.describe(`${loc.code} /download`, () => {
    test(`${loc.code} — page has metadata, JSON-LD and download CTA`, async ({ page, request }) => {
      const url = `/${loc.code}/download`;
      await page.goto(url);

      await expect(page).toHaveTitle(new RegExp(loc.title, 'i'));

      const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
      expect(jsonLd).toBeTruthy();
      const parsed = JSON.parse(jsonLd || '{}');
      expect(parsed['@type']).toBe('SoftwareApplication');
      expect(parsed.operatingSystem).toMatch(/Windows/i);

      const download = page.getByRole('link', { name: /download/i }).first();
      await expect(download).toHaveAttribute('href', /https?:\/\//);

      const href = await download.getAttribute('href');
      expect(href).toBeTruthy();

      // External download check is optional in CI — enable with CI_DOWNLOAD_CHECK=true
      if (process.env.CI_DOWNLOAD_CHECK === 'true' && href) {
        const res = await request.get(href, { timeout: 15000 });
        expect(res.status()).toBe(200);
        const cd = res.headers()['content-disposition'] || '';
        expect(cd.length).toBeGreaterThan(0);
      }
    });
  });
}
