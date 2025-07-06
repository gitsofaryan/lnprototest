import { webSocketService, MessageFlowEvent } from "./websocket";
import api from "./api";

export interface MessageResponse {
  messages: MessageFlowEvent[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// API Client for minimal endpoints
export const apiClient = {
  // Connect endpoint - runs Vincent's 7-step sequence
  async connect(): Promise<MessageResponse> {
    try {
      const response = await api.connect();
      return {
        messages: [
          {
            direction: "out" as const,
            event: "sequence_started",
            data: {
              status: response.status,
              sequence_id: response.sequence_id,
              node_id: response.node_id,
              steps_completed: response.steps_completed,
            },
            timestamp: Date.now(),
          },
        ],
      };
    } catch (error) {
      console.error("Error in connect:", error);
      throw error;
    }
  },

  // Send raw message
  async sendMessage(
    type: string,
    content: Record<string, unknown> = {}
  ): Promise<MessageResponse> {
    try {
      await api.sendMessage(type, content);
      return {
        messages: [
          {
            direction: "out" as const,
            event: "raw_message",
            data: { type, content },
            timestamp: Date.now(),
          },
        ],
      };
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  // WebSocket management
  async connectWebSocket(): Promise<void> {
    return webSocketService.connect();
  },

  async runConnectSequence(nodeId: string = "03"): Promise<void> {
    return webSocketService.runConnect(nodeId);
  },

  disconnect(): void {
    return webSocketService.disconnect();
  },

  // WebSocket event handlers
  onMessage(handler: (event: MessageFlowEvent) => void): () => void {
    return webSocketService.onMessage(handler);
  },

  onError(handler: (error: { error: string }) => void): () => void {
    return webSocketService.onError(handler);
  },

  onComplete(handler: () => void): () => void {
    return webSocketService.onComplete(handler);
  },
};
