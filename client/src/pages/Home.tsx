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
        width: "100vw",   // full viewport width
        height: "100vh",  // full viewport height
        margin: 0,
        padding: 0,
        background: "#f0f0f0", // optional
      }}
    >
      <button
        onClick={handleNewSession}
        style={{
          padding: "20px 40px",
          fontSize: "1.5rem",
          cursor: "pointer",
          borderRadius: "12px",
          border: "none",
          background: "#222",
          color: "white",
          boxShadow: "0px 5px 15px rgba(0,0,0,0.3)",
          transition: "background 0.2s ease",
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
