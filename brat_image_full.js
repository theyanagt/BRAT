const axios = require('axios');
const express = require('express');

const runPlaywrightCode = async (code) => {
  try {
    const url = 'https://try.playwright.tech/service/control/run';
    const headers = {
      'accept': '*/*',
      'content-type': 'application/json',
      'origin': 'https://try.playwright.tech',
      'referer': 'https://try.playwright.tech/?l=playwright-test',
      'user-agent': 'Postify/1.0.0',
    };
    const data = {
      code: code,
      language: 'javascript',
    };
    const response = await axios.post(url, data, { headers });
    return response.data;
  } catch (error) {
    console.error('Error running playwright code:', error);
    throw error;
  }
};

const bratMaker = async (text) => {
  const code = `
const { chromium } = require('playwright');

async function generateBratImage(text) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 375, height: 812 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
    });
    const page = await context.newPage();
    await page.goto('https://www.bratgenerator.com/');
    await page.evaluate(() => {
        setupTheme('white');
    });
    await page.fill('#textInput', text); 
    await page.click('#onetrust-accept-btn-handler');
    await page.waitForTimeout(500);
    const screenshot = await page.screenshot();
    await browser.close();
    return screenshot;
}

generateBratImage('${text}').then(screenshot => {
    return screenshot;
});`;

  const { output } = await runPlaywrightCode(code.trim());
  return output;
};

const handler = async (req, res) => {
  const { method } = req;
  const { text } = req.method === 'GET' ? req.query : req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text parameter is required' });
  }

  try {
    const result = await bratMaker(text);
    Promise.resolve(result)
      .then(() => {
        console.log('Query processing complete!');
      })
      .catch((error) => {
        console.error('Error processing query:', error);
      });
    res.setHeader('Content-Type', 'image/png');
    return res.status(200).send(Buffer.from(result));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to generate brat image' });
  }
};

const app = express();
app.use(express.json());

app.post('/brat-image', handler);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
