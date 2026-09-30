import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI SDK dynamically so runtime secret injection is picked up immediately
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Fallback briefing generator
function generateFallbackBriefing(data: any) {
  const { currentHour, windSpeedKt, tideLevel, surgeMaxM, landfallLocation, highRiskDistricts, sheltersAtRisk } = data;
  const isSevere = windSpeedKt >= 115;
  const cat = windSpeedKt >= 137 ? 'Extremely Severe Cyclonic Storm (ESCS)' : windSpeedKt >= 90 ? 'Very Severe Cyclonic Storm (VSCS)' : 'Severe Cyclonic Storm (SCS)';
  
  return {
    summary: `At ${currentHour >= 0 ? `T+${currentHour}h` : `T${currentHour}h`} prior to landfall, Cyclone Fani equivalent is tracking towards ${landfallLocation || 'Puri-Konark coast'} as an ${cat} packing sustained winds of ${windSpeedKt} knots (${Math.round(windSpeedKt * 1.852)} km/h). Peak astronomical tide is ${tideLevel} with computed storm surge reaching up to ${surgeMaxM.toFixed(1)}m in vulnerable coastal lowlands. Anticipatory evacuation and asset protection must be prioritized across ${highRiskDistricts.join(', ')}.`,
    confidence: currentHour < -24 ? 89 : 96,
    confidenceLabel: currentHour < -24 ? 'High Confidence' : 'Very High Confidence',
    evidenceBullets: [
      `Sustained wind field: ${windSpeedKt} kt with gust potential up to ${Math.round(windSpeedKt * 1.25)} kt within 45km radius of eye wall.`,
      `Peak surge depth: ${surgeMaxM.toFixed(1)}m modelled along coastal estuaries of Puri, Jagatsinghpur, and Chilika mouth.`,
      `Critical infrastructure alert: ${sheltersAtRisk.length > 0 ? `${sheltersAtRisk.length} cyclone shelters flagged for flooding or over-capacity.` : 'All monitored shelters currently outside 2m surge zone.'}`,
      `Lead time window: ${Math.abs(currentHour)} hours available before onset of gale-force winds (>40 kt) along coastal corridors.`
    ]
  };
}

