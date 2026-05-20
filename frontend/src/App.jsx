import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Applications from "./pages/Applications";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NewApplication from "./pages/NewApplication";
import Register from "./pages/Register";
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/applications"
        element={
          <ProtectedRoute>
            <Applications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/applications/new"
        element={
          <ProtectedRoute>
            <NewApplication />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;