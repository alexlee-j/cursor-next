"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

interface FollowContextType {
  isFollowing: boolean;
  followersCount: number;
  setIsFollowing: Dispatch<SetStateAction<boolean>>;
  setFollowersCount: Dispatch<SetStateAction<number>>;
}

const FollowContext = createContext<FollowContextType | null>(null);

interface FollowProviderProps {
  children: ReactNode;
  initialIsFollowing: boolean;
  initialFollowersCount: number;
  authorId: string;
}

export function FollowProvider({
  children,
  initialIsFollowing,
  initialFollowersCount,
}: FollowProviderProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);

  return (
    <FollowContext.Provider
      value={{
        isFollowing,
        followersCount,
        setIsFollowing,
        setFollowersCount,
      }}
    >
      {children}
    </FollowContext.Provider>
  );
}

export function useFollow() {
  const context = useContext(FollowContext);
  if (!context) {
    throw new Error("useFollow must be used within a FollowProvider");
  }
  return context;
}
