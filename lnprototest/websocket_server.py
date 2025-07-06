import asyncio
import json
import websockets
from typing import Dict, Any, Optional
from .event import Event, Msg, ExpectMsg

class WebSocketServer:
    def __init__(self, host: str = "localhost", port: int = 8765):
        self.host = host
        self.port = port
        self.clients = set()
        self.server = None

    async def start(self):
        self.server = await websockets.serve(self.handle_client, self.host, self.port)
        print(f"WebSocket server started at ws://{self.host}:{self.port}")

    async def stop(self):
        if self.server:
            self.server.close()
            await self.server.wait_closed()

    async def handle_client(self, websocket, path):
        self.clients.add(websocket)
        try:
            async for message in websocket:
                # Handle incoming messages if needed
                pass
        finally:
            self.clients.remove(websocket)

    async def broadcast_event(self, event: Event, direction: str, payload: Dict[str, Any]):
        """Broadcast an event to all connected clients"""
        if not self.clients:
            return

        message = {
            "direction": direction,
            "msg_name": event.__class__.__name__,
            "payload": payload
        }

        websockets.broadcast(self.clients, json.dumps(message))

    async def broadcast_message(self, msg: Msg, direction: str):
        """Broadcast a message event to all connected clients"""
        await self.broadcast_event(msg, direction, msg.kwargs)

    async def broadcast_expect(self, expect: ExpectMsg, direction: str):
        """Broadcast an expect message event to all connected clients"""
        await self.broadcast_event(expect, direction, {"msgtype": expect.msgtype}) 