const { Bot, Keyboard } = require('@maxhub/max-bot-api');
const chatService = require('./chatService');

/**
 * MAX Messenger Bot Service
 * Uses official @maxhub/max-bot-api SDK
 * 
 * Documentation: https://dev.max.ru/docs/chatbots/bots-coding/library/js
 */

class MaxBotService {
  constructor(token) {
    if (!token) {
      throw new Error('BOT_TOKEN is required');
    }

    this.token = token;
    this.bot = new Bot(token);
    this.setupHandlers();
    console.log('[MAX Bot] Bot instance created');
  }

  /**
   * Setup message and event handlers
   */
  setupHandlers() {
    // Log all updates for debugging
    this.bot.use(async (ctx, next) => {
      console.log('[MAX Bot] 📥 Received update:', JSON.stringify(ctx.update, null, 2));
      await next();
    });

    // Handle /start command
    this.bot.command('start', async (ctx) => {
      try {
        console.log(`[MAX Bot] /start command from user ${ctx.user?.user_id}`);
        
        const response = chatService.processMessage('привет');
        await this.sendResponse(ctx, response);
      } catch (error) {
        console.error('[MAX Bot] Error handling /start:', error);
        await ctx.reply('Извините, произошла ошибка. Попробуйте позже.');
      }
    });

    // Handle all incoming text messages
    this.bot.on('message_created', async (ctx) => {
      try {
        const text = ctx.message?.body?.text || '';
        const userId = ctx.user?.user_id;
        
        console.log(`[MAX Bot] Message from ${userId}: ${text}`);

        // Skip if it's a command (already handled by bot.command)
        if (text.startsWith('/')) {
          return;
        }

        // Process message through chat service
        const response = chatService.processMessage(text);
        await this.sendResponse(ctx, response);

      } catch (error) {
        console.error('[MAX Bot] Error handling message:', error);
        await ctx.reply('Извините, произошла ошибка при обработке сообщения.');
      }
    });

    // Handle callback button clicks
    this.bot.on('message_callback', async (ctx) => {
      try {
        const payload = ctx.update?.callback?.payload;
        const userId = ctx.user?.user_id;
        
        console.log(`[MAX Bot] Callback from ${userId}: ${payload}`);

        // Process callback as regular message
        const response = chatService.processMessage(payload);
        await this.sendResponse(ctx, response);

      } catch (error) {
        console.error('[MAX Bot] Error handling callback:', error);
      }
    });

    // Handle bot added to chat
    this.bot.on('bot_added', async (ctx) => {
      try {
        console.log(`[MAX Bot] Bot added to chat ${ctx.chat?.chat_id}`);
        await ctx.reply('Спасибо, что добавили меня! Напишите /start для начала работы.');
      } catch (error) {
        console.error('[MAX Bot] Error handling bot_added:', error);
      }
    });

    // Handle bot started (user initiated conversation)
    this.bot.on('bot_started', async (ctx) => {
      try {
        console.log(`[MAX Bot] Bot started by user ${ctx.user?.user_id}`);
        const response = chatService.processMessage('привет');
        await this.sendResponse(ctx, response);
      } catch (error) {
        console.error('[MAX Bot] Error handling bot_started:', error);
      }
    });
  }

  /**
   * Send formatted response with text and optional keyboard
   */
  async sendResponse(ctx, response) {
    try {
      // Send main text response
      if (response.text) {
        const options = {};

        // Add inline keyboard with suggestions
        if (response.suggestions && response.suggestions.length > 0) {
          const keyboard = this.buildKeyboard(response.suggestions);
          options.attachments = [keyboard];
        }

        await ctx.reply(response.text, options);
      }

      // Handle specific action types
      if (response.action === 'events' && response.events) {
        await this.sendEvents(ctx, response.events);
      }

      if (response.applicationTypes && response.applicationTypes.length > 0) {
        await this.sendApplicationTypes(ctx, response.applicationTypes);
      }

      if (response.commands && response.commands.length > 0) {
        await this.sendCommands(ctx, response.commands);
      }

    } catch (error) {
      console.error('[MAX Bot] Error sending response:', error);
      throw error;
    }
  }

  /**
   * Build inline keyboard from suggestion array
   */
  buildKeyboard(suggestions) {
    // Group suggestions into rows (max 3 buttons per row for better UX)
    const buttons = [];
    for (let i = 0; i < suggestions.length; i += 3) {
      const rowButtons = suggestions.slice(i, i + 3).map(suggestion =>
        Keyboard.button.callback(suggestion, suggestion)
      );
      buttons.push(rowButtons);
    }

    return Keyboard.inlineKeyboard(buttons);
  }

  /**
   * Send formatted events list
   */
  async sendEvents(ctx, events) {
    if (!events || events.length === 0) {
      return;
    }

    let text = '📅 *Предстоящие мероприятия:*\n\n';
    events.forEach((event, index) => {
      text += `${index + 1}. **${event.title}**\n`;
      text += `   📝 ${event.description}\n`;
      text += `   📍 ${event.location}\n`;
      text += `   🕐 ${event.date} в ${event.time}\n\n`;
    });

    await ctx.reply(text, { format: 'markdown' });
  }

  /**
   * Send formatted application types
   */
  async sendApplicationTypes(ctx, types) {
    if (!types || types.length === 0) {
      return;
    }

    let text = '📄 *Доступные типы заявлений:*\n\n';
    types.forEach((type, index) => {
      text += `${index + 1}. **${type.name}**\n`;
      text += `   ${type.description}\n\n`;
    });

    // Add buttons for each application type
    const buttons = types.map(type =>
      Keyboard.button.callback(type.name, `Подать ${type.name}`)
    );
    
    const keyboard = Keyboard.inlineKeyboard([buttons.slice(0, 3)]);

    await ctx.reply(text, { 
      format: 'markdown',
      attachments: [keyboard]
    });
  }

  /**
   * Send formatted commands list
   */
  async sendCommands(ctx, commands) {
    if (!commands || commands.length === 0) {
      return;
    }

    let text = '📋 *Доступные команды:*\n\n';
    commands.forEach(cmd => {
      text += `**${cmd.command}** — ${cmd.description}\n`;
    });

    await ctx.reply(text, { format: 'markdown' });
  }

  /**
   * Start bot polling
   */
  async start() {
    try {
      console.log('[MAX Bot] Starting bot...');
      console.log('[MAX Bot] Using token:', this.token ? `${this.token.substring(0, 10)}...` : 'NONE');
      
      // Start bot in background (don't await)
      this.bot.start().then(() => {
        console.log('[MAX Bot] ✅ Bot started successfully and listening for updates');
      }).catch((error) => {
        console.error('[MAX Bot] ❌ Failed to start bot:', error.message);
        console.error('[MAX Bot] Error details:', error);
      });
      
      // Return immediately
      console.log('[MAX Bot] Bot start initiated (running in background)');
    } catch (error) {
      console.error('[MAX Bot] ❌ Exception during bot start:', error.message);
      console.error('[MAX Bot] Error details:', error);
    }
  }

  /**
   * Stop bot
   */
  async stop() {
    try {
      console.log('[MAX Bot] Stopping bot...');
      await this.bot.stop();
      console.log('[MAX Bot] Bot stopped');
    } catch (error) {
      console.error('[MAX Bot] Error stopping bot:', error);
    }
  }
}

module.exports = MaxBotService;
