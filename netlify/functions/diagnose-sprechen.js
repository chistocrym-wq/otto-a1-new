const MODEL = 'gemini-3.8-flash';

export default async (req) => {
  if (req.method !== 'GET') return json({ error:'Method not allowed' }, 405);
  const apiKey = process.env.GEMINI_API_KEY;
  const baseUrl = process.env.GOOGLE_GEMINI_BASE_URL;
  if (!apiKey || !baseUrl) return json({ configured:false }, 503);

  const audio = makeSilentWavBase64();
  const tests = [
    ['textOnly', [{ text:'Reply with the word OK.' }], {}],
    ['audioPlain', [{ text:'Say whether this audio is silent.' }, { inlineData:{ mimeType:'audio/wav', data:audio } }], {}],
    ['audioLegacySchema', [{ text:'Return JSON with transcript and score.' }, { inlineData:{ mimeType:'audio/wav', data:audio } }], {
      responseMimeType:'application/json',
      responseSchema:{ type:'OBJECT', required:['transcript','score'], properties:{ transcript:{type:'STRING'}, score:{type:'INTEGER', enum:[0,50,100]} } },
    }],
    ['audioNewSchema', [{ text:'Return JSON with transcript and score.' }, { inlineData:{ mimeType:'audio/wav', data:audio } }], {
      responseFormat:{ text:{ mimeType:'application/json', schema:{ type:'object', required:['transcript','score'], properties:{ transcript:{type:'string'}, score:{type:'integer', enum:[0,50,100]} } } } },
    }],
  ];

  const results = {};
  for (const [name, parts, generationConfig] of tests) {
    try {
      const response = await fetch(`${baseUrl}/v1beta/models/${MODEL}:generateContent`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'x-goog-api-key':apiKey },
        body:JSON.stringify({ contents:[{role:'user',parts}], ...(Object.keys(generationConfig).length ? {generationConfig} : {}) }),
      });
      const raw = await response.text();
      results[name] = { status:response.status, ok:response.ok, detail:sanitize(raw) };
    } catch (error) {
      results[name] = { status:0, ok:false, detail:error instanceof Error ? error.message : String(error) };
    }
  }
  return json({ configured:true, model:MODEL, results });
};

export const config = { path:'/api/diagnose-sprechen' };
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}})}
function sanitize(raw){
  try {
    const p=JSON.parse(raw);
    if(p?.error)return JSON.stringify({code:p.error.code,status:p.error.status,message:String(p.error.message||'').slice(0,500)});
    return JSON.stringify({hasCandidate:Boolean(p?.candidates?.length),finishReason:p?.candidates?.[0]?.finishReason||'',text:String(p?.candidates?.[0]?.content?.parts?.[0]?.text||'').slice(0,120)});
  } catch { return String(raw).replace(/[A-Za-z0-9_-]{30,}/g,'[redacted]').slice(0,500); }
}
function makeSilentWavBase64(){
  const rate=16000, frames=4000, bytes=frames*2, b=Buffer.alloc(44+bytes);
  b.write('RIFF',0);b.writeUInt32LE(36+bytes,4);b.write('WAVE',8);b.write('fmt ',12);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(bytes,40);
  return b.toString('base64');
}
