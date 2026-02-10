import { io } from "socket.io-client";

const URL =
    import.meta.env.PROD
        ? window.location.origin
        : "http://localhost:3001";

export const socket = io(URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
});

export default socket;
