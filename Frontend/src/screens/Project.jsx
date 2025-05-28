import React, { useState, useRef, useEffect, useContext } from "react";
import gsap from "gsap";
import { useLocation } from "react-router-dom";
import { UserContext } from "../context/user.context";
import axios from "../config/axios";
import { marked } from "marked"; // Install this library using `npm install marked`
import {
  initializaSocket,
  receiveMassage,
  sendMessage,
} from "../config/socket";
const Project = () => {
  const container = useRef();
  const location = useLocation();
  const { user } = useContext(UserContext);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidePanalOpen, setIsSidePanalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(new Set());
  const [users, setUsers] = useState([]);
  const [project, setProject] = useState(location.state.project);
  const [message, setMessage] = useState("");
  const [fileTree, setFileTree] = useState({
    "app.js": {
      content: `const express = require('expess');`,
    },
    "package.json": {
      content: `{
      "name":"temp-server"
    }`,
    },
  });

  const [currentFile, setCurrentFile] = useState(null);
  const [openFile, setOpenFile] = useState([])

  // const [messagesBoxData, setMessagesBoxData] = useState([]);
  const messagesBox = React.createRef();

  const handleUserClick = (id) => {
    setSelectedUserId((prevSelectedUserId) => {
      const newSelectedUserId = new Set(prevSelectedUserId);
      if (newSelectedUserId.has(id)) {
        newSelectedUserId.delete(id);
      } else {
        newSelectedUserId.add(id);
      }
      return newSelectedUserId;
    });
  };

  const addCollaborators = () => {
    axios
      .put("/projects/add-user", {
        projectId: project._id,
        users: Array.from(selectedUserId),
      })
      .then((res) => {
        // console.log("Collaborators added:", res.data);
        setIsModalOpen(false);
      })
      .catch((err) => {
        console.error("Error adding collaborators:", err);
      });
  };

  useEffect(() => {
    if (!project || !project._id) {
      console.error("Project ID is missing or invalid");
      return;
    }

    // Initialize the socket connection
    initializaSocket(project._id);

    const ID = project._id;

    // Listen for incoming messages
    receiveMassage("project-message", (data) => {
      appendIncomingMessage(data);
      console.log("Received message:", data, project._Id);
      console.log("Current project ID:", project._id);
    });

    // Fetch the project details
    axios
      .get(`/projects/get-project/${project._id}`)
      .then((res) => {
        console.log("Project data:", res.data.project); // Log the project data
        setProject(res.data.project); // Set the project state
      })
      .catch((err) => {
        console.error("Error fetching project:", err);
      });

    // Fetch all users
    axios
      .get("/users/all")
      .then((res) => {
        setUsers(res.data.users || []);
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
      });
  }, []);

  // Initialize the side panel position
  useEffect(() => {
    gsap.set(container.current, { x: "-100%" });
  }, []);

  // Animate the side panel based on `isSidePanalOpen`
  useEffect(() => {
    if (isSidePanalOpen) {
      gsap.to(container.current, {
        x: "0%",
        duration: 0.5,
        ease: "power2.out",
      });
    } else {
      gsap.to(container.current, {
        x: "-100%",
        duration: 0.5,
        ease: "power2.out",
      });
    }
  }, [isSidePanalOpen]);

  const send = () => {
    if (!message.trim()) {
      console.error("Message is empty");
      return;
    }
    sendMessage("project-message", {
      message,
      sender: user,
      projectId: project._id, // Include the project ID
    });
    appendOutgoingMessage({ sender: user, message });

    console.log("Sending message:", message);
    setMessage("");
  };
  const scrollToBottom = () => {
    if (messagesBox.current) {
      messagesBox.current.scrollTop = messagesBox.current.scrollHeight;
    }
  };
  const appendIncomingMessage = (messageObject) => {
    const messagesBox = document.querySelector(".message-box");
    const newMessage = document.createElement("div");

    newMessage.classList.add(
      "mr-auto",
      "max-w-96",
      "message",
      "flex",
      "flex-col",
      "p-2",
      "bg-slate-50",
      "w-fit",
      "rounded-md",
      "break-words"
    );

    const senderNameOrEmail =
      messageObject.sender._id === "ai"
        ? messageObject.sender.name // Use 'name' for AI messages
        : messageObject.sender?.email || "Unknown"; // Use 'email' for user messages

    if (messageObject.sender._id === "ai") {
      // Render AI message as Markdown
      const renderedMarkdown = marked(messageObject.message);
      newMessage.innerHTML = `<small class="opacity-55 text-xs">${senderNameOrEmail}</small>
        <div class="text-sm overflow-auto bg-slate-950 text-white p-2 rounded-xl ">${renderedMarkdown}</div>`;
    } else {
      // Render user message as plain text
      newMessage.innerHTML = `<small class="opacity-55 text-xs">${senderNameOrEmail}</small>
        <p class="text-sm">${messageObject.message}</p>`;
    }

    messagesBox.appendChild(newMessage);
    scrollToBottom();
  };

  const appendOutgoingMessage = (messageObject) => {
    const messagesBox = document.querySelector(".message-box");
    const newMessage = document.createElement("div");

    newMessage.classList.add(
      "ml-auto",
      "max-w-56",
      "message",
      "flex",
      "flex-col",
      "p-2",
      "bg-slate-50",
      "w-fit",
      "rounded-md",
      "break-words"
    );
    newMessage.innerHTML = `<small class="opacity-55 text-xs">${
      messageObject.sender?.email || "Unknown"
    }</small>
      <p class="text-sm">${messageObject.message}</p>`;
    messagesBox.appendChild(newMessage);
    scrollToBottom();
  };

  return (
    <main className="h-screen w-screen flex">
      <section className="left relative flex flex-col h-screen min-w-70 bg-teal-500">
        <header className="flex justify-between items-center p-2 px-4 w-full bg-slate-300">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex p-2 px-4 gap-2 bg-blue-500 text-white rounded-md"
          >
            <i className="ri-add-fill mr-1"></i>
            <p>Add collaborator</p>
          </button>
          <button
            onClick={() => setIsSidePanalOpen(!isSidePanalOpen)}
            className="p-2"
          >
            <i className="ri-group-fill"></i>
          </button>
        </header>

        <div className="conversatoin-area flex-grow flex flex-col p-2 min-h-0">
          <div
            ref={messagesBox}
            className="message-box flex-grow flex flex-col gap-1 overflow-y-auto  min-h-0 max-h-full"
          >
            {/* messages here */}
          </div>
          <div className="w-full flex items-center gap-2 mt-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-grow p-2 border rounded"
              placeholder="Type your message..."
            />
            <button
              onClick={send}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Send
            </button>
          </div>
        </div>

        {/* Sliding Side Panel */}
        <div
          ref={container}
          className="sediPanel w-full h-full flex flex-col gap-2 bg-red-600 absolute z-10 top-0"
        >
          <header className="flex justify-between items-center p-2 px-3 bg-slate-200">
            <h1 className="font-semibold"> collaborator</h1>
            <button onClick={() => setIsSidePanalOpen(false)} className="p-2">
              <i className="ri-close-fill"></i>
            </button>
          </header>

          <div className="users flex flex-col gap-2">
            {project && project.users && project.users.length > 0 ? (
              project.users.map((user) => (
                <div
                  key={user._id}
                  className="user cursor-pointer hover:bg-slate-200 p-2 flex gap-2 items-center"
                >
                  <div className="aspect-square rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600">
                    <i className="ri-user-fill absolute"></i>
                  </div>
                  <h1 className="font-semibold text-lg text-black">
                    {user.email || "No Email"}
                  </h1>
                </div>
              ))
            ) : (
              <p className="text-white">No users found</p>
            )}
          </div>
        </div>
      </section>

      <section className="right bg-red-100 flex-grow h-full flex ">
        <div className="explorer h-full max-w-64 min-w-52  bg-slate-300 ">
          <div className="file-tree w-full">
            {Object.keys(fileTree).map((file) => (
              <button
                key={file}
                onClick={() => {
                  setCurrentFile(file);
                  setOpenFile(Array.from(new Set([...openFile, file])));
                }}
                className="tree-element p-2 cursor-pointer px-4 flex items-center gap-2 bg-slate-200 w-full"
              >
                <p className="font-semibold text-lg">{file}</p>
              </button>
            ))}
          </div>
        </div>

        {currentFile && (
          <div className="code-editor h-full flex-grow flex flex-col">
            <div className="top flex items-center ">
              {openFile.map((file) => (
                <button
                  key={file}
                  onClick={() => setCurrentFile(file)}
                  className={
                    "open-file cursor-pointer p-2 px-4 flex items-center w-fit gap-2 bg-slate-300 " +
                    (currentFile === file ? "bg-slate-400" : "")
                  }
                >
                  <p className="font-semibold text-lg"> {file}</p>
                  <span
                    className="p-2 cursor-pointer"
                    onClick={e => {
                      e.stopPropagation();
                      // Remove only the closed file from openFile
                      setOpenFile(openFile.filter(f => f !== file));
                      // If the closed file is the current file, set currentFile to another open file or null
                      if (currentFile === file) {
                        const remainingFiles = openFile.filter(f => f !== file);
                        setCurrentFile(remainingFiles.length > 0 ? remainingFiles[remainingFiles.length - 1] : null);
                      }
                    }}
                  >
                    <i className="ri-close-fill"></i>
                  </span>
                </button>
              ))}
            </div>
            <div className="bottom flex-grow min-h-0">
              <textarea
                className="p-2 bg-slate-900 text-white h-full w-full overflow-auto m-0 resize-none"
                value={fileTree[currentFile]?.content}
           
              />
            </div>
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-md w-96 max-w-full relative">
            <header className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Select User</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2">
                <i className="ri-close-fill"></i>
              </button>
            </header>
            <div className="users-list flex flex-col gap-2 mb-16 max-h-96 overflow-auto">
              {users.map((user) => (
                <div
                  key={user._id}
                  className={`user cursor-pointer hover:bg-slate-200 ${
                    Array.from(selectedUserId).indexOf(user._id) !== -1
                      ? "bg-slate-200"
                      : ""
                  } p-2 flex gap-2 items-center`}
                  onClick={() => handleUserClick(user._id)}
                >
                  <div className="aspect-square relative rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600">
                    <i className="ri-user-fill absolute"></i>
                  </div>
                  <h1 className="font-semibold text-lg">{user.email}</h1>
                </div>
              ))}
            </div>
            <button
              onClick={addCollaborators}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Add Collaborators
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Project;
