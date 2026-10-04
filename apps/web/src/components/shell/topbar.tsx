import { Suspense } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewTaskDialog, type Option } from "@/components/tasks/new-task-dialog";
import { NotificationsButton } from "./notifications-button";
import { SearchForm } from "./search-form";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { UserMenu } from "./user-menu";
import type { ShellOrg } from "./app-sidebar";

export function Topbar({
  user,
  taskOptions,
}: {
  user: { name: string; email: string; canSeeMembers: boolean };
  org: ShellOrg;
  hidden: string[];
  taskOptions: { projects: Option[]; members: Option[] } | null;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur sm:h-16 sm:gap-3 sm:px-6 lg:px-8 dark:glass dark:border-border/80 dark:bg-background/55">
      <Suspense>
        <SearchForm />
      </Suspense>
      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        {taskOptions && taskOptions.projects.length > 0 && (
          <NewTaskDialog
            projects={taskOptions.projects}
            members={taskOptions.members}
            trigger={
              <Button size="icon" aria-label="Nouvelle tâche" className="size-10 sm:h-11 sm:w-auto sm:px-4">
                <Plus aria-hidden />
                <span className="max-sm:sr-only">Nouvelle tâche</span>
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