// 1. Briefing Endpoint
app.post('/api/gemini/briefing', async (req, res) => {
  try {
    const inputData = req.body;
    const ai = getAIClient();
    if (!ai) {
      return res.json(generateFallbackBriefing(inputData));
    }

    const prompt = `You are the lead meteorologist & disaster risk officer for Odisha State Disaster Management Authority (OSDMA).
Based SOLELY on the provided cyclone simulation data, produce a crisp, professional decision-support briefing.

DATA PROVIDED:
${JSON.stringify(inputData, null, 2)}

INSTRUCTIONS:
1. Return a valid JSON object matching this schema:
{
  "summary": "2-3 sentences plain-language situation summary explaining the immediate threat, landfall timing, and peak hazards.",
  "confidence": <integer number 75-99 indicating model confidence based on forecast lead time>,
  "confidenceLabel": "High Confidence" | "Very High Confidence" | "Moderate Confidence",
  "evidenceBullets": [
    "Evidence bullet 1 with concrete metrics from data",
    "Evidence bullet 2 with concrete metrics from data",
    "Evidence bullet 3 with concrete metrics from data",
    "Evidence bullet 4 with concrete metrics from data"
  ]
}
2. Use ONLY the data provided. Do NOT hallucinate unmentioned cities or facts.
3. Be direct, authoritative, and operational for emergency incident commanders.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return res.json(parsed);
    }
    return res.json(generateFallbackBriefing(inputData));
  } catch (error: any) {
    console.error('Error generating briefing with Gemini:', error?.message || error);
    return res.json(generateFallbackBriefing(req.body));
  }
});

// Fallback evacuation copilot generator
function generateFallbackEvacuation(data: any) {
  const { currentHour, windSpeedKt, floodedRoads, floodedShelters, safeShelters } = data;
  
  const actions = [
    {
      id: 'act-1',
      priority: 'CRITICAL',
      target: 'Puri Coastal Wards 1 to 8 & Pentakota Fishermen Colony',
      action: 'Mandatory evacuation of 42,000 residents within 2.5km of shoreline.',
      deadline: `${Math.max(2, Math.abs(currentHour) - 8)} hours before landfall (Target: 18:00 IST)`,
      route: floodedRoads.includes('Marine Drive') ? 'Use inland NH-316 via Malatipatpur (Marine Drive is BLOCKED by surge)' : 'NH-316 & Jagannath Sadak corridor',
      assignedShelters: 'Puri District Multipurpose Shelters #3, #4, and Pipili High School Shelter',
      reasoning: 'Projected storm surge > 2.2m will breach traditional sea dykes.'
    },
    {
      id: 'act-2',
      priority: 'HIGH',
      target: 'Chilika Satapada & Brahmagiri Lagoon Villages',
      action: 'Relocate low-lying island settlements using mechanized NDRF Zodiac boats before wind speeds surpass 45 kt.',
      deadline: `${Math.max(4, Math.abs(currentHour) - 12)} hours before landfall`,
      route: 'State Highway 13 inland connector to Brahmagiri Higher Secondary MCS',
      assignedShelters: 'Brahmagiri MCS #1 and Rebananuagaon Shelter',
      reasoning: 'Lagoon water ingress combined with 1.8m surge will cut off road links.'
    },
    {
      id: 'act-3',
      priority: 'HIGH',
      target: 'Paradip Port & Ersama Block (Jagatsinghpur)',
      action: 'Order immediate halt to cargo handling, de-berth non-essential vessels, and move 18,500 slum dwellers to concrete cyclone shelters.',
      deadline: 'T-18h operational cutoff',
      route: 'SH-12 inland link towards Jagatsinghpur town',
      assignedShelters: 'Paradip Multi-Purpose Cyclone Shelter #2 & #4',
      reasoning: 'Gale winds (>100 kt) will cause massive structural damage to tin/asbestos housing.'
    },
    {
      id: 'act-4',
      priority: 'MEDIUM',
      target: 'Power Substation & Hospital Preparedness',
      action: 'Isolate vulnerable coastal 33kV feeders; pre-position 500kVA diesel backup generators at Puri DHH and SCB Medical Cuttack.',
      deadline: 'T-12h cutoff',
      route: 'All-weather NH corridors',
      assignedShelters: 'N/A (Critical Lifeline Asset)',
      reasoning: 'Pre-emptive shutdown prevents transformer explosion and electrocution hazard.'
    }
  ];

  return {
    actions,
    shelterAlerts: floodedShelters.map((s: any) => ({
      name: s.name,
      issue: 'Inundation threat / Plinth breach (>1.2m water)',
      capacity: s.capacity,
      rerouteTo: 'Brahmagiri MCS #2 or Pipili Inland Relief Camp',
      status: 'REJECTED_UNSAFE'
    })),
    rerouteAdvise: floodedRoads.length > 0
      ? `Road alert: ${floodedRoads.join(', ')} currently inundated or blocked by debris. Emergency convoys must route through NH-316 inland bypass.`
      : 'All primary national and state highways currently passable. Keep Marine Drive monitored.'
  };
}

// 2. Evacuation Copilot Endpoint
app.post('/api/gemini/evacuation', async (req, res) => {
  try {
    const inputData = req.body;
    const ai = getAIClient();
    if (!ai) {
      return res.json(generateFallbackEvacuation(inputData));
    }

    const prompt = `You are the chief evacuation coordinator for OSDMA during Cyclone Fani emergency response.
Analyze the current cyclone threat data, flooded roads, compromised shelters, and population at risk.

DATA PROVIDED:
${JSON.stringify(inputData, null, 2)}

TASK:
Produce an actionable, prioritized evacuation dispatch plan.
1. Specify which wards/blocks must evacuate first, exact deadlines, routes to take, and alternate shelters if primary shelters flood or exceed capacity.
2. If any road is flagged as flooded (e.g. Marine Drive), explicitly reroute through safe inland roads (e.g. NH-316).
3. Return a valid JSON matching this schema:
{
  "actions": [
    {
      "id": "act-1",
      "priority": "CRITICAL" | "HIGH" | "MEDIUM",
      "target": "Specific coastal block or ward",
      "action": "Clear imperative action",
      "deadline": "Time to complete action",
      "route": "Evacuation path including reroutes around flooded roads",
      "assignedShelters": "Safe cyclone shelters",
      "reasoning": "Scientific justification based on surge/wind data"
    }
  ],
  "shelterAlerts": [
    {
      "name": "Shelter name",
      "issue": "Flooding or capacity overload",
      "capacity": 1000,
      "rerouteTo": "Alternative shelter name",
      "status": "REJECTED_UNSAFE" | "EXCEEDED_CAPACITY"
    }
  ],
  "rerouteAdvise": "Summary advisory on road closures and safe transit corridors"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return res.json(parsed);
    }
    return res.json(generateFallbackEvacuation(inputData));
  } catch (error: any) {
    console.error('Error in evacuation copilot with Gemini:', error?.message || error);
    return res.json(generateFallbackEvacuation(req.body));
  }
});

