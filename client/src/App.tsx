import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import WhiteboardComponent from "./components/WhiteboardComponent";

function App() {
  return (
    <Router>
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/board/:sessionId" element={<WhiteboardComponent />} />
      </Routes>
    </Router>
  );
}

export default App;
