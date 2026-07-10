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
import AdminDashboard from "./pages/AdminDashboard";
import Chat from "./pages/Chat";
import SuperAdmin from "./pages/SuperAdmin";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";
import PaymentKhaltiCallback from "./pages/PaymentKhaltiCallback";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Register />} />

          {/* Public browsing — no login required */}
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/artwork/:id" element={<ArtworkDetail />} />
          <Route path="/exhibition/:id" element={<VirtualExhibition />} />

          {/* Protected — requires login */}
          <Route path="/upload" element={
          <ProtectedRoute allowedRoles={["ARTIST"]}><ArtworkUpload /></ProtectedRoute>} />
          <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={["ARTIST"]}><ArtistDashboard /></ProtectedRoute>} />
          <Route path="/profile" element={
            <ProtectedRoute><BuyerProfile/></ProtectedRoute>} />
          <Route path="/notification" element={
            <ProtectedRoute><Notifications/></ProtectedRoute>} />
          <Route path="/admin" element={
            <ProtectedRoute><AdminDashboard/></ProtectedRoute>} />
          <Route path="/chat" element={
            <ProtectedRoute><Chat/></ProtectedRoute>} />
          <Route path="/chat/:userId" element={
            <ProtectedRoute><Chat/></ProtectedRoute>} />
          <Route path="/superadmin" element={
            <ProtectedRoute><SuperAdmin/></ProtectedRoute>} />

          {/* eSewa payment redirect targets */}
          <Route path="/payment/success" element={
            <ProtectedRoute><PaymentSuccess/></ProtectedRoute>} />
          <Route path="/payment/failure" element={
            <ProtectedRoute><PaymentFailure/></ProtectedRoute>} />

          {/* Khalti payment redirect target */}
          <Route path="/payment/khalti/callback" element={
            <ProtectedRoute><PaymentKhaltiCallback/></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;