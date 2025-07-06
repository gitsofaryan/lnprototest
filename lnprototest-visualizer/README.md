# Lightning Network Protocol Visualizer

A React-based visualizer for real-time Lightning Network protocol message flow, designed to work with the minimal lnprototest API.

## Features

✅ **Real-time visualization** of Vincent's 7-step protocol sequence  
✅ **Interactive message flow** between Runner and LDK nodes  
✅ **Raw message sending** capabilities  
✅ **Socket.IO integration** for live updates  
✅ **Modern React + TypeScript** implementation  

## Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: AWS Cloudscape Design System
- **Visualization**: ReactFlow for interactive node diagrams
- **State Management**: Zustand
- **Real-time Communication**: Socket.IO client
- **Styling**: Tailwind CSS

## API Integration

The visualizer connects to the minimal Lightning Network API with exactly 2 endpoints:

- **`/connect`** - Runs Vincent's 7-step protocol handshake sequence
- **`/rawmsg`** - Sends individual raw messages

All protocol events are broadcasted in real-time via Socket.IO.

## Running the Visualizer

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

## Usage

1. **Start the backend API** first:
   ```bash
   cd ../api && python app.py
   ```

2. **Open the visualizer** at `http://localhost:5173`

3. **Connect**: Click "Connect" to establish WebSocket connection and run Vincent's sequence

4. **Send raw messages**: Use "Send Raw Message" to send individual protocol messages

5. **Watch real-time flow**: See messages animate between Runner and LDK nodes

## Key Components

### MessageFlow
Interactive ReactFlow diagram showing:
- Runner node (left) and LDK node (right)
- Animated message edges with protocol events
- Real-time message broadcasting

### MessageList & MessageLog
Live message history and details panel showing:
- Sequence steps and timestamps
- Message content and direction
- Protocol event types

### Store (Zustand)
Simplified state management for:
- Connection state tracking
- Message history
- Available message types

## Changes from Original

The visualizer has been **significantly simplified** to align with the minimal API:

**Removed**:
- Complex node/connection management
- Multiple endpoint calls
- Over-engineered state handling
- Health checks and node info endpoints

**Simplified**:
- Only 2 API calls (`/connect`, `/rawmsg`)
- Direct Socket.IO integration
- Focused on Vincent's exact sequence
- Minimal state management

**Enhanced**:
- Real-time message visualization
- Better TypeScript support
- Cleaner component architecture
- Aligned with minimal API philosophy

## Development

- **TypeScript**: Full type safety throughout
- **ESLint**: Code quality and consistency
- **Vite**: Fast development and building
- **Hot reload**: Instant updates during development

The visualizer now perfectly complements the minimal backend API, providing essential protocol visualization without unnecessary complexity.
