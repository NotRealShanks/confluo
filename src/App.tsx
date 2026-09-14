import { Room } from "./Room";
import Editor from "./Editor";
import Presence from "./Presence";

export default function App() {
  return (
    <Room>
      <Presence />
      <Editor />
    </Room>
  );
}