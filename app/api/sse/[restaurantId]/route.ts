import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { addConnection, removeConnection } from "@/lib/sse";

export const dynamic = "force-dynamic";

const HEARTBEAT_INTERVAL = 25_000; // 25 seconds

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  const { restaurantId } = await params;

  // Auth check
  const session = await getServerSession(authOptions);
  if (!session?.user?.restaurantId || session.user.restaurantId !== restaurantId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let connectionEntry: ReturnType<typeof addConnection> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Register this connection
      connectionEntry = addConnection(restaurantId, controller);

      // SEC: Reject if connection limit reached
      if (!connectionEntry) {
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ error: "Too many connections" })}\n\n`)
        );
        controller.close();
        return;
      }

      // Send initial connected event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ restaurantId })}\n\n`)
      );

      // Heartbeat to keep the connection alive
      heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          // Connection dead — cleanup happens in cancel()
          if (heartbeatTimer) clearInterval(heartbeatTimer);
        }
      }, HEARTBEAT_INTERVAL);
    },
    cancel() {
      // Client disconnected
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      if (connectionEntry) removeConnection(restaurantId, connectionEntry);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
