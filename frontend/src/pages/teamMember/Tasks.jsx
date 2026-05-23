import React from "react";
import TasksPage from "../../features/tasks/TasksPage";
import { TASK_MODES } from "../../features/tasks/taskAccess";

const TeamMemberTasks = () => <TasksPage mode={TASK_MODES.TEAM} />;

export default TeamMemberTasks;
