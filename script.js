// ============================================================
// CJPTV AI — FIRE EDITION
// FIXED CHAT + MEMORY + IMAGE ANALYSIS + LIVE SEARCH + FIREBASE
// ============================================================

import {
    auth,
    provider,
    signInWithPopup,
    signInAnonymously,
    signOut,
    onAuthStateChanged
} from "./firebase.js";

// ============================================================
// CONFIG
// ============================================================

const BACKEND_URL =
    "https://cjptv-backendv3.vercel.app/api/chat";

const TAVILY_URL =
    "https://api.tavily.com/search";

const POLLINATIONS_URL =
    "https://image.pollinations.ai/prompt/";

const STORAGE_HISTORY =
    "cjptv_chat_history";

const STORAGE_MEMORY =
    "cjptv_memory";

const STORAGE_GUEST =
    "cjptv_guest_name";


// ============================================================
// DOM
// ============================================================

const $ = id =>
    document.getElementById(id);

const sidebar =
    $("sidebar");

const menuBtn =
    $("menuBtn");

const closeSidebar =
    $("closeSidebar");

const chat =
    $("chat");

const hero =
    $("hero");

const heroText =
    $("heroText");

const userInput =
    $("userInput");

const sendBtn =
    $("sendBtn");

const historyList =
    $("historyList");

const newChatBtn =
    $("newChatBtn");

const nameModal =
    $("nameModal");

const googleLoginBtn =
    $("googleLoginBtn");

const guestBtn =
    $("guestBtn");

const sidebarLoginBtn =
    $("sidebarLoginBtn");

const userName =
    $("userName");

const userStatus =
    $("userStatus");

const userAvatar =
    $("userAvatar");

const tickerText =
    $("tickerText");

const aboutBtn =
    $("aboutBtn");

const aboutModal =
    $("aboutModal");

const closeAbout =
    $("closeAbout");

const imageViewer =
    $("imageViewer");

const viewerImg =
    $("viewerImg");

const closeImage =
    $("closeImage");

const downloadImage =
    $("downloadImage");

const attachBtn =
    $("attachBtn");

const imageInput =
    $("imageInput");

const imagePreviewContainer =
    $("imagePreviewContainer");

const imagePreview =
    $("imagePreview");

const removeImageBtn =
    $("removeImageBtn");


// ============================================================
// STATE
// ============================================================

let attachedImageBase64 = null;

let currentUser = null;

let currentChat = [];

let isThinking = false;


// ============================================================
// HERO
// ============================================================

function showHero() {

    if (hero) {
        hero.style.display = "flex";
    }
}


function hideHero() {

    if (hero) {
        hero.style.display = "none";
    }
}


// ============================================================
// SCROLL
// ============================================================

function scrollToBottom() {

    requestAnimationFrame(() => {

        window.scrollTo({
            top:
                document.body.scrollHeight,
            behavior:
                "smooth"
        });

    });
}


// ============================================================
// CLEAN AI RESPONSE
// ============================================================

function cleanAIReply(text) {
    if (!text) return "";

    return String(text)
        // HTML
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>\s*<p>/gi, "\n\n")
        .replace(/<[^>]*>/g, "")

        // Markdown bold / italic
        .replace(/\*\*(.*?)\*\*/gs, "$1")
        .replace(/__(.*?)__/gs, "$1")
        .replace(/\*(.*?)\*/gs, "$1")
        .replace(/_(.*?)_/gs, "$1")

        // Remove leftover asterisks/underscores
        .replace(/\*/g, "")
        .replace(/_/g, "")

        // HTML entities
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")

        // Clean excessive blank lines
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}


// ============================================================
// MESSAGE CREATION
// ============================================================

