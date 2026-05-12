import React from "react";
import TaskDetailsPage from "../../features/tasks/TaskDetailsPage";
import { TASK_MODES } from "../../features/tasks/taskAccess";

const TeamMemberTaskDetails = () => <TaskDetailsPage mode={TASK_MODES.TEAM} />;

export default TeamMemberTaskDetails;
