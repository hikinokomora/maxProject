// Consolidated: real implementation moved here (from maxBotService2.js)
const { Bot, Keyboard } = require('@maxhub/max-bot-api');
const chatService = require('./chatService');
const applicationsService = require('./applicationsService');
const authService = require('./authService');
const prisma = require('./db');
const pdfService = require('./pdfService');
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
			const welcome = `👋 **Добро пожаловать в чат-бот университета!**\n\n` +
				`Я ваш персональный помощник, который поможет вам с:\n\n` +
				`📅 **Расписанием занятий** — узнайте когда и где проходят пары\n` +
				`🎯 **Мероприятиями** — не пропустите важные события\n` +
				`📝 **Заявлениями** — быстрая подача и отслеживание статуса\n` +
				`👤 **Профилем** — сохраните данные для упрощённой работы\n` +
				`❓ **Помощью** — получите ответы на вопросы\n\n` +
				`💡 Все даты и время указаны в московском часовом поясе (МСК, UTC+3)\n\n` +
				`✨ Выберите действие на клавиатуре ниже:`;
			await ctx.reply(welcome, { format: 'markdown', attachments: [this.buildMainKeyboardWithApp()] });
		});

		this.bot.on('message_created', async (ctx) => {
			try {
				const text = ctx.message?.body?.text || '';
				const userId = ctx.user?.user_id;
				const session = this.sessions.get(userId);

				if (session) {
					if (session.mode === 'application') return this.handleApplicationFlow(ctx, text, session);
					if (session.mode === 'status') return this.handleStatusFlow(ctx, text, session);
					if (session.mode === 'profile') return this.handleProfileFlow(ctx, text, session);
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
				const maxUserId = ctx.user?.user_id;
				
				// Мой профиль
				if (payload === 'Мой профиль' || payload === '� Мой профиль') {
					return this.showProfile(ctx);
				}

				// Редактировать профиль
				if (payload === 'Редактировать профиль') {
					this.sessions.set(userId, { mode: 'profile', step: 'name' });
					return ctx.reply('Введите ваше полное ФИО:');
				}

				// Получить справку об обучении
				if (payload === 'Получить справку') {
					let user = await authService.findOrCreateByMaxUserId(maxUserId, { 
						name: ctx.user?.full_name || `User ${maxUserId}`, 
						email: `user_${maxUserId}@max.local`, 
						role: 'STUDENT' 
					});
					
					const profile = await prisma.studentProfile.findUnique({
						where: { userId: user.id },
						include: { institute: true, direction: true, group: true }
					});
					
					if (!profile) {
						return ctx.reply('⚠️ Сначала заполните профиль студента.');
					}
					
					await ctx.reply('⏳ Генерирую справку...');
					
					const result = await pdfService.generateStudyCertificate({
						userId: user.id,
						name: user.name,
						institute: profile.institute?.name,
						direction: profile.direction?.name,
						group: profile.group?.name,
						course: profile.course,
						paid: profile.paid
					});
					
					if (result.success) {
						await ctx.reply(
							`✅ Справка об обучении готова!\n\n` +
							`📄 Файл: ${result.filename}\n\n` +
							`⚠️ Внимание: Это демо-версия справки. ` +
							`Для получения официальной справки обратитесь в деканат.`
						);
						// TODO: Отправить файл когда MAX API будет поддерживать отправку файлов
					} else {
						await ctx.reply('❌ Ошибка генерации справки. Попробуйте позже.');
					}
					return;
				}

				// Мои заявления
				if (payload === 'Мои заявления') {
					// Получаем профиль пользователя
					let user = await authService.findOrCreateByMaxUserId(maxUserId, { 
						name: ctx.user?.full_name || `User ${maxUserId}`, 
						email: `user_${maxUserId}@max.local`, 
						role: 'STUDENT' 
					});
					
					if (!user) return ctx.reply('Ошибка получения профиля. Попробуйте позже.');
					
					// Ищем заявления по userId
					const result = await applicationsService.getApplicationsByUserId(user.id);
					console.log(`[MAX Bot] Applications for user ${user.id}:`, result);
					
					if (!result.success) {
						await ctx.reply(`Не удалось получить список: ${result.message}`);
					} else if (!result.data || result.data.length === 0) {
						await ctx.reply('У вас пока нет заявлений. Вы можете подать новое через «Подать заявление».');
					} else {
						const listText = this.formatApplicationsList(result.data);
						await ctx.reply(listText, { format: 'markdown' });
					}
					return;
				}

				// Статус заявления
				if (payload === 'Статус заявления') {
					this.sessions.set(userId, { mode: 'status', step: 'askId' });
					return ctx.reply('Укажите номер заявления (например: 12)');
				}

				// Подать заявление
				if (payload === 'Подать заявление' || payload === '📝 Заявления') {
					return this.sendApplicationTypes(ctx, universityConfig.applicationTypes);
				}

				// Подать конкретное заявление
				if (payload?.startsWith('Подать ')) {
					const name = payload.replace('Подать ', '').trim();
					const type = universityConfig.applicationTypes.find(t => t.name.toLowerCase() === name.toLowerCase());
					if (!type) {
						await ctx.reply('Тип не распознан, выберите из списка.');
						return this.sendApplicationTypes(ctx, universityConfig.applicationTypes);
					}
					
					// Получаем профиль для автозаполнения
					let user = await authService.findOrCreateByMaxUserId(maxUserId, { 
						name: ctx.user?.full_name || `User ${maxUserId}`, 
						email: `user_${maxUserId}@max.local`, 
						role: 'STUDENT' 
					});
					
					if (!user) {
						return ctx.reply('⚠️ Ошибка получения профиля. Попробуйте позже.');
					}
					
					// Проверяем, заполнен ли профиль студента
					const profile = await prisma.studentProfile.findUnique({ where: { userId: user.id } });
					
					if (!profile || !profile.groupId) {
						await ctx.reply('⚠️ Пожалуйста, сначала заполните ваш профиль (группа, курс и т.д.).\nНажмите «Мой профиль» → «Редактировать профиль»');
						return;
					}
					
					this.sessions.set(userId, { 
						mode: 'application', 
						step: 'description',
						data: { 
							type: type.id, 
							typeName: type.name,
							studentName: user.name,
							userId: user.id
						} 
					});
					return ctx.reply(`Заявление «${type.name}».\n\nКратко опишите, что требуется (или отправьте «-» чтобы пропустить):`);
				}

				// Выбор факультета (уже не используется, т.к. берём из профиля)
				if (payload?.startsWith('dep:')) {
					const dep = payload.slice(4);
					const session = this.sessions.get(userId);
					if (session?.mode === 'application' && session.step === 'department') {
						session.data.department = dep;
						session.step = 'email';
						return ctx.reply('Укажите ваш email для уведомлений:');
					}
				}

				// Остальные кнопки - передаём в chatService
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

		// Упрощённый флоу - только описание, всё остальное из профиля
		if (session.step === 'description') {
			session.data.description = value === '-' ? '' : value;
			
			console.log('[MAX Bot] Creating application with data:', session.data);
			
			// Получаем полный профиль студента
			const profile = await prisma.studentProfile.findUnique({
				where: { userId: session.data.userId },
				include: { 
					group: true, 
					institute: true,
					direction: true,
					user: true
				}
			});
			
			if (!profile || !profile.group) {
				await ctx.reply('⚠️ Профиль не найден. Заполните профиль через «Мой профиль».');
				this.sessions.delete(userId);
				return;
			}

			const result = await applicationsService.createApplication({
				type: session.data.type,
				typeName: session.data.typeName,
				studentName: profile.user.name,
				studentId: profile.group.name, // Используем группу как идентификатор
				department: profile.institute?.name || profile.direction?.name || 'Не указано',
				description: session.data.description,
				email: profile.user.email,
				userId: session.data.userId
			});
			
			console.log('[MAX Bot] Application creation result:', result);
			
			if (!result.success) {
				await ctx.reply(`Не удалось создать заявление: ${result.message}`);
			} else {
				// Отправляем уведомление создателю
				await ctx.reply(
					`✅ Заявление №${result.data.id} создано!\n\n` +
					`• Тип: ${result.data.typeName}\n` +
					`• ФИО: ${result.data.studentName}\n` +
					`• Группа: ${result.data.studentId}\n` +
					`• Подразделение: ${result.data.department}\n\n` +
					`Вы получите уведомление, когда статус изменится.`
				);
				
				// TODO: Уведомление админам/преподавателям о новом заявлении
				console.log(`[MAX Bot] New application #${result.data.id} from user ${profile.user.name}`);
			}
			
			this.sessions.delete(userId);
			const keyboard = this.buildKeyboard(['Мои заявления', 'Расписание', 'Мероприятия', 'Подать заявление']);
			return ctx.reply('Чем ещё могу помочь?', { attachments: [keyboard] });
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
			console.log(`[MAX Bot] Looking for applications with studentId: "${studentId}"`);
			const result = await applicationsService.getApplicationsByStudentId(studentId);
			console.log(`[MAX Bot] Applications result:`, result);
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
		
		// Эмодзи-статусы
		const statusEmoji = {
			'pending': '🕐 В обработке',
			'approved': '✅ Одобрено',
			'rejected': '❌ Отклонено',
			'processing': '⚙️ В работе'
		};
		
		const createdDate = new Date(a.createdAt);
		// Конвертируем в московское время (UTC+3)
		const moscowDate = new Date(createdDate.getTime() + (3 * 60 * 60 * 1000));
		
		const text = [
			`📝 *Заявление №${a.id}*\n`,
			`Статус: ${statusEmoji[a.status] || a.status}`,
			`Тип: ${a.typeName}`,
			`ФИО: ${a.studentName}`,
			`Группа: ${a.studentId}`,
			a.department ? `Подразделение: ${a.department}` : null,
			a.description ? `\n💬 Описание: ${a.description}` : null,
			`\n📅 Создано: ${moscowDate.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`
		].filter(Boolean).join('\n');
		await ctx.reply(text, { format: 'markdown' });
	}

	formatApplicationsList(list) {
		const statusEmoji = {
			'pending': '🕐',
			'approved': '✅',
			'rejected': '❌',
			'processing': '⚙️'
		};
		
		let text = '📄 *Ваши заявления:*\n';
		for (const a of list) {
			const emoji = statusEmoji[a.status] || '📋';
			text += `\n${emoji} №${a.id}: ${a.typeName}`;
		}
		text += '\n\n💡 Для подробностей: Статус заявления <ID>\n(например: Статус заявления 12)';
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
				Keyboard.button.callback('👤 Мой профиль', 'Мой профиль'),
				Keyboard.button.callback('❓ Помощь', 'Помощь')
			]
		]);
	}

	async sendEvents(ctx, events) {
		if (!events?.length) return;
		let text = '🎯 *Предстоящие мероприятия:*\n';
		events.forEach((e, i) => {
			// Форматируем дату для UTC+3
			const eventDate = new Date(e.date);
			const dateStr = eventDate.toLocaleDateString('ru-RU', { 
				day: '2-digit', 
				month: 'long',
				timeZone: 'Europe/Moscow'
			});
			
			text += `\n${i + 1}. 📌 **${e.title}**`;
			text += `\n   📝 ${e.description}`;
			text += `\n   📍 ${e.location}`;
			text += `\n   🕐 ${dateStr} в ${e.time} (МСК)`;
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

	async showProfile(ctx) {
		const maxUserId = ctx.user?.user_id;
		
		// Получаем или создаём пользователя
		let user = await authService.findOrCreateByMaxUserId(maxUserId, { 
			name: ctx.user?.full_name || `User ${maxUserId}`, 
			email: `user_${maxUserId}@max.local`, 
			role: 'STUDENT' 
		});
		
		if (!user) return ctx.reply('Ошибка получения профиля.');
		
		// Получаем профиль студента
		const profile = await prisma.studentProfile.findUnique({
			where: { userId: user.id },
			include: {
				institute: true,
				direction: true,
				group: true,
				debts: { where: { closed: false } }
			}
		});
		
		if (!profile) {
			await ctx.reply(
				`👤 *Ваш профиль*\n\n` +
				`ФИО: ${user.name}\n` +
				`Email: ${user.email}\n\n` +
				`⚠️ Профиль студента не заполнен.\nЗаполните его для упрощённой подачи заявлений.`,
				{ format: 'markdown', attachments: [Keyboard.inlineKeyboard([[Keyboard.button.callback('Заполнить профиль', 'Редактировать профиль')]])] }
			);
			return;
		}
		
		// Получаем статистику по заявлениям
		const applications = await prisma.application.findMany({
			where: { userId: user.id }
		});
		
		const stats = {
			total: applications.length,
			pending: applications.filter(a => a.status === 'pending').length,
			approved: applications.filter(a => a.status === 'approved').length,
			rejected: applications.filter(a => a.status === 'rejected').length
		};
		
		const text = [
			`👤 *Ваш профиль*\n`,
			`ФИО: ${user.name}`,
			`Email: ${user.email}`,
			`\n🎓 *Учебная информация:*`,
			`Институт: ${profile.institute?.name || 'не указан'}`,
			`Направление: ${profile.direction?.name || 'не указано'}`,
			`Группа: ${profile.group?.name || 'не указана'}`,
			`Курс: ${profile.course || 'не указан'}`,
			profile.debts && profile.debts.length > 0 ? `\n⚠️ *Академические долги:*` : null,
			...profile.debts?.map(d => `• ${d.subject}${d.description ? ' — ' + d.description : ''}`) || [],
			stats.total > 0 ? `\n📊 *Статистика заявлений:*` : null,
			stats.total > 0 ? `Всего: ${stats.total}` : null,
			stats.pending > 0 ? `🕐 В обработке: ${stats.pending}` : null,
			stats.approved > 0 ? `✅ Одобрено: ${stats.approved}` : null,
			stats.rejected > 0 ? `❌ Отклонено: ${stats.rejected}` : null
		].filter(Boolean).join('\n');
		
		await ctx.reply(text, {
			format: 'markdown',
			attachments: [Keyboard.inlineKeyboard([
				[Keyboard.button.callback('Редактировать', 'Редактировать профиль')],
				[Keyboard.button.callback('📄 Справка об обучении', 'Получить справку')]
			])]
		});
	}

	async handleProfileFlow(ctx, text, session) {
		const userId = ctx.user?.user_id;
		const maxUserId = ctx.user?.user_id;
		const value = text?.trim();

		// Получаем пользователя
		let user = await authService.findOrCreateByMaxUserId(maxUserId, { 
			name: ctx.user?.full_name || `User ${maxUserId}`, 
			email: `user_${maxUserId}@max.local`, 
			role: 'STUDENT' 
		});
		
		if (!user) {
			await ctx.reply('Ошибка авторизации.');
			this.sessions.delete(userId);
			return;
		}

		switch (session.step) {
			case 'name':
				// Обновляем имя пользователя
				await prisma.user.update({ where: { id: user.id }, data: { name: value } });
				session.step = 'group';
				
				// Получаем список групп
				const groups = await prisma.group.findMany({ include: { direction: { include: { institute: true } } } });
				if (groups.length === 0) {
					await ctx.reply('⚠️ В системе нет групп. Обратитесь к администратору.');
					this.sessions.delete(userId);
					return;
				}
				
				session.data = { groups };
				let groupsText = '📚 Выберите вашу группу:\n\n';
				groups.forEach((g, i) => {
					groupsText += `${i + 1}. ${g.name} (${g.direction.name})\n`;
				});
				groupsText += '\nВведите номер группы (например: 1)';
				return ctx.reply(groupsText);
				
			case 'group': {
				const idx = parseInt(value, 10) - 1;
				if (isNaN(idx) || idx < 0 || idx >= session.data.groups.length) {
					return ctx.reply('Некорректный номер. Введите число от 1 до ' + session.data.groups.length);
				}
				
				const selectedGroup = session.data.groups[idx];
				
				// Создаём или обновляем профиль студента
				await prisma.studentProfile.upsert({
					where: { userId: user.id },
					create: {
						userId: user.id,
						studyType: 'BACHELOR',
						instituteId: selectedGroup.direction.instituteId,
						directionId: selectedGroup.directionId,
						groupId: selectedGroup.id,
						course: selectedGroup.course,
						paid: false
					},
					update: {
						instituteId: selectedGroup.direction.instituteId,
						directionId: selectedGroup.directionId,
						groupId: selectedGroup.id,
						course: selectedGroup.course
					}
				});
				
				await ctx.reply(
					`✅ Профиль обновлён!\n\n` +
					`Группа: ${selectedGroup.name}\n` +
					`Направление: ${selectedGroup.direction.name}\n` +
					`Курс: ${selectedGroup.course}`
				);
				
				this.sessions.delete(userId);
				const keyboard = this.buildMainKeyboardWithApp();
				return ctx.reply('Теперь вы можете подавать заявления!', { attachments: [keyboard] });
			}
		}
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
