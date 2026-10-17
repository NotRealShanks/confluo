import { useOthers, useSelf } from "@liveblocks/react/suspense";
import { colorFor } from "./lib/color";

function Person({ id, name, readOnly }: { id: string; name: string; readOnly: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-gray-200">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colorFor(id) }} />
      {name}
      {readOnly && <span className="text-xs text-gray-500">view only</span>}
    </span>
  );
}

export default function Presence() {
  const self = useSelf();
  const others = useOthers();

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
      <span className="font-medium">{others.length + 1} online</span>
      <Person id={self.id} name={`${self.info.name} (you)`} readOnly={!self.canWrite} />
      {others.map((other) => (
        <Person key={other.connectionId} id={other.id} name={other.info.name} readOnly={!other.canWrite} />
      ))}
    </div>
  );
}
