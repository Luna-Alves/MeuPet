import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AccountRegistration from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="registration" element={<AccountRegistration />} />
        <Route path="/usuario/:id" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
}
