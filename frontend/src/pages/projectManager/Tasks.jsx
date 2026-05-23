import React from "react";
import { useLoaderData } from "react-router-dom";
import TasksPage from "../../features/tasks/TasksPage";
import { TASK_MODES } from "../../features/tasks/taskAccess";
import { tasksLoader } from "../../loader/manager/Tasks.loader";

export { tasksLoader as loader };

const Tasks = () => {
  const loaderData = useLoaderData();
  return <TasksPage mode={TASK_MODES.MANAGER} loaderData={loaderData} />;
};

export default Tasks;
