import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import eventlet and patch early
import eventlet
eventlet.monkey_patch()

# Import necessary libraries
from flask import Flask, request, jsonify
from flask_cors import CORS
import time
import re
import traceback
from lnprototest.dummyrunner import DummyRunner
from lnprototest.event import Msg, ExpectMsg, Connect, Disconnect
import logging
from flask_socketio import SocketIO, emit

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)

# Configure CORS
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "allow_headers": ["Content-Type"],
        "expose_headers": ["Content-Type"]
    }
})

# Initialize SocketIO
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode='eventlet'
)

# Global runner instance
runner = None

class MockConfig:
    def getoption(self, name):
        if name == "verbose":
            return True
        return False

def broadcast_message(message_data):
    """Broadcast message to all connected WebSocket clients"""
    try:
        socketio.emit('message', message_data)
        logger.info(f"Broadcasted message: {message_data}")
    except Exception as e:
        logger.error(f"Error broadcasting message: {str(e)}")

def is_valid_hex(s):
    """Validate hex string"""
    if not isinstance(s, str):
        return False
    return bool(re.match(r'^[0-9a-fA-F]*$', s))

@app.route('/connect', methods=['POST'])
def connect():
    """Perform a full protocol handshake sequence as specified by Vincent"""
    try:
        global runner
        data = request.get_json() or {}
        node_id = data.get('node_id', '03')
        
        # Initialize runner
        config = MockConfig()
        runner = DummyRunner(config)
        
        sequence_id = f'seq_{node_id}_{int(time.time())}'
        
        # Vincent's exact sequence:
        # 1. Connect to node 03
        step1 = Connect(connprivkey="03")
        broadcast_message({
            'sequence_id': sequence_id,
            'step': 1,
            'direction': 'out',
            'event': 'Connect',
            'data': {'connprivkey': '03'},
            'timestamp': int(time.time() * 1000)
        })
        
        # 2. Expect init message
        step2 = ExpectMsg("init")
        broadcast_message({
            'sequence_id': sequence_id,
            'step': 2,
            'direction': 'in',
            'event': 'ExpectMsg',
            'data': {'msgtype': 'init'},
            'timestamp': int(time.time() * 1000)
        })
        
        # 3. Send init message with global features
        step3 = Msg("init", globalfeatures=runner.runner_features(globals=True))
        broadcast_message({
            'sequence_id': sequence_id,
            'step': 3,
            'direction': 'out',
            'event': 'Msg',
            'data': {'msgtype': 'init', 'globalfeatures': runner.runner_features(globals=True)},
            'timestamp': int(time.time() * 1000)
        })
        
        # 4. Disconnect
        step4 = Disconnect()
        broadcast_message({
            'sequence_id': sequence_id,
            'step': 4,
            'direction': 'out',
            'event': 'Disconnect',
            'data': {},
            'timestamp': int(time.time() * 1000)
        })
        
        # 5. Connect to node 02
        step5 = Connect(connprivkey="02")
        broadcast_message({
            'sequence_id': sequence_id,
            'step': 5,
            'direction': 'out',
            'event': 'Connect',
            'data': {'connprivkey': '02'},
            'timestamp': int(time.time() * 1000)
        })
        
        # 6. Expect init message again
        step6 = ExpectMsg("init")
        broadcast_message({
            'sequence_id': sequence_id,
            'step': 6,
            'direction': 'in',
            'event': 'ExpectMsg',
            'data': {'msgtype': 'init'},
            'timestamp': int(time.time() * 1000)
        })
        
        # 7. Send init message with additional features
        step7 = Msg("init", globalfeatures=runner.runner_features(globals=True, additional_features=[99]))
        broadcast_message({
            'sequence_id': sequence_id,
            'step': 7,
            'direction': 'out',
            'event': 'Msg',
            'data': {
                'msgtype': 'init', 
                'globalfeatures': runner.runner_features(globals=True, additional_features=[99])
            },
            'timestamp': int(time.time() * 1000)
        })
        
        # Broadcast sequence completion
        broadcast_message({
            'sequence_id': sequence_id,
            'event': 'sequence_complete',
            'total_steps': 7,
            'timestamp': int(time.time() * 1000)
        })
        
        return jsonify({
            'status': 'success',
            'sequence_id': sequence_id,
            'node_id': node_id,
            'steps_completed': 7
        })
        
    except Exception as e:
        logger.error(f"Error in connect: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/rawmsg', methods=['POST'])
def send_raw_message():
    """Send a single raw message and broadcast the result"""
    try:
        global runner
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
            
        msg_type = data.get('type')
        content = data.get('content', {})
        
        if not msg_type:
            return jsonify({'error': 'Message type is required'}), 400
        
        # Initialize runner if not exists
        if not runner:
            config = MockConfig()
            runner = DummyRunner(config)
        
        # Create and send the message
        msg = Msg(msg_type, **content)
        
        # Broadcast the message
        message_data = {
            'direction': 'out',
            'event': 'RawMsg',
            'data': {
                'msgtype': msg_type,
                **content
            },
            'timestamp': int(time.time() * 1000)
        }
        
        broadcast_message(message_data)
        
        return jsonify({
            'status': 'success',
            'message_type': msg_type,
            'content': content
        })
        
    except Exception as e:
        logger.error(f"Error in rawmsg: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

# WebSocket event handlers
@socketio.on('connect')
def handle_connect():
    """Handle WebSocket client connection"""
    logger.info("WebSocket client connected")
    emit('connected', {'status': 'connected'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle WebSocket client disconnection"""
    logger.info("WebSocket client disconnected")

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)