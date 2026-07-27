// =========================
// SMART ROUTER
// =========================

function detectIntent(message) {

  const text = message.toLowerCase().trim();

  if (
    text.includes("today's date") ||
    text === "date"
  ) {
    return "date";
  }

  if (
    text.includes("news") ||
    text.includes("headline")
  ) {
    return "news";
  }

  if (
    text.startsWith("who is") ||
    text.startsWith("what is") ||
    text.startsWith("where is")
  ) {
    return "wiki";
  }

  if (
    text.includes("my name") ||
    text.includes("remember")
  ) {
    return "memory";
  }

  return "chat";
}
