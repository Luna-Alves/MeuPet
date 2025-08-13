import React from "react";
import { NavLink } from "react-router-dom";
import homeIcon from "../assets/icone-home.svg";
import cadastroIcon from "../assets/cadastro-usuario.svg";
import profileIcon from "../assets/perfil.svg";
import logoutIcon from "../assets/logout.svg";
import loginIcon from "../assets/login.svg";
import petIcon from "../assets/pet.svg";
import { NavbarCollapse } from "react-bootstrap";

export default function MenuSidebar() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  return (
    <nav className="menu-sidebar d-flex flex-column align-items-center py-3">
      <NavLink to="/" className="mb-4" title="Página Principal">
        <img src={homeIcon} alt="Home" className="menu-icon" />
      </NavLink>

      {!token && (
        <>
          <NavLink
            to="/registration"
            className="mb-4"
            title="Cadastro de conta"
          >
            <img
              src={cadastroIcon}
              alt="Ícone de cadastro de conta"
              className="menu-icon"
            />
          </NavLink>

          <NavLink to="/pet" className="mb-4" title="Área Pet">
            <img src={petIcon} alt="Ícone da área pet" className="menu-icon" />
          </NavLink>

          <NavLink to="/login" className="mb-4" title="Entrar ">
            <img
              src={loginIcon}
              alt="Ícone de Login"
              className="menu-icon"
              style={{ fontSize: 24 }}
            />
          </NavLink>
        </>
      )}

      {token && userId && (
        <>
          <NavLink
            to={`/usuario/${userId}`}
            className="mb-4"
            title="Meu Perfil"
          >
            <img src={profileIcon} alt="Perfil" className="menu-icon" />
          </NavLink>

          <NavLink to="/pet" className="mb-4" title="Área Pet">
            <img src={petIcon} alt="Ícone da área pet" className="menu-icon" />
          </NavLink>

          <NavLink
            title="Sair"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("userId");
              window.location.href = "/login";
            }}
          >
            <img
              src={logoutIcon}
              alt="Ícone de logout"
              className="menu-icon"
              style={{ fontSize: 24 }}
            />
          </NavLink>
        </>
      )}
    </nav>
  );
}
