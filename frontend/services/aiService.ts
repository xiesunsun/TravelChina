
import { GoogleGenAI } from "@google/genai";

// Initialize AI client if key is available (Client-side safe check)
const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

type QuestionType = 'location' | 'date' | 'weather' | 'photo' | 'description';

interface QuestionContext {
  region?: string; // The province/region clicked on map
  city?: string;
  date?: string;
  weather?: string;
}

const SYSTEM_INSTRUCTION = `
你是一位温婉、知性且充满生活情趣的女性旅行博主，也是用户最好的旅行搭子。
你的语气要自然、亲切、像一位老朋友聊天，不要使用翻译腔，也不要过于古板（不要满口“吾”、“汝”、“甚好”）。
你可以适当使用一点点诗意的表达，但主体要是现代汉语，让人感觉舒服、放松。
你的任务是引导用户回忆并记录旅行细节。
每次只问一个简短的问题，字数控制在30字以内。
`;

// Fallback messages: Modern, warm, friendly
const FALLBACK_MESSAGES: Record<QuestionType, string[]> = {
  location: [
    "哇，{region}可是个好地方！这次你具体去了哪儿玩呀？",
    "我也很喜欢{region}的风土人情。能告诉我你停留在哪座城市吗？",
    "这片土地总是藏着惊喜。这次你的目的地是哪里呢？",
    "听起来很棒！具体的打卡点是哪里，快跟我说说。"
  ],
  date: [
    "这段美好的回忆发生在什么时候呢？",
    "还是那句老话，择日不如撞日。你是哪天去的呀？",
    "那个特别的日子，你还记得是哪一天吗？",
    "我想把这个时间也悄悄记下来，是哪一天呢？"
  ],
  weather: [
    "那天的天气怎么样？是阳光明媚，还是烟雨蒙蒙？",
    "我还想知道，那天抬头看天，是什么样子的？",
    "好的天气会有好心情，那天是晴天还是雨天呢？",
    "当时的天色如何？有没有给你留下特别的印象？"
  ],
  photo: [
    "有没有拍到什么好看的照片？让我过过眼瘾呗。",
    "无图无真相呀，快把私藏的美照分享一张出来。",
    "那个瞬间一定很美吧，有没有照片能让我看看？",
    "要是有一张当时的照片就更完美了，有拍吗？"
  ],
  description: [
    "看着这些，你现在心里想到了什么？随便写两句吧。",
    "此情此景，有没有什么特别的感触想记下来的？",
    "关于这趟旅程，还有什么有趣的小故事吗？",
    "最后，给这段回忆加个注脚吧，写什么都行。"
  ]
};

function getRandomFallback(type: QuestionType, context: QuestionContext): string {
  const templates = FALLBACK_MESSAGES[type];
  const template = templates[Math.floor(Math.random() * templates.length)];

  // Simple variable replacement
  let result = template;
  if (context.region) result = result.replace(/{region}/g, context.region);
  else result = result.replace(/{region}/g, '那里');

  if (context.city) result = result.replace(/{city}/g, context.city);

  return result;
}

export const generateQuestion = async (
  type: QuestionType,
  context: QuestionContext
): Promise<string> => {
  // If no AI client, return fallback immediately
  if (!ai) {
    return getRandomFallback(type, context);
  }

  try {
    const model = 'gemini-2.5-flash-lite';
    let prompt = '';

    switch (type) {
      case 'location':
        prompt = `用户点击了地图上的"${context.region || '某个地方'}"。作为朋友，请自然地询问用户具体去了哪个城市或景点。不要太书面。`;
        break;
      case 'date':
        prompt = `用户去了"${context.city}"。请像朋友一样随口问问是哪天去的。`;
        break;
      case 'weather':
        prompt = `用户在"${context.date}"去了"${context.city}"。请温柔地询问那天天气如何。`;
        break;
      case 'photo':
        prompt = `请用期待的语气询问用户是否有关于"${context.city}"的照片愿意分享。`;
        break;
      case 'description':
        prompt = `用户分享了照片（或没分享）。请引导用户写下一段简短的随笔，语气要感性一点。`;
        break;
    }

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 1.1,
      }
    });

    const text = response.text;
    return text || getRandomFallback(type, context);
  } catch (error) {
    console.warn("AI generation failed, using fallback:", error);
    return getRandomFallback(type, context);
  }
};
