// src/Component/admin/TeamCard.jsx
import React from 'react';
import { Trash2, Settings } from 'lucide-react';

const TeamCard = ({ team, showActions = false, onDelete, onClick }) => {
  return (
    <div 
      className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:shadow-sm transition cursor-pointer"
      onClick={onClick} // ← Add onClick handler here
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">{team.name}</h3>
          <p className="text-sm text-gray-600">Team Lead: {team.lead}</p>
        </div>
        {showActions && (
          <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}> {/* ← Prevent event bubbling */}
            {/* <button className="p-2 hover:bg-gray-200 rounded-lg">
              <Settings className="w-4 h-4" />
            </button> */}
            <button 
              onClick={onDelete}
              className="p-2 hover:bg-red-100 rounded-lg text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-white rounded-lg">
          <div className="text-2xl font-bold text-[#4DA5AD]">{team.members}</div>
          <div className="text-sm text-gray-600">Members</div>
        </div>
        <div className="text-center p-3 bg-white rounded-lg">
          <div className="text-2xl font-bold text-[#4DA5AD]">{team.projects}</div>
          <div className="text-sm text-gray-600">Projects</div>
        </div>
      </div>
      
      <button 
        className="w-full py-2 text-sm border border-[#4DA5AD] text-[#4DA5AD] rounded-lg hover:bg-[#4DA5AD] hover:text-white transition"
        onClick={(e) => {
          e.stopPropagation(); // ← Prevent card click when clicking this button
          onClick && onClick();
        }}
      >
        Manage Team
      </button>
    </div>
  );
};

export default TeamCard;