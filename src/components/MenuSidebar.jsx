import React from "react";
import { NavLink } from "react-router-dom";
import homeIcon from "../assets/icone-home.svg";
import cadastroIcon from "../assets/cadastro-usuario.svg";
import perfilIcon from "../assets/perfil.svg";

export default function MenuSidebar() {
  const usuarioId = localStorage.getItem("usuarioId");
  return (
    <nav className="menu-sidebar d-flex flex-column align-items-center py-3">
      <NavLink to="/" className="mb-4" title="Página Principal">
        <img src={homeIcon} alt="Home" className="menu-icon" />
      </NavLink>
      <NavLink to="registration" className="mb-4" title="Cadastro">
        <img
          src={cadastroIcon}
          alt="Cadastro de usuário"
          className="menu-icon"
        />
      </NavLink>
      <NavLink
        to={`/usuario/${usuarioId}`}
        className="mb-4"
        title="Perfil de usuário"
      >
        <img src={perfilIcon} alt="Perfil de usuário" className="menu-icon" />
      </NavLink>
    </nav>
  );
}
