import { Search } from "lucide-react";
import { withBasePath } from "@/lib/base-path";
import { cn } from "@/lib/utils";

interface PublicSearchFormProps {
  query?: string;
  size?: "compact" | "large";
  className?: string;
}

const labels = {
  placeholder:
    "\u0627\u0628\u062d\u062b \u0639\u0646 \u0639\u0627\u0626\u0644\u0629 \u0623\u0648 \u0634\u062e\u0635...",
  submit: "\u0628\u062d\u062b",
};

export function PublicSearchForm({
  query = "",
  size = "compact",
  className,
}: PublicSearchFormProps) {
  const isLarge = size === "large";

  return (
    <form
      action={withBasePath("/search")}
      method="get"
      className={cn("flex w-full items-center gap-2", className)}
      role="search"
    >
      <div className="relative flex-1">
        <Search
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none",
            isLarge ? "h-5 w-5 right-4" : "h-4 w-4"
          )}
        />
        <input
          name="q"
          type="search"
          defaultValue={query}
          placeholder={labels.placeholder}
          className={cn(
            "w-full rounded-md border border-input bg-muted/40 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring",
            isLarge ? "h-12 rounded-lg pr-12 pl-4 text-base" : "h-8 pr-9 pl-3"
          )}
        />
      </div>
      <button
        type="submit"
        className={cn(
          "shrink-0 rounded-md bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
          isLarge ? "h-12 px-6 text-base" : "h-8 px-4 text-sm"
        )}
      >
        {labels.submit}
      </button>
    </form>
  );
}