function addMessage(
    text,
    type = "user-msg",
    save = true,
    imageSrc = null
) {

    if (!chat) {
        return null;
    }

    hideHero();

    const message =
        document.createElement(
            "div"
        );

    message.className =
        `message ${type}`;

    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "message-bubble";


    // --------------------------------------------------------
    // IMAGE
    // --------------------------------------------------------

    if (imageSrc) {

        const img =
            document.createElement(
                "img"
            );

        img.src =
            imageSrc;

        img.style.maxWidth =
            "100%";

        img.style.maxHeight =
            "240px";

        img.style.borderRadius =
            "12px";

        img.style.marginBottom =
            text
                ? "10px"
                : "0";

        img.style.display =
            "block";

        img.style.cursor =
            "pointer";

        img.addEventListener(
            "click",
            () => {
                openImageViewer(
                    imageSrc
                );
            }
        );

        bubble.appendChild(
            img
        );
    }


    // --------------------------------------------------------
    // TEXT
    // --------------------------------------------------------

    if (text) {

        const textNode =
            document.createElement(
                "div"
            );

        textNode.textContent =
            text;

        bubble.appendChild(
            textNode
        );
    }


    message.appendChild(
        bubble
    );

    chat.appendChild(
        message
    );


    // --------------------------------------------------------
    // SAVE
    // --------------------------------------------------------

    if (save) {

        currentChat.push({

            type,

            text:
                text || "",

            image:
                imageSrc || null,

            time:
                Date.now()

        });
    }


    scrollToBottom();

    return message;
}


// ============================================================
// AI MESSAGE
// ============================================================

async function typeAIMessage(
    text,
    save = true
) {

    if (!chat) {
        return;
    }

    hideHero();

    const cleaned =
        cleanAIReply(text);

    const message =
        document.createElement(
            "div"
        );

    message.className =
        "message ai-msg";

    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "message-bubble";

    message.appendChild(
        bubble
    );

    chat.appendChild(
        message
    );


    let output = "";

    for (
        let i = 0;
        i < cleaned.length;
        i++
    ) {

        output +=
            cleaned[i];

        bubble.textContent =
            output;

        if (
            i % 3 === 0
        ) {

            scrollToBottom();

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        8
                    )
            );
        }
    }


    bubble.textContent =
        cleaned;


    if (save) {

        currentChat.push({

            type:
                "ai-msg",

            text:
                cleaned,

            time:
                Date.now()

        });
    }


    scrollToBottom();
}


// ============================================================
// THINKING DOTS
// ============================================================

function createThinking() {

    if (!chat) {
        return null;
    }

    const message =
        document.createElement(
            "div"
        );

    message.className =
        "message ai-msg thinking-message";


    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "message-bubble";


    bubble.innerHTML = `
        <span class="thinking-dots">
            <span></span>
            <span></span>
            <span></span>
        </span>
    `;


    message.appendChild(
        bubble
    );

    chat.appendChild(
        message
    );

    scrollToBottom();

    return message;
}


// ============================================================
// TAVILY KEY
// ============================================================

function getTavilyKey() {

    try {

        if (
            typeof TAVILY_API_KEY !==
                "undefined" &&
            TAVILY_API_KEY
        ) {

            return TAVILY_API_KEY;
        }

    } catch (_) {}


    if (
        typeof window !==
            "undefined" &&
        window.TAVILY_API_KEY
    ) {

        return window.TAVILY_API_KEY;
    }


    return null;
}


// ============================================================
// LIVE SEARCH
// ============================================================

async function liveSearch(
    query
) {

    const key =
        getTavilyKey();

    if (!key) {
        return "";
    }


    try {

        const response =
            await fetch(
                TAVILY_URL,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            api_key:
                                key,

                            query:
                                query,

                            search_depth:
                                "advanced",

                            include_answer:
                                true,

                            include_raw_content:
                                false,

                            max_results:
                                6
                        })
                }
            );


        if (!response.ok) {

            console.warn(
                "Tavily failed:",
                response.status
            );

            return "";
        }


        const data =
            await response.json();


        let context = "";


        if (
            data.answer
        ) {

            context +=
                `LIVE SEARCH ANSWER:\n${data.answer}\n\n`;
        }


        if (
            Array.isArray(
                data.results
            )
        ) {

            context +=
                "LIVE WEB RESULTS:\n";


            data.results.forEach(
                (result, index) => {

                    context += `
${index + 1}. ${result.title || "Untitled"}
URL: ${result.url || ""}
CONTENT: ${result.content || ""}
`;
                }
            );
        }


        return context.trim();

    } catch (error) {

        console.warn(
            "Live search error:",
            error
        );

        // IMPORTANT:
        // Search failure must NOT break chat.
        return "";
    }
}


