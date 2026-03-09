// src/Component/admin/TeamCard.jsx
import React from 'react';

const TeamCard = ({ team, onClick, onDelete, showActions = true }) => {
  // Destructure with defaults - all values are already primitives
  const {
    name = 'Unnamed Team',
    lead = 'Unassigned',
    memberCount = 0,
    projectCount = 0
  } = team || {};

  return (
    <div 
      className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 cursor-pointer hover:shadow-md transition"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{name}</h3>
          <p className="text-sm text-gray-500">Team Lead: {lead}</p>
        </div>
        {showActions && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onDelete) onDelete(e);
            }}
            className="text-red-500 hover:text-red-700 text-lg font-bold"
          >
            &times;
          </button>
        )}
      </div>

      <div className="mt-3 text-sm text-gray-700 space-y-1">
        <p>Members: {memberCount}</p>
        <p>Projects: {projectCount}</p>
      </div>
      
      <div className="mt-3 text-xs text-[#4DA5AD] font-medium">
        Manage Team →
      </div>
    </div>
  );
};

export default TeamCard;