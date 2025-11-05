export interface ChatMessage {
  id?: number;
  sender: {
    id: number;
    name: string;
    email: string;
  };
  receiver: {
    id: number;
    name: string;
    email: string;
  };
  content: string;
  timestamp?: string;
  isRead?: boolean;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  messageType?: string; // TEXT, IMAGE, FILE, AUDIO, VIDEO
  isDeleted?: boolean;
}

export interface FriendRequest {
  id?: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  friend: {
    id: number;
    name: string;
    email: string;
  };
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';
  createdAt?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  gender: string;
  dob: string;
  mobile?: string;
  profileImageUrl?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Friendship {
  id?: number;
  user: User;
  friend: User;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';
  createdAt?: string;
}

export interface Notification {
  id: number;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}