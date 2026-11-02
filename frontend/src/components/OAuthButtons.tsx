import { oauthUrl } from "../api/client";
import { GitHubIcon, GoogleIcon } from "./icons";

const BUTTON_CLASS =
  "flex w-full items-center justify-center gap-2.5 rounded-md border border-[#27272a] bg-[#09090b] px-4 py-2.5 font-mono text-xs font-medium text-[#f4f4f5] transition-colors hover:border-[#3f3f46] hover:bg-[#18181b]";

export default function OAuthButtons() {
  return (
    <>
      <div className="my-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-[#71717a]">
        <span className="h-px flex-1 bg-[#27272a]" />
        <span>or continue with</span>
        <span className="h-px flex-1 bg-[#27272a]" />
      </div>
      <div className="space-y-2.5">
        <a href={oauthUrl("google")} className={BUTTON_CLASS}>
          <GoogleIcon />
          <span>Continue with Google</span>
        </a>
        <a href={oauthUrl("github")} className={BUTTON_CLASS}>
          <GitHubIcon />
          <span>Continue with GitHub</span>
        </a>
      </div>
    </>
  );
}
