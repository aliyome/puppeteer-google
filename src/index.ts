import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import dotenv from 'dotenv';

dotenv.config();

const headless = process.env.DEBUG ? false : true;
const pass = process.env.PASS!;
const email = process.env.EMAIL!;

let i = 0;

const main = async () => {
  const browser = await puppeteer
    .use(StealthPlugin())
    .launch({ args: ['--lang=ja'], headless });
  const page = await browser.newPage();

  await page.setExtraHTTPHeaders({ 'Accept-Language': 'ja-JP' });
  await page.goto('https://accounts.google.co.jp/');

  await page.waitForSelector('input[type="email"]');
  await page.click('input[type="email"]');
  await page.type('input[type="email"]', email);
  await page.waitForSelector('#identifierNext');
  await page.click('#identifierNext');
  await page.waitForSelector('input[type="password"]', { visible: true });
  await page.click('input[type="password"]');
  await page.type('input[type="password"]', pass);
  await page.waitForSelector('#passwordNext');
  await page.click('#passwordNext');
  await page.waitForNavigation();
  await page.goto('https://www.youtube.com/feed/subscriptions');
  await page.waitForSelector('ytd-grid-video-renderer');
  await page.screenshot({ path: 'stealth.png', fullPage: true });

  const liveHrefs = await page.evaluate(() => {
    const badges = document.querySelectorAll('#video-badges > div > span');
    const hrefs: string[] = [];
    badges.forEach((badge) => {
      const href = badge
        .closest('ytd-grid-video-renderer')
        ?.querySelector<HTMLAnchorElement>('a#thumbnail')?.href;
      if (href) {
        hrefs.push(href);
      }
    });
    return hrefs;
  });

  const regHref = /=(.{11})/;
  const liveVideoIds = liveHrefs
    .map((href) => {
      const match = regHref.exec(href);
      return match ? match[1] : null;
    })
    .filter((videoId) => !!videoId);

  console.log(liveVideoIds);
  await browser.close();
};

main().catch(console.error);
