import Link from "next/link";
import { Users, Clock, TreePine, Lock, Globe, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FamilyCardProps {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
  isPublic: boolean;
  updatedAt: Date;
  originSummary?: string | null;
  size?: "small" | "medium" | "large";
}

const sizeConfig = {
  small:  { card: "h-40",  icon: "h-8  w-8",  tree: "h-6 w-6" },
  medium: { card: "h-52",  icon: "h-11 w-11", tree: "h-8 w-8" },
  large:  { card: "h-64",  icon: "h-14 w-14", tree: "h-10 w-10" },
};

export function FamilyCard({
  name,
  slug,
  memberCount,
  isPublic,
  updatedAt,
  originSummary,
  size = "medium",
}: FamilyCardProps) {
  const config = sizeConfig[size];

  const daysAgo = Math.floor(
    (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const timeLabel =
    daysAgo === 0 ? "اليوم" : daysAgo === 1 ? "أمس" : `منذ ${daysAgo} يوم`;

  return (
    <Link href={`/family/${slug}`} className="group block">
      <Card
        className={cn(
          "relative overflow-hidden border-border/60 bg-card/80 backdrop-blur",
          "hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5",
          "transition-all duration-300",
          config.card
        )}
      >
        {/* Background texture */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent via-transparent to-transparent" />

        <CardContent className="relative h-full flex flex-col justify-between p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div
              className={cn(
                "rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110",
                config.icon
              )}
            >
              <TreePine className={cn("text-accent", config.tree)} />
            </div>
            <Badge variant={isPublic ? "public" : "private"} className="text-xs">
              {isPublic ? (
                <><Globe className="h-3 w-3 ml-1" />عامة</>
              ) : (
                <><Lock className="h-3 w-3 ml-1" />خاصة</>
              )}
            </Badge>
          </div>

          {/* Name & description */}
          <div className="mt-2">
            <h3 className="font-semibold text-foreground text-base leading-snug group-hover:text-accent transition-colors line-clamp-1">
              عائلة {name}
            </h3>
            {originSummary && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                {originSummary}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {memberCount} فرد
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {timeLabel}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
