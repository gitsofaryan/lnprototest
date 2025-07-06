# Lightning Network Protocol Test API (Minimal)

A minimal Lightning Network protocol testing API with real-time WebSocket communication, refactored to Vincent's specifications.

## Overview

This API provides exactly **two endpoints** for Lightning Network protocol testing:

- **`/connect`** - Performs a full protocol handshake sequence
- **`/rawmsg`** - Sends a single raw message

All communication is broadcasted in real-time via WebSocket for visualization.

## Running the API

1. **Install Dependencies**:
   ```bash
   poetry install
   ```

2. **Run the API**:
   ```bash
   poetry run python api/app.py
   ```
   The API will start on `http://localhost:5000` with WebSocket support.

## API Endpoints

### POST /connect

Performs Vincent's specified protocol handshake sequence:

1. Connect to node 03
2. Expect init message
3. Send init message with global features
4. Disconnect
5. Connect to node 02
6. Expect init message
7. Send init message with additional features [99]

**Request:**
```json
{
  "node_id": "03"
}
```

**Response:**
```json
{
  "status": "success",
  "sequence_id": "seq_03_1234567890",
  "node_id": "03",
  "steps_completed": 7
}
```

### POST /rawmsg

Sends a single raw Lightning Network message.

**Request:**
```json
{
  "type": "ping",
  "content": {
    "num_pong_bytes": 16,
    "byteslen": 16
  }
}
```

**Response:**
```json
{
  "status": "success",
  "message_type": "ping",
  "content": {
    "num_pong_bytes": 16,
    "byteslen": 16
  }
}
```

## WebSocket Events

All protocol events are broadcasted via WebSocket on the main namespace.

### Message Format

```json
{
  "sequence_id": "seq_03_1234567890",
  "step": 1,
  "direction": "out",
  "event": "Connect",
  "data": {
    "connprivkey": "03"
  },
  "timestamp": 1234567890123
}
```

### Event Types

- **Connect** - Connection establishment
- **Disconnect** - Connection termination  
- **ExpectMsg** - Expecting incoming message
- **Msg** - Outgoing message
- **RawMsg** - Raw message (from /rawmsg endpoint)

## Testing

Use the provided test script:

```bash
python api/test_minimal_api.py
```

Or test manually:

### Test /connect
```bash
curl -X POST http://localhost:5000/connect \
  -H "Content-Type: application/json" \
  -d '{"node_id": "03"}'
```

### Test /rawmsg
```bash
curl -X POST http://localhost:5000/rawmsg \
  -H "Content-Type: application/json" \
  -d '{"type": "ping", "content": {"num_pong_bytes": 16, "byteslen": 16}}'
```

## Architecture

- **Single file implementation** (`app.py`)
- **Direct WebSocket integration** (no separate WebSocket runner)
- **Minimal dependencies**: Flask, Flask-CORS, Flask-SocketIO, eventlet
- **Real-time broadcasting** of all protocol events
- **Vincent's exact sequence** implementation in `/connect`

## Key Features

✅ **Minimal and focused** - Only essential functionality  
✅ **Real-time visualization** - WebSocket broadcasting  
✅ **Protocol correctness** - Follows Lightning Network specifications  
✅ **Clean architecture** - Single file, clear separation of concerns  
✅ **Vincent's sequence** - Exact implementation as specified

## Changes Made

This API has been refactored from the original over-engineered version to be minimal and focused:

- **Removed endpoints**: `/health`, `/api/node-info`, `/api/connect`, `/api/raw-msg`
- **Added endpoints**: `/connect`, `/rawmsg` (exactly 2 as specified)
- **Removed files**: `websocket_runner.py` (integrated into `app.py`)
- **Simplified**: No complex state management, no unnecessary helper functions
- **Focused**: Only Vincent's exact sequence and raw message sending