// Fallback multilingual alert generator
const FALLBACK_ALERTS: Record<string, any> = {
  English: {
    title: 'RED ALERT: Extreme Cyclone Emergency - Immediate Action',
    level: 'SEVERE RED',
    leadTime: 'Landfall expected within 24-36 hours',
    content: 'A very severe cyclone is heading towards the Puri-Odisha coast with winds exceeding 175 km/h and seawater surge up to 3 meters. All residents in kutcha houses and coastal areas within 3km of the sea must move immediately to concrete Cyclone Shelters. Do not go near the beach. Keep your phone charged, store drinking water, and keep emergency medicines. Call 1070 or 1077 for emergency rescue assistance.',
    keyRules: [
      'Move to nearest designated cyclone shelter before 18:00 IST.',
      'Do NOT venture into the sea or flooded roads.',
      'Switch off cooking gas and main electric switches.',
      'Emergency Toll Free Numbers: 1070 (State), 1077 (District).'
    ]
  },
  Odia: {
    title: 'ଲାଲ୍ ସତର୍କତା: ଭୟଙ୍କର ବାତ୍ୟା ଜରୁରୀକାଳୀନ ସୂଚନା',
    level: 'ଲାଲ୍ ସତର୍କତା (RED ALERT)',
    leadTime: 'ଆଗାମୀ ୨୪ ରୁ ୩୬ ଘଣ୍ଟା ମଧ୍ୟରେ ସ୍ଥଳଭାଗ ଛୁଇଁବ',
    content: 'ଏକ ଅତ୍ୟନ୍ତ ଭୀଷଣ ବାତ୍ୟା ପୁରୀ ତଥା ଓଡ଼ିଶା ଉପକୂଳ ଆଡ଼କୁ ଅଗ୍ରସର ହେଉଛି। ପବନର ବେଗ ଘଣ୍ଟାପ୍ରତି ୧୭୫ କିମିରୁ ଅଧିକ ହେବ ଏବଂ ସମୁଦ୍ର ଜୁଆର ୩ ମିଟର ଉଚ୍ଚତା ପର୍ଯ୍ୟନ୍ତ ଗାଁରେ ପଶିପାରେ। କଚ୍ଚା ଘରେ ରହୁଥିବା ତଥା ସମୁଦ୍ର କୂଳର ସମସ୍ତ ଲୋକ ତୁରନ୍ତ ନିକଟସ୍ଥ ପକ୍କା ବାତ୍ୟା ଆଶ୍ରୟସ୍ଥଳୀକୁ ଚାଲିଯାଆନ୍ତୁ। ସମୁଦ୍ର କୂଳକୁ ଯାଆନ୍ତୁ ନାହିଁ। ଜରୁରୀ ସହାୟତା ପାଇଁ ୧୦୭୦ କିମ୍ବା ୧୦୭୭ ନମ୍ବରକୁ ଡାଏଲ କରନ୍ତୁ।',
    keyRules: [
      'ସନ୍ଧ୍ୟା ୬ଟା ପୂର୍ବରୁ ପକ୍କା ବାତ୍ୟା ଆଶ୍ରୟସ୍ଥଳକୁ ଚାଲିଯାଆନ୍ତୁ।',
      'ସମୁଦ୍ର କିମ୍ବା ବନ୍ୟା ପାଣି ପାଖକୁ ଯାଆନ୍ତୁ ନାହିଁ।',
      'ରୋଷେଇ ଗ୍ୟାସ୍ ଏବଂ ବିଦ୍ୟୁତ ମୁଖ୍ୟ ସୁଇଚ୍ ବନ୍ଦ କରନ୍ତୁ।',
      'ଜରୁରୀକାଳୀନ ହେଲ୍ପଲାଇନ: ୧୦୭୦ / ୧୦୭୭'
    ]
  },
  Hindi: {
    title: 'रेड अलर्ट: अत्यंत भीषण चक्रवात की चेतावनी - तुरंत सुरक्षित स्थान पर जाएं',
    level: 'गंभीर रेड अलर्ट (SEVERE RED)',
    leadTime: 'अगले 24-36 घंटों में तट से टकराने की संभावना',
    content: 'एक अत्यंत भीषण चक्रवाती तूफान ओडिशा के पुरी तट की ओर बढ़ रहा है। हवा की रफ्तार 175 किमी/घंटे से अधिक और समुद्र की लहरें 3 मीटर तक उठने की आशंका है। समुद्र तट के 3 किमी के भीतर और कच्चे मकानों में रहने वाले सभी लोग तुरंत नजदीकी पक्के चक्रवात आश्रय स्थल में चले जाएं। समुद्र किनारे न जाएं। पीने का पानी और जरूरी दवाइयां साथ रखें। आपातकालीन सहायता के लिए 1070 या 1077 पर संपर्क करें।',
    keyRules: [
      'शाम 6 बजे से पहले निकटतम पक्के चक्रवात आश्रय स्थल पहुंचें।',
      'समुद्र तट या जलमग्न सड़कों की ओर बिल्कुल न जाएं।',
      'बिजली का मेन स्विच और रसोई गैस सिलेंडर बंद रखें।',
      'आपातकालीन हेल्पलाइन नंबर: 1070 (राज्य), 1077 (जिला)।'
    ]
  },
  Bengali: {
    title: 'রেড অ্যালার্ট: অতি প্রবল ঘূর্ণিঝড় সতর্কতা - অবিলম্বে নিরাপদ আশ্রয়ে যান',
    level: 'রেড অ্যালার্ট (RED ALERT)',
    leadTime: 'আগামী ২৪-৩৬ ঘণ্টার মধ্যে উপকূলে আঘাত হানবে',
    content: 'একটি অত্যন্ত শক্তিশালী ঘূর্ণিঝড় ওড়িশার পুরী উপকূলের দিকে ধেয়ে আসছে। বাতাসের গতিবেগ ঘণ্টায় ১৭৫ কিলোমিটারেরও বেশি এবং ৩ মিটার উঁচু জলোচ্ছ্বাস হতে পারে। সমুদ্রের কাছে ও মাটির বাড়িতে বসবাসকারী সকলকে অবিলম্বে নিকটবর্তী পাকা সাইক্লোন শেল্টারে যাওয়ার নির্দেশ দেওয়া হচ্ছে। সমুদ্রে যাবেন না। জরুরি সাহায্যের জন্য ১০৭০ বা ১০৭৭ নম্বরে ফোন করুন।',
    keyRules: [
      'সন্ধ্যে ৬টার মধ্যে সাইক্লোন সেন্টারে পৌঁছান।',
      'সমুদ্র তীর বা প্লাবিত রাস্তায় যাবেন না।',
      'গ্যাস এবং মেইন ইলেকট্রিক সুইচ বন্ধ রাখুন।',
      'জরুরি হেল্পলাইন নম্বর: ১০৭০ / ১০৭৭'
    ]
  },
  Tamil: {
    title: 'சிவப்பு எச்சரிக்கை: தீவிர புயல் முன்னெச்சரிக்கை - உடனே பாதுகாப்பான இடத்திற்கு செல்லவும்',
    level: 'ரெட் அலர்ட் (RED ALERT)',
    leadTime: 'அடுத்த 24-36 மணி நேரத்தில் கரையை கடக்கும்',
    content: 'ஒடிசா புரி கடற்கரையை நோக்கி அதி தீவிர புயல் நகர்ந்து வருகிறது. காற்றின் வேகம் மணிக்கு 175 கி.மீ வரை இருக்கும் மற்றும் 3 மீட்டர் உயரத்திற்கு கடல் அலைகள் ஊருக்குள் புக வாய்ப்புள்ளது. கடலோர மக்கள் உடனடியாக அரசு புயல் நிவாரண முகாம்களுக்கு செல்லவும். கடலுக்கு செல்ல வேண்டாம். அவசர உதவிக்கு 1070 அல்லது 1077 ஐ அழைக்கவும்.',
    keyRules: [
      'உடனடியாக கான்கிரீட் புயல் மையங்களுக்கு செல்லவும்.',
      'கடற்கரைக்கு செல்ல வேண்டாம்.',
      'மின்சாரம் மற்றும் காஸ் இணைப்பை துண்டிக்கவும்.',
      'அவசர உதவி எண்: 1070 / 1077'
    ]
  },
  Telugu: {
    title: 'రెడ్ అలర్ట్: అత్యంత తీవ్ర తుఫాను హెచ్చరిక - వెంటనే సురక్షిత ప్రాంతాలకు వెళ్లండి',
    level: 'రెడ్ అలర్ట్ (RED ALERT)',
    leadTime: 'రాబోయే 24-36 గంటల్లో తీరం దాటే అవకాశం',
    content: 'ఒడిశా పూరి తీరం వైపు అత్యంత తీవ్ర తుఫాను దూసుకువస్తోంది. గంటకు 175 కి.మీ వేగంతో పెనుగాలులు మరియు 3 మీటర్ల ఎత్తున సముద్రపు నీరు ముందుకు వచ్చే ప్రమాదం ఉంది. తీరప్రాంత నివాసితులు వెంటనే తుఫాను పునరావాస కేంద్రాలకు వెళ్లాలి. సముద్రం వద్దకు వెళ్లకండి. అత్యవసర సహాయం కోసం 1070 లేదా 1077 కు ఫోన్ చేయండి.',
    keyRules: [
      'వెంటనే సమీపంలోని తుఫాను షెల్టర్‌కు చేరుకోండి.',
      'సముద్రం లేదా వరద నీటి వద్దకు వెళ్లవద్దు.',
      'విద్యుత్ మెయిన్ స్విచ్, గ్యాస్ సిలిండర్లను ఆపివేయండి.',
      'టోల్ ఫ్రీ సహాయ కేంద్రం: 1070 / 1077'
    ]
  }
};

