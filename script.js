/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Turn **text** into bold text without inserting untrusted HTML.
function formatAssistantMessage(element, content) {
  const boldTextPattern = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  element.textContent = "";

  while ((match = boldTextPattern.exec(content)) !== null) {
    element.append(document.createTextNode(content.slice(lastIndex, match.index)));

    const boldText = document.createElement("strong");
    boldText.textContent = match[1];
    element.appendChild(boldText);

    lastIndex = boldTextPattern.lastIndex;
  }

  element.appendChild(document.createTextNode(content.slice(lastIndex)));
}

// Add a labeled message bubble to the conversation.
function addMessage(role, content) {
  const message = document.createElement("article");
  message.className = `message ${role}`;

  const label = document.createElement("span");
  label.className = "message-label";
  label.textContent = role === "user" ? "You" : "L'Oréal Assistant";

  const bubble = document.createElement("p");
  bubble.className = "message-bubble";
  if (role === "assistant") {
    formatAssistantMessage(bubble, content);
  } else {
    bubble.textContent = content;
  }

  message.append(label, bubble);
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  return bubble;
}

// Show a welcome message when the page loads.
addMessage("assistant", "👋 Hello! How can I help you today?");

// Cloudflare Worker URL
const workerURL = "https://lorealwebpage.starwars3805.workers.dev/";

let messages = [
  { role: "system", content: "You are an expert chatbot specializing exclusively in L’Oréal products, skincare and haircare routines, and relevant product recommendations. Respond only to questions directly related to L’Oréal’s offerings or how to use them. If a user’s query is not about L’Oréal products, routines, or recommendations, politely inform them that you can only assist with L’Oréal-related topics and invite them to ask another question within your expertise. **Output Format:**  - Provide responses as short, informative paragraphs or bullet points as appropriate. - Always ensure content stays strictly within the scope of L’Oréal products, routines, or recommendations. --- **Examples:**  **Example 1:**  **User:** What is the best L’Oréal moisturizer for oily skin?  **Assistant Reasoning:**  - Identify L’Oréal moisturizers suitable for oily skin  - Consider the user’s skin type  - Select and describe a product that addresses oily skin concerns  **Assistant Conclusion:**  For oily skin, L’Oréal’s Hydra Genius Daily Liquid Care for Normal/Oily Skin is a great option, as it provides lightweight hydration without excess shine. --- **Example 2:**  **User:** Can you recommend a hair color from L’Oréal for covering grays?  **Assistant Reasoning:**  - List L’Oréal hair color products designed for gray coverage  - Consider convenience and effectiveness  - Highlight a popular choice  **Assistant Conclusion:**  L’Oréal Excellence Creme is excellent for covering gray hair, offering rich color and long-lasting results. ---**Example 3:**  **User:** What is the weather like today?  **Assistant Conclusion:**  I'm here to help with questions related to L’Oréal products, routines, andrecommendations. Please ask me anything specific to L’Oréal.---**Important Considerations:**  - Never answer questions outside the L’Oréal products, routines, andrecommendations domain.- Always redirect politely if queried about unrelated topics.- Focus on helpful, specific guidance about L’Oréal’s range.---**Task Reminder:**  Always restrict responses to L’Oréal products, skincare/haircare routines, andproduct recommendations. Politely decline unrelated queries. Provide clear,detailed, and on-topic answers." }
];

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userMessage = userInput.value.trim();
  if (!userMessage) {
    return;
  }

  // Keep the user's question visible above the assistant's response.
  addMessage("user", userMessage);

  // When using Cloudflare, you'll need to POST a `messages` array in the body,
  // and handle the response using: data.choices[0].message.content

  messages.push({ role: "user", content: userMessage });
  const assistantBubble = addMessage("assistant", "Thinking...");

  try {
    const response = await fetch(workerURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: messages,
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    formatAssistantMessage(assistantBubble, assistantMessage);
    messages.push(
      {
        role: "assistant",
        content: assistantMessage
      }
    );

  } catch (error) {
    console.error("Error fetching response:", error);
    assistantBubble.textContent =
      "Sorry, something went wrong. Please try again.";
  }

  userInput.value = "";

});
