import React, { useState, useContext, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../config/axios.js";
import { UserContext } from "../context/user.context.jsx";
import { FaEnvelope, FaLock, FaUserPlus, FaUser } from "react-icons/fa";
import gsap from "gsap";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confPassword, setConfPassword] = useState("");
  const { setUser } = useContext(UserContext);
  const [dupEmail, setDupEmail] = useState(false);
  const [error, setError] = useState("");
  const [notMatch, setNotMatch] = useState(false);

  const navigate = useNavigate();
  const cardRef = useRef(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: -40, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power2.out" }
      );
    }
  }, []);

  function submitHandler(e) {
    e.preventDefault();
    setNotMatch(false);
    setDupEmail(false);
    setError("");

    if (password !== confPassword) {
      setNotMatch(true);
      return;
    }

    axios
      .post("/users/register", {
        name,
        email,
        password,
      })
      .then((res) => {
        localStorage.setItem("token", res.data.token);
        setUser(res.data.user);
        navigate("/login");
      })
      .catch((err) => {
        setError(
          err.response?.data?.message ||
            err.response?.data ||
            err.message ||
            "An unexpected error occurred."
        );
        setDupEmail(true);
      });
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[#232526] via-[#414345] to-[#232526] bg-opacity-90 z-50 min-h-screen px-2">
      <div
        ref={cardRef}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 animate-none flex flex-col"
        style={{
          fontFamily: "'Montserrat', sans-serif",
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(255,255,255,0.95)",
        }}
      >
        <div className="flex flex-col items-center mb-6">
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full shadow-lg mb-2">
            <FaUserPlus className="text-white text-3xl" />
          </span>
          <h2 className="text-3xl font-bold text-gray-800 mb-1 tracking-wide text-center">
            Create Account
          </h2>
          <p className="text-gray-500 text-sm mb-2 text-center">
            Join our creative community!
          </p>
        </div>
        <form onSubmit={submitHandler} className="space-y-5">
          <div className="relative">
            <label
              className="block text-gray-600 mb-1 font-semibold"
              htmlFor="name"
            >
              Name
            </label>
            <span className="absolute left-3 top-10 text-blue-400">
              <FaUser />
            </span>
            <input
              onChange={(e) => setName(e.target.value)}
              type="text"
              id="name"
              className="w-full p-3 pl-10 rounded-lg bg-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 font-medium"
              placeholder="Enter your name"
              required
            />
          </div>
          <div className="relative">
            <label
              className="block text-gray-600 mb-1 font-semibold"
              htmlFor="email"
            >
              Email
            </label>
            <span className="absolute left-3 top-10 text-blue-400">
              <FaEnvelope />
            </span>
            <input
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              id="email"
              className="w-full p-3 pl-10 rounded-lg bg-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 font-medium"
              placeholder="Enter your email"
              autoComplete="email"
              required
            />
          </div>
          {dupEmail && error && (
            <div>
              <div className="text-red-600 text-center mt-4">{error}</div>
            </div>
          )}
          <div className="relative">
            <label
              className="block text-gray-600 mb-1 font-semibold"
              htmlFor="password"
            >
              Password
            </label>
            <span className="absolute left-3 top-10 text-purple-400">
              <FaLock />
            </span>
            <input
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              id="password"
              className="w-full p-3 pl-10 rounded-lg bg-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200 font-medium"
              placeholder="Enter your password"
              autoComplete="new-password"
              required
            />
          </div>
          <div className="relative">
            <label
              className="block text-gray-600 mb-1 font-semibold"
              htmlFor="Confirm-password"
            >
              Confirm Password
            </label>
            <span className="absolute left-3 top-10 text-purple-400">
              <FaLock />
            </span>
            <input
              onChange={(e) => setConfPassword(e.target.value)}
              type="password"
              id="Confirm-password"
              className="w-full p-3 pl-10 rounded-lg bg-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200 font-medium"
              placeholder="Enter your password"
              autoComplete="new-password"
              required
            />
          </div>
          {notMatch && (
            <div>
              <div className="text-red-600 text-center mt-4">
                Confirm Password does not match
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg shadow-md hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <FaUserPlus className="text-xl" />
            Register
          </button>
        </form>
        <p className="text-gray-500 mt-6 text-center">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-600 font-semibold hover:underline transition-colors duration-150"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
