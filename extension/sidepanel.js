// ════════════════════════════════════════════════════════════════
//  sidepanel.js — Sentience v2  Pure Live Agent Edition
//  No chat input. Voice is the interface.
// ════════════════════════════════════════════════════════════════

// ── CONFIG ──────────────────────────────────────────────────────
// Chrome extensions run on chrome-extension:// pages, so location.hostname
// is always empty — always point to the local backend during development.
const API_BASE = 'http://localhost:8000';

const DASHBOARD_URL = API_BASE + '/dashboard';

// ── CONSTANTS ────────────────────────────────────────────────────
const EMOS = {
  happy:{e:'😊',l:'Happy',hi:false},
  calm:{e:'😌',l:'Calm',hi:false},
  neutral:{e:'😐',l:'Neutral',hi:false},
  sad:{e:'😔',l:'Sad',hi:false},
  tired:{e:'😴',l:'Tired',hi:false},
  confused:{e:'😕',l:'Confused',hi:false},
  lonely:{e:'🥺',l:'Lonely',hi:true},
  anxious:{e:'😟',l:'Anxious',hi:true},
  stressed:{e:'😰',l:'Stressed',hi:true},
  frustrated:{e:'😤',l:'Frustrated',hi:true},
  fearful:{e:'😨',l:'Fearful',hi:true},
  angry:{e:'😠',l:'Angry',hi:true},
};

const CTX_META = {
  checkout: {icon:'🛒',label:'CHECKOUT',cls:'checkout'},
  banking:  {icon:'🏦',label:'BANKING',cls:'banking'},
  crypto:   {icon:'₿', label:'CRYPTO',cls:'crypto'},
  investing:{icon:'📈',label:'INVESTING',cls:'investing'},
  budget:   {icon:'📊',label:'BUDGET',cls:''},
  shopping: {icon:'🛍',label:'SHOPPING',cls:'shopping'},
  insurance:{icon:'🛡',label:'INSURANCE',cls:''},
  finance:  {icon:'💰',label:'FINANCE',cls:''},
};

// ── STATE ────────────────────────────────────────────────────────
let emotion      = 'neutral';
let sessionId    = null;
let vuln         = 0;
let currentCtx   = null;

// Live WebSocket state
let liveWS       = null;
let liveReady    = false;
let audioCtx     = null;
let micStream    = null;
let micProcessor = null;

// Camera state
let cameraOn     = false;
let camStream    = null;
let camTimer     = null;
let lastFrame    = '';

// Audio playback
const audioQueue = [];
let isPlaying    = false;
let isAISpeaking = false;

// ── DOM ──────────────────────────────────────────────────────────
const $  = id => document.getElementById(id);

const statusChip    = $('statusChip');
const statusTxt     = $('statusTxt');
const ctxBanner     = $('ctxBanner');
const ctxInner      = $('ctxInner');
const ctxType       = $('ctxType');
const ctxProduct    = $('ctxProduct');
const ctxInsight    = $('ctxInsight');
const ctxPrices     = $('ctxPrices');
const ctxVuln       = $('ctxVuln');
const ctxDismiss    = $('ctxDismiss');
const orbBtn        = $('orbBtn');
const orbIcon       = $('orbIcon');
const orbLabel      = $('orbLabel');
const orbStatus     = $('orbStatus');
const waveBars      = $('waveBars');
const transcriptArea= $('transcriptArea');
const transcriptEmpty=$('transcriptEmpty');
const emoOrb        = $('emoOrb');
const emoName       = $('emoName');
const emoSub        = $('emoSub');
const vulnNum       = $('vulnNum');
const vulnFill      = $('vulnFill');
const chipsRow      = $('chipsRow');
const camFeed       = $('camFeed');
const camThumb      = $('camThumb');
const camToggle     = $('camToggle');
const camReading    = $('camReading');
const dashBtn       = $('dashBtn');
const modal         = $('modal');
const modalBody     = $('modalBody');
const modalScore    = $('modalScore');
const modalFill     = $('modalFill');
const modalWait     = $('modalWait');
const modalProceed  = $('modalProceed');
const toastZone     = $('toastZone');
const quickLogBtn   = $('quickLogBtn');
const quickLogPanel = $('quickLogPanel');
const qlAmt         = $('qlAmt');
const qlCat         = $('qlCategory');
const qlDesc        = $('qlDesc');
const qlSubmit      = $('qlSubmit');

