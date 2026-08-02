import {
    auth,
    provider,
    signInWithPopup,
    signInAnonymously,
    signOut,
    onAuthStateChanged
} from "./firebase.js";
const BACKEND_URL = "https://cjptv-backendv3.vercel.app/api/chat";

// =========================
// MEMORY
// =========================
let memory = JSON.parse(localStorage.getItem("memory")) || {};

function saveMemory(key, value) {
  memory[key] = value;
  localStorage.setItem("memory", JSON.stringify(memory));
}
let chats =
JSON.parse(localStorage.getItem("cjptv_chats")) || [];

let currentChat = [];
// =========================
// ELEMENTS
// =========================
const hero = document.getElementById("hero");
const heroText = document.getElementById("heroText");
const chat = document.getElementById("chat");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const modal = document.getElementById("nameModal");


// =========================
// LOAD SAVED USER
// =========================
window.onload = () => {
  const savedName = localStorage.getItem("sambhav_username");
  if (savedName) {
    memory.name = savedName;
    if (heroText) heroText.innerText = `Welcome back, ${savedName} 👋`;
    if (modal) modal.style.display = "none";
  } else if (modal) {
    modal.style.display = "flex";
  }
  loadHistory();
};
const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");
const closeSidebar = document.getElementById("closeSidebar");

menuBtn.onclick = () => {
  sidebar.classList.add("open");
};

closeSidebar.onclick = () => {
  sidebar.classList.remove("open");
};
// =========================
// SAFE UI & HELPERS
// =========================
function addMessage(text, type) {
  const div = document.createElement("div");
  div.className = type;
  div.innerText = text;

  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;

  // Save message to current chat
  currentChat.push({
    text,
    type
  });
}

function safeRemove(el) {
  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
  }
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
// TAVILY LIVE SEARCH
// =========================
async function liveSearch(query) {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: typeof TAVILY_API_KEY !== "undefined" ? TAVILY_API_KEY : "",
        query: query,
        search_depth: "advanced",
        include_answer: true,
        max_results: 3
      })
    });
    return await res.json();
  } catch (e) {
    console.log("Live Search Error:", e);
    return null;
  }
}

// =========================
// IMAGE GENERATION
// =========================
async function generateImage(prompt) {
  const url = "https://image.pollinations.ai/prompt/" + encodeURIComponent(prompt);
  addMessage("🎨 Generating image...", "ai-msg");

  const img = document.createElement("img");
  img.src = url;
  img.className = "ai-image";
  img.alt = prompt;

  img.onclick = () => {
    const viewerImg = document.getElementById("viewerImg");
    const imageViewer = document.getElementById("imageViewer");
    if (viewerImg && imageViewer) {
      viewerImg.src = url;
      imageViewer.style.display = "flex";
    }
  };

  chat.appendChild(img);
  chat.scrollTop = chat.scrollHeight;
}

// =========================
// AI ENGINE
// =========================
async function askAI(message) {
  // 1. Wikipedia ONLY for explicit definition queries
  const isWikiQuery = /^(who is|what is|where is|when was)\s+/i.test(message);
  if (isWikiQuery) {
    const clean = message.replace(/^(who is|what is|where is|when was)\s+/gi, "").trim();
    if (clean.length > 2) {
      const wiki = await getWikiAnswer(clean);
      if (wiki) return "📚 " + wiki;
    }
  }

  // 2. ALWAYS search Tavily
  let liveContext = null;
  try {
    const live = await liveSearch(message);
    if (live) {
      if (live.answer) {
        liveContext = live.answer;
      } else if (live.results && live.results.length > 0) {
        liveContext = live.results
          .map((r) => r.content)
          .filter(Boolean)
          .join("\n\n");
      }
    }
  } catch (e) {
    console.log("Tavily retrieval failed:", e);
  }

  // 3. Backend Call (Sends liveContext if Tavily retrieved info)
  const payload = { message };
  if (liveContext) {
    payload.liveContext = liveContext;
  }

  const res = await fetch(BACKEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || data.reply || "No response received.";
}

// =========================
// GREETING HANDLER
// =========================
function handleGreeting(message) {
  const text = message.toLowerCase().trim();
  const greetings = ["hi", "hello", "hey", "hii", "hola"];

  if (greetings.includes(text)) {
    addMessage(message, "user-msg");
    addMessage("👋 Hello! How can I help you today?", "ai-msg");
    userInput.value = "";
    return true;
  }
  return false;
}

// =========================
// SEND MESSAGE
// =========================
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  if (handleGreeting(message)) return;

  const lower = message.toLowerCase();

  // Save Name Command
  if (lower.startsWith("my name is ")) {
    const name = message.substring(11).trim();
    saveMemory("name", name);
    addMessage(message, "user-msg");
    addMessage("😊 Nice to meet you, " + name + "! I'll remember your name.", "ai-msg");
    userInput.value = "";
    return;
  }

  // Image Generation Command
  const imageTriggers = [
    "draw ", "create image", "generate image", "make image",
    "create an image", "design", "create poster of"
  ];
  if (imageTriggers.some((trigger) => lower.startsWith(trigger))) {
    const prompt = message
      .replace(/draw|create image|generate image|make image|create an image|design|create poster of/gi, "")
      .trim();

    addMessage(message, "user-msg");
    userInput.value = "";
    await generateImage(prompt);
    return;
  }

  // Name Recall Command
  if (lower.includes("what is my name") || lower.includes("what's my name")) {
    const name = memory.name;
    addMessage(message, "user-msg");
    if (name) {
      addMessage("👤 Your name is " + name, "ai-msg");
    } else {
      addMessage("I don't know your name yet 😊", "ai-msg");
    }
    userInput.value = "";
    return;
  }

  // Standard Pipeline Response
if (hero) {
  hero.classList.add("hide");
}
 
addMessage(message, "user-msg");
userInput.value = "";

  const loading = document.createElement("div");
  loading.className = "ai-msg";
  loading.innerText = "Thinking...";
  chat.appendChild(loading);

  try {
    const reply = await askAI(message);

    // Remove the "Thinking..." bubble
    safeRemove(loading);

    const div = document.createElement("div");
    div.className = "ai-msg";
    chat.appendChild(div);

    let i = 0;

    function typeWriter() {
        if (i < reply.length) {
            div.textContent += reply.charAt(i);
            i++;
            chat.scrollTop = chat.scrollHeight;
            setTimeout(typeWriter, 15);
        }
    }

    typeWriter();

} catch (err) {
    safeRemove(loading);
    addMessage("Error: " + err.message, "ai-msg");
} 
}

