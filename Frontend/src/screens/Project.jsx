import React, { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { useLocation } from "react-router-dom";

const Project = ({ navigate }) => {
  const container = useRef();
  const location = useLocation();
  console.log(location.state);

  const [isSidePanalOpen, setIsSidePanalOpen] = useState(false);

  // Ensure the initial position of the sediPanel is -100% on X-axis
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

  return (
    <main className="h-screen w-screen flex">
      <section className="left relative flex flex-col h-full min-w-70 bg-teal-500">
        <header className="flex justify-end p-2 px-4 w-full bg-slate-300">
          <button
            onClick={() => {
              setIsSidePanalOpen(true);
            }}
            className="p-2"
          >
            <i className="ri-group-fill"></i>
          </button>
        </header>

        <div className="conversatoin-area flex-grow flex flex-col p-2">
          <div className="message-box flex-grow flex flex-col gap-1">
            <div className="incoming max-w-60 flex flex-col p-2 bg-slate-50 w-fit rounded-md break-words">
              <small className="opacity-55 text-xs">example@gmail.com</small>
              <p className="text-sm">Hello</p>
            </div>

            <div className="outgoing max-w-56 ml-auto flex flex-col p-2 bg-slate-50 w-fit rounded-md break-words">
              <small className="opacity-55 text-xs">example@gmail.com</small>
              <p className="text-sm">Lorem ipsum dolor sit</p>
            </div>
          </div>
          <div className="w-full flex">
            <input
              className="p-2 px-4 border outline-none flex=groe"
              type="text"
              placeholder="Enter the message"
            />

            <button className=" px-3 text-white bg-slate-950 ">
              <i className="ri-send-plane-fill"></i>
            </button>
          </div>
        </div>

        <div
          ref={container}
          className="sediPanel w-full h-full flex flex-col gap-2  bg-red-600 absolute z-10 top-0"
        >
          <header className="flex justify-end p-2 px-3 bg-slate-200">
            <button
              onClick={() => {
                setIsSidePanalOpen(false);
              }}
            >
              <i className="ri-close-fill"></i>
            </button>
          </header>

          <div className=" users flex flex-col gap-2 ">
            <div className="user p-2 cursor-pointer hover:bg-slate-300 flex gap-2 items-center">
              <div className="rounded-full flex justify-center items-center aspect-square w-fit h-fit p-5 bg-gray-400 text-white">
                <i className="ri-user-fill absolute"></i>
              </div>
              <h2 className="font-semibold text-lg ">UserName</h2>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Project;
