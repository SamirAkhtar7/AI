import { io } from "socket.io-client";

let socketInstance = null;

export const initializaSocket = (projectId) => {
  if (!projectId) {
    console.error("Project ID is missing");
    return;
  }

  socketInstance = io(import.meta.env.VITE_API_URL, {
    auth: {
      token: localStorage.getItem("token"), // Ensure the token is stored in localStorage
    },
    query: {
      projectId: projectId, // Use the passed projectId directly
    },
  });

  socketInstance.on("connect", () => {
    console.log("Connected to the server");
  });

  socketInstance.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });

  return socketInstance;
};

export const receiveMassage = (eventName, data) => {
  socketInstance.on(eventName, data);
};

export const sendMessage = (eventName, data) => {
  socketInstance.emit(eventName, data);
};
