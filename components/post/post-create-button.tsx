"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";

interface PostCreateButtonProps {
  className?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function PostCreateButton({
  className,
  variant = "default",
  size,
}: PostCreateButtonProps) {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.push("/dashboard/posts/new")}
      className={className}
      variant={variant}
      size={size}
    >
      {size === "icon" ? (
        <Icons.add className="h-4 w-4" />
      ) : (
        <>
          <Icons.add className="mr-2 h-4 w-4" />
          新建文章
        </>
      )}
    </Button>
  );
}
