const { chromium } = require('C:/Users/Asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const fs = require('node:fs')
const path = require('node:path')

const output = (name) => path.resolve(__dirname, name)

async function metrics(page, selector) {
  return page.locator(selector).evaluate((element) => {
    const box = element.getBoundingClientRect()
    const style = getComputedStyle(element)
    return {
      x: Math.round(box.x),
      y: Math.round(box.y),
      width: Math.round(box.width),
      height: Math.round(box.height),
      padding: style.padding,
      gap: style.gap,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      pageHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
    }
  })
}

async function run() {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 })
  const assetsDirectory = path.resolve(__dirname, '../dist/assets')
  const cssFile = fs.readdirSync(assetsDirectory).find((file) => file.endsWith('.css'))
  const jsFile = fs.readdirSync(assetsDirectory).find((file) => file.endsWith('.js'))
  const rawCss = fs.readFileSync(path.join(assetsDirectory, cssFile), 'utf8')
  const css = rawCss.replace(/url\(([^)]+\.ttf)\)/g, (_, relativeUrl) => {
    const filename = path.basename(relativeUrl.replace(/["']/g, ''))
    const base64 = fs.readFileSync(path.join(assetsDirectory, filename)).toString('base64')
    return `url(data:font/ttf;base64,${base64})`
  })
  const js = fs.readFileSync(path.join(assetsDirectory, jsFile), 'utf8')

  await page.setContent('<!doctype html><html><head></head><body><div id="root"></div></body></html>')
  await page.evaluate(() => {
    window.location.hash = '#register'
    window.fetch = async (url) => {
      if (String(url).endsWith('/auth/register')) {
        return new Response(JSON.stringify({ code: 1000, result: { status: 'PENDING_VERIFICATION' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ code: 1000, result: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  })
  await page.addStyleTag({ content: css })
  await page.addScriptTag({ content: js, type: 'module' })
  await page.locator('.register-card').waitFor()
  await page.screenshot({ path: output('register-1280x800.png'), fullPage: false })
  const registerDesktop = await metrics(page, '.register-card')

  await page.getByLabel('Họ và tên').fill('Sinh viên EduShare')
  await page.getByLabel('Email sinh viên').fill('sv123@university.edu.vn')
  await page.getByLabel('Mật khẩu', { exact: true }).fill('Password123')
  await page.getByLabel('Xác nhận mật khẩu').fill('Password123')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Đăng ký', exact: true }).click()
  await page.locator('.otp-card').waitFor()

  await page.setViewportSize({ width: 1280, height: 1122 })
  await page.screenshot({ path: output('otp-actual-1280.png'), fullPage: false })
  const otpDesktop = await metrics(page, '.otp-card')
  const otpInputs = await metrics(page, '.otp-inputs')

  await page.setViewportSize({ width: 390, height: 700 })
  await page.screenshot({ path: output('otp-mobile-390x700.png'), fullPage: false })
  const otpMobile = await metrics(page, '.otp-card')

  await page.evaluate(() => { window.location.hash = '#login' })
  await page.locator('.login-card').waitFor()
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.screenshot({ path: output('login-1280x720.png'), fullPage: false })
  const loginDesktop = await metrics(page, '.login-card')

  await page.evaluate(() => { window.location.hash = '#register' })
  await page.locator('.register-card').waitFor()
  await page.setViewportSize({ width: 390, height: 700 })
  await page.screenshot({ path: output('register-mobile-390x700.png'), fullPage: false })
  const registerMobile = await metrics(page, '.register-card')

  console.log(JSON.stringify({ registerDesktop, otpDesktop, otpInputs, otpMobile, loginDesktop, registerMobile }, null, 2))
  await browser.close()
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
