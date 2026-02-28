import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

    try {
        await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });

        await page.type('input[placeholder="name@example.com"]', 'test@example.com');
        await page.type('input[placeholder="••••••••"]', 'password123');
        await page.click('button[type="submit"]');

        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        console.log('Navigating to Timetable...');
        await page.goto('http://localhost:5173/timetable', { waitUntil: 'networkidle0' });

        console.log('Clicking Manual Planner tab...');
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const manualBtn = buttons.find(b => b.textContent && b.textContent.includes('Manual Planner'));
            if (manualBtn) manualBtn.click();
        });

        await new Promise(r => setTimeout(r, 2000));
        console.log('Capture finished.');

    } catch (e) {
        console.error("Test failed: ", e);
    } finally {
        await browser.close();
    }
})();
