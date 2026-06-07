import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Gallery from "./pages/Gallery";
import ArtworkUpload from "./pages/ArtworkUpload";
import ArtworkDetail from "./pages/ArtworkDetail";
import VirtualExhibition from "./pages/VirtualExhibition";
import ProtectedRoute from "./components/ProtectedRoute";
import ArtistDashboard from "./pages/ArtistDashboard";
import BuyerProfile from "./pages/BuyerProfile";
import Notifications from "./pages/Notifications";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Register />} />
          <Route path="/" element={<Register />} />
          <Route path="/home" element={
            <ProtectedRoute><Home /></ProtectedRoute>
          } />
          <Route path="/gallery" element={
            <ProtectedRoute><Gallery /></ProtectedRoute>
          } />
          <Route path="/upload" element={
            <ProtectedRoute><ArtworkUpload /></ProtectedRoute>
          } />
          <Route path="/artwork/:id" element={
            <ProtectedRoute><ArtworkDetail /></ProtectedRoute>
          } />
          <Route path="/exhibition" element={
            <ProtectedRoute><VirtualExhibition /></ProtectedRoute>} />
          <Route path="/dashboard" element={
            <ProtectedRoute><ArtistDashboard /></ProtectedRoute>} />
          <Route path="/profile" element={
            <ProtectedRoute><BuyerProfile/></ProtectedRoute>} />
          <Route path="/notification" element={
            <ProtectedRoute><Notifications/></ProtectedRoute>} /> 
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;