import React from "react";
import BasePage from "./BasePage";
import CardInfo from "../components/CardInfo";

export default class LandingPage extends BasePage {
  renderContent() {
    return (
      <>
        <div className="container text-center">
          <h2>Boas vindas ao MeuPet!</h2>
          <p>
            Aqui você poderá registrar os dados vacinais do seu pet e ter o
            histórico de vacinação dele sempre em mãos.
          </p>

          <div className="row row-cols-1 row-cols-md-3 g-4 mt-4">
            <div className="col">
              <CardInfo
                title="Registro Fácil"
                imageSrc="https://media.istockphoto.com/id/1251375321/pt/foto/mobile-office-at-home-funny-portrait-cute-puppy-dog-border-collie-on-bed-working-surfing.jpg?s=1024x1024&w=is&k=20&c=tTZS-vNSGDz6TbajX1mvQnry5dTgMMuzNhDkiV-IanU="
              >
                Cadastre vacinas em poucos cliques e acompanhe todas as doses.
              </CardInfo>
            </div>
            <div className="col">
              <CardInfo
                title="Lembretes Automáticos"
                imageSrc="https://media.istockphoto.com/id/488530500/pt/foto/m%C3%A9dico-veterin%C3%A1rio-examinando-bonito-adulto-gato.jpg?s=1024x1024&w=is&k=20&c=Ih-0tnTibFeCxyn9a4oT1jmVxI-VUY0QSSOaUF_V7AY="
              >
                Receba notificações antes da próxima vacina do seu amiguinho.
              </CardInfo>
            </div>
            <div className="col">
              <CardInfo
                title="Histórico Completo"
                imageSrc="https://plus.unsplash.com/premium_photo-1663029003313-41c48a3520f2?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              >
                Consulte todo o histórico de vacinação sempre que precisar.
              </CardInfo>
            </div>
          </div>
        </div>
      </>
    );
  }
}
