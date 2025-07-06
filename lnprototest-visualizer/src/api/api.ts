import { webSocketService } from "./websocket";

const API_BASE_URL = "http://localhost:5000";

export interface ConnectRequest {
  node_id?: string;
}

export interface RawMessageRequest {
  type: string;
  content?: Record<string, unknown>;
}

export interface ConnectResponse {
  status: string;
  sequence_id: string;
  node_id: string;
  steps_completed: number;
}

export interface RawMessageResponse {
  status: string;
  message_type: string;
  content: Record<string, unknown>;
}

const api = {
  // Connect endpoint - runs Vincent's 7-step sequence
  connect: (data: ConnectRequest = { node_id: "03" }) =>
    fetch(`${API_BASE_URL}/connect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).then((res) => res.json() as Promise<ConnectResponse>),

  // Send raw message endpoint
  sendRawMessage: (data: RawMessageRequest) =>
    fetch(`${API_BASE_URL}/rawmsg`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).then((res) => res.json() as Promise<RawMessageResponse>),

  // WebSocket connection management
  connectWebSocket: () => webSocketService.connect(),
  runConnectSequence: (nodeId?: string) => webSocketService.runConnect(nodeId),
  sendMessage: (type: string, content?: Record<string, unknown>) =>
    webSocketService.sendRawMessage(type, content || {}),
  disconnect: () => webSocketService.disconnect(),
};

export default api;
