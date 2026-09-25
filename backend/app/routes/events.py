import asyncio
import json
import time
from typing import Set, Dict, Any, AsyncGenerator
from fastapi import APIRouter, Request
from starlette.responses import StreamingResponse

router = APIRouter(prefix="/events", tags=["Real-Time Clinical Telemetry"])

# In-memory subscriber queues for real-time SSE broadcast
_subscribers: Set[asyncio.Queue] = set()


async def broadcast_clinical_event(event_data: Dict[str, Any]):
    """
    Broadcasts a real-time event to all connected web clients via Server-Sent Events.
    """
    if not event_data.get("timestamp"):
        event_data["timestamp"] = time.strftime("%I:%M %p")
    if not event_data.get("id"):
        event_data["id"] = f"ev-{int(time.time() * 1000)}"

    payload = json.dumps(event_data)
    dead_subscribers = set()
    for queue in list(_subscribers):
        try:
            queue.put_nowait(payload)
        except asyncio.QueueFull:
            dead_subscribers.add(queue)

    for dead in dead_subscribers:
        _subscribers.discard(dead)


@router.post("/publish")
async def publish_event(event: Dict[str, Any]):
    """
    API endpoint allowing services to publish real-time events.
    """
    await broadcast_clinical_event(event)
    return {"status": "broadcast_dispatched", "subscribers": len(_subscribers)}


@router.get("/stream")
async def stream_clinical_events(request: Request):
    """
    Server-Sent Events (SSE) endpoint for real-time frontend synchronization.
    Maintains persistent HTTP connection with < 50ms broadcast latency.
    """
    queue: asyncio.Queue = asyncio.Queue(maxsize=100)
    _subscribers.add(queue)

    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            # Send initial connection handshake
            init_msg = json.dumps({
                "type": "CONNECTION_ESTABLISHED",
                "title": "SlotSure Live Telemetry Connected",
                "description": "Real-time SSE event bus streaming active",
                "timestamp": time.strftime("%I:%M %p"),
                "badge": "Connected",
                "badgeColor": "emerald"
            })
            yield f"data: {init_msg}\n\n"

            while True:
                # Disconnect if client closed browser
                if await request.is_disconnected():
                    break

                try:
                    # Wait for next broadcast event or timeout after 15 seconds to send heartbeat
                    payload = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"data: {payload}\n\n"
                except asyncio.TimeoutError:
                    # Send periodic keep-alive heartbeat ping
                    heartbeat = json.dumps({
                        "type": "HEARTBEAT",
                        "title": "Clinic Telemetry Ping",
                        "description": "Hospital neural nodes synchronized",
                        "timestamp": time.strftime("%I:%M %p"),
                        "badge": "Heartbeat",
                        "badgeColor": "slate"
                    })
                    yield f"data: {heartbeat}\n\n"

        except asyncio.CancelledError:
            pass
        finally:
            _subscribers.discard(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
