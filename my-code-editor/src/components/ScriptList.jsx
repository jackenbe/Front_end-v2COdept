// src/components/ScriptList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ScriptList = () => {
  const [scripts, setScripts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchScripts();
  }, []);

  const fetchScripts = async () => {
    try {
      const response = await axios.get('/api/scripts/');
      setScripts(response.data);
    } catch (error) {
      console.error("Error fetching scripts:", error);
    }
  };

  const handleOpenScript = (id) => {
    navigate(`/script/${id}`);
  };

  const handleCreateNew = () => {
    navigate('/script/');
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">My Scripts</h2>
        <button onClick={handleCreateNew} className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300">
          Create New Script
        </button>
      </div>
      {scripts.length > 0 ? (
        <ul className="space-y-4">
          {scripts.map(script => (
            <li key={script.id} onClick={() => handleOpenScript(script.id)} className="p-4 border rounded-lg hover:bg-gray-50 transition duration-300 cursor-pointer flex justify-between items-center">
              <div>
                <span className="font-semibold text-lg">{script.name}</span>
                <span className="block text-sm text-gray-500">Last updated: {new Date(script.updated_at).toLocaleString()}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500">No scripts found. Create one to get started!</p>
      )}
    </div>
  );
};

export default ScriptList;