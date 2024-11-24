"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Tag {
  id: string;
  name: string;
}

export function TagSelect({
  selectedTags = [],
  onTagsChange,
}: {
  selectedTags?: Tag[];
  onTagsChange: (tags: Tag[]) => void;
}) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch("/api/tags");
        const data = await response.json();
        if (Array.isArray(data)) {
          setTags(data);
        }
      } catch (error) {
        console.error("Failed to fetch tags:", error);
      }
    };

    fetchTags();
  }, []);

  const handleTagSelect = (tag: Tag) => {
    const isSelected = selectedTags.some((t) => t.id === tag.id);
    let newTags: Tag[];

    if (isSelected) {
      newTags = selectedTags.filter((t) => t.id !== tag.id);
    } else {
      newTags = [...selectedTags, tag];
    }

    onTagsChange(newTags);
  };

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-[32px] p-2 border rounded-md">
        {selectedTags.length === 0 ? (
          <span className="text-muted-foreground text-sm">未选择标签</span>
        ) : (
          selectedTags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="h-6">
              {tag.name}
              <button
                className="ml-1 hover:text-destructive"
                onClick={() => handleTagSelect(tag)}
              >
                ×
              </button>
            </Badge>
          ))
        )}
      </div>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-[120px]">
            选择标签
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <div className="p-2 border-b">
            <div className="flex items-center gap-2 px-2 py-1 border rounded-md focus-within:ring-1">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 border-0 p-0 focus-visible:ring-0"
                placeholder="搜索标签..."
              />
            </div>
          </div>
          <ScrollArea className="h-[300px]">
            <div className="grid gap-0.5 p-2">
              {filteredTags.map((tag) => {
                const isSelected = selectedTags.some((t) => t.id === tag.id);
                return (
                  <Button
                    key={tag.id}
                    variant={isSelected ? "secondary" : "ghost"}
                    className="justify-start h-8 px-2 py-1 text-sm"
                    onClick={() => handleTagSelect(tag)}
                  >
                    {tag.name}
                  </Button>
                );
              })}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
