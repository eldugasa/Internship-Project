// src/pages/admin/SettingsPage.jsx
import React, { useState, useEffect } from "react";

const SettingsPage = () => {
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [user, setUser] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const token = localStorage.getItem("token");

  // ---------------- FETCH USER ----------------
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setUser(data);
        setName(data.name);
        setEmail(data.email);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, [token]);

  // ---------------- UPDATE PROFILE ----------------
  const handleUpdateProfile = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/users/me/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name, email }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to update profile");
        return;
      }

      alert("Profile updated successfully!");
      setShowEditProfile(false);
      setUser(data);
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    }
  };

  // ---------------- CHANGE PASSWORD ----------------
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      const res = await fetch(
        "http://localhost:5000/api/users/me/password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to change password");
        return;
      }

      alert("Password changed successfully!");
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="max-w-sm space-y-4">
        <button
          className="w-full p-4 bg-white border rounded-lg"
          onClick={() => setShowEditProfile(true)}
        >
          Edit Profile
        </button>

        <button
          className="w-full p-4 bg-white border rounded-lg"
          onClick={() => setShowChangePassword(true)}
        >
          Change Password
        </button>
      </div>

      {/* ---------------- EDIT PROFILE MODAL ---------------- */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-lg font-bold mb-4">Edit Profile</h2>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className="w-full mb-3 p-2 border rounded"
            />

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full mb-3 p-2 border rounded"
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowEditProfile(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleUpdateProfile}
                className="px-4 py-2 bg-[#4DA5AD] text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- CHANGE PASSWORD MODAL ---------------- */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-lg font-bold mb-4">Change Password</h2>

            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current Password"
              className="w-full mb-3 p-2 border rounded"
            />

            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
              className="w-full mb-3 p-2 border rounded"
            />

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm New Password"
              className="w-full mb-3 p-2 border rounded"
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowChangePassword(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleChangePassword}
                className="px-4 py-2 bg-[#4DA5AD] text-white rounded"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
