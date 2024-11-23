"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

interface PostActionsContextType {
  liked: boolean;
  likesCount: number;
  isFavorited: boolean;
  favoritesCount: number;
  setLiked: Dispatch<SetStateAction<boolean>>;
  setLikesCount: Dispatch<SetStateAction<number>>;
  setIsFavorited: Dispatch<SetStateAction<boolean>>;
  setFavoritesCount: Dispatch<SetStateAction<number>>;
}

const PostActionsContext = createContext<PostActionsContextType | null>(null);

interface PostActionsProviderProps {
  children: ReactNode;
  initialLiked: boolean;
  initialLikesCount: number;
  initialIsFavorited: boolean;
  initialFavoritesCount: number;
}

export function PostActionsProvider({
  children,
  initialLiked,
  initialLikesCount,
  initialIsFavorited,
  initialFavoritesCount,
}: PostActionsProviderProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [favoritesCount, setFavoritesCount] = useState(initialFavoritesCount);

  return (
    <PostActionsContext.Provider
      value={{
        liked,
        likesCount,
        isFavorited,
        favoritesCount,
        setLiked,
        setLikesCount,
        setIsFavorited,
        setFavoritesCount,
      }}
    >
      {children}
    </PostActionsContext.Provider>
  );
}

export function usePostActions() {
  const context = useContext(PostActionsContext);
  if (!context) {
    throw new Error("usePostActions must be used within a PostActionsProvider");
  }
  return context;
}
