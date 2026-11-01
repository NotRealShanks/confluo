import { LiveAvatarStack, type LiveAvatarStackProps } from "./collaborative/LiveAvatarStack";

export default function Presence(props: LiveAvatarStackProps) {
  return <LiveAvatarStack {...props} />;
}

export { LiveAvatarStack };