// ── TOAST ─────────────────────────────────────────────────────────
function toast(msg, type='ok', dur=2400){
  const el=document.createElement('div');
  el.className='toast '+type; el.textContent=msg;
  toastZone.appendChild(el);
  requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('show')));
  setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),250)},dur);
}

// ── STATUS CHECK ──────────────────────────────────────────────────
async function checkStatus(){
  try{
    const d = await fetch(`${API_BASE}/health`,{signal:AbortSignal.timeout(4000)}).then(r=>r.json());
    statusChip.className = 'status-chip online';
    statusTxt.textContent = d.gemini_ready ? 'Gemini Live' : 'Connected';
    if(d.session_id) sessionId = d.session_id;
  }catch{
    statusChip.className = 'status-chip offline';
    statusTxt.textContent = 'Offline';
    setTimeout(checkStatus, 5000);
  }
}

// ── EMOTION ───────────────────────────────────────────────────────
function setEmotion(key){
  emotion = key;
  const e = EMOS[key] || {e:'😐',l:key,hi:false};
  emoOrb.textContent = e.e;
  emoName.textContent = e.l;
  emoSub.textContent = 'Updating vulnerability…';

  document.querySelectorAll('.chip').forEach(c=>{
    const isActive = c.dataset.emotion === key;
    c.classList.toggle('active', isActive);
    c.classList.toggle('hi', isActive && e.hi);
  });

  // Tell live WS about emotion change
  if(liveWS && liveReady){
    liveWS.send(JSON.stringify({type:'emotion', data:key}));
  }

  fetchVuln(key);
}

async function fetchVuln(emo){
  try{
    const endpoint = emo
      ? `/pattern-report/quantitative/${emo}`
      : `/pattern-report/quantitative/neutral`;
    const d = await fetch(API_BASE + endpoint).then(r=>r.json());
    vuln = d.vulnerability_score || 0;
    updateVulnUI(vuln, d.quantitative_insight);
  }catch{
    try{
      const d2 = await fetch(`${API_BASE}/pattern-report/${emo}`).then(r=>r.json());
      vuln = d2.vulnerability_score || 0;
      updateVulnUI(vuln, null);
    }catch{}
  }
}

function updateVulnUI(score, insight){
  const pct = Math.min(Math.round((score/10)*100), 100);
  const color = score>=7?'var(--red)':score>=4?'var(--amber)':'var(--g)';
  vulnNum.textContent = score.toFixed(1);
  vulnNum.style.color = color;
  vulnFill.style.width = pct+'%';
  vulnFill.style.background = color;
  const verdict = score>=7?'High Risk':score>=4?'Moderate':'Low Risk';
  emoSub.textContent = verdict + (insight ? ' · '+insight.slice(0,40) : '');
}

// ── CHIPS ─────────────────────────────────────────────────────────
function buildChips(){
  Object.entries(EMOS).forEach(([key,em])=>{
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.dataset.emotion = key;
    btn.textContent = `${em.e} ${em.l}`;
    btn.addEventListener('click', ()=>setEmotion(key));
    chipsRow.appendChild(btn);
  });
}

// ── TRANSCRIPT ────────────────────────────────────────────────────
let _streamLine = null;

function addTranscript(text, role='ai'){
  if(transcriptEmpty) transcriptEmpty.style.display='none';
  const line = document.createElement('div');
  line.className = 'transcript-line ' + role;
  line.textContent = (role==='ai'?'◆ ':'▷ ') + text;
  transcriptArea.appendChild(line);
  transcriptArea.scrollTop = transcriptArea.scrollHeight;
  return line;
}

