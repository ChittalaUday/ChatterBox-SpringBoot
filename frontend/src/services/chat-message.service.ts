import { ChatMessage } from './chat.types';

const API_BASE_URL = 'http://localhost:8083/api/chat';

class ChatMessageService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getChatHistory(friendId: number): Promise<ChatMessage[]> {
    const response = await fetch(`${API_BASE_URL}/messages?friendId=${friendId}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch chat history');
    }

    return await response.json();
  }

  async sendMessage(receiverId: number, content: string): Promise<ChatMessage> {
    const response = await fetch(`${API_BASE_URL}/send`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ receiverId, content })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send message');
    }

    return await response.json();
  }

  async markMessagesAsRead(senderId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/mark-as-read`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ senderId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to mark messages as read');
    }

    return await response.json();
  }
}

export default new ChatMessageService();