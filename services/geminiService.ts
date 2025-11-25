import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, AIInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    // We will ask Gemini to analyze the transaction data and return structured JSON insights
    const prompt = `
      Проанализируй следующие финансовые данные и предоставь 3 конкретных, полезных совета или наблюдения на Русском языке.
      Сфокусируйся на привычках трат, возможностях для экономии или аномалиях.
      
      Текущий баланс: ${totalBalance} руб.
      Последние транзакции: ${JSON.stringify(transactions.slice(0, 15))}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Ты опытный финансовый советник. Отвечай на русском языке. Будь краток, профессионален и позитивен.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["warning", "success", "info"] }
            },
            required: ["title", "description", "type"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIInsight[];
    }
    return [];
  } catch (error) {
    console.error("Error analyzing finances:", error);
    return [
      {
        title: "Анализ недоступен",
        description: "Не удалось сгенерировать советы. Пожалуйста, проверьте API ключ.",
        type: "info"
      }
    ];
  }
};

export const chatWithAdvisor = async (message: string, contextData: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Контекст данных пользователя: ${contextData}\n\nВопрос пользователя: ${message}`,
      config: {
        systemInstruction: "Ты полезный финансовый ассистент в приложении CoinKeep. Отвечай на вопросы кратко, опираясь на предоставленный контекст. Отвечай всегда на русском языке.",
      }
    });
    return response.text || "Извините, я не смог обработать этот запрос.";
  } catch (error) {
    console.error("Chat error:", error);
    return "Ошибка связи с финансовым советником.";
  }
};