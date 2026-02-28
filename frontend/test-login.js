import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto('http://localhost:8080/auth');

    await page.type('input[type="email"]', 'om@test.com');
    await page.type('input[type="password"]', 'password123');

    await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);

    const url = page.url();
    console.log('Final URL:', url);
    await page.screenshot({ path: 'login_result.png' });

    await browser.close();
})();
