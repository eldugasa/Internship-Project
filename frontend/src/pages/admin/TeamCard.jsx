// src/Component/admin/TeamCard.jsx
import React from 'react';

const TeamCard = ({ team, onClick, onDelete, showActions = true }) => {
  return (
    <div 
      className="bg-white rounded-xl shadow-sm p-5 border border-gray-200 cursor-pointer hover:shadow-md transition"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{team.name}</h3>
          <p className="text-sm text-gray-500">Lead: {team.lead || 'Unassigned'}</p>
        </div>
        {showActions && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-red-500 hover:text-red-700 text-lg font-bold"
          >
            &times;
          </button>
        )}
      </div>

      <div className="mt-3 text-sm text-gray-700 space-y-1">
        <p>Members: {team.users?.length || 0}</p>
        <p>Projects: {team.projects?.length || 0}</p>
      </div>
    </div>
  );
};

export default TeamCard;
