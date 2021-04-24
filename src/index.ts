import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import express from 'express';

dotenv.config();

const token = process.env.TELEGRAM_TOKEN!;
const herokuUrl = process.env.HEROKU_URL;
let bot: TelegramBot;

if (process.env.NODE_ENV === 'production') {
  bot = new TelegramBot(token);
  bot.setWebHook(herokuUrl + token);
} else {
  bot = new TelegramBot(token, { polling: true });
}

bot.on('message', async msg => {
  const chatId = msg.chat.id;

  // send a welcome message
  if (msg.text === '/start') {
    return bot.sendMessage(
      chatId,
      'မင်္ဂလာပါ။\nချုံ့ချင်တဲ့ url တွေကိုစတင်ပို့လို့ရပါပြီ။'
    );
  }

  // shorten url
  try {
    const shortUrl = await shortenUrl(msg.text!);
    return bot.sendMessage(chatId, shortUrl);
  } catch (error) {
    return bot.sendMessage(chatId, 'url တွေကိုပဲချုံ့ပေးလို့ရမှာပါ။');
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
