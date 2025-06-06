import React, { useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Node,
  Position,
  EdgeLabelRenderer
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Container,
  Header,
  Box,
  SpaceBetween,
  Button,
  Select,
  Modal,
  FormField,
  Input,
  Textarea
} from '@cloudscape-design/components';
import { Zap } from 'lucide-react';
import { useStore } from '../../store';
import MessageLog from './MessageLog';

// Custom Node Component
const CustomNode = ({ data }: { data: { label: string; type: string; isConnected: boolean } }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-2 rounded-lg border shadow-md bg-white/80
        ${data.type === 'runner' ? 'border-blue-500' : 'border-yellow-500'}
        ${data.isConnected ? 'node-connected' : ''}`}
      style={{ pointerEvents: 'all', zIndex: 2 }}
    >
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 
        ${data.type === 'runner' ? 'bg-blue-100' : 'bg-yellow-100'}`}
      >
        <Zap size={24} className={data.type === 'runner' ? 'text-blue-500' : 'text-yellow-500'} />
      </div>
      <div className="text-sm font-semibold">{data.label}</div>
      <div className="text-xs text-gray-500 mt-1">
        {data.isConnected ? 'Connected' : 'Disconnected'}
      </div>
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

// Define nodes as a stable constant outside the component
const NODES: Node[] = [
  {
    id: 'runner',
    type: 'custom',
    data: {
      label: 'Runner',
      type: 'runner',
      isConnected: false // will be updated in the component
    },
    position: { x: 250, y: 200 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    style: { width: 150, height: 150 }
  },
  {
    id: 'ldk',
    type: 'custom',
    data: {
      label: 'LDK',
      type: 'ldk',
      isConnected: false // will be updated in the component
    },
    position: { x: 700, y: 200 },
    sourcePosition: Position.Left,
    targetPosition: Position.Right,
    style: { width: 150, height: 150 }
  },
];

const MessageFlow: React.FC = () => {
  const connected = useStore(state => state.connected);
  const messages = useStore(state => state.messages);
  const sendMessage = useStore(state => state.sendMessage);
  const availableMessages = useStore(state => state.availableMessages);
  const selectedMessage = useStore(state => state.selectedMessage);
  const selectMessage = useStore(state => state.selectMessage);
  const connect = useStore(state => state.connect);
  const connectionState = useStore(state => state.connectionState);
  const shouldBeConnected = useRef(false);

  // State for raw message modal
  const [showRawMsgModal, setShowRawMsgModal] = useState(false);
  const [rawMsgType, setRawMsgType] = useState('');
  const [rawMsgContent, setRawMsgContent] = useState('');

  // Animated message edge state
  const [edges, setEdges] = useState<Edge[]>([]);
  const [lastAnimatedId, setLastAnimatedId] = useState<string | null>(null);

  // Permanent connection edge
  const connectionEdge: Edge = {
    id: 'connection',
    source: 'runner',
    target: 'ldk',
    type: 'smoothstep',
    label: (
      <EdgeLabelRenderer>
        <div style={{
          position: 'absolute',
          background: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 500,
          color: '#666',
          border: '1px solid #666',
          zIndex: 1,
        }}>
          init
        </div>
      </EdgeLabelRenderer>
    ),
    style: {
      strokeWidth: 2,
      stroke: '#666',
      strokeDasharray: '5 5',
      zIndex: 1
    }
  };

  // Always set the permanent connection edge on mount
  useEffect(() => {
    setEdges([connectionEdge]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animate new messages as temporary edges
  useEffect(() => {
    if (!messages.length) return;
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.id === lastAnimatedId) return;

    const newEdge: Edge = {
      id: `message-${lastMessage.id}`,
      source: lastMessage.from === 'runner' ? 'runner' : 'ldk',
      target: lastMessage.to === 'runner' ? 'runner' : 'ldk',
      type: 'smoothstep',
      animated: true,
      label: (
        <EdgeLabelRenderer>
          <div style={{
            position: 'absolute',
            background: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 700,
            color: lastMessage.from === 'runner' ? '#3b82f6' : '#eab308',
            border: `1px solid ${lastMessage.from === 'runner' ? '#3b82f6' : '#eab308'}`,
            zIndex: 3,
          }}>
            {lastMessage.type}
          </div>
        </EdgeLabelRenderer>
      ),
      style: {
        stroke: lastMessage.from === 'runner' ? '#3b82f6' : '#eab308',
        strokeWidth: 3,
        zIndex: 2
      }
    };

    // Always include the permanent connection edge
    setEdges([connectionEdge, newEdge]);
    setLastAnimatedId(lastMessage.id);

    // Remove the message edge after 2 seconds, keep the connection edge
    const timeout = setTimeout(() => {
      setEdges([connectionEdge]);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [messages, lastAnimatedId]);

  // Poll for connection status only when we want to be connected
  useEffect(() => {
    if (!shouldBeConnected.current) return;

    const pollStatus = async () => {
      try {
        const response = await fetch('http://localhost:5000/node-info');
        const data = await response.json();
        if (data.active_connections && data.active_connections > 0) {
          useStore.getState().setConnectionState('connected');
          useStore.setState({ connected: true });
        } else {
          useStore.getState().setConnectionState('disconnected');
          useStore.setState({ connected: false });
        }
      } catch {
        useStore.getState().setConnectionState('disconnected');
        useStore.setState({ connected: false });
      }
    };

    const statusInterval = setInterval(pollStatus, 2000);
    return () => clearInterval(statusInterval);
  }, [shouldBeConnected.current]);

  // Poll for messages when connected
  useEffect(() => {
    if (!connected || !shouldBeConnected.current) return;

    const pollMessages = async () => {
      try {
        const response = await fetch('/messages');
        const data = await response.json();
        if (data && data.messages) {
          useStore.getState().setMessages(data.messages);
        }
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    };

    const messageInterval = setInterval(pollMessages, 2000);
    return () => clearInterval(messageInterval);
  }, [connected, shouldBeConnected.current]);

  // Handle raw message send
  const handleRawMessageSend = async () => {
    if (!connected) return;

    try {
      let content = {};
      try {
        content = JSON.parse(rawMsgContent);
      } catch {
        // If not valid JSON, use as is
        content = { data: rawMsgContent };
      }

      await sendMessage(rawMsgType, content);
      setShowRawMsgModal(false);
      setRawMsgType('');
      setRawMsgContent('');
    } catch (error) {
      console.error('Error sending raw message:', error);
    }
  };

  // Handle connect/disconnect
  const handleConnectionToggle = async () => {
    if (!connected) {
      try {
        shouldBeConnected.current = true;
        await connect();
      } catch (error) {
        console.error('Connection error:', error);
        shouldBeConnected.current = false;
        useStore.getState().setConnectionState('disconnected');
      }
    } else {
      shouldBeConnected.current = false;
      useStore.getState().setConnectionState('disconnected');
      useStore.setState({ connected: false });
      useStore.getState().resetLogs();
    }
  };

  // Use React.useMemo to update isConnected in node data without changing the array reference
  const nodes = React.useMemo(() => NODES.map(node => ({
    ...node,
    data: {
      ...node.data,
      isConnected: connected
    }
  })), [connected]);

  return (
    <>
      <Container
        header={
          <Header
            variant="h2"
            description="Visualization of message flow between nodes"
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  onClick={handleConnectionToggle}
                  loading={connectionState === 'connecting'}
                  disabled={connectionState === 'connecting'}
                  variant={connected ? "normal" : "primary"}
                >
                  {connectionState === 'connecting' ? 'Connecting...' :
                    connected ? 'Disconnect' : 'Connect'}
                </Button>
                {connected && (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button
                      onClick={() => setShowRawMsgModal(true)}
                      variant="normal"
                    >
                      Send Raw Message
                    </Button>
                    <Select
                      selectedOption={selectedMessage ? {
                        label: selectedMessage.name,
                        value: selectedMessage.id
                      } : null}
                      onChange={({ detail }) => {
                        const message = availableMessages.find(m => m.id === detail.selectedOption.value);
                        selectMessage(message || null);
                      }}
                      options={availableMessages.map(msg => ({
                        label: msg.name,
                        value: msg.id,
                        description: msg.description
                      }))}
                      placeholder="Select a message"
                      filteringType="auto"
                      empty="No messages available"
                    />
                    <Button
                      onClick={async () => {
                        if (selectedMessage && connected) {
                          await sendMessage(selectedMessage.type, selectedMessage.content);
                          selectMessage(null);
                        }
                      }}
                      disabled={!selectedMessage}
                      variant="primary"
                    >
                      Send Message
                    </Button>
                  </SpaceBetween>
                )}
              </SpaceBetween>
            }
          >
            Message Flow
          </Header>
        }
      >
        <SpaceBetween size="l">
          <Box padding="l">
            <div style={{ height: 600 }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                minZoom={0.5}
                maxZoom={1.5}
                style={{ background: '#f8fafc' }}
                defaultEdgeOptions={{
                  type: 'smoothstep',
                  animated: false
                }}
              >
                <Background color="#94a3b8" gap={16} />
                <Controls />
              </ReactFlow>
            </div>
          </Box>
          <MessageLog />
        </SpaceBetween>
      </Container>

      <Modal
        visible={showRawMsgModal}
        onDismiss={() => setShowRawMsgModal(false)}
        header="Send Raw Message"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setShowRawMsgModal(false)} variant="link">
              Cancel
            </Button>
            <Button onClick={handleRawMessageSend} variant="primary">
              Send
            </Button>
          </SpaceBetween>
        }
        className="wide-modal"
      >
        <SpaceBetween size="m">
          <FormField label="Message Type">
            <Input
              value={rawMsgType}
              onChange={({ detail }) => setRawMsgType(detail.value)}
              placeholder="e.g., init"
            />
          </FormField>
          <FormField
            label="Message Content"
            description="Enter JSON content or plain text"
          >
            <Textarea
              value={rawMsgContent}
              onChange={({ detail }) => setRawMsgContent(detail.value)}
              placeholder='e.g., {"globalfeatures": "", "features": ""}'
              rows={5}
            />
          </FormField>
        </SpaceBetween>
      </Modal>
    </>
  );
};

export default MessageFlow;