function streamTranscript(chunk){
  if(!_streamLine){
    if(transcriptEmpty) transcriptEmpty.style.display='none';
    _streamLine = document.createElement('div');
    _streamLine.className = 'transcript-line ai';
    _streamLine.textContent = '◆ ';
    transcriptArea.appendChild(_streamLine);
  }
  _streamLine.textContent += chunk;
  transcriptArea.scrollTop = transcriptArea.scrollHeight;
}

function finalizeTranscript(){
  _streamLine = null;
}

// ── GEMINI LIVE WS ────────────────────────────────────────────────
orbBtn.addEventListener('click', ()=>{
  if(liveReady) stopLive();
  else startLive();
});

function startLive(){
  setOrbState('connecting');
  const wsBase = API_BASE.replace('http://','ws://').replace('https://','wss://');
  liveWS = new WebSocket(`${wsBase}/ws/live`);

  liveWS.onopen = ()=>{
    sessionId = sessionId || crypto.randomUUID();
    liveWS.send(JSON.stringify({type:'init', session_id:sessionId, emotion}));
  };

  liveWS.onmessage = async (event)=>{
    const msg = JSON.parse(event.data);

    if(msg.type === 'status' && msg.data === 'connected'){
      liveReady = true;
      setOrbState('active');
      toast('🎙 Gemini Live connected', 'ok', 1800);
      startMic();
    }
    else if(msg.type === 'audio'){
      await enqueueAudio(msg.data);
    }
    else if(msg.type === 'text'){
      streamTranscript(msg.data);
    }
    else if(msg.type === 'turn_complete'){
      finalizeTranscript();
      setOrbState('active');
    }
    else if(msg.type === 'intervention'){
      const d = msg.data;
      showModal(
        `You're currently <strong>${EMOS[d.emotion]?.l||d.emotion}</strong>.<br><br>Your vulnerability score is <strong>${d.score}/10</strong>. Based on your pattern: ${d.pattern||'you tend to overspend in this state.'}`,
        d.score
      );
    }
    else if(msg.type === 'vulnerability_update'){
      vuln = msg.data.score;
      updateVulnUI(vuln, null);
    }
    else if(msg.type === 'error'){
      toast('Error: '+msg.data, 'err', 4000);
      stopLive();
    }
  };

  liveWS.onclose = ()=>{
    liveReady = false;
    stopMic();
    setOrbState('idle');
  };

  liveWS.onerror = ()=>{
    toast('Cannot connect — is backend running?', 'err', 4000);
    stopLive();
  };
}

function stopLive(){
  stopMic();
  if(liveWS){ try{liveWS.close()}catch{} liveWS=null; }
  liveReady = false;
  isAISpeaking = false;
  setOrbState('idle');
  toast('Session ended', 'warn', 1400);
}

function setOrbState(state){
  orbBtn.className = 'orb-btn';
  waveBars.className = 'wave-bars';

  if(state==='idle'){
    orbIcon.textContent='🎙';
    orbLabel.textContent='TAP TO TALK';
    orbStatus.textContent='Tap to talk with Sentience';
    orbStatus.className='orb-status';
  }
  else if(state==='connecting'){
    orbIcon.textContent='⏳';
    orbLabel.textContent='CONNECTING';
    orbStatus.textContent='Connecting to Gemini Live…';
    orbStatus.className='orb-status';
  }
  else if(state==='active'){
    orbBtn.classList.add('active');
    orbIcon.textContent='🎙';
    orbLabel.textContent='LISTENING';
    orbStatus.textContent='Gemini Live — speak freely';
    orbStatus.className='orb-status active';
    waveBars.classList.add('show');
  }
  else if(state==='speaking'){
    orbBtn.classList.add('ai-speaking');
    orbIcon.textContent='🔊';
    orbLabel.textContent='SPEAKING';
    orbStatus.textContent='Sentience is speaking…';
    orbStatus.className='orb-status speaking';
    waveBars.classList.add('show','speaking');
  }
  else if(state==='error'){
    orbBtn.classList.add('error');
    orbIcon.textContent='⚠️';
    orbLabel.textContent='ERROR';
    orbStatus.textContent='Connection failed';
    orbStatus.className='orb-status err';
  }
}

