const BACKEND_URL = "https://cjptv-backendv3.vercel.app/api/chat";

// =========================
// MEMORY
// =========================
let memory = JSON.parse(localStorage.getItem("memory")) || {};

function saveMemory(key, value) {
  memory[key] = value;
  localStorage.setItem("memory", JSON.stringify(memory));
}

// =========================
// ELEMENTS
// =========================
const hero = document.getElementById("hero");
const heroText = document.getElementById("heroText");
const chat = document.getElementById("chat");
// =========================
// LOAD SAVED USER
// =========================

window.onload = () => {

    const savedName = localStorage.getItem("sambhav_username");

    if(savedName){

        memory.name = savedName;

        heroText.innerText = `Welcome back, ${savedName} 👋`;

        document.getElementById("nameModal").style.display = "none";

    }else{

        document.getElementById("nameModal").style.display = "flex";

    }

};
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const modal = document.getElementById("nameModal");
const nameInput = document.getElementById("nameInput");

// =========================
// SAFE UI
// =========================
function addMessage(text, type) {
  const div = document.createElement("div");
  div.className = type;
  div.innerText = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// =========================
// WIKIPEDIA
// =========================
async function getWikiAnswer(query) {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
    );
    const data = await res.json();
    return data.extract || null;
  } catch {
    return null;
  }
}

// =========================
// LIVE SEARCH (TAVILY)
// =========================
async function liveSearch(query) {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: "advanced",
        include_answer: true,
        max_results: 3
      })
    });

    const data = await res.json();
    return data;
  } catch (e) {
    console.log("Live Search Error:", e);
    return null;
  }
}
async function generateImage(prompt) {

  const url =
    "https://image.pollinations.ai/prompt/" +
    encodeURIComponent(prompt);

  addMessage("🎨 Generating image...", "ai-msg");

  const img = document.createElement("img");
  img.src = url;
  img.className = "ai-image";
  img.alt = prompt;

  chat.appendChild(img);
  chat.scrollTop = chat.scrollHeight;
}

// =========================
// AI ENGINE
// =========================
async function askAI(message) {

  const lower = message.toLowerCase();

  // 1. Wikipedia
  const clean = message
    .replace(/who is|what is|where is|when was/gi, "")
    .trim();

  if (clean.length > 3) {
    const wiki = await getWikiAnswer(clean);
    if (wiki) return "📚 " + wiki;
  }

  // 2. Live search
  const needsLive =
    lower.includes("current") ||
    lower.includes("latest") ||
    lower.includes("today") ||
    lower.includes("news") ||
    lower.includes("cm") ||
    lower.includes("prime minister") ||
    lower.includes("president");

  if (needsLive) {
    const live = await liveSearch(message);

    const answer =
      live?.answer ||
      live?.results?.[0]?.content;

    if (answer) return "🌍 " + answer;
  }

// 3. AI fallback through Vercel Backend

const res = await fetch(
  BACKEND_URL,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: message
    })
  }
);

const data = await res.json();

return data.choices[0].message.content;
}

// =========================
// SEND MESSAGE
// =========================
async function sendMessage() {
  const message = userInput.value.trim();
  if (handleGreeting(message)) return;
  function handleGreeting(message) {
  const text = message.toLowerCase().trim();

  const greetings = ["hi", "hello", "hey", "hii", "hola"];

  if (greetings.includes(text)) {
    addMessage(message, "user-msg");
    addMessage("👋 Hello! How can I help you today?", "ai-msg");
    return true;
  }

  return false;
  }
  if (!message) return;

const lower = message.toLowerCase();
// =========================
// SAVE USER NAME
// =========================
if (lower.startsWith("my name is ")) {

  const name = message.substring(11).trim();

  saveMemory("name", name);

  addMessage(message, "user-msg");
  addMessage("😊 Nice to meet you, " + name + "! I'll remember your name.", "ai-msg");

  userInput.value = "";

  return;
}
if (
  lower.startsWith("draw ") ||
  lower.startsWith("create image") ||
  lower.startsWith("generate image") ||
  lower.startsWith("make image") ||
  lower.startsWith("create an image") ||
  lower.startsWith("create an image of") ||
  lower.startsWith("can you create image of") ||
  lower.startsWith("design") ||
  lower.startsWith("create poster of")
) {

  const prompt = message
    .replace(/draw|create image|generate image|make image/gi, "")
    .trim();

  addMessage(message, "user-msg");

  await generateImage(prompt);

  userInput.value = "";

  return;
}
if (
  lower.includes("what is my name") ||
  lower.includes("what's my name") ||
  lower.includes("my name")
) {
  const name = memory.name;

  addMessage(message, "user-msg");

  if (name) {
    addMessage("👤 Your name is " + name, "ai-msg");
  } else {
    addMessage("I don't know your name yet 😊", "ai-msg");
  }

  return;
}
  addMessage(message, "user-msg");
  userInput.value = "";

  const loading = document.createElement("div");
  loading.className = "ai-msg";
  loading.innerText = "Thinking...";
  chat.appendChild(loading);

  async function generateImage(prompt){

  const url =
  "https://image.pollinations.ai/prompt/" +
  encodeURIComponent(prompt);

  const img=document.createElement("img");

  img.src=url;
  img.className="ai-image";

  img.onclick=()=>{

    document.getElementById("viewerImg").src=url;

    document.getElementById("imageViewer").style.display="flex";

  };

  chat.appendChild(img);

  chat.scrollTop=chat.scrollHeight;

}

  try {
    const reply = await askAI(message);

setTimeout(() => {
  safeRemove(loading);
  addMessage(reply, "ai-msg");
}, 50);

  } catch (err) {
    safeRemove(loading);
    addMessage("Error: " + err.message, "ai-msg");
  }
}

