import { oauthUrl } from "../api/client";
import { GitHubIcon, GoogleIcon } from "./icons";

const BUTTON_CLASS =
  "flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50";

export default function OAuthButtons() {
  return (
    <>
      <div className="my-6 flex items-center gap-3 text-xs uppercase text-gray-400">
        <span className="h-px flex-1 bg-gray-200" />
        or
        <span className="h-px flex-1 bg-gray-200" />
      </div>
      <div className="space-y-3">
        <a href={oauthUrl("google")} className={BUTTON_CLASS}>
          <GoogleIcon />
          Continue with Google
        </a>
        <a href={oauthUrl("github")} className={BUTTON_CLASS}>
          <GitHubIcon />
          Continue with GitHub
        </a>
      </div>
    </>
  );
}
