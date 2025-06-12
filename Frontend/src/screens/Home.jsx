import React, { useContext, useState, useEffect, useRef } from "react";
import { UserContext } from "../context/user.context";
import axios from "../config/axios";
import { useNavigate } from "react-router-dom";
import {
  FaPlusCircle,
  FaFolderOpen,
  FaUsers,
  FaLightbulb,
} from "react-icons/fa";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  const { user } = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [project, setProject] = useState([]);
  const projectsRef = useRef([]);
  const headerRef = useRef(null);

  const navigate = useNavigate();

  function createProject(e) {
    e.preventDefault();
    axios
      .post("/projects/create", {
        name: projectName,
      })
      .then((res) => {
        setIsModalOpen(false);
        setProject((prevProjects) => [...prevProjects, res.data]);
        setProjectName("");
      })
      .catch((error) => {
        console.log(error);
      });
  }

  useEffect(() => {
    axios
      .get("/projects/all")
      .then((res) => {
        setProject(res.data.projects || []);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  // GSAP Animations
  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -40, rotateY: 30 },
        {
          opacity: 1,
          y: 0,
          rotateY: 0,
          duration: 0.8,
          ease: "power3.out",
        }
      );
    }
    if (projectsRef.current) {
      projectsRef.current.forEach((el, i) => {
        if (el) {
          gsap.fromTo(
            el,
            { opacity: 0, y: 60, rotateY: 30, scale: 0.95 },
            {
              opacity: 1,
              y: 0,
              rotateY: 0,
              scale: 1,
              duration: 0.7,
              delay: 0.15 * i,
              ease: "power3.out",
              scrollTrigger: {
                trigger: el,
                start: "top 90%",
                toggleActions: "play none none none",
              },
            }
          );
        }
      });
    }
  }, [project, isModalOpen]);

  return (
    <main
      className="min-h-screen w-full bg-gradient-to-br from-[#f8fafc] via-[#e0eafc] to-[#f8fafc] flex flex-col items-center py-6 px-2"
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      {/* Top Heading and New Project Button */}
      <div
        className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6 mb-8 px-2"
        ref={headerRef}
      >
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-blue-700 flex flex-wrap items-center gap-2 drop-shadow-lg text-center md:text-left">
            <FaLightbulb className="text-yellow-400 text-3xl sm:text-4xl" />
            <span>Welcome to</span>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ml-2">
              Something Great AI
            </span>
          </h1>
          <p className="text-gray-700 text-base sm:text-lg md:text-xl font-medium mt-2 text-center md:text-left">
            Effortlessly manage, collaborate, and run your AI projects in a
            beautiful, interactive workspace.
          </p>
        </div>
        <div className="w-full md:w-auto flex justify-center md:justify-end items-center mt-6 md:mt-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 px-5 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-base shadow-xl hover:scale-105 transition-transform duration-200"
            style={{
              boxShadow: "0 4px 24px 0 rgba(80, 80, 200, 0.15)",
              perspective: "400px",
            }}
          >
            <FaPlusCircle className="text-base" />
            New Project
          </button>
        </div>
      </div>

      {/* Projects Section in the Middle */}
      <section className="w-full max-w-6xl flex flex-col-reverse md:flex-row items-center justify-between gap-8 mb-10 px-2">
        {/* Projects List */}
        <div className="flex-2 flex flex-col gap-6 w-full">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight mb-4 text-center md:text-left drop-shadow-lg">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Your Projects
            </span>
          </h2>
          {/* AI Message Info */}
          <div className="mb-2 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-base font-medium shadow-sm text-center">
            💡 <b>Tip:</b> You can chat with{" "}
            <span className="font-bold text-purple-600">@ai</span> in your
            project to get code, file structures, and instant help. Just type
            your question or request and{" "}
            <span className="font-bold text-purple-600">@ai</span> will respond
            with code, explanations, or even generate project files for you!
          </div>
          <div className="projects flex flex-wrap gap-6 justify-center md:justify-start">
            {Array.isArray(project) && project.length === 0 && (
              <div className="w-full flex flex-col items-center mt-10">
                <FaFolderOpen className="text-6xl sm:text-7xl text-gray-300 mb-4" />
                <p className="text-gray-500 text-base sm:text-lg font-medium text-center">
                  No projects yet. Click{" "}
                  <span className="font-bold text-blue-600">New Project</span>{" "}
                  to get started!
                </p>
              </div>
            )}

            {Array.isArray(project) &&
              project.map((projectItem, idx) => (
                <div
                  key={projectItem._id}
                  ref={(el) => (projectsRef.current[idx] = el)}
                  className="project flex flex-col gap-3 cursor-pointer p-5 sm:p-7 rounded-2xl sm:rounded-3xl min-w-[180px] sm:min-w-[220px] max-w-xs bg-white shadow-2xl border border-gray-100 hover:shadow-3xl hover:-translate-y-2 hover:scale-105 transition-all duration-200"
                  style={{
                    transition: "box-shadow 0.3s, transform 0.3s",
                    perspective: "600px",
                    willChange: "transform",
                  }}
                >
                  <div
                    className="flex items-center gap-2 sm:gap-3"
                    onClick={() => {
                      navigate(`/project`, {
                        state: { project: projectItem },
                      });
                    }}
                  >
                    <FaFolderOpen className="text-2xl sm:text-3xl text-blue-500 drop-shadow-md" />
                    <h3 className="font-bold text-lg sm:text-2xl text-gray-800 truncate">
                      {projectItem.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaUsers className="text-base sm:text-lg text-purple-500" />
                    <span className="font-medium text-sm sm:text-base">
                      {projectItem.users?.length || 0} Collaborator
                      {projectItem.users?.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `Are you sure you want to delete the project "${projectItem.name}"?`
                        )
                      ) {
                        axios
                          .delete(`/projects/delete/${projectItem._id}`)
                          .then(() => {
                            setProject((prev) =>
                              prev.filter((p) => p._id !== projectItem._id)
                            );
                          })
                          .catch((err) => {
                            alert("Failed to delete project.");
                            console.error(err);
                          });
                      }
                    }}
                    className="mt-2 px-4 py-2 rounded-lg bg-red-500 text-white font-semibold shadow hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </div>
              ))}
          </div>
        </div>
        {/* Side Plane with Image */}
        <div className="flex-1 flex justify-center items-center mb-8 md:mb-0">
          <img
            src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=500&q=80"
            alt="AI Project Example"
            className="rounded-2xl shadow-xl w-full max-w-xs object-cover border-4 border-blue-100"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-5xl px-2">
        <ul className="list-none flex flex-wrap gap-3 sm:gap-4 mt-2 justify-center">
          <li className="flex items-center gap-2 bg-blue-50 px-3 sm:px-4 py-2 rounded-xl text-blue-700 font-semibold shadow-sm text-sm sm:text-base">
            ✨ Create unlimited projects
          </li>
          <li className="flex items-center gap-2 bg-purple-50 px-3 sm:px-4 py-2 rounded-xl text-purple-700 font-semibold shadow-sm text-sm sm:text-base">
            🤝 Real-time collaboration
          </li>
          <li className="flex items-center gap-2 bg-green-50 px-3 sm:px-4 py-2 rounded-xl text-green-700 font-semibold shadow-sm text-sm sm:text-base">
            🚀 Instant code preview
          </li>
          <li className="flex items-center gap-2 bg-yellow-50 px-3 sm:px-4 py-2 rounded-xl text-yellow-700 font-semibold shadow-sm text-sm sm:text-base">
            🔒 Secure cloud storage
          </li>
        </ul>
      </section>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 px-2">
          <div
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-10 relative"
            style={{
              fontFamily: "'Montserrat', sans-serif",
              boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.18)",
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.98)",
              perspective: "800px",
            }}
          >
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl sm:text-3xl transition-colors"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FaPlusCircle className="text-blue-500" />
              Create New Project
            </h2>
            <form onSubmit={createProject} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Project Name
                </label>
                <input
                  onChange={(e) => setProjectName(e.target.value)}
                  value={projectName}
                  type="text"
                  className="w-full p-3 rounded-lg bg-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 font-medium"
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold shadow-md hover:scale-105 transition-transform duration-200"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;
