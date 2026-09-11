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

const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");
const closeSidebar = document.getElementById("closeSidebar");

// =========================
// LOAD SAVED USER
// =========================
window.onload = () => {

    const savedName = localStorage.getItem("sambhav_username");

    if (savedName) {

        memory.name = savedName;

        if (heroText) {
            heroText.innerText =
                `Welcome back, ${savedName} 👋`;
        }

        if (modal) {
            modal.style.display = "none";
        }

    } else if (modal) {

        modal.style.display = "flex";
    }

    loadHistory();
};

// =========================
// SIDEBAR
// =========================
if (menuBtn) {
    menuBtn.onclick = () => {
        sidebar.classList.add("open");
    };
}

if (closeSidebar) {
    closeSidebar.onclick = () => {
        sidebar.classList.remove("open");
    };
}

// =========================
// SAFE UI
// =========================
function addMessage(text, type, save = true) {

    const div = document.createElement("div");

    div.className = type;
    div.innerText = text;

    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;

    if (save) {

        currentChat.push({
            text,
            type
        });
    }

    return div;
}

function safeRemove(el) {

    if (el && el.parentNode) {
        el.parentNode.removeChild(el);
    }
}

// =========================
// LOCAL CHAT RESPONSES
// =========================
// These work WITHOUT Tavily/Gemini.
// Useful for identity, greetings and simple casual conversation.
function getLocalResponse(message) {

    const text = message.toLowerCase().trim();

    // Greetings
    if (
        ["hi", "hello", "hey", "hii", "hiii", "hola"]
            .includes(text)
    ) {
        return "👋 Hey! I'm CJPTV AI. How can I help you?";
    }

    // Who are you?
    if (
        text.includes("who are you") ||
        text.includes("what are you")
    ) {
        return "🤖 I'm CJPTV AI, your AI assistant. I can chat with you, answer questions, and use live web search when you need current information.";
    }

    // Who made you?
    if (
        text.includes("who made you") ||
        text.includes("who created you") ||
        text.includes("who built you") ||
        text.includes("who developed you")
    ) {
        return "🤖 I'm CJPTV AI, created for the CJPTV project.";
    }

    // What can you do?
    if (
        text.includes("what can you do") ||
        text.includes("your capabilities") ||
        text.includes("what do you do")
    ) {
        return "🚀 I can chat with you, explain things, help with questions, remember your name locally, generate images, and search the web when fresh information is needed.";
    }

    // How are you?
    if (
        text === "how are you" ||
        text === "how are you?"
    ) {
        return "😎 I'm doing great and ready to help!";
    }

    // Thanks
    if (
        text === "thanks" ||
        text === "thank you" ||
        text === "thx"
    ) {
        return "You're welcome! 😎";
    }

    // Good morning
    if (text.includes("good morning")) {
        return "🌅 Good morning! Hope you're having a great day.";
    }

    // Good afternoon
    if (text.includes("good afternoon")) {
        return "☀️ Good afternoon! What are we working on today?";
    }

    // Good evening
    if (text.includes("good evening")) {
        return "🌆 Good evening! How can I help?";
    }

    // Bye
    if (
        text === "bye" ||
        text === "goodbye" ||
        text === "see you"
    ) {
        return "👋 See you later!";
    }

    return null;
}

// =========================
// IMAGE GENERATION
// =========================
async function generateImage(prompt) {

    const url =
        "https://image.pollinations.ai/prompt/" +
        encodeURIComponent(prompt);

    addMessage("🎨 Generating image...", "ai-msg");

    const img = document.createElement("img");

    img.src = url;
    img.className = "ai-image";
    img.alt = prompt;

    img.onclick = () => {

        const viewerImg =
            document.getElementById("viewerImg");

        const imageViewer =
            document.getElementById("imageViewer");

        if (viewerImg && imageViewer) {

            viewerImg.src = url;
            imageViewer.style.display = "flex";
        }
    };

    chat.appendChild(img);
    chat.scrollTop = chat.scrollHeight;
}

