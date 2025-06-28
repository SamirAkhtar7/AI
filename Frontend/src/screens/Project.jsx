import React, { useState, useRef, useEffect, useContext } from "react";
import gsap from "gsap";
import { useLocation } from "react-router-dom";
import { UserContext } from "../context/user.context";
import axios from "../config/axios";
import { getWebContainer } from "../config/webcontainer";
import { marked } from "marked";
import {
  initializaSocket,
  receiveMassage,
  sendMessage,
} from "../config/socket";
import {
  FaUserPlus,
  FaUsers,
  FaFolder,
  FaFileAlt,
  FaChevronDown,
  FaChevronRight,
  FaSave,
  FaPlay,
  FaTimes,
  FaCommentDots,
} from "react-icons/fa";
import hljs from "highlight.js";
import "highlight.js/styles/vs2015.css"; // VS Code-like theme
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css"; // Already imported

// Helper to detect language from file extension
function getLanguageFromFilename(filename) {
  if (!filename) return "javascript";
  if (filename.endsWith(".js")) return "javascript";
  if (filename.endsWith(".json")) return "json";
  if (filename.endsWith(".jsx")) return "jsx";
  if (filename.endsWith(".ts")) return "typescript";
  if (filename.endsWith(".tsx")) return "tsx";
  if (filename.endsWith(".css")) return "css";
  if (filename.endsWith(".html")) return "html";
  if (filename.endsWith(".md")) return "markdown";
  return "javascript";
}

const fontFamily = "'Poppins', 'Montserrat', 'Segoe UI', Arial, sans-serif";

