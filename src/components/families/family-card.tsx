import Link from "next/link";
import { Users, Clock, Lock, Globe, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { withBasePath } from "@/lib/base-path";
import { formatFamilyHomeland } from "@/lib/family-homeland";

interface FamilyCardProps {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
  isPublic: boolean;
  updatedAt: Date;
  originSummary?: string | null;
  homelandCountry?: string | null;
  homelandRegion?: string | null;
  homelandCity?: string | null;
  size?: "small" | "medium" | "large";
}

const labels = {
  public: "\u0639\u0627\u0645\u0629",
  private: "\u062e\u0627\u0635\u0629",
  family: "\u0639\u0627\u0626\u0644\u0629",
  person: "\u0641\u0631\u062f",
};

const sizeConfig = {
  small: { card: "min-h-40", mark: "h-10 w-10" },
  medium: { card: "min-h-44", mark: "h-12 w-12" },
  large: { card: "min-h-52", mark: "h-14 w-14" },
};

const cardIcon = withBasePath("/icons/maskable-icon-512x512.png");

export function FamilyCard({
  name,
  slug,
  memberCount,
  isPublic,
  updatedAt,
  originSummary,
  homelandCountry,
  homelandRegion,
  homelandCity,
  size = "medium",
}: FamilyCardProps) {
  const config = sizeConfig[size];
  const homeland = formatFamilyHomeland({ homelandCountry, homelandRegion, homelandCity });
  const timeLabel = new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "medium",
  }).format(updatedAt);

  return (
    <Link href={`/family/${slug}`} className="group block h-full">
      <Card
        className={cn(
          "relative h-full overflow-hidden rounded-lg border-border/60 bg-card/80 backdrop-blur",
          "transition-all duration-300 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5",
          config.card
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_90%,hsl(var(--accent)/0.11),transparent_34%)]" />
        <div
          className="absolute -bottom-7 -left-7 h-32 w-32 bg-contain bg-center bg-no-repeat opacity-[0.055] transition-opacity duration-300 group-hover:opacity-[0.1]"
          style={{ backgroundImage: `url(${cardIcon})` }}
          aria-hidden="true"
        />

        <CardContent className="relative flex h-full flex-col justify-between p-4">
          <div className="flex items-start justify-between gap-3">
            <div
              className={cn(
                "rounded-full border border-accent/20 bg-background/55 bg-cover bg-center shadow-sm shadow-black/20",
                config.mark
              )}
              style={{ backgroundImage: `url(${cardIcon})` }}
              aria-hidden="true"
            />
            <Badge variant={isPublic ? "public" : "private"} className="text-xs">
              {isPublic ? (
                <>
                  <Globe className="ml-1 h-3 w-3" />
                  {labels.public}
                </>
              ) : (
                <>
                  <Lock className="ml-1 h-3 w-3" />
                  {labels.private}
                </>
              )}
            </Badge>
          </div>

          <div className="mt-5">
            <h3 className="line-clamp-1 text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
              {labels.family} {name}
            </h3>
            {homeland && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-accent/70" />
                <span className="line-clamp-1">{homeland}</span>
              </p>
            )}
            {originSummary && (
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {originSummary}
              </p>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {memberCount} {labels.person}
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
