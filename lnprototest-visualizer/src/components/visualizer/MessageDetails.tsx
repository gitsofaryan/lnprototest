import React from 'react';
import {
  Container,
  Header,
  Box,
  SpaceBetween,
  ColumnLayout,
  StatusIndicator,
  Badge
} from '@cloudscape-design/components';
import { useStore } from '../../store';

const MessageDetails: React.FC = () => {
  const { selectedMessage, messages, connected } = useStore(state => ({
    selectedMessage: state.selectedMessage,
    messages: state.messages,
    connected: state.connected
  }));

  const messageStats = {
    total: messages.length,
    outgoing: messages.filter(m => m.direction === 'out').length,
    incoming: messages.filter(m => m.direction === 'in').length,
    unique_events: new Set(messages.map(m => m.event)).size
  };

  const recentMessage = messages[messages.length - 1];

  return (
    <Container
      header={
        <Header
          variant="h3"
          description="Message statistics and latest activity"
          actions={
            <StatusIndicator type={connected ? 'success' : 'stopped'}>
              {connected ? 'Connected' : 'Disconnected'}
            </StatusIndicator>
          }
        >
          Protocol Activity
        </Header>
      }
    >
      <SpaceBetween size="l">
        {/* Statistics */}
        <ColumnLayout columns={4} variant="text-grid">
          <div>
            <Box variant="h4">Total Messages</Box>
            <div className="text-2xl font-bold text-blue-600">{messageStats.total}</div>
          </div>
          <div>
            <Box variant="h4">Outgoing</Box>
            <div className="text-2xl font-bold text-green-600">{messageStats.outgoing}</div>
          </div>
          <div>
            <Box variant="h4">Incoming</Box>
            <div className="text-2xl font-bold text-orange-600">{messageStats.incoming}</div>
          </div>
          <div>
            <Box variant="h4">Event Types</Box>
            <div className="text-2xl font-bold text-purple-600">{messageStats.unique_events}</div>
          </div>
        </ColumnLayout>

        {/* Recent Message */}
        {recentMessage && (
          <Box>
            <Header variant="h4">Latest Message</Header>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Badge color={recentMessage.direction === 'out' ? 'blue' : 'green'}>
                  {recentMessage.direction === 'out' ? 'Outgoing' : 'Incoming'}
                </Badge>
                <span className="font-semibold">{recentMessage.event}</span>
                <span className="text-sm text-gray-500">
                  {new Date(recentMessage.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <pre className="text-sm text-gray-700 bg-white p-3 rounded border overflow-auto max-h-32">
                {JSON.stringify(recentMessage.data, null, 2)}
              </pre>
            </div>
          </Box>
        )}

        {/* Selected Message Details */}
        {selectedMessage ? (
          <Box>
            <Header variant="h4">Selected Message Template</Header>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Badge color="grey">{selectedMessage.category}</Badge>
                <span className="font-semibold">{selectedMessage.name}</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{selectedMessage.description}</p>
              <pre className="text-sm text-gray-700 bg-white p-3 rounded border overflow-auto max-h-32">
                {JSON.stringify(selectedMessage.content || {}, null, 2)}
              </pre>
            </div>
          </Box>
        ) : (
          <Box>
            <div className="text-center text-gray-500 py-8">
              Select a message template from the available messages to view its details
            </div>
          </Box>
        )}
      </SpaceBetween>
    </Container>
  );
};

export default MessageDetails;