// 3. Alerts Endpoint
app.post('/api/gemini/alert', async (req, res) => {
  try {
    const { language = 'English', timelineHour = -24, windSpeedKt = 120, surgeHeight = 2.4, targetDistrict = 'Puri' } = req.body;
    const ai = getAIClient();
    if (!ai) {
      const fallback = FALLBACK_ALERTS[language] || FALLBACK_ALERTS.English;
      return res.json(fallback);
    }

    const prompt = `You are an emergency public communications expert for the Odisha State Disaster Management Authority (OSDMA).
Generate an ultra-clear, low-literacy cyclone emergency advisory in the language: "${language}".

PARAMETERS:
- Lead time to landfall: ${Math.abs(timelineHour)} hours
- Target District: ${targetDistrict} and coastal Odisha
- Sustained Wind Speed: ${windSpeedKt} knots (${Math.round(windSpeedKt * 1.852)} km/h)
- Storm Surge Height: ${surgeHeight} meters
- Emergency Helpline: 1070 (State Control Room), 1077 (District Control Room)

REQUIREMENTS:
1. Use simple, low-literacy phrasing that uneducated villagers, fishermen, and families can immediately understand and act upon without panic.
2. Provide short, punchy sentences and imperative action commands.
3. Return a valid JSON object matching:
{
  "title": "Clear headline in ${language}",
  "level": "RED ALERT" | "ORANGE WARNING",
  "leadTime": "Clear time window string in ${language}",
  "content": "Paragraph in ${language} of around 60-80 words explaining what is happening, where to go, and what to take (medicines, documents, drinking water).",
  "keyRules": [
    "Short imperative rule 1 in ${language}",
    "Short imperative rule 2 in ${language}",
    "Short imperative rule 3 in ${language}",
    "Helpline information in ${language}"
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return res.json(parsed);
    }
    return res.json(FALLBACK_ALERTS[language] || FALLBACK_ALERTS.English);
  } catch (error: any) {
    console.error('Error generating alert with Gemini:', error?.message || error);
    const lang = req.body?.language || 'English';
    return res.json(FALLBACK_ALERTS[lang] || FALLBACK_ALERTS.English);
  }
});

// Setup Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback HTML serving for SPA in development mode
    app.use('*', async (req, res, next) => {
      // Don't intercept API routes
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const fs = await import('fs');
        const indexPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`CycloneShield AI server running on port ${port} (0.0.0.0)`);
  });
}

startServer();
