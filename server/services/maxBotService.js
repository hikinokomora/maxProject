// Consolidated: real implementation moved here (from maxBotService2.js)
const { Bot, Keyboard } = require('@maxhub/max-bot-api');
const chatService = require('./chatService');
const applicationsService = require('./applicationsService');
const authService = require('./authService');
const universityConfig = require('../config/university.json');

class MaxBotService {
	constructor(token) {
		if (!token) throw new Error('BOT_TOKEN is required');
		this.token = token;
		this.bot = new Bot(token);
		this.sessions = new Map();
		this.setupHandlers();
	}

	setupHandlers() {
		this.bot.use(async (ctx, next) => {
			console.log('[MAX Bot] 📥 Update:', JSON.stringify(ctx.update, null, 2));
			await next();
		});

		this.bot.command('start', async (ctx) => {
			const welcome = `👋 Добро пожаловать в чат-бот университета!\n\n` +
				`Я помогу вам с:\n` +
				`📅 Расписанием занятий\n` +
				`🎯 Мероприятиями\n` +
				`📝 Подачей заявлений\n` +
				`💡 Полезной информацией\n\n` +
				`Выберите действие ниже:`;
			await ctx.reply(welcome, { attachments: [this.buildMainKeyboardWithApp()] });
		});

		this.bot.on('message_created', async (ctx) => {
			try {
				const text = ctx.message?.body?.text || '';
				const userId = ctx.user?.user_id;
				const session = this.sessions.get(userId);

				if (session) {
					if (session.mode === 'application') return this.handleApplicationFlow(ctx, text, session);
					if (session.mode === 'status') return this.handleStatusFlow(ctx, text, session);
				}

				if (text.startsWith('/')) return;
				const lower = text.toLowerCase().trim();

				const statusMatch = lower.match(/^статус\s+заявления\s*(\d+)/i);
				if (statusMatch) return this.replyWithApplicationStatus(ctx, parseInt(statusMatch[1], 10));

				if (lower === 'статус заявления') {
					this.sessions.set(userId, { mode: 'status', step: 'askId' });
					return ctx.reply('Укажите номер заявления (например: 12)');
				}

				if (lower === 'мои заявления') {
					this.sessions.set(userId, { mode: 'status', step: 'askStudentId' });
					return ctx.reply('Введите номер студенческого (или табельный):');
				}

				const response = chatService.processMessage(text);
				await this.sendResponse(ctx, response);
			} catch (e) {
				console.error('[MAX Bot] message_created error:', e);
				await ctx.reply('Ошибка обработки сообщения.');
			}
		});

		this.bot.on('message_callback', async (ctx) => {
			try {
				const payload = ctx.update?.callback?.payload;
				const userId = ctx.user?.user_id;
				if (payload === 'Мой токен' || payload === '🔐 Мой токен') {
					const maxUserId = ctx.user?.user_id;
					let user = await authService.findOrCreateByMaxUserId(maxUserId, { name: ctx.user?.full_name || `User ${maxUserId}`, email: `user_${maxUserId}@max.local`, role: 'STUDENT' });
					if (!user) return ctx.reply('Не удалось получить профиль. Попробуйте позже.');
					const token = authService.generateToken(user, '1h');
					await ctx.reply('Ваш временный токен (действителен 1 час):');
					return ctx.reply(token);
				}

				if (payload === 'Подать заявление') {
					return this.sendApplicationTypes(ctx, universityConfig.applicationTypes);
				}

				if (payload?.startsWith('Подать ')) {
					const name = payload.replace('Подать ', '').trim();
					const type = universityConfig.applicationTypes.find(t => t.name.toLowerCase() === name.toLowerCase());
					if (!type) {
						await ctx.reply('Тип не распознан, выберите из списка.');
						return this.sendApplicationTypes(ctx, universityConfig.applicationTypes);
					}
					this.sessions.set(userId, { mode: 'application', step: 'studentName', data: { type: type.id, typeName: type.name } });
					return ctx.reply(`Начнем заявление «${type.name}». Введите ваше ФИО.`);
				}

				if (payload?.startsWith('dep:')) {
					const dep = payload.slice(4);
					const session = this.sessions.get(userId);
					if (session?.mode === 'application' && session.step === 'department') {
						session.data.department = dep;
						session.step = 'email';
						return ctx.reply('Укажите ваш email для уведомлений:');
					}
				}

				const response = chatService.processMessage(payload);
				await this.sendResponse(ctx, response);
			} catch (e) {
				console.error('[MAX Bot] callback error:', e);
			}
		});

		this.bot.on('bot_added', async (ctx) => ctx.reply('Спасибо! Напишите /start для начала.'));
		this.bot.on('bot_started', async (ctx) => {
			const response = chatService.processMessage('привет');
			await this.sendResponse(ctx, response);
		});
	}

