import type { InvalidationEntity } from "@/types/restaurant";

// In-memory store for SSE connections, keyed by restaurantId
// Each restaurant can have multiple connected clients (tablets, PCs, etc.)
type SSEController = ReadableStreamDefaultController<Uint8Array>;

interface ConnectionEntry {
  controller: SSEController;
  createdAt: number;
}

const connections = new Map<string, Set<ConnectionEntry>>();

// SEC: Max SSE connections per restaurant to prevent memory DoS
const MAX_CONNECTIONS_PER_RESTAURANT = 20;

/**
 * Register a new SSE connection for a restaurant.
 * Returns null if the connection limit is reached.
 */
export function addConnection(restaurantId: string, controller: SSEController): ConnectionEntry | null {
  if (!connections.has(restaurantId)) {
    connections.set(restaurantId, new Set());
  }
  const set = connections.get(restaurantId)!;
  if (set.size >= MAX_CONNECTIONS_PER_RESTAURANT) {
    return null; // Limit reached
  }
  const entry: ConnectionEntry = { controller, createdAt: Date.now() };
  set.add(entry);
  return entry;
}

/**
 * Remove an SSE connection when the client disconnects.
 */
export function removeConnection(restaurantId: string, entry: ConnectionEntry) {
  const set = connections.get(restaurantId);
  if (set) {
    set.delete(entry);
    if (set.size === 0) {
      connections.delete(restaurantId);
    }
  }
}

/**
 * Broadcast an invalidation event to all SSE clients for a restaurant.
 * Called by API route handlers after successful mutations.
 */
export function broadcastInvalidation(restaurantId: string, entity: InvalidationEntity) {
  const set = connections.get(restaurantId);
  if (!set || set.size === 0) return;

  const encoder = new TextEncoder();
  const message = `event: invalidate\ndata: ${JSON.stringify({ entity, timestamp: Date.now() })}\n\n`;
  const encoded = encoder.encode(message);

  const dead: ConnectionEntry[] = [];

  for (const entry of set) {
    try {
      entry.controller.enqueue(encoded);
    } catch {
      // Controller closed / client disconnected
      dead.push(entry);
    }
  }

  // Clean up dead connections
  for (const entry of dead) {
    set.delete(entry);
  }
  if (set.size === 0) {
    connections.delete(restaurantId);
  }
}

/**
 * Get the number of active connections for debugging.
 */
export function getConnectionCount(restaurantId?: string): number {
  if (restaurantId) {
    return connections.get(restaurantId)?.size ?? 0;
  }
  let total = 0;
  for (const set of connections.values()) {
    total += set.size;
  }
  return total;
}