// ============================================================
// FRESH INFORMATION
// ============================================================

function needsFreshInfo(
    query
) {

    if (!query) {
        return false;
    }

    const q =
        query.toLowerCase();


    const freshWords = [

        "latest",
        "current",
        "today",
        "tonight",
        "now",
        "recent",
        "recently",
        "news",
        "breaking",
        "update",
        "updates",
        "price",
        "prices",
        "stock",
        "score",
        "scores",
        "match",
        "weather",
        "forecast",
        "president",
        "prime minister",
        "ceo",
        "election",
        "release",
        "released",
        "launch",
        "launched",
        "2025",
        "2026"

    ];


    return freshWords.some(
        word =>
            q.includes(word)
    );
}


// ============================================================
// MEMORY
// ============================================================

function getMemory() {

    try {

        const raw =
            localStorage.getItem(
                STORAGE_MEMORY
            );

        if (!raw) {
            return {};
        }

        const memory =
            JSON.parse(raw);

        return (
            memory &&
            typeof memory ===
                "object"
        )
            ? memory
            : {};

    } catch (error) {

        console.warn(
            "Memory read error:",
            error
        );

        return {};
    }
}


function saveMemory(
    key,
    value
) {

    try {

        const memory =
            getMemory();

        memory[key] =
            value;

        localStorage.setItem(
            STORAGE_MEMORY,
            JSON.stringify(
                memory
            )
        );

    } catch (error) {

        console.warn(
            "Memory save error:",
            error
        );
    }
}


function getMemoryContext() {

    const memory =
        getMemory();


    if (
        !Object.keys(
            memory
        ).length
    ) {

        return "";
    }


    return JSON.stringify(
        memory
    );
}


// ============================================================
// CONVERSATION MEMORY
// ============================================================

function getConversationForBackend() {

    return currentChat

        .filter(
            message => {

                return (
                    message.type ===
                        "user-msg" ||
                    message.type ===
                        "ai-msg"
                );
            }
        )

        .map(
            message => {

                return {

                    role:
                        message.type ===
                        "user-msg"
                            ? "user"
                            : "assistant",

                    content:
                        cleanAIReply(
                            message.text ||
                                ""
                        )

                };
            }
        )

        .filter(
            message =>
                message.content.trim()
        );
}


// ============================================================
// BACKEND CHAT
// ============================================================

async function askBackend(
    query,
    liveContext = "",
    image = null
) {

    /*
     * IMPORTANT:
     *
     * The current user message is already inside
     * currentChat.
     *
     * Therefore conversation contains the full
     * conversation INCLUDING the newest message.
     */

    const conversation =
        getConversationForBackend();


    const memoryContext =
        getMemoryContext();


    const payload = {

        message:
            query ||
            "Analyze this image.",

        image:
            image || null,

        liveContext:
            liveContext || "",

        conversation:
            conversation,

        memory:
            memoryContext

    };


    console.log(
        "CJPTV → backend",
        {
            messages:
                conversation.length,
            hasImage:
                !!image,
            hasLiveContext:
                !!liveContext,
            hasMemory:
                !!memoryContext
        }
    );


    let response;


    try {

        response =
            await fetch(
                BACKEND_URL,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );

    } catch (networkError) {

        console.error(
            "CJPTV backend network error:",
            networkError
        );

        throw new Error(
            "Unable to reach CJPTV backend."
        );
    }


    const rawText =
        await response.text();


    console.log(
        "CJPTV backend status:",
        response.status
    );


    if (!response.ok) {

        console.error(
            "CJPTV backend error:",
            rawText
        );

        throw new Error(
            `Backend returned ${response.status}`
        );
    }


    let data;


    try {

        data =
            JSON.parse(
                rawText
            );

    } catch (error) {

        console.error(
            "Invalid backend JSON:",
            rawText
        );

        throw new Error(
            "Backend returned invalid JSON."
        );
    }


    const reply =
        data.reply ??
        data.response ??
        data.answer ??
        data.message ??
        data.text ??
        data.result;


    if (
        typeof reply !==
            "string" ||
        !reply.trim()
    ) {

        console.error(
            "Empty backend response:",
            data
        );

        throw new Error(
            "Backend returned an empty response."
        );
    }


    return cleanAIReply(
        reply
    );
}