// =========================
// CHATBOT API
// =========================
async function askAI(message) {

    const conversation = currentChat
        .slice(-12)
        .map(item => ({
            role:
                item.type === "user-msg"
                    ? "user"
                    : "assistant",
            content: item.text
        }));

    const res = await fetch(BACKEND_URL, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            message,
            conversation
        })
    });

    let data;

    try {
        data = await res.json();
    } catch {
        throw new Error(
            "Backend returned an invalid response."
        );
    }

    if (!res.ok) {

        throw new Error(
            data.error ||
            data.message ||
            `Server error ${res.status}`
        );
    }

    return data.reply ||
        data.choices?.[0]?.message?.content ||
        "No response received.";
}

// =========================
// SEND MESSAGE
// =========================
async function sendMessage() {

    const message = userInput.value.trim();

    if (!message) return;

    // =========================
    // LOCAL RESPONSE FIRST
    // =========================
    const localReply =
        getLocalResponse(message);

    if (localReply) {

        if (hero) {
            hero.classList.add("hide");
        }

        addMessage(message, "user-msg");

        addMessage(
            localReply,
            "ai-msg"
        );

        userInput.value = "";

        return;
    }

    // =========================
    // SAVE NAME
    // =========================
    const lower = message.toLowerCase();

    if (lower.startsWith("my name is ")) {

        const name =
            message.substring(11).trim();

        saveMemory("name", name);

        addMessage(
            message,
            "user-msg"
        );

        addMessage(
            "😊 Nice to meet you, " +
            name +
            "! I'll remember your name.",
            "ai-msg"
        );

        userInput.value = "";

        return;
    }

    // =========================
    // NAME RECALL
    // =========================
    if (
        lower.includes("what is my name") ||
        lower.includes("what's my name")
    ) {

        addMessage(
            message,
            "user-msg"
        );

        const name = memory.name;

        if (name) {

            addMessage(
                "👤 Your name is " +
                name,
                "ai-msg"
            );

        } else {

            addMessage(
                "I don't know your name yet 😊",
                "ai-msg"
            );
        }

        userInput.value = "";

        return;
    }

    // =========================
    // IMAGE GENERATION
    // =========================
    const imageTriggers = [
        "draw ",
        "create image",
        "generate image",
        "make image",
        "create an image",
        "design ",
        "create poster of"
    ];

    if (
        imageTriggers.some(trigger =>
            lower.startsWith(trigger)
        )
    ) {

        const prompt = message
            .replace(
                /draw|create image|generate image|make image|create an image|design|create poster of/gi,
                ""
            )
            .trim();

        if (hero) {
            hero.classList.add("hide");
        }

        addMessage(
            message,
            "user-msg"
        );

        userInput.value = "";

        await generateImage(prompt);

        return;
    }

    // =========================
    // NORMAL CHAT
    // =========================
    if (hero) {
        hero.classList.add("hide");
    }

    addMessage(
        message,
        "user-msg"
    );

    userInput.value = "";

    const loading =
        document.createElement("div");

    loading.className = "ai-msg";
    loading.innerText = "Thinking...";

    chat.appendChild(loading);
    chat.scrollTop = chat.scrollHeight;

    try {

        const reply =
            await askAI(message);

        safeRemove(loading);

        const div =
            document.createElement("div");

        div.className = "ai-msg";

        chat.appendChild(div);

        let i = 0;

        function typeWriter() {

            if (i < reply.length) {

                div.textContent +=
                    reply.charAt(i);

                i++;

                chat.scrollTop =
                    chat.scrollHeight;

                setTimeout(
                    typeWriter,
                    12
                );

            } else {

                currentChat.push({
                    text: reply,
                    type: "ai-msg"
                });
            }
        }

        typeWriter();

    } catch (err) {

        safeRemove(loading);

        addMessage(
            "⚠️ " +
            (err.message ||
                "Something went wrong."),
            "ai-msg"
        );
    }
}

// =========================
// IMAGE VIEWER
// =========================
const closeImgBtn =
    document.getElementById("closeImage");

if (closeImgBtn) {

    closeImgBtn.onclick = () => {

        const imageViewer =
            document.getElementById(
                "imageViewer"
            );

        if (imageViewer) {
            imageViewer.style.display =
                "none";
        }
    };
}

const imageViewer =
    document.getElementById("imageViewer");

if (imageViewer) {

    imageViewer.onclick = (e) => {

        if (
            e.target.id ===
            "imageViewer"
        ) {
            imageViewer.style.display =
                "none";
        }
    };
}

