import React from "react";
import RegistrationForm from "../components/RegistrationForm";
import BasePage from "./BasePage";

export default class RegisterPage extends BasePage {
  renderContent() {
    return (
      <>
        <div className="register-page">
          <div className="container mt-5">
            <h2>Cadastro de Conta</h2>
            <RegistrationForm />
          </div>
        </div>
      </>
    );
  }
}
