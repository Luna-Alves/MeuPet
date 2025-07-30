import React from "react";

export default class Footer extends React.Component {
  render() {
    return (
      <footer className="footer-custom text-center py-3 mt-auto">
        <div className="container d-flex flex-column align-items-center">
          <small className="footer-text mb-2">
            Faça parte da comunidade MeuPet nas redes ou entre em contato:
          </small>
          <div className="d-flex gap-3">
            <a
              href="https://instagram.com/seu_perfil"
              target="_blank"
              rel="noopener noreferrer"
              title="Instagram"
              className="footer-icon"
            >
              <i className="bi bi-instagram"></i>
            </a>
            <a
              href="mailto:contato@meupet.com.br"
              title="Enviar e-mail"
              className="footer-icon"
            >
              <i className="bi bi-envelope-fill"></i>
            </a>
            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
              title="WhatsApp"
              className="footer-icon"
            >
              <i className="bi bi-whatsapp"></i>
            </a>
          </div>
        </div>
      </footer>
    );
  }
}