// ============================================================
// IMAGE COMPRESSION
// ============================================================

function compressImage(
    file,
    maxWidth = 768,
    quality = 0.65
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const reader =
                new FileReader();


            reader.onload =
                event => {

                    const img =
                        new Image();


                    img.onload =
                        () => {

                            let width =
                                img.width;

                            let height =
                                img.height;


                            if (
                                width >
                                maxWidth
                            ) {

                                height =
                                    Math.round(
                                        (
                                            height *
                                            maxWidth
                                        ) /
                                        width
                                    );

                                width =
                                    maxWidth;
                            }


                            const canvas =
                                document.createElement(
                                    "canvas"
                                );


                            canvas.width =
                                width;

                            canvas.height =
                                height;


                            const ctx =
                                canvas.getContext(
                                    "2d"
                                );


                            ctx.drawImage(
                                img,
                                0,
                                0,
                                width,
                                height
                            );


                            resolve(
                                canvas.toDataURL(
                                    "image/jpeg",
                                    quality
                                )
                            );
                        };


                    img.onerror =
                        reject;

                    img.src =
                        event.target.result;
                };


            reader.onerror =
                reject;


            reader.readAsDataURL(
                file
            );
        }
    );
}


// ============================================================
// IMAGE ATTACHMENT
// ============================================================

if (
    attachBtn &&
    imageInput
) {

    attachBtn.addEventListener(
        "click",
        () => {

            imageInput.value =
                "";

            imageInput.click();
        }
    );


    imageInput.addEventListener(
        "change",
        async event => {

            const file =
                event.target.files?.[0];


            if (
                !file ||
                !file.type.startsWith(
                    "image/"
                )
            ) {

                return;
            }


            try {

                attachedImageBase64 =
                    await compressImage(
                        file,
                        768,
                        0.65
                    );


                if (imagePreview) {

                    imagePreview.src =
                        attachedImageBase64;
                }


                if (
                    imagePreviewContainer
                ) {

                    imagePreviewContainer.style.display =
                        "flex";
                }

            } catch (error) {

                console.error(
                    "Image processing error:",
                    error
                );

                alert(
                    "Failed to process image."
                );
            }
        }
    );
}


// ============================================================
// CLEAR IMAGE
// ============================================================

function clearAttachedImage() {

    attachedImageBase64 =
        null;


    if (imageInput) {

        imageInput.value =
            "";
    }


    if (imagePreview) {

        imagePreview.src =
            "";
    }


    if (
        imagePreviewContainer
    ) {

        imagePreviewContainer.style.display =
            "none";
    }
}


if (removeImageBtn) {

    removeImageBtn.addEventListener(
        "click",
        clearAttachedImage
    );
}


// ============================================================
// IMAGE GENERATION
// ============================================================

function isImageRequest(
    query
) {

    const q =
        query.toLowerCase();


    return (

        q.includes(
            "generate an image"
        ) ||

        q.includes(
            "generate image"
        ) ||

        q.includes(
            "create an image"
        ) ||

        q.includes(
            "make an image"
        ) ||

        q.includes(
            "draw an image"
        ) ||

        q.includes(
            "create a picture"
        ) ||

        q.includes(
            "generate a picture"
        ) ||

        q.startsWith(
            "image of "
        ) ||

        q.startsWith(
            "picture of "
        )

    );
}


function extractImagePrompt(
    query
) {

    return query
        .replace(
            /^(generate an image|generate image|create an image|make an image|draw an image|create a picture|generate a picture|image of|picture of)\s*/i,
            ""
        )
        .trim();
}


// ============================================================
// GENERATE IMAGE
// ============================================================

