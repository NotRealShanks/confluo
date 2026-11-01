/* oxlint-disable react/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface FollowContextType {
  followingUserId: string | null;
  startFollowing: (userId: string, targetFileId?: string | null) => void;
  stopFollowing: () => void;
  jumpToUser: (userId: string, targetFileId?: string | null) => void;
  registerJumpHandler: (
    handler: (userId: string, targetFileId?: string | null) => void,
  ) => () => void;
}

const defaultContext: FollowContextType = {
  followingUserId: null,
  startFollowing: () => {},
  stopFollowing: () => {},
  jumpToUser: () => {},
  registerJumpHandler: () => () => {},
};

const FollowContext = createContext<FollowContextType>(defaultContext);

export function FollowProvider({ children }: { children: ReactNode }) {
  const [followingUserId, setFollowingUserId] = useState<string | null>(null);
  const jumpHandlerRef = useRef<
    ((userId: string, targetFileId?: string | null) => void) | null
  >(null);

  const registerJumpHandler = useCallback(
    (handler: (userId: string, targetFileId?: string | null) => void) => {
      jumpHandlerRef.current = handler;
      return () => {
        if (jumpHandlerRef.current === handler) {
          jumpHandlerRef.current = null;
        }
      };
    },
    [],
  );

  const jumpToUser = useCallback(
    (userId: string, targetFileId?: string | null) => {
      jumpHandlerRef.current?.(userId, targetFileId);
    },
    [],
  );

  const startFollowing = useCallback(
    (userId: string, targetFileId?: string | null) => {
      setFollowingUserId(userId);
      jumpToUser(userId, targetFileId);
    },
    [jumpToUser],
  );

  const stopFollowing = useCallback(() => {
    setFollowingUserId(null);
  }, []);

  return (
    <FollowContext.Provider
      value={{
        followingUserId,
        startFollowing,
        stopFollowing,
        jumpToUser,
        registerJumpHandler,
      }}
    >
      {children}
    </FollowContext.Provider>
  );
}

export function useFollow() {
  return useContext(FollowContext);
}

