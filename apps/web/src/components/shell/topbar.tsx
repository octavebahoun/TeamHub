import { Suspense } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewTaskDialog, type Option } from "@/components/tasks/new-task-dialog";
import { MobileNav } from "./mobile-nav";
import { NotificationsButton } from "./notifications-button";
import { SearchForm } from "./search-form";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { UserMenu } from "./user-menu";
import type { ShellOrg } from "./app-sidebar";

export function Topbar({
  user,
  org,
  hidden,
  taskOptions,
}: {
  user: { name: string; email: string; canSeeMembers: boolean };
  org: ShellOrg;
  hidden: string[];
  taskOptions: { projects: Option[]; members: Option[] } | null;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-19 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-8 dark:glass dark:border-border/80 dark:bg-background/55">
      <MobileNav org={org} hidden={hidden} />
      <Suspense>
        <SearchForm />
      </Suspense>
      <div className="ml-auto flex items-center gap-3">
        {taskOptions && taskOptions.projects.length > 0 && (
          <NewTaskDialog
            projects={taskOptions.projects}
            members={taskOptions.members}
            trigger={
              <Button size="lg" aria-label="Nouvelle tâche" className="max-sm:size-11 max-sm:px-0">
                <Plus aria-hidden /> <span className="max-sm:sr-only">Nouvelle tâche</span>
              </Button>
            }
          />
        )}
        <ThemeToggle />
        <NotificationsButton />
        <UserMenu {...user} />
      </div>
    </header>
  );
}
