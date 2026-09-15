import { useMemo } from "react";
import { Room } from "./Room";
import Editor from "./Editor";
import Presence from "./Presence";

function randomName() {
  return `Guest${Math.floor(Math.random() * 1000)}`;
}

function randomColor() {
  return "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
}

export default function App() {
  const myName = useMemo(randomName, []);
  const myColor = useMemo(randomColor, []);

  return (
    <Room name={myName}>
      <Presence />
      <Editor name={myName} color={myColor} />
    </Room>
  );
}