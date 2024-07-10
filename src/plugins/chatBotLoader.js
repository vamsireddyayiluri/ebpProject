export function initializeChatbot() {
    const src = 'https://www.chatbase.co/embed.min.js'
    const chatbotId = 'i0RWw2HNO0QFoNQnIOouu'
    const domain = 'www.chatbase.co'
  
    const script = document.createElement('script')
    script.src = src
    script.defer = true
    script.setAttribute('chatbotId', chatbotId)
    script.setAttribute('domain', domain)
    document.head.appendChild(script)
  
    window.embeddedChatbotConfig = {
      chatbotId: chatbotId,
      domain: domain,
    }
  }