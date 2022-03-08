import { config } from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import express from 'express';

config();

const token = process.env.TELEGRAM_TOKEN!;
const herokuUrl = process.env.HEROKU_URL;
let bot: TelegramBot;

if (process.env.NODE_ENV === 'production') {
  bot = new TelegramBot(token);
  bot.setWebHook(herokuUrl + token);
} else {
  bot = new TelegramBot(token, { polling: true }); // enabling polling will delete webhook if there is one
}

bot.on('message', async msg => {
  const chatId = msg.chat.id;

  // send a welcome message
  if (msg.text === '/start') {
    return bot.sendMessage(
      chatId,
      'Welcome. You can now start sending urls you wish to shorten'
    );
  }

  // shorten url
  try {
    const shortUrl = await shortenUrl(msg.text!);
    return bot.sendMessage(chatId, shortUrl);
  } catch (error) {
    return bot.sendMessage(chatId, 'Please send a valid url');
  }
});

const app = express();

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.listen(process.env.PORT, () => {
  console.log(`Bot running on port ${process.env.PORT}...`);
});

app.post(`/${token}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

const shortenUrl = async (url: string): Promise<string> => {
  const res = await axios.post('https://cleanuri.com/api/v1/shorten', {
    url,
  });
  return res.data.result_url;
};
