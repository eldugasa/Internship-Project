import React from "react";
import TaskDetailsPage from "../../features/tasks/TaskDetailsPage";
import { TASK_MODES } from "../../features/tasks/taskAccess";

const QATesterTaskDetails = () => <TaskDetailsPage mode={TASK_MODES.QA} />;

export default QATesterTaskDetails;
