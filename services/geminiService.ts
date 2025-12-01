import { Transaction, AIInsight } from "../types.ts";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "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";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

interface OpenRouterMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const callOpenRouter = async (messages: OpenRouterMessage[]): Promise<string> => {
  try {
    const response = await fetch(OPENROUTER_BASE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://coinkeep.app",
        "X-Title": "CoinKeep"
      },
      body: JSON.stringify({
        model: "grok-4.1-fast",
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("OpenRouter API call error:", error);
    throw error;
  }
};

export const analyzeFinances = async (transactions: Transaction[], totalBalance: number): Promise<AIInsight[]> => {
  // If no data, return welcome message without calling API
  if (transactions.length === 0) {
    return [
      {
        title: "Добро пожаловать в CoinKeep!",
        description: "Начните добавлять свои доходы и расходы, чтобы получить персональные советы от ИИ.",
        type: "info"
      },
      {
        title: "Совет",
        description: "Вы можете добавить регулярные платежи во вкладке 'Подписки', чтобы отслеживать ежемесячные списания.",
        type: "success"
      }
    ];
  }

  try {
    const systemPrompt = `Ты опытный финансовый советник. Отвечай на русском языке. Будь краток, профессионален и позитивен.
    
Ты должен ответить JSON массивом ровно в таком формате (без markdown, только валидный JSON):
[
  {
    "title": "Заголовок совета",
    "description": "Подробное описание",
    "type": "warning|success|info"
  }
]

Верни ровно 3 совета.`;

    const userPrompt = `Проанализируй следующие финансовые данные и предоставь 3 конкретных, полезных совета или наблюдения на Русском языке.
Сфокусируйся на привычках трат, возможностях для экономии или аномалиях.

Текущий баланс: ${totalBalance} руб.
Последние транзакции: ${JSON.stringify(transactions.slice(0, 15))}

Верни только JSON массив, без пояснений.`;

    const messages: OpenRouterMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    const response = await callOpenRouter(messages);
    
    // Parse JSON from response (Grok может обернуть в markdown блоки)
    let jsonString = response.trim();
    if (jsonString.startsWith("```json")) {
      jsonString = jsonString.replace(/^```json\n/, "").replace(/\n```$/, "");
    } else if (jsonString.startsWith("```")) {
      jsonString = jsonString.replace(/^```\n/, "").replace(/\n```$/, "");
    }
    
    const insights = JSON.parse(jsonString) as AIInsight[];
    return insights;
  } catch (error) {
    console.error("Error analyzing finances:", error);
    return [
      {
        title: "Анализ недоступен",
        description: "Не удалось сгенерировать советы. Пожалуйста, проверьте API ключ OpenRouter.",
        type: "info"
      }
    ];
  }
};

export const chatWithAdvisor = async (message: string, contextData: string): Promise<string> => {
  try {
    const systemPrompt = "Ты полезный финансовый ассистент в приложении CoinKeep. Отвечай на вопросы кратко, опираясь на предоставленный контекст. Отвечай всегда на русском языке.";
    
    const userPrompt = `Контекст данных пользователя: ${contextData}\n\nВопрос пользователя: ${message}`;
    
    const messages: OpenRouterMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];

    const response = await callOpenRouter(messages);
    return response || "Извините, я не смог обработать этот запрос.";
  } catch (error) {
    console.error("Chat error:", error);
    return "Ошибка связи с финансовым советником.";
  }
};