	async handleApplicationFlow(ctx, text, session) {
		const userId = ctx.user?.user_id;
		const maxUserId = ctx.user?.user_id;
		const value = text?.trim();

		switch (session.step) {
			case 'studentName':
				session.data.studentName = value;
				session.step = 'studentId';
				return ctx.reply('Укажите номер студенческого билета (или табельный номер):');
			case 'studentId': {
				session.data.studentId = value;
				session.step = 'department';
				const buttons = [universityConfig.departments.slice(0, 3).map(d => Keyboard.button.callback(d, `dep:${d}`))];
				return ctx.reply('Выберите факультет/подразделение:', { attachments: [Keyboard.inlineKeyboard(buttons)] });
			}
			case 'department':
				session.data.department = value;
				session.step = 'email';
				return ctx.reply('Укажите ваш email для уведомлений:');
			case 'email':
				if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return ctx.reply('Введите корректный email (пример: ivanov@example.com)');
				session.data.email = value;
				session.step = 'description';
				return ctx.reply('Кратко опишите, что требуется (необязательно). Если нечего добавлять — отправьте «-».');
			case 'description': {
				session.data.description = value === '-' ? '' : value;
				
				// Find or create user by MAX user ID
				let user = await authService.findOrCreateByMaxUserId(maxUserId, {
					email: session.data.email,
					name: session.data.studentName,
					role: 'STUDENT'
				});

				if (!user) {
					await ctx.reply('⚠️ Ошибка авторизации. Пожалуйста, попробуйте позже.');
					this.sessions.delete(userId);
					return;
				}

				const result = await applicationsService.createApplication({
					type: session.data.type,
					studentName: session.data.studentName,
					studentId: session.data.studentId,
					department: session.data.department,
					description: session.data.description,
					email: session.data.email,
					userId: user.id
				});
				
				if (!result.success) {
					await ctx.reply(`Не удалось создать заявление: ${result.message}`);
				} else {
					await ctx.reply(
						`✅ Заявление №${result.data.id} создано:\n` +
						`• Тип: ${result.data.typeName}\n` +
						`• ФИО: ${result.data.studentName}\n` +
						`• Номер: ${result.data.studentId}\n` +
						`• Подразделение: ${result.data.department}\n` +
						`Мы отправим уведомление о статусе на ${result.data.email}.`
					);
				}
				this.sessions.delete(userId);
				const keyboard = this.buildKeyboard(['Статус заявления', 'Мои заявления', 'Расписание', 'Мероприятия', 'Подать заявление']);
				return ctx.reply('Чем ещё могу помочь?', { attachments: [keyboard] });
			}
			default:
				this.sessions.delete(userId);
				return ctx.reply('Давайте начнём сначала. Выберите тип заявления:', { attachments: [this.buildKeyboard(universityConfig.applicationTypes.map(a => a.name))] });
		}
	}

	async handleStatusFlow(ctx, text, session) {
		const userId = ctx.user?.user_id;
		const value = text?.trim();

		if (session.step === 'askId') {
			const id = parseInt(value, 10);
			if (isNaN(id)) return ctx.reply('Пожалуйста, введите числовой ID заявления (например: 12).');
			await this.replyWithApplicationStatus(ctx, id);
			this.sessions.delete(userId);
			return;
		}

		if (session.step === 'askStudentId') {
			const studentId = value;
			const result = await applicationsService.getApplicationsByStudentId(studentId);
			if (!result.success) {
				await ctx.reply(`Не удалось получить список: ${result.message}`);
			} else if (!result.data || result.data.length === 0) {
				await ctx.reply('Заявления не найдены. Вы можете подать новое через «Подать заявление».');
			} else {
				const listText = this.formatApplicationsList(result.data);
				await ctx.reply(listText, { format: 'markdown' });
			}
			this.sessions.delete(userId);
			const keyboard = this.buildKeyboard(['Статус заявления', 'Подать заявление', 'Помощь']);
			await ctx.reply('Что дальше?', { attachments: [keyboard] });
		}
	}

