import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import HostScreen from "./pages/HostScreen";
import PlayerScreen from "./pages/PlayerScreen";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/host/:roomCode" element={<HostScreen />} />
        <Route path="/play/:roomCode" element={<PlayerScreen />} />
      </Routes>
    </Router>
  );
}

export default App;
