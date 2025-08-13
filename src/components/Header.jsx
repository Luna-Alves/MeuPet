import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/meupet.svg";
import patas from "../assets/patas.svg";

export default class Header extends React.Component {
  render() {
    return (
      <header className="header-pet text-white p-3">
        <div className="container">
          <div className="brand">
            <Link to="/">
              <img src={logo} alt="Logo MeuPet" className="logo-meupet" />
            </Link>
            <h1>A saúde do seu melhor amigo nas suas mãos</h1>
          </div>
          <img
            src={patas}
            alt="Imagem de patas"
            className="header-patas-image"
          />
        </div>
      </header>
    );
  }
}