// ── MIC STREAM (AudioWorkletNode — replaces deprecated ScriptProcessorNode) ─
async function startMic(){
  try{
    micStream = await navigator.mediaDevices.getUserMedia({audio:true,video:false});
    audioCtx  = new AudioContext({sampleRate:16000});

    // Load the worklet processor from the extension bundle
    const workletURL = chrome.runtime.getURL('audio-processor.js');
    await audioCtx.audioWorklet.addModule(workletURL);

    const src = audioCtx.createMediaStreamSource(micStream);
    micProcessor = new AudioWorkletNode(audioCtx, 'mic-processor');

    // The worklet posts Float32 chunks — convert and send to WebSocket
    micProcessor.port.onmessage = (e)=>{
      if(!liveReady) return;
      const pcm = f32ToPCM16(e.data.pcmFloat32);
      const b64 = bufToB64(pcm.buffer);
      if(liveWS && liveWS.readyState===WebSocket.OPEN){
        liveWS.send(JSON.stringify({type:'audio', data:b64}));
      }
    };

    src.connect(micProcessor);
    micProcessor.connect(audioCtx.destination);
  }catch(err){
    console.error('startMic error:', err);
    toast('Microphone error: '+err.message, 'err');
    stopLive();
  }
}

function stopMic(){
  micStream?.getTracks().forEach(t=>t.stop());
  micStream = null;
  try{ micProcessor?.port?.close(); micProcessor?.disconnect(); }catch{}
  micProcessor = null;
  try{ audioCtx?.close(); }catch{}
  audioCtx = null;
}

// ── AUDIO PLAYBACK ─────────────────────────────────────────────────────────────
// ONE persistent AudioContext — chunks are scheduled sequentially on the same
// audio graph. Creating a new context per chunk causes gaps, pops, and crashes.
let _pbCtx        = null;   // single persistent playback context
let _pbUntil      = 0;      // AudioContext timestamp of end of last scheduled chunk
let _pbLastSrc    = null;   // last BufferSourceNode (to detect drain complete)

function _getPlaybackCtx(){
  if(!_pbCtx || _pbCtx.state==='closed'){
    _pbCtx   = new AudioContext({sampleRate:24000});
    _pbUntil = _pbCtx.currentTime;
  }
  if(_pbCtx.state==='suspended') _pbCtx.resume();
  return _pbCtx;
}

function enqueueAudio(b64){
  isPlaying=true; isAISpeaking=true; setOrbState('speaking');
  const ctx = _getPlaybackCtx();

  // Schedule this chunk immediately after the previous one — no gap
  const startAt = Math.max(_pbUntil, ctx.currentTime + 0.005);
  try{
    const bytes = b64ToBuffer(b64);
    const i16   = new Int16Array(bytes);
    const f32   = pcm16ToF32(i16);
    const buf   = ctx.createBuffer(1, f32.length, 24000);
    buf.copyToChannel(f32, 0);
    const src   = ctx.createBufferSource();
    src.buffer  = buf;
    src.connect(ctx.destination);
    src.start(startAt);
    _pbUntil   = startAt + buf.duration;
    _pbLastSrc = src;
    src.onended = ()=>{
      // Only mark done if no more chunks are coming soon
      if(src === _pbLastSrc){
        isPlaying=false; isAISpeaking=false;
        setOrbState(liveReady?'active':'idle');
      }
    };
  }catch(e){ console.error('Audio schedule error:', e); }
}

function _stopPlayback(){
  // Called on barge-in — close context so all scheduled sounds stop immediately
  try{ _pbCtx?.close(); }catch{}
  _pbCtx=null; _pbUntil=0; _pbLastSrc=null;
  isPlaying=false; isAISpeaking=false;
}

