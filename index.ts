import { config } from 'https://deno.land/std@0.159.0/dotenv/mod.ts';
import { Telegraf } from 'https://esm.sh/telegraf@4.12.2';
import axios from 'https://esm.sh/axios@1.4.0';
import { Application, Router } from 'https://deno.land/x/oak@v11.1.0/mod.ts';

await config({
  export: true,
});

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
  ctx.reply('Welcome. You can now start sending urls you wish to shorten')
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
}

const router = new Router();

router.post(`/${TELEGRAM_TOKEN}`, async ctx => {
  const body = await ctx.request.body().value;
  await bot.handleUpdate(body);
  ctx.response.status = 200;
});

// Call this endpoint to set webhook in production
router.get('/hello', async ctx => {
  await fetch(
    `https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook?url=${APP_URL}/${TELEGRAM_TOKEN}`
  );

  ctx.response.body = 'Hello! 👋';
});

const app = new Application();

app.use(router.routes());

if (DENO_ENV !== 'development') {
  app.listen({ port: 8000 });
}
