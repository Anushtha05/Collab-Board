import React from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

const Home = () => {
  const navigate = useNavigate();

  const handleNewSession = () => {
    const id = uuidv4();
    navigate(`/board/${id}`);
  };

  return (
    <div>
      <button onClick={handleNewSession}>New Session</button>
    </div>
  );
};

export default Home;
