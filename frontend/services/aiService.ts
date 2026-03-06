import { API_BASE_URL } from './apiService';

type QuestionType = 'location' | 'date' | 'weather' | 'photo' | 'description';

interface QuestionContext {
  region?: string; // The province/region clicked on map
  city?: string;
  spot_name?: string;
  date?: string;
  weather?: string;
}

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
  try {
    const response = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        step: type,
        ...context
      }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data.message;
  } catch (error) {
    console.warn("AI generation failed, using fallback:", error);
    return getRandomFallback(type, context);
  }
};

interface LocationResult {
  city: string;
  spot_name: string;
}

export const resolveLocation = async (
  locationInput: string,
  regionContext: string
): Promise<LocationResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/resolve_location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        location_input: locationInput,
        region_context: regionContext
      }),
    });

    if (!response.ok) {
      throw new Error('Location resolution failed');
    }

    return await response.json();
  } catch (error) {
    console.error("AI location resolution failed:", error);
    return { city: '云深不知处', spot_name: locationInput };
  }
}