function generateImage(
    prompt
) {

    const url =
        POLLINATIONS_URL +
        encodeURIComponent(
            prompt
        );


    hideHero();


    const message =
        document.createElement(
            "div"
        );

    message.className =
        "message ai-msg";


    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "message-bubble";


    const img =
        document.createElement(
            "img"
        );

    img.src =
        url;

    img.alt =
        prompt;

    img.loading =
        "lazy";

    img.style.maxWidth =
        "100%";

    img.style.borderRadius =
        "18px";

    img.style.cursor =
        "pointer";


    img.addEventListener(
        "click",
        () => {

            openImageViewer(
                url
            );
        }
    );


    bubble.appendChild(
        img
    );

    message.appendChild(
        bubble
    );

    chat.appendChild(
        message
    );


    currentChat.push({

        type:
            "ai-image",

        text:
            url,

        prompt,

        time:
            Date.now()

    });


    scrollToBottom();

    saveCurrentChat();
}


// ============================================================
// IMAGE VIEWER
// ============================================================

function openImageViewer(
    url
) {

    if (
        !imageViewer ||
        !viewerImg
    ) {

        return;
    }


    viewerImg.src =
        url;


    imageViewer.classList.add(
        "active"
    );
}


function closeViewer() {

    if (!imageViewer) {
        return;
    }


    imageViewer.classList.remove(
        "active"
    );


    if (viewerImg) {

        viewerImg.src =
            "";
    }
}


if (closeImage) {

    closeImage.addEventListener(
        "click",
        closeViewer
    );
}


if (imageViewer) {

    imageViewer.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                imageViewer
            ) {

                closeViewer();
            }
        }
    );
}


if (downloadImage) {

    downloadImage.addEventListener(
        "click",
        () => {

            if (
                !viewerImg?.src
            ) {

                return;
            }


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                viewerImg.src;

            link.download =
                "cjptv-ai-image.jpg";

            link.target =
                "_blank";


            document.body.appendChild(
                link
            );

            link.click();

            link.remove();
        }
    );
}


// ============================================================
// SEND MESSAGE
// ============================================================

async function sendMessage() {

    if (isThinking) {
        return;
    }


    const query =
        userInput?.value.trim() ||
        "";


    const imageToSend =
        attachedImageBase64;


    if (
        !query &&
        !imageToSend
    ) {

        return;
    }


    // --------------------------------------------------------
    // ADD USER MESSAGE FIRST
    // --------------------------------------------------------

    if (userInput) {

        userInput.value =
            "";
    }


    clearAttachedImage();


    addMessage(
        query,
        "user-msg",
        true,
        imageToSend
    );


    // --------------------------------------------------------
    // IMAGE GENERATION
    // --------------------------------------------------------

    if (
        query &&
        isImageRequest(query) &&
        !imageToSend
    ) {

        const prompt =
            extractImagePrompt(
                query
            );


        if (prompt) {

            generateImage(
                prompt
            );

        } else {

            await typeAIMessage(
                "🔥 Tell me what you want me to generate.",
                true
            );

            saveCurrentChat();
        }


        return;
    }


    // --------------------------------------------------------
    // THINKING START
    // --------------------------------------------------------

    isThinking =
        true;


    if (sendBtn) {

        sendBtn.disabled =
            true;

        sendBtn.style.opacity =
            "0.6";
    }


    const thinking =
        createThinking();


    try {

        let liveContext =
            "";


        // ----------------------------------------------------
        // ONLY SEARCH WHEN NEEDED
        // ----------------------------------------------------

        if (
            query &&
            needsFreshInfo(
                query
            )
        ) {

            /*
             * If Tavily fails, liveSearch returns ""
             * and chat continues normally.
             */

            liveContext =
                await liveSearch(
                    query
                );
        }


        // ----------------------------------------------------
        // KEEP DOTS UNTIL BACKEND ACTUALLY FINISHES
        // ----------------------------------------------------

        const answer =
            await askBackend(
                query,
                liveContext,
                imageToSend
            );


        // ----------------------------------------------------
        // REMOVE DOTS ONLY NOW
        // ----------------------------------------------------

        if (thinking) {

            thinking.remove();
        }


        // ----------------------------------------------------
        // SHOW ANSWER
        // ----------------------------------------------------

        await typeAIMessage(
            answer,
            true
        );


        // ----------------------------------------------------
        // SAVE
        // ----------------------------------------------------

        saveCurrentChat();


    } catch (error) {

        console.error(
            "CJPTV AI error:",
            error
        );


        if (thinking) {

            thinking.remove();
        }


        await typeAIMessage(
            "⚠️ CJPTV AI couldn't connect to the server right now. Please try again in a moment.",
            true
        );


        saveCurrentChat();


    } finally {

        isThinking =
            false;


        if (sendBtn) {

            sendBtn.disabled =
                false;

            sendBtn.style.opacity =
                "1";
        }


        userInput?.focus();
    }
}