// =========================
// EVENT LISTENERS & UI
// =========================
const closeImgBtn = document.getElementById("closeImage");
if (closeImgBtn) {
  closeImgBtn.onclick = () => {
    const imageViewer = document.getElementById("imageViewer");
    if (imageViewer) imageViewer.style.display = "none";
  };
}

const imageViewer = document.getElementById("imageViewer");
if (imageViewer) {
  imageViewer.onclick = (e) => {
    if (e.target.id === "imageViewer") {
      imageViewer.style.display = "none";
    }
  };
}

const downloadImgBtn = document.getElementById("downloadImage");
if (downloadImgBtn) {
  downloadImgBtn.onclick = () => {
    const img = document.getElementById("viewerImg");
    if (!img) return;
    const a = document.createElement("a");
    a.href = img.src;
    a.download = "SambhavAI_Image.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
}

if (sendBtn) sendBtn.addEventListener("click", sendMessage);
if (userInput) {
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
}


// =========================
// NEWS TICKER
// =========================
async function loadTicker() {
  try {
    const res = await fetch("https://api.spaceflightnewsapi.net/v4/articles/?limit=8");
    const data = await res.json();
    const headlines = data.results.map((item) => "🔴 " + item.title).join("     •     ");
    const ticker = document.getElementById("tickerText");
    if (ticker) ticker.textContent = headlines;
  } catch {
    const ticker = document.getElementById("tickerText");
    if (ticker) ticker.textContent = "Unable to load latest headlines.";
  }
}

loadTicker();
setInterval(loadTicker, 300000);

// =========================
// BACKGROUND PARTICLES
// =========================
const canvas = document.getElementById("particleCanvas");
if (canvas) {
  const ctx = canvas.getContext("2d");

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  const particles = [];
  for (let i = 0; i < 45; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 3 + 2,
      dx: (Math.random() - 0.5) * 1.2,
      dy: (Math.random() - 0.5) * 1.2
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.dx;
      p.y += p.dy;

      if (p.x < 0 || p.x > canvas.width) p.dx *= -1.2;
      if (p.y < 0 || p.y > canvas.height) p.dy *= -1.2;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,0,0,0.35)";
      ctx.shadowColor = "red";
      ctx.shadowBlur = 15;
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = "rgba(255,0,0,0.08)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animate);
  }
  animate();
}
// =========================
// NEW CHAT BUTTON
// =========================
document.getElementById("newChatBtn").onclick = () => {

    if (currentChat.length) {

        chats.unshift({
            title: currentChat[0].text.substring(0, 30),
            messages: currentChat
        });

        localStorage.setItem(
            "cjptv_chats",
            JSON.stringify(chats)
        );
    }

    currentChat = [];

    chat.innerHTML = "";

    hero.classList.remove("hide");

    loadHistory();
};
function loadHistory() {

    const list = document.getElementById("historyList");

    list.innerHTML = "";

    chats.forEach((c) => {

        const item = document.createElement("div");

        item.innerText = c.title;

        item.onclick = () => {

            chat.innerHTML = "";

            currentChat = [];

            c.messages.forEach((m) => {
                addMessage(m.text, m.type);
            });

        };

        list.appendChild(item);

    });

}
document.getElementById("guestBtn").onclick = async () => {
    try {
        await signInAnonymously(auth);
    } catch (err) {
        console.error(err);
    }
};
document.getElementById("googleLoginBtn").onclick = async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (err) {
        console.error(err);
        alert(err.message);
    }
};
onAuthStateChanged(auth, (user) => {

    if (!user) return;

    console.log("Photo URL:", user.photoURL);

    document.getElementById("nameModal").style.display = "none";

    const loginBtn=document.getElementById("sidebarLoginBtn");

    if(user.isAnonymous){

        heroText.innerText="Welcome, Guest 👋";

        document.getElementById("userName").innerText="Guest";

        document.getElementById("userStatus").innerText="Guest Mode";

        loginBtn.innerText="Login";

    }else{

        heroText.innerText=`Welcome, ${user.displayName} 👋`;

        document.getElementById("userName").innerText=user.displayName;

        document.getElementById("userStatus").innerText=user.email;

        document.getElementById("userAvatar").src =
user.photoURL ||
`https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=f8501c&color=fff`;

        loginBtn.innerText="Logout";
    }

});
document.getElementById("sidebarLoginBtn").onclick = async () => {

    if(auth.currentUser){

        if(auth.currentUser.isAnonymous){

            await signOut(auth);
            await signInWithPopup(auth,provider);

        }else{

            await signOut(auth);
            location.reload();

        }

    }else{

        await signInWithPopup(auth,provider);

    }

};