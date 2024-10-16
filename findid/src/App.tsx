import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Init from "@/pages/init/Init";
import Main from "@/pages/Main";
import CallbackPage from "./components/CallbackPage";

function App() {
    return (
        <div>
            <Router>
                <Routes>
                    <Route path="/" element={<Init />} />
                    <Route path="/callback" element={<CallbackPage />} />
                    <Route path="/main/*" element={<Main />} />
                </Routes>
            </Router>
        </div>
    );
}

export default App;