// ESC = barge-in interrupt
document.addEventListener('keydown', e=>{
  if(e.key==='Escape' && liveReady && liveWS){
    liveWS.send(JSON.stringify({type:'interrupt'}));
    audioQueue.length=0;
    _stopPlayback();  // closes AudioContext so queued chunks stop instantly
    setOrbState('active');
    toast('Interrupted', 'warn', 1200);
  }
});

// ── PCM HELPERS ───────────────────────────────────────────────────
function f32ToPCM16(f32){
  const out=new Int16Array(f32.length);
  for(let i=0;i<f32.length;i++) out[i]=Math.max(-32768,Math.min(32767,f32[i]*32768));
  return out;
}
function pcm16ToF32(i16){
  const f=new Float32Array(i16.length);
  for(let i=0;i<i16.length;i++) f[i]=i16[i]/32768;
  return f;
}
function bufToB64(buf){
  let s=''; const b=new Uint8Array(buf);
  for(let i=0;i<b.length;i++) s+=String.fromCharCode(b[i]);
  return btoa(s);
}
function b64ToBuffer(b64){
  const bin=atob(b64), buf=new ArrayBuffer(bin.length), v=new Uint8Array(buf);
  for(let i=0;i<bin.length;i++) v[i]=bin.charCodeAt(i);
  return buf;
}

// ── CAMERA ───────────────────────────────────────────────────────
camToggle.addEventListener('click', ()=>cameraOn?stopCam():startCam());

async function startCam(){
  try{
    camStream = await navigator.mediaDevices.getUserMedia({video:true,audio:false});
    camFeed.srcObject = camStream;
    camFeed.onloadedmetadata = ()=>camFeed.classList.add('live');
    camThumb.classList.add('on');
    cameraOn = true;
    camToggle.textContent = 'Disable Camera';
    camToggle.classList.add('on');
    captureAndAnalyze();
    camTimer = setInterval(captureAndAnalyze, 8000);
  }catch{
    toast('Camera access denied', 'err');
  }
}

function stopCam(){
  camStream?.getTracks().forEach(t=>t.stop());
  camStream=null; camFeed.srcObject=null;
  camFeed.classList.remove('live');
  camThumb.classList.remove('on');
  cameraOn=false; lastFrame='';
  camToggle.textContent='Enable Camera';
  camToggle.classList.remove('on');
  camReading.textContent='Enable camera for passive emotion detection';
  clearInterval(camTimer); camTimer=null;
}

function captureFrame(){
  if(!cameraOn||!camFeed.videoWidth) return '';
  const c=document.createElement('canvas');
  c.width=320;c.height=240;
  c.getContext('2d').drawImage(camFeed,0,0,320,240);
  return c.toDataURL('image/jpeg',0.7).split(',')[1];
}