// ============================================================
// INPUT
// ============================================================

if (sendBtn) {

    sendBtn.addEventListener(
        "click",
        sendMessage
    );
}


if (userInput) {

    userInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                    "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();
            }
        }
    );
}


// ============================================================
// SIDEBAR
// ============================================================

if (menuBtn) {

    menuBtn.addEventListener(
        "click",
        () => {

            sidebar?.classList.toggle(
                "active"
            );
        }
    );
}


if (closeSidebar) {

    closeSidebar.addEventListener(
        "click",
        () => {

            sidebar?.classList.remove(
                "active"
            );
        }
    );
}


// ============================================================
// NEW CHAT
// ============================================================

function startNewChat() {

    saveCurrentChat();


    currentChat =
        [];


    if (chat) {

        chat.innerHTML =
            "";
    }


    showHero();


    if (heroText) {

        heroText.textContent =
            "What's next?";
    }


    sidebar?.classList.remove(
        "active"
    );


    userInput?.focus();
}


if (newChatBtn) {

    newChatBtn.addEventListener(
        "click",
        startNewChat
    );
}


// ============================================================
// HISTORY
// ============================================================

function getHistory() {

    try {

        const data =
            localStorage.getItem(
                STORAGE_HISTORY
            );


        if (!data) {
            return [];
        }


        const parsed =
            JSON.parse(data);


        return Array.isArray(
            parsed
        )
            ? parsed
            : [];

    } catch (error) {

        console.warn(
            "History read error:",
            error
        );

        return [];
    }
}


// ============================================================
// SAVE CHAT
// ============================================================

function saveCurrentChat() {

    if (
        !currentChat.length
    ) {

        return;
    }


    const history =
        getHistory();


    const firstUserMessage =
        currentChat.find(
            item =>
                item.type ===
                "user-msg"
        );


    const title =
        firstUserMessage?.text ||
        "New Chat";


    /*
     * Prevent accidentally saving the exact same
     * conversation repeatedly.
     */

    const last =
        history[0];


    if (
        last &&
        JSON.stringify(
            last.messages
        ) ===
        JSON.stringify(
            currentChat
        )
    ) {

        return;
    }


    const entry = {

        id:
            Date.now(),

        title:
            title.substring(
                0,
                60
            ),

        messages:
            currentChat,

        createdAt:
            Date.now()
    };


    history.unshift(
        entry
    );


    try {

        localStorage.setItem(
            STORAGE_HISTORY,
            JSON.stringify(
                history.slice(
                    0,
                    50
                )
            )
        );

    } catch (error) {

        console.warn(
            "History save error:",
            error
        );
    }


    renderHistory();
}


// ============================================================
// RENDER HISTORY
// ============================================================

function renderHistory() {

    if (!historyList) {
        return;
    }


    historyList.innerHTML =
        "";


    const history =
        getHistory();


    if (!history.length) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "history-empty";


        empty.textContent =
            "No chats yet";


        historyList.appendChild(
            empty
        );


        return;
    }


    history.forEach(
        item => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "history-item";


            button.textContent =
                item.title ||
                "New Chat";


            button.addEventListener(
                "click",
                () => {

                    loadChat(
                        item
                    );
                }
            );


            historyList.appendChild(
                button
            );
        }
    );
}


