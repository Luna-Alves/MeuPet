import React from "react";
import { NavLink } from "react-router-dom";
import homeIcon from "../assets/icone-home.svg";

export default function MenuSidebar() {
  return (
    <nav className="menu-sidebar d-flex flex-column align-items-center py-3">
      <NavLink to="/" className="mb-4" title="Página Principal">
        <img src={homeIcon} alt="Home" className="menu-icon" />
      </NavLink>
    </nav>
  );
}
