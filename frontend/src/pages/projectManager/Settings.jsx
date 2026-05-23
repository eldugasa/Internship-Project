import SharedSettingsPage from "../../features/settings/SettingsPage";
import { settingsLoader } from "../../loader/manager/Settings.loader";

export { settingsLoader as loader };

const Settings = () => <SharedSettingsPage mode="manager" />;

export default Settings;
