import { Badge } from "@pos/ui/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@pos/ui/components/card";
import { navItem } from "./nav";

/** Landing page for a module whose features are delivered in a later milestone. */
export function ModulePage({ href }: { href: string }) {
  const { label, description, milestone, icon: Icon } = navItem(href);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
        <Icon className="size-6" aria-hidden />
        {label}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Scheduled for {milestone} <Badge variant="secondary">not built yet</Badge>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          This module has no screens yet. See TODO.md for the delivery plan.
        </CardContent>
      </Card>
    </div>
  );
}