async function captureAndAnalyze(){
  if(!cameraOn) return;
  const frame = captureFrame();
  if(!frame) return;
  lastFrame = frame;

  // Send frame to Gemini Live session so it can SEE you
  if(liveWS && liveReady && liveWS.readyState===WebSocket.OPEN){
    liveWS.send(JSON.stringify({type:'visual_frame', data:frame}));
  }

  try{
    const d=await fetch(`${API_BASE}/vision`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({image_frame:frame}),
    }).then(r=>r.json());
    if(!d.emotion_detected) return;
    camReading.textContent = d.visual_context || d.emotion_detected;
    if(d.emotion_detected !== emotion && EMOS[d.emotion_detected]){
      const prev = emotion;
      setEmotion(d.emotion_detected);
      emoSub.textContent = 'Detected by camera';
      toast(`Camera: ${EMOS[d.emotion_detected].e} ${d.emotion_detected}`, 'ok', 2000);

      // ── PROACTIVE INTERVENTION ────────────────────────────────────
      // If camera detects a high-vulnerability emotion and we have page
      // context (i.e., user is on a checkout/shopping page), proactively
      // surface the intervention without waiting for the user to speak.
      const highRisk = EMOS[d.emotion_detected]?.hi;
      const onCheckout = currentCtx && (currentCtx.type === 'checkout' || currentCtx.type === 'shopping');
      if(highRisk && onCheckout && vuln >= 4){
        // Only fire once per context to avoid spamming
        if(!window._proactiveTriggered){
          window._proactiveTriggered = true;
          setTimeout(async ()=>{
            // Fetch fresh vuln for new emotion
            await fetchVuln(d.emotion_detected);
            const emoLabel = EMOS[d.emotion_detected].l;
            const emoIcon  = EMOS[d.emotion_detected].e;
            showModal(
              `${emoIcon} Camera detected you're feeling <strong>${emoLabel}</strong> while on a ${currentCtx.type} page.<br><br>`+
              `Your vulnerability score just updated to <strong>${vuln.toFixed(1)}/10</strong>. `+
              `Sentience suggests a <strong>24-hour cool-off</strong> before continuing.`,
              vuln
            );
            toast(`Proactive: ${emoLabel} detected on checkout — intervention triggered`, 'warn', 4000);
          }, 1200);
        }
      }
      // Reset proactive trigger when emotion improves
      if(!EMOS[d.emotion_detected]?.hi) window._proactiveTriggered = false;
    }
  }catch{}
}

// ── CONTEXT BANNER ────────────────────────────────────────────────
function showContext(ctx){
  currentCtx = ctx;
  const meta = CTX_META[ctx.contextType] || CTX_META.finance;
  ctxInner.className = 'ctx-inner ' + meta.cls;
  ctxType.textContent = meta.icon + ' ' + meta.label;
  ctxType.className = 'ctx-type ' + meta.cls;
  ctxProduct.textContent = ctx.productName || ctx.pageTitle || ctx.store || '';
  ctxInsight.textContent = 'Analyzing your emotional spending profile…';
  ctxPrices.innerHTML='';
  (ctx.visiblePrices||[]).slice(0,3).forEach(p=>{
    const tag=document.createElement('span');
    tag.className='ctx-price-tag'; tag.textContent=p;
    ctxPrices.appendChild(tag);
  });
  ctxBanner.classList.add('show');
  fetchContextInsight(ctx);
}

async function fetchContextInsight(ctx){
  try{
    const d=await fetch(`${API_BASE}/context-insight`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        contextType:ctx.contextType||'finance', emotion,
        productName:ctx.productName||'', price:ctx.price||'',
        totalAmount:ctx.totalAmount||'', visiblePrices:ctx.visiblePrices||[],
        budgetCategory:ctx.budgetCategory||'Other',
        pageTitle:ctx.pageTitle||'', store:ctx.store||'',
      }),
    }).then(r=>r.json());
    ctxInsight.textContent = d.insight||'';
    if(d.vulnerability_score!=null){
      vuln = d.vulnerability_score;
      updateVulnUI(vuln, null);
      const color = vuln>=7?'hi':vuln>=4?'med':'lo';
      ctxVuln.textContent = vuln.toFixed(1)+'/10';
      ctxVuln.className = 'ctx-vuln '+color;
    }
    // Also speak the insight via Live if connected
    if(liveWS && liveReady && d.insight){
      liveWS.send(JSON.stringify({type:'context_alert', data:{insight:d.insight,emotion,vuln}}));
    }
  }catch{
    ctxInsight.textContent='Backend needed for full analysis.';
  }
}

ctxDismiss.addEventListener('click', ()=>ctxBanner.classList.remove('show'));

// Listen for context from content script via background
chrome.runtime.onMessage.addListener((message)=>{
  if(message.type==='checkout_context'||message.type==='financial_context'){
    showContext(message.data);
  }
});
chrome.runtime.sendMessage({type:'get_pending_checkout'},(res)=>{
  if(res?.data) showContext({...res.data, contextType:'checkout'});
});
setTimeout(()=>{
  chrome.runtime.sendMessage({type:'get_pending_context'},(res)=>{
    if(res?.data && !currentCtx) showContext(res.data);
  });
},300);

