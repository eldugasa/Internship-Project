import SharedNotificationBell from "../../features/notifications/NotificationBell";

const NotificationBell = ({ baseRoute = "/team-member" }) => {
  const mode = baseRoute === "/qa-tester" ? "qa" : "teamMember";
  return <SharedNotificationBell mode={mode} baseRoute={baseRoute} />;
};

export default NotificationBell;
