import { config } from 'dotenv';
import { Telegraf } from 'telegraf';
import axios from 'axios';
import express from 'express';

config();

const token = process.env.TELEGRAM_TOKEN!;
const herokuUrl = process.env.HEROKU_URL;

const bot = new Telegraf(token);

bot.start(ctx =>
  ctx.reply('Welcome. You can now start sending urls you wish to shorten')
);

bot.on('text', async ctx => {
  // shorten url
  try {
    const shortUrl = await shortenUrl(ctx.update.message.text);
    return ctx.reply(shortUrl);
  } catch (error) {
    return ctx.reply('Please send a valid url');
  }
});

if (process.env.NODE_ENV === 'production') {
  bot.telegram.setWebhook(herokuUrl + token);
} else {
  bot.launch();
}

const app = express();

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.listen(process.env.PORT, () => {
  console.log(`Bot running on port ${process.env.PORT}...`);
});

app.post(`/${token}`, (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

const shortenUrl = async (url: string): Promise<string> => {
  const res = await axios.post('https://cleanuri.com/api/v1/shorten', {
    url,
  });
  return res.data.result_url;
};