const downloadImgBtn =
    document.getElementById(
        "downloadImage"
    );

if (downloadImgBtn) {

    downloadImgBtn.onclick = () => {

        const img =
            document.getElementById(
                "viewerImg"
            );

        if (!img) return;

        const a =
            document.createElement("a");

        a.href = img.src;
        a.download =
            "CJPTV_AI_Image.png";

        document.body.appendChild(a);

        a.click();

        document.body.removeChild(a);
    };
}

// =========================
// EVENTS
// =========================
if (sendBtn) {

    sendBtn.addEventListener(
        "click",
        sendMessage
    );
}

if (userInput) {

    userInput.addEventListener(
        "keypress",
        (e) => {

            if (e.key === "Enter") {
                sendMessage();
            }
        }
    );
}

// =========================
// NEWS TICKER
// =========================
async function loadTicker() {

    try {

        const res =
            await fetch(
                "https://api.spaceflightnewsapi.net/v4/articles/?limit=8"
            );

        const data =
            await res.json();

        const headlines =
            data.results
                .map(
                    item =>
                        "🔴 " +
                        item.title
                )
                .join(
                    "     •     "
                );

        const ticker =
            document.getElementById(
                "tickerText"
            );

        if (ticker) {
            ticker.textContent =
                headlines;
        }

    } catch {

        const ticker =
            document.getElementById(
                "tickerText"
            );

        if (ticker) {

            ticker.textContent =
                "Unable to load latest headlines.";
        }
    }
}

loadTicker();

setInterval(
    loadTicker,
    300000
);

// =========================
// BACKGROUND PARTICLES
// =========================
const canvas =
    document.getElementById(
        "particleCanvas"
    );

