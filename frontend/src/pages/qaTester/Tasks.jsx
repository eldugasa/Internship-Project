import React from "react";
import TasksPage from "../../features/tasks/TasksPage";
import { TASK_MODES } from "../../features/tasks/taskAccess";

const QATesterTasks = () => <TasksPage mode={TASK_MODES.QA} />;

export default QATesterTasks;