// =========================
// SAFE REMOVE (IMPORTANT)
// =========================
function safeRemove(el) {
  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
  }
}

// =========================
// EVENTS
// =========================
document.getElementById("closeImage").onclick=()=>{

document.getElementById("imageViewer").style.display="none";

};

document.getElementById("imageViewer").onclick=(e)=>{

if(e.target.id==="imageViewer"){

document.getElementById("imageViewer").style.display="none";

}

};
document.getElementById("downloadImage").onclick = () => {

  const img = document.getElementById("viewerImg");

  const a = document.createElement("a");

  a.href = img.src;

  a.download = "SambhavAI_Image.png";

  document.body.appendChild(a);

  a.click();

  document.body.removeChild(a);

};
sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// =========================
// CONTINUE BUTTON (FIXED)
// =========================
window.saveName = function () {
  const name = nameInput.value.trim();
  if (!name) return;

  localStorage.setItem("sambhav_username", name);

  saveMemory("name", name);
  heroText.innerText = `What's next, ${name}?`;
  if (modal) {

    modal.style.display = "none";

  }
  };async function loadTicker(){

try{

const res = await fetch(
"https://api.spaceflightnewsapi.net/v4/articles/?limit=8"
);

const data = await res.json();

const headlines = data.results
.map(item => "🔴 " + item.title)
.join("     •     ");

document.getElementById("tickerText").textContent = headlines;

}catch{

document.getElementById("tickerText").textContent =
"Unable to load latest headlines.";

}

}

loadTicker();

setInterval(loadTicker,300000);
// =========================
// CJPTV PARTICLE BACKGROUND
// =========================

const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const particles = [];

for(let i=0;i<45;i++){

    particles.push({

        x:Math.random()*canvas.width,
        y:Math.random()*canvas.height,

        r:Math.random()*3+2,

        dx:(Math.random()-0.5)*1.2,
dy:(Math.random()-0.5)*1.2

    });

}

function animate(){

    ctx.clearRect(0,0,canvas.width,canvas.height);

    for(let i=0;i<particles.length;i++){

        const p=particles[i];

        p.x+=p.dx;
        p.y+=p.dy;

        if(p.x<0||p.x>canvas.width)p.dx*=-1.2;
        if(p.y<0||p.y>canvas.height)p.dy*=-1.2;

        ctx.beginPath();

        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);

        ctx.fillStyle="rgba(255,0,0,0.35)";

        ctx.shadowColor="red";
        ctx.shadowBlur=15;

        ctx.fill();

        for(let j=i+1;j<particles.length;j++){

            const p2=particles[j];

            const dist=Math.hypot(p.x-p2.x,p.y-p2.y);

            if(dist<120){

                ctx.beginPath();

                ctx.moveTo(p.x,p.y);
                ctx.lineTo(p2.x,p2.y);

                ctx.strokeStyle="rgba(255,0,0,0.08)";
                ctx.lineWidth=1;

                ctx.stroke();

            }

        }

    }

    requestAnimationFrame(animate);

}

animate();
