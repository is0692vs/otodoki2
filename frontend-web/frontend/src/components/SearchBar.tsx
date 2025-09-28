import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export function SearchBar() {
  return (
    <div className="relative flex w-full max-w-2xl">
      <Input
        type="text"
        placeholder="アーティスト、アルバム、楽曲を検索..."
        className="pr-12"
      />
      <Button
        size="sm"
        className="absolute right-1 top-1 h-8 w-8 p-0"
      >
        <Search className="h-4 w-4" />
        <span className="sr-only">検索</span>
      </Button>
    </div>
  );
}