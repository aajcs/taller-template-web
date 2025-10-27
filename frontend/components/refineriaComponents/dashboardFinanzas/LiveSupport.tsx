// RUTA: /components/dashboards/sales/LiveSupport.tsx
import React, { useState, useRef, useEffect } from "react";
import { InputText } from "primereact/inputtext";

const LiveSupport = () => {
  const [chatMessages, setChatMessages] = useState([
    {
      self: false,
      from: "Jane Cooper",
      url: "/demo/images/avatar/stephenshaw.png",
      messages: [
        "Hey M. hope you are well. Our idea is accepted by the board. ",
      ],
    },
    {
      self: true,
      from: "Jerome Bell",
      url: "/demo/images/avatar/ivanmagalhaes.png",
      messages: ["we did it! 🤠"],
    },
    {
      self: false,
      from: "Darlene Robertson",
      url: "/demo/images/avatar/amyelsner.png",
      messages: ["I will be looking at the process then, just to be sure 🤓 "],
    },
  ]);
  const chatcontainer = useRef<HTMLUListElement | null>(null);

  const onChatKeydown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      const message = event.currentTarget.value;
      event.currentTarget.value = "";
      if (!message) return;

      let newChatMessages = [...chatMessages];
      newChatMessages.push({
        self: true,
        from: "Jerome Bell",
        url: "/demo/images/avatar/ivanmagalhaes.png",
        messages: [message],
      });
      setChatMessages(newChatMessages);
    }
  };

  useEffect(() => {
    chatcontainer.current?.scroll({
      top: chatcontainer.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatMessages]);

  return (
    <div className="card h-full">
      <h5>Live Support</h5>
      <div>
        <ul
          ref={chatcontainer}
          className="chat-container list-none p-0 px-3 mt-4 mb-6 h-21rem overflow-y-auto"
        >
          {chatMessages.map((chartMessage, i) => (
            <li
              className={`flex align-items-start mb-3 ${
                chartMessage.self
                  ? "justify-content-end"
                  : "justify-content-start"
              }`}
              key={i}
            >
              {!chartMessage.self && (
                <img
                  src={chartMessage.url}
                  width="36"
                  height="36"
                  className="border-circle"
                  alt="chat-alt"
                />
              )}
              <div
                className={`ml-2 flex flex-column ${
                  chartMessage.self ? "align-items-end" : "align-items-start"
                }`}
              >
                <div>
                  <span className="font-bold mr-3">{chartMessage.from}</span>
                  <span className="text-color-secondary">2m ago</span>
                </div>
                {chartMessage.messages.map((message, messageIndex) => (
                  <div
                    key={messageIndex}
                    className={`inline-block border-round px-5 py-3 mt-3 ${
                      chartMessage.self
                        ? "bg-primary-500 text-primary-50 text-right"
                        : "surface-100 text-left"
                    }`}
                  >
                    {message}
                  </div>
                ))}
              </div>
              {chartMessage.self && (
                <img
                  src={chartMessage.url}
                  width="36"
                  height="36"
                  className="border-circle ml-2"
                  alt="avatar"
                />
              )}
            </li>
          ))}
        </ul>
        <div className="p-inputgroup mt-3">
          <InputText
            type="text"
            placeholder="Write your message (Hint: 'PrimeReact')"
            onKeyDown={onChatKeydown}
          />
        </div>
      </div>
    </div>
  );
};

export default LiveSupport;
