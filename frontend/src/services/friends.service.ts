import { Friendship, User, Notification } from './chat.types';

const API_BASE_URL = 'http://192.168.1.42:8083/api/friends';
const USER_API_BASE_URL = 'http://192.168.1.42:8083/api/users';
const NOTIFICATION_API_BASE_URL = 'http://192.168.1.42:8083/api/notifications';

class FriendsService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async searchUsers(query: string): Promise<User[]> {
    const response = await fetch(`${USER_API_BASE_URL}/search?query=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to search users';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If parsing fails, use the raw text
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    if (!responseText) {
      return []; // Return empty array if no users found
    }
    
    try {
      return JSON.parse(responseText);
    } catch (e) {
      throw new Error('Invalid JSON response from server');
    }
  }

  async sendFriendRequest(friendId: number): Promise<Friendship> {
    const response = await fetch(`${API_BASE_URL}/request`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ friendId })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to send friend request';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If parsing fails, use the raw text
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    if (!responseText) {
      throw new Error('Empty response from server');
    }
    
    try {
      return JSON.parse(responseText);
    } catch (e) {
      throw new Error('Invalid JSON response from server');
    }
  }

  async acceptFriendRequest(friendId: number): Promise<Friendship> {
    const response = await fetch(`${API_BASE_URL}/accept`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ friendId })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to accept friend request';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If parsing fails, use the raw text
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    if (!responseText) {
      throw new Error('Empty response from server');
    }
    
    try {
      return JSON.parse(responseText);
    } catch (e) {
      throw new Error('Invalid JSON response from server');
    }
  }

  async rejectFriendRequest(friendId: number): Promise<Friendship> {
    const response = await fetch(`${API_BASE_URL}/reject`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ friendId })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to reject friend request';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If parsing fails, use the raw text
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    if (!responseText) {
      throw new Error('Empty response from server');
    }
    
    try {
      return JSON.parse(responseText);
    } catch (e) {
      throw new Error('Invalid JSON response from server');
    }
  }

  async getFriends(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/list`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to fetch friends';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If parsing fails, use the raw text
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    if (!responseText) {
      return []; // Return empty array if no friends
    }
    
    try {
      return JSON.parse(responseText);
    } catch (e) {
      throw new Error('Invalid JSON response from server');
    }
  }

  async getPendingRequests(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/requests`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to fetch friend requests';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If parsing fails, use the raw text
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    if (!responseText) {
      return []; // Return empty array if no pending requests
    }
    
    try {
      return JSON.parse(responseText);
    } catch (e) {
      throw new Error('Invalid JSON response from server');
    }
  }

  async removeFriend(friendId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/remove`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ friendId })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to remove friend';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If parsing fails, use the raw text
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    if (!responseText) {
      return { message: 'Friend removed successfully' };
    }
    
    try {
      return JSON.parse(responseText);
    } catch (e) {
      // If the response isn't JSON, assume it's a success message
      return { message: responseText || 'Friend removed successfully' };
    }
  }
  
  // Notification methods
  async getUnreadNotificationsCount(): Promise<number> {
    const response = await fetch(`${NOTIFICATION_API_BASE_URL}/unread/count`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to fetch notifications count';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If parsing fails, use the raw text
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    if (!responseText) {
      return 0;
    }
    
    try {
      const data = JSON.parse(responseText);
      return data.count || 0;
    } catch (e) {
      throw new Error('Invalid JSON response from server');
    }
  }
  
  async getUnreadNotifications(): Promise<Notification[]> {
    const response = await fetch(`${NOTIFICATION_API_BASE_URL}/unread`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to fetch notifications';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If parsing fails, use the raw text
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    if (!responseText) {
      return [];
    }
    
    try {
      return JSON.parse(responseText);
    } catch (e) {
      throw new Error('Invalid JSON response from server');
    }
  }
  
  async markNotificationAsRead(notificationId: number): Promise<Notification> {
    const response = await fetch(`${NOTIFICATION_API_BASE_URL}/${notificationId}/read`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to mark notification as read';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If parsing fails, use the raw text
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    if (!responseText) {
      throw new Error('Empty response from server');
    }
    
    try {
      return JSON.parse(responseText);
    } catch (e) {
      throw new Error('Invalid JSON response from server');
    }
  }
  
  async markAllNotificationsAsRead(): Promise<{ message: string }> {
    const response = await fetch(`${NOTIFICATION_API_BASE_URL}/read-all`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to mark all notifications as read';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If parsing fails, use the raw text
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const responseText = await response.text();
    if (!responseText) {
      return { message: 'All notifications marked as read' };
    }
    
    try {
      return JSON.parse(responseText);
    } catch (e) {
      // If the response isn't JSON, assume it's a success message
      return { message: responseText || 'All notifications marked as read' };
    }
  }
}

export default new FriendsService();