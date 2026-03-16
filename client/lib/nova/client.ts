import { io, type Socket } from "socket.io-client";

function waitForEvent<T>(
  socket: Socket,
  eventName: string,
  timeoutMs = 5_000,
) {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for ${eventName}`));
    }, timeoutMs);

    const handleSuccess = (payload: T) => {
      cleanup();
      resolve(payload);
    };

    const handleError = (error: { message?: string; details?: string }) => {
      cleanup();
      reject(new Error(error.details ?? error.message ?? `Nova error during ${eventName}`));
    };

    const cleanup = () => {
      window.clearTimeout(timer);
      socket.off(eventName, handleSuccess);
      socket.off("error", handleError);
    };

    socket.once(eventName, handleSuccess);
    socket.once("error", handleError);
  });
}

export function createNovaSocket(serverUrl: string) {
  return io(serverUrl, {
    autoConnect: false,
    transports: ["websocket", "polling"],
  });
}

export async function connectSocket(socket: Socket) {
  if (socket.connected) return;

  await new Promise<void>((resolve, reject) => {
    const onConnect = () => {
      cleanup();
      resolve();
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const cleanup = () => {
      socket.off("connect", onConnect);
      socket.off("connect_error", onError);
    };

    socket.once("connect", onConnect);
    socket.once("connect_error", onError);
    socket.connect();
  });
}

export async function initializeNovaSession(socket: Socket, systemPrompt: string) {
  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error("Timed out initializing Nova connection"));
    }, 5_000);

    socket.emit("initializeConnection", (ack?: { success?: boolean; error?: string }) => {
      window.clearTimeout(timeout);
      if (ack?.success) {
        resolve();
        return;
      }
      reject(new Error(ack?.error ?? "Nova connection failed"));
    });
  });

  socket.emit("promptStart");
  socket.emit("systemPrompt", systemPrompt);
  socket.emit("audioStart");

  await waitForEvent(socket, "audioReady");
}
