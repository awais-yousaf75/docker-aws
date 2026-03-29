import "./App.css";
import { Editor } from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";
import { useRef, useMemo, useState, useEffect } from "react";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";

function App() {
  const editorRef = useRef(null);
  const [userName, setUserName] = useState(() => {
    return new URLSearchParams(window.location.search).get("userName") || "";
  });

  const [users, setUsers] = useState([]);

  const ydoc = useMemo(() => new Y.Doc(), []);

  const ytext = ydoc.getText("monaco", [ydoc]);

  const handleMount = (editor) => {
    editorRef.current = editor;
    new MonacoBinding(
      ytext,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
    );
  };

  const handleJoin = (e) => {
    e.preventDefault();
    setUserName(e.target.userName.value);
    window.history.pushState({}, "", "?userName=" + e.target.userName.value);
  };

  useEffect(() => {
    if (userName) {
      const provider = new SocketIOProvider(
        "http://localhost:3000",
        "monaco",
        ydoc,
        { autoConnect: true },
      );

      provider.awareness.setLocalStateField("user", {
        userName,
        color: "#" + Math.floor(Math.random() * 16777215).toString(16),
      });

      const states = Array.from(provider.awareness.getStates().values());
      setUsers(
        states
          .filter((state) => state.user && state.user.userName)
          .map((state) => state.user),
      );

      provider.awareness.on("change", () => {
        const states = Array.from(provider.awareness.getStates().values());
        setUsers(
          states
            .filter((state) => state.user && state.user.userName)
            .map((state) => state.user),
        );
      });

      function hanleBeforeUnload() {
        provider.awareness.setLocalStateField("user", null);
      }

      window.addEventListener("beforeunload", hanleBeforeUnload);

      return () => {
        provider.disconnect();
        window.removeEventListener("beforeunload", hanleBeforeUnload);
      };
    }
  }, [userName]);

  if (!userName) {
    return (
      <main className="h-screen w-full bg-gray-950 flex items-center justify-center">
        <form onSubmit={handleJoin} className="bg-amber-50 p-4 rounded-lg">
          <h1 className="text-xl font-bold mb-4">
            Enter your name to join the editor
          </h1>
          <input
            type="text"
            className="border border-gray-300 p-2 rounded-lg w-full"
            placeholder="Your name"
            name="userName"
          />
          <button
            className="bg-blue-500 text-white p-2 rounded-lg mt-4"
            onClick={() => {
              if (userName.trim()) {
                setUserName(userName.trim());
              }
            }}
          >
            Join Editor
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="h-screen w-full bg-gray-950 flex gap-4 p-4 ">
      <aside className="h-full w-1/4 bg-amber-50 rounded-lg">
        <h2 className="text-xl font-bold p-4 border-b border-gray-300">
          Active Users
        </h2>
        <ul className="p-4">
          {users.map((user, index) => (
            <li key={index} className="flex items-center gap-2 mb-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: user.color }}
              ></span>
              {user.userName}
            </li>
          ))}
        </ul>
      </aside>
      <section className="w-3/4 bg-neutral-800 rounded-lg overflow-hidden">
        <Editor
          height="100%"
          language="javascript"
          theme="vs-dark"
          defaultValue="// Enter your code here"
          onMount={handleMount}
        />
      </section>
    </main>
  );
}

export default App;