	async replyWithApplicationStatus(ctx, id) {
		const result = await applicationsService.getApplicationById(id);
		if (!result.success || !result.data) return ctx.reply('Заявление не найдено. Проверьте номер и попробуйте снова.');
		const a = result.data;
		const text = [
			`📝 Заявление №${a.id}`,
			`• Тип: ${a.typeName}`,
			`• Статус: ${a.status}`,
			`• ФИО: ${a.studentName}`,
			`• Номер: ${a.studentId}`,
			a.department ? `• Подразделение: ${a.department}` : null,
			`• Email: ${a.email}`,
			`Создано: ${new Date(a.createdAt).toLocaleString()}`
		].filter(Boolean).join('\n');
		await ctx.reply(text);
	}

	formatApplicationsList(list) {
		let text = '📄 *Ваши заявления:*\n';
		for (const a of list) {
			text += `\n• №${a.id}: ${a.typeName} — ${a.status}`;
		}
		text += '\n\nЧтобы узнать подробности: Статус заявления <ID> (например: Статус заявления 12)';
		return text;
	}

	async sendResponse(ctx, response) {
		if (response.text) {
			const options = {};
			if (response.suggestions?.length) options.attachments = [this.buildKeyboard(response.suggestions)];
			await ctx.reply(response.text, options);
		}
		if (response.action === 'events' && response.events) await this.sendEvents(ctx, response.events);
		if (response.applicationTypes?.length) await this.sendApplicationTypes(ctx, response.applicationTypes);
		if (response.commands?.length) await this.sendCommands(ctx, response.commands);
	}

	buildKeyboard(suggestions) {
		const rows = [];
		for (let i = 0; i < suggestions.length; i += 3) {
			rows.push(suggestions.slice(i, i + 3).map(s => Keyboard.button.callback(s, s)));
		}
		return Keyboard.inlineKeyboard(rows);
	}

	buildMainKeyboardWithApp() {
		// Мини-приложение удалено: оставляем только клавиши бота
		return Keyboard.inlineKeyboard([
			[
				Keyboard.button.callback('📅 Расписание', 'Расписание'),
				Keyboard.button.callback('🎯 Мероприятия', 'Мероприятия'),
				Keyboard.button.callback('📝 Заявления', 'Подать заявление')
			],
			[
				Keyboard.button.callback('❓ Помощь', 'Помощь'),
				Keyboard.button.callback('🔐 Мой токен', 'Мой токен')
			]
		]);
	}

	async sendEvents(ctx, events) {
		if (!events?.length) return;
		let text = '📅 *Предстоящие мероприятия:*\n\n';
		events.forEach((e, i) => {
			text += `${i + 1}. **${e.title}**\n   📝 ${e.description}\n   📍 ${e.location}\n   🕐 ${e.date} в ${e.time}\n\n`;
		});
		await ctx.reply(text, { format: 'markdown' });
	}

	async sendApplicationTypes(ctx, types) {
		if (!types?.length) return;
		let text = '📄 *Доступные типы заявлений:*\n\n';
		types.forEach((t, i) => {
			text += `${i + 1}. **${t.name}**\n   ${t.description}\n\n`;
		});
		const buttons = types.slice(0, 3).map(t => Keyboard.button.callback(t.name, `Подать ${t.name}`));
		await ctx.reply(text, { format: 'markdown', attachments: [Keyboard.inlineKeyboard([buttons])] });
	}

	async sendCommands(ctx, commands) {
		if (!commands?.length) return;
		let text = '📋 *Доступные команды:*\n\n';
		for (const c of commands) text += `**${c.command}** — ${c.description}\n`;
		await ctx.reply(text, { format: 'markdown' });
	}

	async start() {
		console.log('[MAX Bot] Starting bot...');
		console.log('[MAX Bot] Token:', this.token ? `${this.token.slice(0,8)}...` : 'NONE');
		this.bot.start()
			.then(() => console.log('[MAX Bot] ✅ Bot started'))
			.catch(err => console.error('[MAX Bot] ❌ Start failed:', err.message));
	}

	async stop() {
		console.log('[MAX Bot] Stopping bot...');
		try { await this.bot.stop(); console.log('[MAX Bot] Bot stopped'); } catch(e){ console.error('[MAX Bot] Stop error', e); }
	}
}

module.exports = MaxBotService;
