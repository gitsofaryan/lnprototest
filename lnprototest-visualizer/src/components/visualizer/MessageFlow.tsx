import React, { useEffect, useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  Position,
  Handle,
  Connection,
  addEdge,
  NodeProps,
  useNodesState,
  useEdgesState,
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Container,
  Header,
  Box,
  SpaceBetween,
  Button,
  Modal,
  FormField,
  Input,
  Textarea
} from '@cloudscape-design/components';
import { useStore } from '../../store';
import { MessageFlowEvent } from '../../api/websocket';
import MessageLog from './MessageLog';
import { Zap } from 'lucide-react';
import { apiClient } from '../../api/client';

interface CustomNodeData {
  label: string;
  type: string;
  isConnected: boolean;
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 shadow-lg bg-white transition-all duration-500
        ${data.type === 'runner' ? 'border-blue-500 hover:border-blue-600' : 'border-yellow-500 hover:border-yellow-600'}
        ${data.isConnected ? 'shadow-xl animate-pulse' : 'opacity-75'}`}
      style={{
        minWidth: '140px',
        minHeight: '120px',
        pointerEvents: 'all',
        transform: data.isConnected ? 'translateY(-2px)' : 'translateY(0px)',
        animation: data.isConnected ? 'float 3s ease-in-out infinite' : 'none'
      }}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float {
            0%, 100% { transform: translateY(-2px); }
            50% { transform: translateY(-6px); }
          }
        `
      }} />

      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-all duration-300
        ${data.type === 'runner' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'}
        ${data.isConnected ? 'scale-110' : 'scale-100'}`}
      >
        <Zap size={28} />
      </div>
      <div className="text-sm font-bold text-gray-800 mb-1">{data.label}</div>
      <div className={`text-xs px-3 py-1 rounded-full font-medium
        ${data.isConnected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
        {data.isConnected ? 'Online' : 'Offline'}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          background: data.type === 'runner' ? '#3b82f6' : '#eab308',
          width: 10,
          height: 10,
          opacity: data.isConnected ? 1 : 0.5
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{
          background: data.type === 'runner' ? '#3b82f6' : '#eab308',
          width: 10,
          height: 10,
          opacity: data.isConnected ? 1 : 0.5
        }}
      />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const initialNodes: Node<CustomNodeData>[] = [
  {
    id: 'runner',
    type: 'custom',
    position: { x: 80, y: 200 },
    data: { label: 'Protocol Runner', type: 'runner', isConnected: false },
    draggable: true,
  },
  {
    id: 'ldk',
    type: 'custom',
    position: { x: 520, y: 200 },
    data: { label: 'LDK Node', type: 'ldk', isConnected: false },
    draggable: true,
  },
];

const MessageFlowComponent: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { connected } = useStore();

  // State for raw message modal
  const [showRawMsgModal, setShowRawMsgModal] = useState(false);
  const [rawMsgType, setRawMsgType] = useState('');
  const [rawMsgContent, setRawMsgContent] = useState('');

  // Base connection edge (no arrows, just a line)
  const baseConnectionEdge: Edge = useMemo(() => ({
    id: 'base-connection',
    source: 'runner',
    target: 'ldk',
    type: 'smoothstep',
    animated: connected,
    style: {
      strokeWidth: 3,
      stroke: connected ? '#10b981' : '#d1d5db',
      strokeDasharray: connected ? '0' : '8 4',
    },
    // No markerEnd to remove arrows
    label: connected ? 'Lightning Network Connection' : 'Disconnected',
    labelStyle: {
      fontSize: '12px',
      fontWeight: 600,
      color: connected ? '#059669' : '#6b7280',
    },
    labelBgStyle: {
      fill: 'white',
      fillOpacity: 0.9,
    },
  }), [connected]);

  // Update base connection edge when connection status changes
  useEffect(() => {
    setEdges([baseConnectionEdge]);
  }, [baseConnectionEdge, setEdges]);

  // Update node connection status
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isConnected: connected,
        },
      }))
    );
  }, [connected, setNodes]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        setEdges((eds) => addEdge({
          ...params,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#4CAF50', strokeWidth: 2 },
          // No markerEnd to remove arrows
        }, eds));
      }
    },
    [setEdges]
  );

  // Handle connection toggling
  const handleConnectionToggle = useCallback(async () => {
    try {
      if (!connected) {
        useStore.getState().setConnectionState('connecting');
        await useStore.getState().connect();
        console.log('Connection initiated');
      } else {
        apiClient.disconnect();
        useStore.getState().setConnectionState('disconnected');
        setEdges([baseConnectionEdge]);
        console.log('Connection terminated');
      }
    } catch (error) {
      console.error('Connection error:', error);
      useStore.getState().setConnectionState('disconnected');
    }
  }, [connected, baseConnectionEdge, setEdges]);

  // Handle WebSocket events and create animated message flows
  useEffect(() => {
    const handleMessage = (event: MessageFlowEvent) => {
      try {
        const source = event.direction === 'out' ? 'runner' : 'ldk';
        const target = event.direction === 'out' ? 'ldk' : 'runner';
        const messageId = `message-${event.sequence_id || 'raw'}-${Date.now()}`;

        const messageEdge: Edge = {
          id: messageId,
          source,
          target,
          type: 'smoothstep',
          animated: true,
          style: {
            stroke: event.direction === 'out' ? '#3b82f6' : '#f59e0b',
            strokeWidth: 4,
          },
          // No markerEnd to remove arrows
          label: event.event,
          labelStyle: {
            fontSize: '11px',
            fontWeight: 700,
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            background: event.direction === 'out' ? '#3b82f6' : '#f59e0b',
          },
          labelBgStyle: {
            fill: 'transparent',
          },
        };

        // Add the message edge along with the base connection
        setEdges([baseConnectionEdge, messageEdge]);

        // Add message to store
        useStore.getState().addMessage(event);

        // Remove the message edge after 3 seconds
        setTimeout(() => {
          setEdges([baseConnectionEdge]);
        }, 3000);
      } catch (err) {
        console.error('Error handling message:', err);
      }
    };

    const unsubscribeMessage = apiClient.onMessage(handleMessage);
    const unsubscribeError = apiClient.onError((error: { error: string }) => {
      console.error('WebSocket error:', error);
      useStore.getState().setConnectionState('disconnected');
    });

    return () => {
      unsubscribeMessage();
      unsubscribeError();
    };
  }, [baseConnectionEdge, setEdges]);

  const handleSendMessage = useCallback(async () => {
    if (!rawMsgType) {
      return;
    }

    try {
      let content: Record<string, unknown> = {};
      if (rawMsgContent) {
        try {
          content = JSON.parse(rawMsgContent) as Record<string, unknown>;
        } catch {
          content = { data: rawMsgContent };
        }
      }

      await apiClient.sendMessage(rawMsgType, content);

      setShowRawMsgModal(false);
      setRawMsgType('');
      setRawMsgContent('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [rawMsgType, rawMsgContent]);

  return (
    <>
      <Container
        header={
          <Header
            variant="h2"
            description="Real-time visualization of Lightning Network protocol messages"
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  onClick={handleConnectionToggle}
                  loading={useStore(state => state.connectionState) === 'connecting'}
                  disabled={useStore(state => state.connectionState) === 'connecting'}
                  variant={connected ? "normal" : "primary"}
                >
                  {useStore(state => state.connectionState) === 'connecting' ? 'Connecting...' :
                    connected ? 'Disconnect' : 'Connect'}
                </Button>
                {connected && (
                  <Button
                    onClick={() => setShowRawMsgModal(true)}
                    variant="normal"
                  >
                    Send Message
                  </Button>
                )}
              </SpaceBetween>
            }
          >
            Lightning Network Protocol Visualizer
          </Header>
        }
      >
        <SpaceBetween size="l">
          {/* Flow Visualization */}
          <Box>
            <div style={{ height: '450px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                fitViewOptions={{
                  padding: 0.2,
                  minZoom: 0.8,
                  maxZoom: 1.2
                }}
                minZoom={0.5}
                maxZoom={2}
                defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                style={{
                  background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)'
                }}
                defaultEdgeOptions={{
                  type: 'smoothstep',
                }}
                nodesDraggable={true}
                nodesConnectable={connected}
                elementsSelectable={true}
              >
                <Background
                  color="#cbd5e1"
                  gap={20}
                  size={1}
                />
                <Controls
                  showZoom={true}
                  showFitView={true}
                  showInteractive={false}
                />
              </ReactFlow>
            </div>
          </Box>

          {/* Message Log Panel */}
          {connected && (
            <Box>
              <MessageLog />
            </Box>
          )}
        </SpaceBetween>
      </Container>

      {/* Raw Message Modal */}
      <Modal
        visible={showRawMsgModal}
        onDismiss={() => setShowRawMsgModal(false)}
        header="Send Raw Message"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setShowRawMsgModal(false)} variant="link">
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              variant="primary"
              disabled={!rawMsgType}
            >
              Send Message
            </Button>
          </SpaceBetween>
        }
        size="medium"
      >
        <SpaceBetween size="m">
          <FormField
            label="Message Type"
            errorText={!rawMsgType ? "Message type is required" : undefined}
          >
            <Input
              value={rawMsgType}
              onChange={({ detail }) => setRawMsgType(detail.value)}
              placeholder="e.g., init, ping, pong"
            />
          </FormField>
          <FormField
            label="Message Content (Optional)"
            description="Enter JSON content or leave empty for default"
          >
            <Textarea
              value={rawMsgContent}
              onChange={({ detail }) => setRawMsgContent(detail.value)}
              placeholder='e.g., {"globalfeatures": "", "features": ""}'
              rows={6}
            />
          </FormField>
        </SpaceBetween>
      </Modal>
    </>
  );
};

function MessageFlow() {
  return (
    <ReactFlowProvider>
      <MessageFlowComponent />
    </ReactFlowProvider>
  );
}

export default MessageFlow;
