import { load } from 'https://deno.land/std@0.207.0/dotenv/mod.ts';
import axios from 'npm:axios@1.4.0';
import express from 'npm:express@4.18.2';
import { Telegraf } from 'npm:telegraf@4.12.2';

await load({ export: true });

const DENO_ENV = Deno.env.get('DENO_ENV');
const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_TOKEN');
const APP_URL = Deno.env.get('APP_URL');

const isUrl = (mayBeUrl: string): boolean => {
  try {
    new URL(mayBeUrl);
    return true;
  } catch (error) {
    return false;
  }
};

const shortenUrl = async (url: string): Promise<string> => {
  const res = await axios.post('https://cleanuri.com/api/v1/shorten', {
    url,
  });
  return res.data.result_url;
};

const bot = new Telegraf(TELEGRAM_TOKEN as string);

bot.start(ctx =>
  ctx.reply('Welcome. You can now start sending urls you wish to shorten'),
);

bot.on('text', async ctx => {
  try {
    if (!isUrl(ctx.update.message.text)) {
      return ctx.reply('Please send a valid url');
    }

    const shortUrl = await shortenUrl(ctx.update.message.text);
    ctx.reply(shortUrl);
  } catch (error) {
    ctx.reply('Something went wrong! 💥');
  }
});

if (DENO_ENV === 'development') {
  bot.launch(); // start polling which will delete webhook if there is one
} else {
  const app = express();

  app.use(express.json({ limit: '10kb' }));

  app.post(`/${TELEGRAM_TOKEN}`, async (req, res) => {
    await bot.handleUpdate(req.body);
    res.sendStatus(200);
  });

  // Call this endpoint to set webhook in production
  app.get('/hello', async (req, res) => {
    await fetch(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook?url=${APP_URL}/${TELEGRAM_TOKEN}`,
    );
    res.send('Hello! 👋');
  });

  app.listen({ port: 8000 });
}