// ── INTERVENTION MODAL ────────────────────────────────────────────
function showModal(bodyHtml, score){
  modalBody.innerHTML = bodyHtml;
  const s = score ?? vuln;
  modalScore.textContent = s.toFixed(1)+'/10';
  modalFill.style.width = Math.round((s/10)*100)+'%';
  modal.classList.add('show');
}

modalWait.addEventListener('click', ()=>{
  modal.classList.remove('show');
  toast('✓ Smart pause. Revisit in 24 hours.','ok',3000);
});
modalProceed.addEventListener('click', ()=>{
  modal.classList.remove('show');
  addTranscript("Noted — I'll log this and we can review your regret score tomorrow.",'ai');
});
modal.addEventListener('click', e=>{ if(e.target===modal) modal.classList.remove('show'); });

// ── DASHBOARD BUTTON ─────────────────────────────────────────────
dashBtn.addEventListener('click', ()=>{
  chrome.tabs.create({url: DASHBOARD_URL});
});

// ── DEMO MODE (Ctrl+Shift+S) ─────────────────────────────────────
document.addEventListener('keydown', async e=>{
  if(!(e.ctrlKey && e.shiftKey && e.key==='S')) return;
  e.preventDefault();
  setEmotion('stressed');
  toast('🎬 Demo mode — seeding data…','warn',2000);
  for(const amt of [120,89,340,55,240]){
    await fetch(`${API_BASE}/log-spend`,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({amount:amt,category:'Shopping',emotion_hint:'stressed',description:'demo entry'}),
    }).catch(()=>{});
    await new Promise(r=>setTimeout(r,150));
  }
  // Immediately refresh the vulnerability score so it shows "High Risk" on screen
  await fetchVuln('stressed');
  toast('✓ Data seeded — vulnerability score updated!','ok',3000);

  setTimeout(()=>{
    showModal(
      `You're <strong>😰 Stressed</strong>.<br><br>While stressed, you've made 5 purchases totalling $844 — with an average regret score of <strong>8.2/10</strong>. Is this purchase the exception, or the rule?`,
      8.4
    );
  },600);
});

// ── QUICK LOG ─────────────────────────────────────────────────────
quickLogBtn.addEventListener('click', ()=>{
  const open = quickLogPanel.classList.toggle('show');
  quickLogBtn.textContent = open ? '✕ Cancel' : '＋ Log Spend';
  if(open) qlAmt.focus();
});

qlSubmit.addEventListener('click', async ()=>{
  const amt = parseFloat(qlAmt.value);
  if(!amt || amt<=0){ toast('Enter a valid amount','err',2000); return; }
  const cat  = qlCat.value;
  const desc = qlDesc.value.trim()||cat;
  qlSubmit.disabled = true;
  qlSubmit.textContent = 'Logging…';
  try{
    const d = await fetch(`${API_BASE}/log-spend`,{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({amount:amt, category:cat, description:desc, emotion_hint:emotion}),
    }).then(r=>r.json());
    if(d.status==='logged'){
      toast(`✓ $${amt} logged as ${emotion}`,'ok',2500);
      qlAmt.value=''; qlDesc.value='';
      quickLogPanel.classList.remove('show');
      quickLogBtn.textContent='＋ Log Spend';
    } else {
      toast('Log failed: '+(d.error||'unknown'),'err',3000);
    }
  }catch{ toast('Network error — backend running?','err',3000); }
  finally{ qlSubmit.disabled=false; qlSubmit.textContent='Log It'; }
});

// ── INIT ────────────────────────────────────────────────────────
(async()=>{
  buildChips();
  await checkStatus();
  setEmotion('neutral');
  // Recheck every 10s if offline
  setInterval(()=>{
    if(!liveReady) checkStatus();
  }, 10000);
})();
