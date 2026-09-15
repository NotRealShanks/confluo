import { useOthers } from "@liveblocks/react/suspense";

export default function Presence() {
  const others = useOthers();

  return (
    <div className="presence">
      <span className="presence-title">
        {others.length + 1} {others.length + 1 === 1 ? "user" : "users"} online
      </span>

      <div className="presence-users">
        {others.map((user) => (
          <div
            key={user.connectionId}
            className="presence-user"
          >
            <span
              className="presence-dot"
              style={{
                backgroundColor:
                  user.presence.name ? "#22c55e" : "#999",
              }}
            />

            <span>{user.presence.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}