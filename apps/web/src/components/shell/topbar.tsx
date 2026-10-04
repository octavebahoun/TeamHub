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
    <header className="sticky top-0 z-30 px-3 pt-2 sm:px-5 sm:pt-3 lg:px-6">
      <div className="glass flex h-12 items-center gap-2 rounded-2xl border border-border/60 bg-background/70 px-2.5 shadow-sm backdrop-blur-xl sm:h-14 sm:gap-3 sm:px-3">
        <Suspense>
          <SearchForm />
        </Suspense>
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
          {taskOptions && taskOptions.projects.length > 0 && (
            <NewTaskDialog
              projects={taskOptions.projects}
              members={taskOptions.members}
              trigger={
                <Button size="icon" aria-label="Nouvelle tâche" className="size-9 rounded-xl sm:h-10 sm:w-auto sm:px-3.5">
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
      </div>
    </header>
  );
}
