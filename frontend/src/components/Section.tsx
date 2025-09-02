import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface SectionProps {
  title: string;
  showViewAll?: boolean;
  children: React.ReactNode;
}

export function Section({ title, showViewAll = false, children }: SectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{title}</h2>
        {showViewAll && (
          <Button variant="ghost" className="h-auto p-0 text-sm">
            すべて見る
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
      {children}
    </section>
  );
}