if (canvas) {

    const ctx =
        canvas.getContext("2d");

    function resizeCanvas() {

        canvas.width =
            window.innerWidth;

        canvas.height =
            window.innerHeight;
    }

    resizeCanvas();

    window.addEventListener(
        "resize",
        resizeCanvas
    );

    const particles = [];

    for (let i = 0; i < 45; i++) {

        particles.push({

            x:
                Math.random() *
                canvas.width,

            y:
                Math.random() *
                canvas.height,

            r:
                Math.random() *
                3 +
                2,

            dx:
                (Math.random() -
                    0.5) *
                1.2,

            dy:
                (Math.random() -
                    0.5) *
                1.2
        });
    }

    function animate() {

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        for (
            let i = 0;
            i < particles.length;
            i++
        ) {

            const p =
                particles[i];

            p.x += p.dx;
            p.y += p.dy;

            if (
                p.x < 0 ||
                p.x > canvas.width
            ) {
                p.dx *= -1.2;
            }

            if (
                p.y < 0 ||
                p.y > canvas.height
            ) {
                p.dy *= -1.2;
            }

            ctx.beginPath();

            ctx.arc(
                p.x,
                p.y,
                p.r,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                "rgba(255,0,0,0.35)";

            ctx.shadowColor =
                "red";

            ctx.shadowBlur =
                15;

            ctx.fill();

            for (
                let j = i + 1;
                j < particles.length;
                j++
            ) {

                const p2 =
                    particles[j];

                const dist =
                    Math.hypot(
                        p.x - p2.x,
                        p.y - p2.y
                    );

                if (dist < 120) {

                    ctx.beginPath();

                    ctx.moveTo(
                        p.x,
                        p.y
                    );

                    ctx.lineTo(
                        p2.x,
                        p2.y
                    );

                    ctx.strokeStyle =
                        "rgba(255,0,0,0.08)";

                    ctx.lineWidth = 1;

                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(
            animate
        );
    }

    animate();
}

// =========================
// NEW CHAT
// =========================
const newChatBtn =
    document.getElementById(
        "newChatBtn"
    );

if (newChatBtn) {

    newChatBtn.onclick = () => {

        if (currentChat.length) {

            chats.unshift({

                title:
                    currentChat[0].text
                        .substring(0, 30),

                messages:
                    currentChat
            });

            localStorage.setItem(
                "cjptv_chats",
                JSON.stringify(chats)
            );
        }

        currentChat = [];

        chat.innerHTML = "";

        if (hero) {
            hero.classList.remove(
                "hide"
            );
        }

        loadHistory();
    };
}

// =========================
// CHAT HISTORY
// =========================
function loadHistory() {

    const list =
        document.getElementById(
            "historyList"
        );

    if (!list) return;

    list.innerHTML = "";

    chats.forEach((c) => {

        const item =
            document.createElement(
                "div"
            );

        item.innerText =
            c.title;

        item.onclick = () => {

            chat.innerHTML = "";

            currentChat = [];

            c.messages.forEach(
                (m) => {

                    addMessage(
                        m.text,
                        m.type
                    );
                }
            );
        };

        list.appendChild(item);
    });
}

// =========================
// GUEST LOGIN
// =========================
const guestBtn =
    document.getElementById(
        "guestBtn"
    );

if (guestBtn) {

    guestBtn.onclick = async () => {

        try {

            await signInAnonymously(
                auth
            );

        } catch (err) {

            console.error(err);
        }
    };
}

// =========================
// GOOGLE LOGIN
// =========================
const googleLoginBtn =
    document.getElementById(
        "googleLoginBtn"
    );

if (googleLoginBtn) {

    googleLoginBtn.onclick =
        async () => {

            try {

                await signInWithPopup(
                    auth,
                    provider
                );

            } catch (err) {

                console.error(err);

                alert(
                    err.message
                );
            }
        };
}

// =========================
// FIREBASE AUTH STATE
// =========================
onAuthStateChanged(
    auth,
    (user) => {

        if (!user) return;

        console.log(
            "Photo URL:",
            user.photoURL
        );

        const nameModal =
            document.getElementById(
                "nameModal"
            );

        if (nameModal) {
            nameModal.style.display =
                "none";
        }

        const loginBtn =
            document.getElementById(
                "sidebarLoginBtn"
            );

        if (user.isAnonymous) {

            if (heroText) {
                heroText.innerText =
                    "Welcome, Guest 👋";
            }

            const userName =
                document.getElementById(
                    "userName"
                );

            const userStatus =
                document.getElementById(
                    "userStatus"
                );

            if (userName) {
                userName.innerText =
                    "Guest";
            }

            if (userStatus) {
                userStatus.innerText =
                    "Guest Mode";
            }

            if (loginBtn) {
                loginBtn.innerText =
                    "Login";
            }

        } else {

            if (heroText) {

                heroText.innerText =
                    `Welcome, ${user.displayName} 👋`;
            }

            const userName =
                document.getElementById(
                    "userName"
                );

            const userStatus =
                document.getElementById(
                    "userStatus"
                );

            const userAvatar =
                document.getElementById(
                    "userAvatar"
                );

            if (userName) {
                userName.innerText =
                    user.displayName;
            }

            if (userStatus) {
                userStatus.innerText =
                    user.email;
            }

            if (userAvatar) {

                userAvatar.src =
                    user.photoURL ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        user.displayName || "User"
                    )}&background=f8501c&color=fff`;
            }

            if (loginBtn) {
                loginBtn.innerText =
                    "Logout";
            }
        }
    }
);

// =========================
// LOGIN / LOGOUT
// =========================
const sidebarLoginBtn =
    document.getElementById(
        "sidebarLoginBtn"
    );

if (sidebarLoginBtn) {

    sidebarLoginBtn.onclick =
        async () => {

            console.log(
                "LOGIN CLICKED"
            );

            try {

                if (auth.currentUser) {

                    if (
                        auth.currentUser
                            .isAnonymous
                    ) {

                        await signOut(
                            auth
                        );

                        await signInWithPopup(
                            auth,
                            provider
                        );

                    } else {

                        await signOut(
                            auth
                        );

                        location.reload();
                    }

                } else {

                    await signInWithPopup(
                        auth,
                        provider
                    );
                }

            } catch (err) {

                console.log(err);

                alert(
                    err.code +
                    "\n" +
                    err.message
                );
            }
        };
}

// =========================
// COPYRIGHT YEAR
// =========================
const copyrightYear =
    document.getElementById(
        "copyrightYear"
    );

if (copyrightYear) {

    copyrightYear.textContent =
        new Date().getFullYear();
}