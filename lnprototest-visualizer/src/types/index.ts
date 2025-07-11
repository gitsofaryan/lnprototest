// Node Types
export type NodeType = 'runner' | 'ldk';

export interface Node {
  id: string;
  type: NodeType;
  label: string;
  position: {
    x: number;
    y: number;
  };
}

// Message Types
export type MessageType = 
  | 'init' 
  | 'error' 
  | 'warning' 
  | 'ping' 
  | 'pong'
  | 'open_channel'
  | 'accept_channel'
  | 'funding_created'
  | 'funding_signed';

export interface Message {
  id: string;
  type: MessageType;
  name: string;
  description: string;
  category: MessageCategory;
  payload?: Record<string, any>;
}

export type MessageCategory = 
  | 'connection' 
  | 'channel' 
  | 'commitment' 
  | 'routing' 
  | 'misc';

// Connection States
export type ConnectionState = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

// Message Log
export interface MessageLog {
  id: string;
  timestamp: number;
  source: NodeType;
  target: NodeType;
  message: Message;
  status: 'sent' | 'received' | 'error';
}

// API Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Flask API Types
export interface FlaskNode {
  id: string;
  privkey: string;
  pubkey: string;
  state: string;
  type: string;
}

export interface FlaskConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  state: string;
}

export interface FlaskMessage {
  id: string;
  connectionId: string;
  content: {
    features: string;
    globalfeatures: string;
  };
  direction: 'sent' | 'received';
  status: string;
  timestamp: number;
  type: string;
}

export interface MessageFlowType {
  id: string;
  direction: 'sent' | 'received';
  type: MessageType;
  status: 'pending' | 'success' | 'error';
}