const Project = () => {
  const container = useRef();
  const messagesBox = useRef();
  const location = useLocation();
  const { user } = useContext(UserContext);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidePanalOpen, setIsSidePanalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(new Set());
  const [users, setUsers] = useState([]);
  const [project, setProject] = useState(location.state.project);
  const [message, setMessage] = useState("");
  const [fileTree, setFileTree] = useState({});
  const [currentFile, setCurrentFile] = useState(null);
  const [openFile, setOpenFile] = useState([]);
  const [openFolders, setOpenFolders] = useState(new Set());
  const [webContainer, setWebContainer] = useState(null);
  const [runProcess, setRunProcess] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(null);
  const [runStatus, setRunStatus] = useState("idle");

  // Toggle folder open/close
  const toggleFolder = (path) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  // --- Collaborator logic ---
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
      .then(() => setIsModalOpen(false))
      .catch((err) => {
        console.error("Error adding collaborators:", err);
      });
  };

  // --- Fetch users on mount ---
  useEffect(() => {
    axios
      .get("/users/all")
      .then((res) => {
        setUsers(res.data.users || []);
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
      });
  }, []);

  // --- Socket and AI message/fileTree logic ---
  useEffect(() => {
    if (!project || !project._id) {
      console.error("Project ID is missing or invalid");
      return;
    }

    initializaSocket(project._id);

    if (!webContainer) {
      getWebContainer().then((container) => {
        setWebContainer(container);
        console.log("container Started");
      });
    }

    receiveMassage("project-message", (data) => {
      if (
        data.sender &&
        data.sender._id === "ai" &&
        typeof data.message === "string"
      ) {
        // Remove code block markers if present
        let clean = data.message.trim();
        if (clean.startsWith("```json")) {
          clean = clean
            .replace(/^```json/, "")
            .replace(/```$/, "")
            .trim();
        } else if (clean.startsWith("```")) {
          clean = clean.replace(/^```/, "").replace(/```$/, "").trim();
        }

        // Only parse if it looks like JSON
        if (clean.startsWith("{") || clean.startsWith("[")) {
          try {
            const parsed = JSON.parse(clean);
            if (parsed.fileTree) {
              setFileTree(parsed.fileTree);
              webContainer?.mount(parsed.fileTree);
            }
          } catch (e) {
            console.error("Failed to parse AI message as JSON:", e);
          }
        }
      }
      // Only append incoming messages if not from the current user
      if (data.sender && data.sender._id !== user._id) {
        appendIncomingMessage(data);
      }
    });
  }, []);

  // --- GSAP Side Panel Animation ---
  useEffect(() => {
    gsap.set(container.current, { x: "-100%" });
  }, []);

  // useEffect(() => {
  //   if (isSidePanalOpen) {
  //     gsap.to(container.current, {
  //       x: "0%",
  //       duration: 0.5,
  //       ease: "power2.out",
  //     });
  //   } else {
  //     gsap.to(container.current, {
  //       x: "-100%",
  //       duration: 0.5,
  //       ease: "power2.out",
  //     });
  //   }
  // }, [isSidePanalOpen]);

  function saveFileTree(ft) {
    axios
      .put("/projects/update-file-tree", {
        projectId: project._id,
        fileTree: ft,
      })
      .then(() => {})
      .catch((err) => {
        console.log(err);
      });
  }

  async function handleRun() {
    if (!webContainer) {
      alert(
        "WebContainer is not ready yet. Please wait a moment and try again."
      );
      return;
    }
    setRunStatus("starting");
    try {
      await webContainer.mount(fileTree);
      const installProcess = await webContainer.spawn("npm", ["install"]);
      await installProcess.exit;
      installProcess.output.pipeTo(
        new WritableStream({
          write(chunk) {
            console.log(chunk);
          },
        })
      );
      if (runProcess && typeof runProcess.kill === "function") {
        runProcess.kill();
      }
      let tempRunProcess = await webContainer.spawn("npm", ["start"]);
      tempRunProcess.output.pipeTo(
        new WritableStream({
          write(chunk) {
            console.log(chunk);
          },
        })
      );
      setRunProcess(tempRunProcess);
      webContainer.on("server-ready", (port, url) => {
        setIframeUrl(url);
        setRunStatus("running");
      });
    } catch (err) {
      setRunStatus("error");
      alert("Failed to run project: " + (err?.message || err));
    }
  }

  // --- Message sending ---
  const send = () => {
    if (!message.trim()) return;
    sendMessage("project-message", {
      message,
      sender: user,
      projectId: project._id,
    });
    appendOutgoingMessage({ sender: user, message });
    setMessage("");
  };

  // --- Scroll to bottom helper ---
  const scrollToBottom = () => {
    if (messagesBox.current) {
      messagesBox.current.scrollTop = messagesBox.current.scrollHeight;
    }
  };

  // --- DOM Message Rendering ---
  const appendIncomingMessage = (messageObject) => {
    const messagesBoxEl = document.querySelector(".message-box");
    const newMessage = document.createElement("div");

    newMessage.classList.add(
      "mr-auto",
      "max-w-96",
      "message",
      "flex",
      "flex-col",
      "p-2",
      "rounded-xl",
      "break-words",
      "shadow"
    );

    const senderNameOrEmail =
      messageObject.sender._id === "ai"
        ? messageObject.sender.name
        : messageObject.sender?.email || "Unknown";

    if (messageObject.sender._id === "ai") {
      let text = "";
      try {
        const parsed = JSON.parse(messageObject.message);
        if (parsed && typeof parsed.text === "string") {
          text = parsed.text;
        } else {
          text = messageObject.message;
        }
      } catch {
        text = messageObject.message;
      }

      // Use PrismJS to highlight code blocks
      // This regex finds all ```lang ... ``` blocks
      let html = text.replace(
        /```(\w+)?\n([\s\S]*?)```/g,
        (match, lang, code) => {
          const language = Prism.languages[lang] || Prism.languages.javascript;
          const highlighted = Prism.highlight(
            code,
            language,
            lang || "javascript"
          );
          return `<pre class="language-${lang}"><code class="language-${lang}">${highlighted}</code></pre>`;
        }
      );

      // For inline code
      html = html.replace(/`([^`]+)`/g, (match, code) => {
        return `<code style="background:#23272f;color:#00eaff;padding:2px 6px;border-radius:6px;">${code}</code>`;
      });

      newMessage.innerHTML = `<small class="opacity-55 text-xs text-white">${senderNameOrEmail}</small>
        <div class="text-sm overflow-auto bg-[#23272f] text-[#e0eafc] p-2 rounded-xl border border-blue-900" style="font-family: 'Fira Mono', 'Consolas', monospace;">${html}</div>`;
      newMessage.style.background =
        "linear-gradient(135deg,#23272f 60%,#2d3748 100%)";
      newMessage.style.color = "#fff";
    } else {
      newMessage.innerHTML = `<small class="opacity-55 text-xs text-white">${senderNameOrEmail}</small>
        <p class="text-sm text-white">${messageObject.message || ""}</p>`;
      newMessage.style.background = "rgba(255,255,255,0.08)";
      newMessage.style.color = "#fff";
    }

    messagesBoxEl.appendChild(newMessage);
    scrollToBottom();
  };

  const appendOutgoingMessage = (messageObject) => {
    const box = messagesBox.current;
    if (!box) return;
    const newMessage = document.createElement("div");

    newMessage.classList.add(
      "ml-auto",
      "max-w-56",
      "message",
      "flex",
      "flex-col",
      "p-2",
      "rounded-xl",
      "break-words",
      "shadow"
    );
    newMessage.innerHTML = `<small class="opacity-55 text-xs text-white">${
      messageObject.sender?.email || "Unknown"
    }</small>
      <p class="text-sm text-white">${messageObject.message}</p>`;
    newMessage.style.background = "rgba(255,255,255,0.12)";
    newMessage.style.color = "#fff";
    box.appendChild(newMessage);
    scrollToBottom();
  };

  // Helper to get file content from fileTree for a given path
  function getFileContent(tree, path) {
    if (!tree || !path) return "";
    const parts = path.split("/");
    let node = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!node[part]) return "";
      if (node[part].file) {
        if (i === parts.length - 1) {
          return node[part].file.contents ?? "";
        }
        return "";
      }
      if (node[part].children) {
        node = node[part].children;
      } else {
        return "";
      }
    }
    return "";
  }

  function renderFileTree(tree, parentPath = "") {
    if (!tree || typeof tree !== "object") return null;

    const folders = [];
    const files = [];

    for (const [name, value] of Object.entries(tree || {})) {
      if (value && value.children) {
        folders.push([name, value]);
      } else if (value && value.file) {
        files.push([name, value]);
      }
    }

    folders.sort((a, b) => a[0].localeCompare(b[0]));
    files.sort((a, b) => a[0].localeCompare(b[0]));

    return (
      <>
        {folders.map(([name, value]) => {
          const fullPath = parentPath ? `${parentPath}/${name}` : name;
          const isOpen = openFolders.has(fullPath);
          return (
            <div key={fullPath} className="ml-2">
              <div
                className="font-semibold text-base cursor-pointer flex items-center py-1 px-2 rounded hover:bg-[#2d3748] text-white transition"
                onClick={() => toggleFolder(fullPath)}
              >
                {isOpen ? (
                  <FaChevronDown className="mr-1 text-blue-400" />
                ) : (
                  <FaChevronRight className="mr-1 text-blue-400" />
                )}
                <FaFolder className="mr-2 text-yellow-400" />
                {name}
              </div>
              {isOpen && (
                <div className="ml-2">
                  {renderFileTree(value.children, fullPath)}
                </div>
              )}
            </div>
          );
        })}
        {files.map(([name, value]) => {
          const fullPath = parentPath ? `${parentPath}/${name}` : name;
          return (
            <button
              key={fullPath}
              onClick={() => {
                setCurrentFile(fullPath);
                setOpenFile(Array.from(new Set([...openFile, fullPath])));
              }}
              className="tree-element p-2 cursor-pointer px-4 flex items-center gap-2 bg-[#23272f] hover:bg-[#2d3748] w-full rounded transition text-white"
            >
              <FaFileAlt className="text-blue-300" />
              <p className="font-medium text-base">{name}</p>
            </button>
          );
        })}
      </>
    );
  }

  // --- UI ---
  return (
    <main
      className="h-screen w-screen flex flex-col md:flex-row"
      style={{
        fontFamily,
        background: "linear-gradient(135deg, #232526 0%, #2d3748 100%)",
        color: "#fff",
      }}
    >
      {/* Left Panel */}
      <section className="left relative flex flex-col h-[320px] md:h-screen w-full md:w-[320px] bg-gradient-to-b from-[#232526] via-[#414345] to-[#232526] shadow-2xl">
        <header className="flex justify-between items-center p-3 w-full bg-[#23272f] border-b border-[#2d3748]">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold shadow hover:scale-105 transition"
          >
            <FaUserPlus className="text-lg" />
            Add collaborator
          </button>
          {/* <button
            onClick={() => setIsSidePanalOpen(!isSidePanalOpen)}
            className="p-2 rounded hover:bg-[#2d3748] transition"
            title="Show Collaborators"
          >
            <FaUsers className="text-xl text-blue-400" />
          </button> */}
        </header>

        {/* Chat Area */}
        <div className="conversatoin-area flex-grow flex flex-col p-2 min-h-0">
          <div
            ref={messagesBox}
            className="message-box flex-grow flex flex-col gap-2 overflow-y-auto min-h-0 max-h-full px-1"
            style={{ color: "#fff" }}
          ></div>
          <div className="w-full flex items-center gap-2 mt-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-grow p-2 border rounded-lg focus:ring-2 focus:ring-blue-400 transition bg-[#23272f] text-white"
              placeholder="Type your message..."
              style={{ fontFamily }}
            />
            <button
              onClick={send}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold shadow hover:scale-105 transition"
            >
              <FaCommentDots className="text-lg" />
            </button>
          </div>
        </div>

        {/* Sliding Side Panel */}
        {/* <div
          ref={container}
          className="sediPanel w-full h-full flex flex-col gap-2 bg-[#23272f] absolute z-20 top-0 left-0 shadow-2xl rounded-r-2xl"
        >
          <header className="flex justify-between items-center p-3 bg-[#2d3748] rounded-t-2xl border-b">
            <h1 className="font-semibold text-blue-300 flex items-center gap-2">
              <FaUsers className="text-xl" /> Collaborators
            </h1>
            <button
              onClick={() => setIsSidePanalOpen(false)}
              className="p-2 rounded hover:bg-[#23272f] transition"
            >
              <FaTimes className="text-xl text-white" />
            </button>
          </header>
          <div className="users flex flex-col gap-2 p-2">
            {project && project.users && project.users.length > 0 ? (
              project.users.map((user) => (
                <div
                  key={user._id}
                  className="user cursor-pointer hover:bg-[#2d3748] p-2 flex gap-2 items-center rounded-lg transition"
                >
                  <div className="aspect-square rounded-full w-10 h-10 flex items-center justify-center text-white bg-gradient-to-br from-blue-500 to-purple-600 shadow">
                    <FaUsers />
                  </div>
                  <h1 className="font-semibold text-base text-white">
                    {user.email || "No Email"}
                  </h1>
                </div>
              ))
            ) : (
              <p className="text-gray-400">No users found</p>
            )}
          </div>
        </div> */}
      </section>

      {/* Main Editor Panel */}
      <section className="right bg-[#2d3748] flex-grow h-full flex flex-col md:flex-row overflow-hidden">
        {/* File Explorer */}
        <div className="explorer h-full max-w-[260px] min-w-[140px] flex bg-gradient-to-b from-[#232526] to-[#2d3748] border-r border-[#23272f] shadow-inner">
          <div className="file-tree w-full py-4 px-2">
            {renderFileTree(fileTree)}
          </div>
        </div>

        {/* Code Editor and Preview */}
        <div className="flex-1 flex flex-col h-full">
          {/* Open Files Tabs & Actions */}
          <div className="top flex flex-wrap items-center justify-between w-full px-4 py-2 bg-[#23272f] border-b border-[#2d3748] shadow-sm">
            <div className="files flex flex-wrap gap-2">
              {openFile.map((file) => (
                <button
                  key={file}
                  onClick={() => setCurrentFile(file)}
                  className={
                    "open-file cursor-pointer px-4 py-2 flex items-center gap-2 rounded-t-lg font-medium shadow-sm " +
                    (currentFile === file
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                      : "bg-[#2d3748] text-blue-200 hover:bg-blue-900")
                  }
                  style={{ fontFamily }}
                >
                  <FaFileAlt />
                  <span>{file}</span>
                  <span
                    className="ml-2 p-1 rounded hover:bg-red-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenFile(openFile.filter((f) => f !== file));
                      if (currentFile === file) {
                        const remainingFiles = openFile.filter(
                          (f) => f !== file
                        );
                        setCurrentFile(
                          remainingFiles.length > 0
                            ? remainingFiles[remainingFiles.length - 1]
                            : null
                        );
                      }
                    }}
                  >
                    <FaTimes className="text-xs" />
                  </span>
                </button>
              ))}
            </div>
            <div className="actions flex gap-2">
              <button
                onClick={() => {
                  if (project && project._id && fileTree) {
                    saveFileTree(fileTree);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold shadow hover:scale-105 transition"
              >
                <FaSave />
                Save
              </button>
              <button
                onClick={handleRun}
                className={`flex items-center gap-2 px-4 py-2 ${
                  runStatus === "running"
                    ? "bg-green-700"
                    : runStatus === "starting"
                    ? "bg-yellow-600"
                    : runStatus === "error"
                    ? "bg-red-700"
                    : "bg-blue-600"
                } text-white rounded-lg font-semibold shadow hover:scale-105 transition`}
                disabled={runStatus === "starting" || !webContainer}
              >
                <FaPlay />
                {runStatus === "starting"
                  ? "Starting..."
                  : runStatus === "running"
                  ? "Running"
                  : runStatus === "error"
                  ? "Error"
                  : "Run"}
              </button>
            </div>
          </div>
          {/* Code Editor */}
          <div className="bottom flex-grow min-h-0 flex flex-col">
            <textarea
              className="p-4 bg-[#23272f] text-[#e0eafc] h-full w-full overflow-auto m-0 font-mono text-base rounded-b-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              style={{
                fontFamily: "'Fira Mono', 'Consolas', 'Menlo', monospace",
                minHeight: "300px",
                whiteSpace: "pre",
                outline: "none",
                border: "none",
                resize: "none",
              }}
              tabIndex={0}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              value={getFileContent(fileTree, currentFile) || ""}
              onChange={(e) => {
                const value = e.target.value;
                // Update fileTree immutably
                setFileTree((prevTree) => {
                  if (!currentFile) return prevTree;
                  const parts = currentFile.split("/");
                  const newTree = { ...prevTree };
                  let node = newTree;
                  for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    if (i === parts.length - 1) {
                      if (node[part] && node[part].file) {
                        node[part] = {
                          ...node[part],
                          file: {
                            ...node[part].file,
                            contents: value,
                          },
                        };
                      }
                    } else {
                      node[part] = { ...node[part] };
                      node = node[part].children;
                    }
                  }
                  return newTree;
                });
              }}
            />
          </div>
        </div>

        {/* Live Preview */}
        {iframeUrl && webContainer && (
          <div className="flex flex-col min-w-[220px] h-full border-l border-[#23272f] bg-[#23272f] shadow-inner text-white">
            <div className="address-bar p-2 bg-[#2d3748] border-b border-[#23272f]">
              <input
                onChange={(e) => setIframeUrl(e.target.value)}
                type="text"
                value={iframeUrl}
                className="w-full p-2 px-4 rounded bg-[#23272f] border border-[#2d3748] font-mono text-xs text-white"
                name=""
                id=""
              />
            </div>
            <iframe
              src={iframeUrl}
              className="w-full h-full rounded-b-lg bg-[#f1f1f1] text-white"
              title="Live Preview"
            ></iframe>
          </div>
        )}
      </section>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-[#23272f] p-6 rounded-2xl w-full max-w-md relative shadow-2xl"
            style={{ fontFamily, color: "#fff" }}
          >
            <header className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-blue-300 flex items-center gap-2">
                <FaUserPlus /> Select User
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded hover:bg-[#2d3748] transition"
              >
                <FaTimes className="text-xl text-white" />
              </button>
            </header>
            <div className="users-list flex flex-col gap-2 mb-16 max-h-80 overflow-auto">
              {users.map((user) => (
                <div
                  key={user._id}
                  className={`user cursor-pointer hover:bg-[#2d3748] ${
                    Array.from(selectedUserId).indexOf(user._id) !== -1
                      ? "bg-[#2d3748]"
                      : ""
                  } p-2 flex gap-2 items-center rounded-lg transition`}
                  onClick={() => handleUserClick(user._id)}
                >
                  <div className="aspect-square relative rounded-full w-10 h-10 flex items-center justify-center text-white bg-gradient-to-br from-blue-500 to-purple-600 shadow">
                    <FaUsers />
                  </div>
                  <h1 className="font-semibold text-base">{user.email}</h1>
                </div>
              ))}
            </div>
            <button
              onClick={addCollaborators}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold shadow hover:scale-105 transition"
            >
              Add Collaborators
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

marked.setOptions({
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
});

export default Project;
