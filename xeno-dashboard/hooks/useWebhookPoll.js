// hooks/useWebhookPoll.js
import { useEffect, useRef } from "react";

/**
 * Poll the backend (through the /api/proxy route) for Shopify webhook events that
 * belong to the logged-in tenant. The backend has already synced the data into the
 * database by the time an event shows up here, so the handler only needs to refresh.
 *
 * onEvents(events) receives a non-empty array of new events.
 */
export default function useWebhookPoll({ onEvents, interval = 5000 }) {
  const handlerRef = useRef(onEvents);
  handlerRef.current = onEvents;

  useEffect(() => {
    let alive = true;
    let timerId;
    let cursor = null; // last event seq seen; null until the first poll

    const poll = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const backendPath =
          cursor === null ? "/api/webhooks/check" : `/api/webhooks/check?after=${cursor}`;
        const res = await fetch(
          `/api/proxy?endpoint=${encodeURIComponent(backendPath)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) return;

        const data = await res.json();
        if (typeof data?.cursor === "number") cursor = data.cursor;
        if (Array.isArray(data?.events) && data.events.length > 0) {
          try {
            await handlerRef.current(data.events);
          } catch (e) {
            console.error("Webhook event handler error", e);
          }
        }
      } catch {
        // network hiccup: keep polling
      } finally {
        if (alive) timerId = setTimeout(poll, interval);
      }
    };

    poll();
    return () => {
      alive = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [interval]);
}
