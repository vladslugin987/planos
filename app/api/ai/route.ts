import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'


import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { message, weekOffset, apiKey, existingEvents } = await req.json()
    
    // Try to get API key from: 1) request body, 2) user settings, 3) env variable
    let effectiveApiKey = apiKey || process.env.OPENAI_API_KEY || ''
    
    // If no API key in request, try to get from user settings
    if (!effectiveApiKey) {
      const session = await getServerSession(authOptions)
      if (session?.user?.id) {
        const settings = await prisma.userSettings.findUnique({
          where: { userId: session.user.id },
          select: { openaiApiKey: true }
        })
        effectiveApiKey = settings?.openaiApiKey || ''
      }
    }
    
    if (!effectiveApiKey) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured. Please add it in Settings.' 
      }, { status: 400 })
    }
    
    const openai = new OpenAI({
      apiKey: effectiveApiKey,
    })

    // Calculate current week dates for context
    const now = new Date()
    const currentDayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1 // Monday = 0
    const mondayOfCurrentWeek = new Date(now)
    mondayOfCurrentWeek.setDate(now.getDate() - currentDayOfWeek + (weekOffset * 7))
    
    const weekDates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(mondayOfCurrentWeek)
      date.setDate(mondayOfCurrentWeek.getDate() + i)
      weekDates.push({
        day: i,
        date: date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
        weekday: ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'][i]
      })
    }

    const weekContext = weekDates.map(d => `${d.weekday} (${d.date}) = день ${d.day}`).join('\n')

    // Format existing events for context
    let existingEventsContext = ''
    if (existingEvents && existingEvents.length > 0) {
      existingEventsContext = '\n\nСУЩЕСТВУЮЩИЕ СОБЫТИЯ НА ЭТОЙ НЕДЕЛЕ:\n' + 
        existingEvents.map((e: any) => {
          const dayName = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'][e.day]
          return `- ${dayName} ${e.startTime}:00-${e.endTime}:00: "${e.title}"`
        }).join('\n')
    }

    const currentDayOfWeekName = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'][now.getDay()]
    const currentYear = now.getFullYear()

    const systemPrompt = `Ты умный помощник-планировщик для календаря. 

СЕГОДНЯ: ${now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}, ${currentDayOfWeekName}
ГОД: ${currentYear}

ВАЖНО ПО ДАТАМ:
- Если пользователь указывает конкретную дату (например "22 октября"), вычисли день недели для этой даты в текущем году (${currentYear})
- Используй свои знания о днях недели для конкретных дат
- Проверь, попадает ли дата в текущую просматриваемую неделю (см. ниже)
- Если дата НЕ в текущей просматриваемой неделе - скажи об этом в message и всё равно создай событие с правильным днем недели

Текущая просматриваемая неделя (weekOffset=${weekOffset}):
${weekContext}${existingEventsContext}

Ты можешь обрабатывать сложные запросы с множественными событиями и конфликтами!

ВАЖНО: КОНФЛИКТ - это когда два события ПЕРЕСЕКАЮТСЯ по времени!
- События 13:00-14:00 и 15:00-17:00 НЕ конфликтуют (между ними есть час)
- События 13:00-15:00 и 14:00-16:00 КОНФЛИКТУЮТ (пересекаются с 14:00 до 15:00)
- Формула: Конфликт если (startA < endB) И (startB < endA)

Если пользователь описывает несколько событий И есть РЕАЛЬНЫЕ конфликты расписания:
1. Проанализируй конфликты используя правильную логику пересечения
2. Предложи оптимальное решение
3. Скорректируй время событий чтобы избежать пересечений
4. Приоритизируй "важные" события
5. НЕ говори о конфликтах, если их нет!

Пользователь пишет о событии, тебе нужно извлечь:
- день недели (0=понедельник, 1=вторник, 2=среда, 3=четверг, 4=пятница, 5=суббота, 6=воскресенье)
  * Если указан день недели напрямую ("в понедельник", "во вторник") - используй ближайший такой день из таблицы выше
  * Если указана конкретная дата ("22 октября") - вычисли день недели для этой даты в ${currentYear} году
  * Не обязательно дата должна быть в таблице выше - главное правильно определить день недели!
- время начала: часы (0-24) и минуты (0, 15, 30, 45)
- время окончания: часы (0-24) и минуты (0, 15, 30, 45)
- название события (краткое, 2-4 слова)
- описание (опционально, до 150 символов)

ВАЖНО ПО ЯЗЫКУ:
- СОХРАНЯЙ ЯЗЫК ОРИГИНАЛЬНОГО ЗАПРОСА ПОЛЬЗОВАТЕЛЯ!
- Если пользователь пишет на английском - название, описание И message должны быть на английском
- Если на русском - на русском
- НЕ ПЕРЕВОДИ название события и сообщения на другой язык!

ВАЖНО ПО МИНУТАМ:
- Если указано точное время (13:15, 14:30) - используй эти минуты
- Если только часы (13-14) - startMinute=0, endMinute=0
- Округляй минуты до ближайших: 0, 15, 30, 45 (например 13:20 → 13:15 или 13:30)

Отвечай в JSON формате:
{
  "events": [
    {"day": number, "startTime": number, "startMinute": number, "endTime": number, "endMinute": number, "title": string, "description": string}
  ],
  "message": "Объяснение твоих действий и предложений (опционально)"
}

Примеры:

ПРОСТОЙ ЗАПРОС:
"встреча в понедельник с 14 до 16" 
-> {"events": [{"day": 0, "startTime": 14, "startMinute": 0, "endTime": 16, "endMinute": 0, "title": "Встреча", "description": ""}]}

ЗАПРОС НА АНГЛИЙСКОМ (СОХРАНЯЕМ ЯЗЫК!):
"monday toilet time 10:00 - 12:00"
-> {"events": [{"day": 0, "startTime": 10, "startMinute": 0, "endTime": 12, "endMinute": 0, "title": "Toilet time", "description": ""}]}

ЗАПРОС НА АНГЛИЙСКОМ БЕЗ КОНФЛИКТОВ (НЕ ПРИДУМЫВАЙ НЕСУЩЕСТВУЮЩИХ КОНФЛИКТОВ!):
Существующие: "Homework time" Mon 15:00-17:00
Запрос: "toilet time monday 13:00 - 14:00"
-> {"events": [{"day": 0, "startTime": 13, "startMinute": 0, "endTime": 14, "endMinute": 0, "title": "Toilet time", "description": ""}]}
Правильно: НЕТ message о конфликте, т.к. 13:00-14:00 НЕ пересекается с 15:00-17:00!

ЗАПРОС С МИНУТАМИ:
"в среду лекция с 13:15 до 14:45"
-> {"events": [{"day": 2, "startTime": 13, "startMinute": 15, "endTime": 14, "endMinute": 45, "title": "Лекция", "description": ""}]}

ЗАПРОС С КОНКРЕТНОЙ ДАТОЙ:
"22 октября встреча с врачом с 09:00 по 13:00"
-> Вычисляешь: 22 октября ${currentYear} = вторник (например)
-> {"events": [{"day": 1, "startTime": 9, "startMinute": 0, "endTime": 13, "endMinute": 0, "title": "Встреча с врачом", "description": ""}], "message": "22 октября - это вторник"}

СЛОЖНЫЙ ЗАПРОС С КОНФЛИКТАМИ:
"завтра в 10:00 спорт до 12:00, но в 11:00 важная встреча до 13:00, и в 13:15 еще одна встреча"
-> Анализ: спорт 10-12 конфликтует с важной встречей 11-13
-> Решение: сократить спорт до 11:00, т.к. встреча важная
-> {"events": [
     {"day": 1, "startTime": 10, "startMinute": 0, "endTime": 11, "endMinute": 0, "title": "Спорт", "description": "Сокращено"},
     {"day": 1, "startTime": 11, "startMinute": 0, "endTime": 13, "endMinute": 0, "title": "Важная встреча", "description": "Приоритет"},
     {"day": 1, "startTime": 13, "startMinute": 15, "endTime": 14, "endMinute": 15, "title": "Встреча", "description": ""}
   ],
   "message": "Я скорректировал расписание: спорт сокращен до 11:00, чтобы не пропустить важную встречу."
  }

ОЧЕНЬ СЛОЖНЫЙ ЗАПРОС С ПЛАНИРОВАНИЕМ:
"завтра с 9 делаю домашку 3 часа, потом лекция 12:30-14:00, после обеда курсовая 2 часа, футбол 16-18, ужин в 19:00, и эссе на час. Реально ли?"
-> Интерпретация неопределенностей:
   - "после обеда" = примерно 14:30-15:00 (после лекции)
   - "ужин в 19:00" = 19:00-20:00 (предполагаем 1 час)
   - эссе - нужно найти время
-> Расчет: 9-12 домашка, 12:30-14:00 лекция, 14:30-16:30 курсовая, 16-18 футбол, 19-20 ужин = занято 8.5 часов
-> Эссе (1 час) можно вставить: 18:00-19:00 (между футболом и ужином)
-> {"events": [
     {"day": 2, "startTime": 9, "startMinute": 0, "endTime": 12, "endMinute": 0, "title": "Домашка по программированию", "description": ""},
     {"day": 2, "startTime": 12, "startMinute": 30, "endTime": 14, "endMinute": 0, "title": "Онлайн-лекция", "description": ""},
     {"day": 2, "startTime": 14, "startMinute": 30, "endTime": 16, "endMinute": 30, "title": "Курсовая", "description": ""},
     {"day": 2, "startTime": 16, "startMinute": 0, "endTime": 18, "endMinute": 0, "title": "Футбол", "description": ""},
     {"day": 2, "startTime": 18, "startMinute": 0, "endTime": 19, "endMinute": 0, "title": "Эссе", "description": ""},
     {"day": 2, "startTime": 19, "startMinute": 0, "endTime": 20, "endMinute": 0, "title": "Семейный ужин", "description": ""}
   ],
   "message": "Да, реально! Я распланировал день: домашка утром, лекция в обед, курсовая после лекции, футбол, эссе перед ужином, ужин вечером. Всё уместилось!"
  }

РАБОТА С НЕОПРЕДЕЛЕННОСТЯМИ:
- "после обеда" = 14:00-15:00 (или после предыдущего события)
- "вечером" = 18:00-20:00
- "утром" = 8:00-10:00
- "днем" = 12:00-15:00
- Если событие без времени окончания и это еда - добавь 1 час
- Если задача без конкретного времени - найди свободное окно подходящей длительности

УЧЕТ СУЩЕСТВУЮЩИХ СОБЫТИЙ:
Если в существующих событиях уже есть что-то запланированное - учитывай это при добавлении новых!

Если запрос слишком сложный или неоднозначный - всё равно попытайся создать события с разумными предположениями и объясни в message.
Если совсем не можешь распарсить - верни {"events": [], "message": "Запрос слишком неоднозначен. Попробуйте указать конкретное время для каждого события."}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.5, // Increased for better creativity in complex queries
      max_tokens: 1000, // Allow longer responses for complex planning
    })

    const response = completion.choices[0]?.message?.content?.trim()
    
    if (!response) {
      return NextResponse.json({ events: [], message: null })
    }

    // try parse json
    try {
      const result = JSON.parse(response)
      
      // Normalize events: add default minutes if missing
      const normalizeEvent = (event: any) => ({
        ...event,
        startMinute: event.startMinute ?? 0,
        endMinute: event.endMinute ?? 0
      })
      
      // Handle new format with events array
      if (result.events && Array.isArray(result.events)) {
        const normalizedEvents = result.events
          .filter((e: any) => typeof e.day === 'number' && e.startTime !== undefined && e.endTime !== undefined)
          .map(normalizeEvent)
        
        return NextResponse.json({ 
          events: normalizedEvents,
          message: result.message || null
        })
      }
      
      // Handle old format (single event) for backwards compatibility
      if (result && typeof result.day === 'number' && result.startTime !== undefined && result.endTime !== undefined) {
        return NextResponse.json({ 
          events: [normalizeEvent(result)],
          message: null
        })
      }
    } catch (e) {
      console.log('parse error:', e, 'response:', response)
    }

    return NextResponse.json({ events: [], message: null })

  } catch (error) {
    console.error('AI error:', error)
    return NextResponse.json({ error: 'AI failed' }, { status: 500 })
  }
}

