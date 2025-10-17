import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function tryLoadLogoDataUrl() {
    const candidates = [
        path.join(
            __dirname,
            '../../../New_HRM_frontend-updated/public/logo.png'
        ),
        path.join(__dirname, '../../public/logo.png'),
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) {
            const base64 = fs.readFileSync(p).toString('base64');
            return `data:image/png;base64,${base64}`;
        }
    }
    return null;
}

export async function renderPayslipPdf(templateData) {
    const templatePath = path.join(__dirname, '../templates/payslip.ejs');
    const logoDataUrl = tryLoadLogoDataUrl();
    const html = await ejs.renderFile(templatePath, {
        ...templateData,
        logoDataUrl,
    });

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '12mm',
                right: '10mm',
                bottom: '12mm',
                left: '10mm',
            },
        });
        return pdfBuffer;
    } finally {
        await browser.close();
    }
}
