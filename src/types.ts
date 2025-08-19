
export type MessageRole = 'user' | 'model' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
}
