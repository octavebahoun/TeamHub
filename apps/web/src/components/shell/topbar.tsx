import { NewTaskDialog, type Option } from "@/components/tasks/new-task-dialog";
import { MobileNav } from "./mobile-nav";
import { NotificationsButton } from "./notifications-button";
import { SearchForm } from "./search-form";
import { UserMenu } from "./user-menu";
import type { ShellOrg } from "./app-sidebar";

export function Topbar({
  user,
  org,
  hidden,
  taskOptions,
}: {
  user: { name: string; email: string };
  org: ShellOrg;
  hidden: string[];
  taskOptions: { projects: Option[]; members: Option[] } | null;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-19 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-8">
      <MobileNav org={org} hidden={hidden} />
      <SearchForm />
      <div className="ml-auto flex items-center gap-3">
        {taskOptions && taskOptions.projects.length > 0 && (
          <div className="hidden sm:block">
            <NewTaskDialog projects={taskOptions.projects} members={taskOptions.members} />
          </div>
        )}
        <NotificationsButton />
        <UserMenu name={user.name} email={user.email} />
      </div>
    </header>
  );
}
