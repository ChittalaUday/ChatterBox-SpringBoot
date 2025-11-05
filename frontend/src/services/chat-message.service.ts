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

  async sendMessage(receiverId: number, content: string, fileData?: {
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    messageType?: string;
  }): Promise<ChatMessage> {
    const payload: any = { receiverId, content };
    if (fileData) {
      payload.fileUrl = fileData.fileUrl;
      payload.fileName = fileData.fileName;
      payload.fileType = fileData.fileType;
      payload.fileSize = fileData.fileSize;
      payload.messageType = fileData.messageType;
    }

    const response = await fetch(`${API_BASE_URL}/send`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send message');
    }

    return await response.json();
  }

  async uploadFile(file: File): Promise<{
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    messageType: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:8083/api/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to upload file');
    }

    return await response.json();
  }

  async deleteMessage(messageId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/${messageId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete message');
    }

    return await response.json();
  }

  async sendTypingIndicator(receiverId: number, isTyping: boolean): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/typing`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ receiverId, isTyping })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send typing indicator');
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

  async getUnreadMessageCounts(): Promise<Record<number, number>> {
    const response = await fetch(`${API_BASE_URL}/unread-counts`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch unread message counts');
    }

    return await response.json();
  }
}

export default new ChatMessageService();