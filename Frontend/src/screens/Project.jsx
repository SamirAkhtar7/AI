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
  const [messages, setMessages] = useState([]);
  const [openFolders, setOpenFolders] = useState(new Set());
  const [webContainer, setWebContainer] = useState(null);
  const [runProcess, setRunProcess] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(null);

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
            console.log(parsed);
            if (parsed.fileTree) {
              setFileTree(parsed.fileTree);
              webContainer?.mount(parsed.fileTree);
            }
          } catch (e) {
            console.error("Failed to parse AI message as JSON:", e);
          }
        }
      }
      appendIncomingMessage(data); // <-- keep this if you want DOM messages
      // REMOVE setMessages((prev) => [...prev, data]);
    });
  }, []);

  // --- GSAP Side Panel Animation ---
  useEffect(() => {
    gsap.set(container.current, { x: "-100%" });
  }, []);

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

  // --- Message sending ---
  const send = () => {
    if (!message.trim()) {
      console.error("Message is empty");
      return;
    }
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
        ? messageObject.sender.name
        : messageObject.sender?.email || "Unknown";

    if (messageObject.sender._id === "ai") {
      // Only call marked if messageObject.message is a string
      let renderedMarkdown = "";
      if (typeof messageObject.message === "string") {
        renderedMarkdown = marked(messageObject.message);
      }
      newMessage.innerHTML = `<small class="opacity-55 text-xs">${senderNameOrEmail}</small>
        <div class="text-sm overflow-auto bg-slate-950 text-white p-2 rounded-xl ">${renderedMarkdown}</div>`;
    } else {
      newMessage.innerHTML = `<small class="opacity-55 text-xs">${senderNameOrEmail}</small>
        <p class="text-sm">${messageObject.message || ""}</p>`;
    }

    messagesBox.appendChild(newMessage);
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
      "bg-slate-50",
      "w-fit",
      "rounded-md",
      "break-words"
    );
    newMessage.innerHTML = `<small class="opacity-55 text-xs">${
      messageObject.sender?.email || "Unknown"
    }</small>
      <p class="text-sm">${messageObject.message}</p>`;
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
        // If this is the last part, return contents
        if (i === parts.length - 1) {
          return node[part].file.contents ?? "";
        }
        // If not last part but it's a file, invalid path
        return "";
      }
      if (node[part].children) {
        node = node[part].children;
      } else {
        // If neither file nor children, invalid path
        return "";
      }
    }
    // If the path points to a folder, not a file
    return "";
  }

  function renderFileTree(tree, parentPath = "") {
    if (!tree || typeof tree !== "object") return null; // Defensive check

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
            <div key={fullPath} className="ml-4">
              <div
                className="font-bold text-base cursor-pointer flex items-center"
                onClick={() => toggleFolder(fullPath)}
              >
                <span className="mr-1">{isOpen ? "▼" : "▶"}</span>
                {name}/
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
              className="tree-element p-2 cursor-pointer px-4 flex items-center gap-2 bg-slate-200 w-full"
            >
              <p className="font-semibold text-lg">{name}</p>
            </button>
          );
        })}
      </>
    );
  }

  // --- UI ---
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
            {/* messages are rendered by appendIncomingMessage/appendOutgoingMessage */}
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

      <section className="right bg-slate-200 flex-grow h-full flex ">
        <div className="explorer h-full max-w-64 min-w-52 flex  bg-slate-300">
          <div className="file-tree w-full">{renderFileTree(fileTree)}</div>
        </div>

        <div className="code-editor h-full flex-grow flex flex-col">
          <div className="top flex items-center justify-between w-full  ">
            <div className="files flex ">
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
                    <i className="ri-close-fill"></i>
                  </span>
                </button>
              ))}
            </div>

            <div className="actions flex gap-2">
              <button
                onClick={async () => {
                  await webContainer.mount(fileTree);

                  // Run npm install and wait for it to finish
                  const installProcess = await webContainer.spawn("npm", [
                    "install",
                  ]);
                  await installProcess.exit; // Wait for install to finish

                  installProcess.output.pipeTo(
                    new WritableStream({
                      write(chunk) {
                       console.log(chunk)
                      },
                    })
                  );

                  if (runProcess) {
                    runProcess.kill();
                  }

                  // Now start the server
                  let tempRunProcess = await webContainer.spawn("npm", [
                    "start",
                  ]);
                  tempRunProcess.output.pipeTo(
                    new WritableStream({
                      write(chunk) {
                 console.log(chunk)
                      },
                    })
                  );

                  setRunProcess(tempRunProcess);

                  webContainer.on("server-ready", (port, url) => {
                    console.log(port,url)
                    setIframeUrl(url);
                  });
                }}
                className="p-2 px-4 bg-slate-300 text-white"
              >
                run
              </button>
            </div>
          </div>
          <div className="bottom flex-grow min-h-0">
            <textarea
              className="p-2 bg-slate-900 text-white h-full w-full overflow-auto m-0 resize-none"
              value={getFileContent(fileTree, currentFile)}
              onChange={(e) => {
                // Update fileTree with new content
                const updateTree = (tree, pathArr, content) => {
                  if (pathArr.length === 0) return tree;
                  const [head, ...rest] = pathArr;
                  if (rest.length === 0) {
                    // At file node
                    if (tree[head] && tree[head].file) {
                      return {
                        ...tree,
                        [head]: {
                          ...tree[head],
                          file: {
                            ...tree[head].file,
                            contents: content,
                          },
                        },
                      };
                    }
                    return tree;
                  }
                  if (tree[head] && tree[head].children) {
                    return {
                      ...tree,
                      [head]: {
                        ...tree[head],
                        children: updateTree(
                          tree[head].children,
                          rest,
                          content
                        ),
                      },
                    };
                  }
                  return tree;
                };
                setFileTree((prev) =>
                  updateTree(prev, currentFile.split("/"), e.target.value)
                );
              }}
            />
          </div>
        </div>

        {
          iframeUrl && webContainer &&
          <iframe src={iframeUrl} className="w-1/2 h-full" > </iframe>
}
        
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
