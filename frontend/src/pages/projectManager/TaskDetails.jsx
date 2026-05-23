import React from "react";
import { useActionData, useLoaderData } from "react-router-dom";
import TaskDetailsPage, {
  action,
  loader,
} from "../../features/tasks/TaskDetailsPage";
import { TASK_MODES } from "../../features/tasks/taskAccess";

export { action, loader };

const TaskDetails = () => {
  const initialData = useLoaderData();
  const actionData = useActionData();

  return (
    <TaskDetailsPage
      mode={TASK_MODES.MANAGER}
      initialData={initialData}
      actionData={actionData}
    />
  );
};

export default TaskDetails;
