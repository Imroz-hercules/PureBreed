# DB4 WebSocket API Documentation

This document describes the WebSocket API for real-time DB4 PLC data streaming.

## Overview

The WebSocket API provides real-time access to DB4 PLC data through Socket.IO. It allows clients to:
- Connect to the WebSocket server
- Start/stop live data streaming
- Get single readings on demand
- Monitor stream status
- Handle errors gracefully

## Connection

**Server URL:** `http://localhost:5001` (or your server address)

**Protocol:** Socket.IO (WebSocket with fallback)

## Events

### Client to Server Events

#### `start_live_stream`
Start continuous live data streaming from the PLC.

**Emitted by:** Client
**Parameters:** None
**Response:** `stream_status` event

#### `stop_live_stream`
Stop the live data streaming.

**Emitted by:** Client
**Parameters:** None
**Response:** `stream_status` event

#### `get_single_reading`
Get a single reading from the PLC (doesn't start continuous streaming).

**Emitted by:** Client
**Parameters:** None
**Response:** `single_reading` or `single_reading_error` event

#### `get_stream_status`
Get the current status of the streaming.

**Emitted by:** Client
**Parameters:** None
**Response:** `stream_status` event

### Server to Client Events

#### `connected`
Sent when a client successfully connects to the server.

**Emitted by:** Server
**Data:**
```json
{
  "message": "Connected to DB4 WebSocket server"
}
```

#### `db4_live_data`
Live data from the PLC (sent every 5 seconds when streaming is active).

**Emitted by:** Server
**Data:**
```json
{
  "timestamp": "2024-01-15 10:30:45",
  "pellet1_ton_hr": 25.5,
  "pellet2_ton_hr": 23.2,
  "pellet3_ton_hr": 27.8,
  "pellet1_kw_ton": 0.85,
  "pellet2_kw_ton": 0.92,
  "pellet3_kw_ton": 0.78,
  "pellet1_temp": 185.5,
  "pellet2_temp": 182.3,
  "pellet3_temp": 188.7
}
```

#### `db4_error`
Error occurred while reading from PLC or during streaming.

**Emitted by:** Server
**Data:**
```json
{
  "error": "Connection failed to PLC",
  "timestamp": "2024-01-15 10:30:45"
}
```

#### `stream_status`
Status update about the streaming operation.

**Emitted by:** Server
**Data:**
```json
{
  "status": "started|stopped|error",
  "message": "Live stream started"
}
```

Or for status query:
```json
{
  "streaming": true,
  "thread_alive": true
}
```

#### `single_reading`
Response to a single reading request.

**Emitted by:** Server
**Data:** Same format as `db4_live_data`

#### `single_reading_error`
Error occurred during single reading request.

**Emitted by:** Server
**Data:** Same format as `db4_error`

## Usage Examples

### JavaScript/TypeScript

```javascript
// Include Socket.IO client
// <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>

const socket = io('http://localhost:5001');

// Connection events
socket.on('connect', () => {
    console.log('Connected to WebSocket server');
});

socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket server');
});

// Data events
socket.on('db4_live_data', (data) => {
    console.log('Live data:', data);
    // Update your UI here
});

socket.on('db4_error', (error) => {
    console.error('Error:', error);
    // Handle error in UI
});

socket.on('stream_status', (status) => {
    console.log('Stream status:', status);
    // Update status indicator
});

// Start live streaming
socket.emit('start_live_stream');

// Get single reading
socket.emit('get_single_reading');

// Stop streaming
socket.emit('stop_live_stream');
```

### Python

```python
import socketio
import time

# Create client
sio = socketio.Client()

@sio.event
def connect():
    print("Connected to WebSocket server")

@sio.on('db4_live_data')
def on_live_data(data):
    print(f"Live data: {data}")

@sio.on('db4_error')
def on_error(data):
    print(f"Error: {data}")

# Connect and start streaming
sio.connect('http://localhost:5001')
sio.emit('start_live_stream')

# Keep connection alive
time.sleep(60)

# Stop and disconnect
sio.emit('stop_live_stream')
sio.disconnect()
```

## Error Handling

The WebSocket API includes comprehensive error handling:

1. **Connection Errors:** Handled by Socket.IO client
2. **PLC Communication Errors:** Emitted as `db4_error` events
3. **Streaming Errors:** Automatically retry with exponential backoff
4. **Database Errors:** Logged and handled gracefully

## Configuration

### PLC Settings
- **IP Address:** 192.168.2.3
- **Rack:** 0
- **Slot:** 3
- **DB Size:** 36 bytes

### Streaming Settings
- **Polling Interval:** 5 seconds (configurable)
- **Error Retry Interval:** 10 seconds
- **Auto-reconnect:** Enabled

## Security Considerations

1. **CORS:** Configured for specific origins
2. **Rate Limiting:** Consider implementing for production
3. **Authentication:** Add if needed for production use
4. **SSL/TLS:** Use WSS for production environments

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check server is running on port 5001
   - Verify CORS settings
   - Check network connectivity

2. **No Data Received**
   - Verify PLC is accessible
   - Check PLC IP address and settings
   - Ensure streaming is started

3. **Frequent Errors**
   - Check PLC connection
   - Verify DB4 exists and is accessible
   - Check network stability

### Debug Mode

Enable debug logging by setting the Flask app to debug mode:

```python
socketio.run(app, debug=True, host="0.0.0.0", port=5001)
```

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| WebSocket | `/` | WebSocket connection endpoint |
| GET | `/api/db4/query` | Query historical data |
| POST | `/api/db4/live` | Store live data in database |
| WebSocket | Various events | Real-time data streaming |

## Performance Notes

- **Memory Usage:** Minimal overhead for streaming
- **Network:** ~1KB per data packet
- **Database:** Automatic storage of all live data
- **Scalability:** Supports multiple concurrent clients