// ============================================================
// LOAD CHAT
// ============================================================

function loadChat(
    item
) {

    if (
        !item ||
        !Array.isArray(
            item.messages
        )
    ) {

        return;
    }


    currentChat =
        [];


    if (chat) {

        chat.innerHTML =
            "";
    }


    hideHero();


    item.messages.forEach(
        message => {

            if (
                message.type ===
                "ai-image"
            ) {

                const messageEl =
                    document.createElement(
                        "div"
                    );


                messageEl.className =
                    "message ai-msg";


                const bubble =
                    document.createElement(
                        "div"
                    );


                bubble.className =
                    "message-bubble";


                const img =
                    document.createElement(
                        "img"
                    );


                img.src =
                    message.text;


                img.alt =
                    message.prompt ||
                    "AI generated image";


                img.style.maxWidth =
                    "100%";

                img.style.borderRadius =
                    "18px";

                img.style.cursor =
                    "pointer";


                img.addEventListener(
                    "click",
                    () => {

                        openImageViewer(
                            message.text
                        );
                    }
                );


                bubble.appendChild(
                    img
                );

                messageEl.appendChild(
                    bubble
                );

                chat.appendChild(
                    messageEl
                );


                currentChat.push(
                    message
                );


                return;
            }


            const type =
                message.type ===
                "user-msg"
                    ? "user-msg"
                    : "ai-msg";


            addMessage(
                message.text ||
                    "",
                type,
                false,
                message.image ||
                    null
            );


            currentChat.push(
                message
            );
        }
    );


    sidebar?.classList.remove(
        "active"
    );


    scrollToBottom();
}


// ============================================================
// GUEST
// ============================================================

async function continueAsGuest() {

    try {

        await signInAnonymously(
            auth
        );

    } catch (error) {

        console.error(
            "Guest authentication failed:",
            error
        );

        alert(
            "Guest login failed. Please check Firebase Anonymous Authentication."
        );
    }
}


// ============================================================
// GOOGLE
// ============================================================

async function continueWithGoogle() {

    try {

        await signInWithPopup(
            auth,
            provider
        );

    } catch (error) {

        console.error(
            "Google authentication failed:",
            error
        );

        alert(
            "Google login failed. Please try again."
        );
    }
}


// ============================================================
// AUTH UI
// ============================================================

