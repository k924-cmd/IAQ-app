import { getMockReply } from '../mocks/conversation.js';

export async function sendConversationMessage(message) {
  return {
    content: await getMockReply(message),
    source: 'mock'
  };
}
