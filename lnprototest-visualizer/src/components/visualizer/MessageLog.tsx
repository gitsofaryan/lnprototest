import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    SpaceBetween,
    Toggle,
    Input,
    Button,
    Container,
    Header,
    Alert,
    Badge
} from '@cloudscape-design/components';
import { useStore } from '../../store';
import { MessageFlowEvent } from '../../api/websocket';
import { Copy, Download, Trash2, Eye, EyeOff } from 'lucide-react';

const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }) + '.' + String(date.getMilliseconds()).padStart(3, '0');
};

const MessageLog: React.FC = () => {
    const [autoScroll, setAutoScroll] = useState(true);
    const [showTimestamps, setShowTimestamps] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);
    const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
    const messages = useStore(state => state.messages);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (autoScroll && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, autoScroll]);

    const handleDownload = () => {
        const data = JSON.stringify(messages, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lightning-messages-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleCopy = async () => {
        try {
            const data = JSON.stringify(messages, null, 2);
            await navigator.clipboard.writeText(data);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    };

    const handleClear = () => {
        useStore.getState().clearMessages();
        setExpandedMessages(new Set());
    };

    const toggleMessageExpansion = (messageId: string) => {
        const newExpanded = new Set(expandedMessages);
        if (newExpanded.has(messageId)) {
            newExpanded.delete(messageId);
        } else {
            newExpanded.add(messageId);
        }
        setExpandedMessages(newExpanded);
    };

    const getMessageColor = (direction: string) => {
        return direction === 'out' ? 'text-blue-600' : 'text-green-600';
    };

    const getDirectionIcon = (direction: string) => {
        return direction === 'out' ? '→' : '←';
    };

    const getStepBadge = (message: MessageFlowEvent) => {
        if (message.step) {
            return (
                <Badge color="blue">
                    Step {message.step}
                </Badge>
            );
        }
        return null;
    };

    const renderMessage = (message: MessageFlowEvent, index: number) => {
        const messageId = `${message.sequence_id || 'raw'}-${message.timestamp}-${index}`;
        const isExpanded = expandedMessages.has(messageId);
        const timestamp = showTimestamps ? formatTimestamp(message.timestamp) : '';
        const directionIcon = getDirectionIcon(message.direction);
        const messageColor = getMessageColor(message.direction);
        const fromNode = message.direction === 'out' ? 'RUNNER' : 'LDK';
        const toNode = message.direction === 'out' ? 'LDK' : 'RUNNER';

        return (
            <div
                key={messageId}
                className="message-item border-l-4 border-gray-200 hover:border-blue-300 bg-white rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-all duration-200"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {showTimestamps && (
                            <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                                {timestamp}
                            </span>
                        )}
                        {getStepBadge(message)}
                        <div className="flex items-center gap-2">
                            <span className={`font-semibold ${messageColor}`}>
                                {message.event}
                            </span>
                            <span className="text-sm text-gray-600">
                                <span className="font-medium text-blue-600">{fromNode}</span>
                                <span className="mx-2 text-gray-400">{directionIcon}</span>
                                <span className="font-medium text-green-600">{toNode}</span>
                            </span>
                        </div>
                    </div>
                    <Button
                        onClick={() => toggleMessageExpansion(messageId)}
                        variant="icon"
                        className="text-gray-500 hover:text-gray-700"
                    >
                        {isExpanded ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                </div>

                {isExpanded && (
                    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-2">Message Data:</div>
                        <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto">
                            {JSON.stringify(message.data, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        );
    };

    const filteredMessages = messages.filter(msg => {
        if (!searchText) return true;
        const searchLower = searchText.toLowerCase();
        return (
            msg.event.toLowerCase().includes(searchLower) ||
            JSON.stringify(msg.data).toLowerCase().includes(searchLower) ||
            (msg.sequence_id && msg.sequence_id.toLowerCase().includes(searchLower))
        );
    });

    return (
        <Container
            header={
                <Header
                    variant="h3"
                    description={`${messages.length} message${messages.length !== 1 ? 's' : ''} logged`}
                    actions={
                        <SpaceBetween direction="horizontal" size="xs">
                            <Button
                                onClick={handleDownload}
                                variant="normal"
                            >
                                <Download size={16} style={{ marginRight: '4px' }} />
                                {/* Export */}
                            </Button>
                            <Button
                                onClick={handleCopy}
                                variant="normal"
                            >
                                <Copy size={16} style={{ marginRight: '4px' }} />
                                {/* {copySuccess ? 'Copied!' : 'Copy'} */}
                            </Button>
                            <Button
                                onClick={handleClear}
                                variant="normal"
                                disabled={messages.length === 0}
                            >
                                <Trash2 size={16} style={{ marginRight: '4px' }} />
                                {/* Clear */}
                            </Button>
                        </SpaceBetween>
                    }
                >
                    Lightning Network Message Log
                </Header>
            }
        >
            <SpaceBetween size="m">
                {copySuccess && (
                    <Alert type="success" dismissible onDismiss={() => setCopySuccess(false)}>
                        Messages copied to clipboard!
                    </Alert>
                )}

                <Box>
                    <SpaceBetween direction="horizontal" size="s">
                        <Input
                            value={searchText}
                            type="search"
                            placeholder="Search messages, events, or data..."
                            onChange={({ detail }) => setSearchText(detail.value)}
                            clearAriaLabel="Clear search"
                        />
                        <Toggle
                            checked={autoScroll}
                            onChange={({ detail }) => setAutoScroll(detail.checked)}
                        >
                            Auto-scroll
                        </Toggle>
                        <Toggle
                            checked={showTimestamps}
                            onChange={({ detail }) => setShowTimestamps(detail.checked)}
                        >
                            Timestamps
                        </Toggle>
                    </SpaceBetween>
                </Box>

                <Box>
                    <div
                        className="message-log-container"
                        style={{
                            maxHeight: '500px',
                            overflowY: 'auto',
                            padding: '8px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '8px'
                        }}
                    >
                        {filteredMessages.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                {searchText ? 'No messages match your search.' : 'No messages yet. Start by connecting!'}
                            </div>
                        ) : (
                            <>
                                {filteredMessages.map(renderMessage)}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>
                </Box>
            </SpaceBetween>
        </Container>
    );
};

export default MessageLog; 