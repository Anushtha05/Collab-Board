import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

const Home = () => {
  const navigate = useNavigate();

  const handleNewSession = () => {
    const id = uuidv4();
    navigate(`/board/${id}`);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#f0f0f0",
        flexDirection: "column",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <h1 style={{ marginBottom: "20px", fontFamily: "'Pacifico', cursive" }}>
        Collab-Board
      </h1>
      <button
        onClick={handleNewSession}
        style={{
          padding: "15px 30px",
          fontSize: "1.2rem",
          cursor: "pointer",
          borderRadius: "10px",
          border: "none",
          background: "#222",
          color: "white",
          boxShadow: "0px 4px 10px rgba(0,0,0,0.3)",
          transition: "all 0.2s ease-in-out",
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "#444")}
        onMouseOut={(e) => (e.currentTarget.style.background = "#222")}
      >
        New Session
      </button>
    </div>
  );
};

export default Home;
