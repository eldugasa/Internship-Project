// src/components/admin/ProjectCard.jsx
import React from 'react';

const ProjectCard = ({ project, compact = false }) => {
  if (compact) {
    return (
      <div key={project.id}>
        <div className="flex justify-between items-center mb-1">
          <span className="font-medium text-gray-900">{project.name}</span>
          <span className="text-sm font-medium text-[#4DA5AD]">{project.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] h-2 rounded-full transition-all duration-300"
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {project.team} • Due: {project.dueDate}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-gray-900">{project.name}</h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
              {project.team}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {project.status}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#4DA5AD]">{project.progress}%</div>
          <div className="text-sm text-gray-500">Progress</div>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] h-2 rounded-full"
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>
      </div>
      
      <div className="text-sm text-gray-600">
        Manager: {project.manager} • Due: {project.dueDate}
      </div>
    </div>
  );
};

export default ProjectCard; // Make sure this is default export