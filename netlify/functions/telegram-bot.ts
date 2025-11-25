import { Telegraf } from 'telegraf';

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.warn('TELEGRAM_BOT_TOKEN is not set; Telegram bot updates will fail.');
}

const bot = new Telegraf(token ?? '');

export const handler = async (event: { body?: string | null }) => {
  if (!token) {
    return { statusCode: 500, body: 'TELEGRAM_BOT_TOKEN not configured' };
  }

  if (!event.body) {
    return { statusCode: 400, body: 'Missing request body' };
  }

  try {
    const update = JSON.parse(event.body);
    await bot.handleUpdate(update);
    return { statusCode: 200, body: 'ok' };
  } catch (error) {
    console.error('Error handling Telegram update', error);
    return { statusCode: 500, body: 'Error handling Telegram update' };
  }
};
