import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AccountRegistration from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import PetPage from "./pages/PetPage";
import VaccinePage from "./pages/VaccinePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="registration" element={<AccountRegistration />} />
        <Route path="/usuario/:id" element={<ProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pet" element={<PetPage />} />
        <Route path="/pet/:petId/saude" element={<VaccinePage />} />
      </Routes>
    </BrowserRouter>
  );
}
