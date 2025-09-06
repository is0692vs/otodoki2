import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface SectionProps {
  title: string;
  viewAllHref?: string;
  children: React.ReactNode;
}

export function Section({ title, viewAllHref, children }: SectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{title}</h2>
        {viewAllHref && (
          <Link href={viewAllHref} passHref>
            <Button variant="ghost" className="h-auto p-0 text-sm">
              すべて見る
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
