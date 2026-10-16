import { oauthUrl } from "../api/client";

const BUTTON_CLASS =
  "block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-center text-sm font-medium text-gray-800 hover:bg-gray-50";

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
          Continue with Google
        </a>
        <a href={oauthUrl("github")} className={BUTTON_CLASS}>
          Continue with GitHub
        </a>
      </div>
    </>
  );
}
