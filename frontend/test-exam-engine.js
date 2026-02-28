import puppeteer from 'puppeteer';

(async () => {
    let browser;
    try {
        console.log('Starting Exam Engine Automation Test...');
        browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();

        // 1. Capture React Error Logs
        page.on('console', msg => {
            if (msg.type() === 'error') console.error('BROWSER ERROR:', msg.text());
        });
        page.on('pageerror', err => console.error('REACT CRASH:', err.toString()));

        // 2. Register a new user dynamically to guarantee access
        const testEmail = `student${Date.now()}@example.com`;
        console.log(`Registering new test account: ${testEmail}`);
        await page.goto('http://localhost:8080/register', { waitUntil: 'networkidle0' });
        await page.type('input[placeholder="John Doe"]', 'Auto Tester');
        await page.type('input[placeholder="name@example.com"]', testEmail);
        await page.type('input[placeholder="••••••••"]', 'password123');
        await page.click('button[type="submit"]');

        console.log('Waiting for Dashboard redirect...');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        // 3. Go to Work & Test Generator
        console.log('Navigating to /work-test');
        await page.goto('http://localhost:8080/work-test', { waitUntil: 'networkidle0' });

        // 4. Input Course Material
        console.log('Typing Material to Generate Test');
        await page.type('input[placeholder="Subject (e.g., Biology)"]', 'System Security');
        await page.type('input[placeholder="Topic (e.g., Cell Division)"]', 'Browser Lockdown');
        await page.type('textarea', `
            A lockdown browser strictly blocks certain features. 
            It prevents keyboard shortcuts like copy-paste.
            It uses Fullscreen API and tracks window blur events to stop tab switching.
            If a user switches tabs 3 times, their exam is auto-submitted.
        `);

        // 5. Click Generate
        console.log('Clicking Generate Test...');
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const genBtn = buttons.find(b => b.textContent && b.textContent.includes('Generate Test'));
            if (genBtn) genBtn.click();
        });

        // 6. Wait for creation (usually ~1.5 - 3 seconds)
        console.log('Waiting for AI generation...');
        await new Promise(r => setTimeout(r, 4000));

        // Let AIVision ready up
        await new Promise(r => setTimeout(r, 2000));

        // 7. Test Anti-Cheat Logic 
        // We will simulate dropping focus from the window 3 times
        console.log('Starting Anti-Cheat verification...');
        for (let i = 1; i <= 3; i++) {
            console.log(`Triggering violation #${i} (window.blur)`);
            await page.evaluate(() => {
                window.dispatchEvent(new Event('blur'));
                document.dispatchEvent(new Event('visibilitychange'));
            });
            await new Promise(r => setTimeout(r, 1000));
        }

        // Wait to allow React re-render and Auto-submit Toast to pop
        await new Promise(r => setTimeout(r, 2000));

        // 8. Extract results from screen
        const results = await page.evaluate(() => {
            const spans = Array.from(document.querySelectorAll('span'));
            const textContent = document.body.innerText;
            return {
                hasAutoSubmitToast: textContent.includes('System auto-submitted due to cheating reasons'),
                hasTerminatedWarning: textContent.includes('Test Terminated'),
                scoreData: spans.filter(s => s.textContent.includes('Score:')).map(s => s.textContent)
            };
        });

        console.log('\n=== TEST RESULTS ===');
        console.log('Auto Submit Toast Displayed:', results.hasAutoSubmitToast);
        console.log('Test Terminated Warning:', results.hasTerminatedWarning);
        console.log('Score pills retrieved:', results.scoreData);

        if (results.hasAutoSubmitToast && results.hasTerminatedWarning) {
            console.log('\n✅ SUCCESS: Exam Engine correctly trapped 3 blur violations and auto-submitted the user!');
        } else {
            console.log('\n❌ FAILURE: Exam Engine did not display terminating cheating remarks.');
        }

    } catch (e) {
        console.error("Test Script Error:", e);
    } finally {
        if (browser) await browser.close();
        console.log('Test concluded.');
    }
})();