function updateUserUI(
    user
) {

    currentUser =
        user;


    if (!user) {

        if (userName) {

            userName.textContent =
                "Guest";
        }


        if (userStatus) {

            userStatus.textContent =
                "Not signed in";
        }


        if (userAvatar) {

            userAvatar.src =
                "https://ui-avatars.com/api/?name=Guest&background=f8501c&color=fff";
        }


        if (sidebarLoginBtn) {

            sidebarLoginBtn.textContent =
                "Login";
        }


        if (nameModal) {

            nameModal.classList.add(
                "active"
            );
        }


        return;
    }


    let displayName =
        "Guest";


    if (
        user.isAnonymous
    ) {

        displayName =
            localStorage.getItem(
                STORAGE_GUEST
            ) ||
            "Guest";

    } else {

        displayName =
            user.displayName ||
            user.email ||
            "User";
    }


    if (userName) {

        userName.textContent =
            displayName;
    }


    if (userStatus) {

        userStatus.textContent =
            user.isAnonymous
                ? "Guest mode"
                : "Signed in";
    }


    if (userAvatar) {

        userAvatar.src =
            user.photoURL ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                displayName
            )}&background=f8501c&color=fff`;
    }


    if (sidebarLoginBtn) {

        sidebarLoginBtn.textContent =
            "Logout";
    }


    if (nameModal) {

        nameModal.classList.remove(
            "active"
        );
    }
}


// ============================================================
// FIREBASE AUTH
// ============================================================

try {

    onAuthStateChanged(
        auth,
        user => {

            updateUserUI(
                user
            );
        }
    );

} catch (error) {

    console.error(
        "Firebase auth listener error:",
        error
    );
}


// ============================================================
// LOGIN BUTTONS
// ============================================================

if (googleLoginBtn) {

    googleLoginBtn.addEventListener(
        "click",
        continueWithGoogle
    );
}


if (guestBtn) {

    guestBtn.addEventListener(
        "click",
        continueAsGuest
    );
}


if (sidebarLoginBtn) {

    sidebarLoginBtn.addEventListener(
        "click",
        async () => {

            if (currentUser) {

                try {

                    await signOut(
                        auth
                    );

                    nameModal?.classList.add(
                        "active"
                    );

                } catch (error) {

                    console.error(
                        "Logout error:",
                        error
                    );
                }

            } else {

                nameModal?.classList.add(
                    "active"
                );
            }
        }
    );
}


// ============================================================
// ABOUT
// ============================================================

if (aboutBtn) {

    aboutBtn.addEventListener(
        "click",
        () => {

            aboutModal?.classList.add(
                "active"
            );
        }
    );
}


if (closeAbout) {

    closeAbout.addEventListener(
        "click",
        () => {

            aboutModal?.classList.remove(
                "active"
            );
        }
    );
}


if (aboutModal) {

    aboutModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                aboutModal
            ) {

                aboutModal.classList.remove(
                    "active"
                );
            }
        }
    );
}


// ============================================================
// YEAR
// ============================================================

const aboutYear =
    $("aboutYear");


if (aboutYear) {

    aboutYear.textContent =
        new Date().getFullYear();
}


const copyrightYear =
    $("copyrightYear");


if (copyrightYear) {

    copyrightYear.textContent =
        new Date().getFullYear();
}


// ============================================================
// LIVE TICKER
// ============================================================

async function loadTicker() {

    if (!tickerText) {
        return;
    }


    try {

        const response =
            await fetch(
                "https://api.spaceflightnewsapi.net/v4/articles/?limit=8"
            );


        if (!response.ok) {
            throw new Error(
                "Ticker API failed"
            );
        }


        const data =
            await response.json();


        if (
            !Array.isArray(
                data.results
            )
        ) {

            throw new Error(
                "No ticker results"
            );
        }


        const headlines =
            data.results
                .map(
                    item =>
                        item.title
                )
                .filter(Boolean);


        if (
            headlines.length
        ) {

            tickerText.textContent =
                headlines.join(
                    "   •   "
                );
        }

    } catch (error) {

        console.warn(
            "Ticker error:",
            error
        );


        tickerText.textContent =
            "CJPTV AI • Technology • Artificial Intelligence • Digital Innovation";
    }
}


// ============================================================
// WELCOME
// ============================================================

function showWelcome() {

    if (!chat) {
        return;
    }


    showHero();


    if (heroText) {

        heroText.textContent =
            "What's next?";
    }
}


// ============================================================
// INITIALIZATION
// ============================================================

function init() {

    renderHistory();

    showWelcome();

    loadTicker();

    userInput?.focus();


    console.log(
        "🔥 CJPTV AI initialized — memory enabled"
    );
}


init();


// ============================================================
// GLOBAL API
// ============================================================

window.CJPTV = {

    sendMessage,

    startNewChat,

    liveSearch,

    getMemory,

    saveMemory,

    getMemoryContext,

    getConversationForBackend,

    cleanAIReply

};


// ============================================================
// BACKGROUND PARTICLES
// ============================================================

const canvas =
    document.getElementById(
        "particleCanvas"
    );


if (canvas) {

    const ctx =
        canvas.getContext(
            "2d"
        );


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


    const particles =
        [];


    for (
        let i = 0;
        i < 45;
        i++
    ) {

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
                (
                    Math.random() -
                    0.5
                ) *
                1.2,

            dy:
                (
                    Math.random() -
                    0.5
                ) *
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


            p.x +=
                p.dx;

            p.y +=
                p.dy;


            if (
                p.x < 0 ||
                p.x > canvas.width
            ) {

                p.dx *=
                    -1;
            }


            if (
                p.y < 0 ||
                p.y > canvas.height
            ) {

                p.dy *=
                    -1;
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


                if (
                    dist < 120
                ) {

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


                    ctx.lineWidth =
                        1;


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