import React from "react";
import BasePage from "./BasePage";
import axios from "axios";
import { withRouter } from "../hoc/withRouter";

class ProfilePage extends BasePage {
  constructor(props) {
    super(props);
    this.state = {
      usuario: null,
      loading: true,
      error: null,
    };
  }

  componentDidMount() {
    const { id } = this.props.params; // pega o :id da URL
    axios
      .get(`/api/usuario/${id}`)
      .then((res) => this.setState({ usuario: res.data }))
      .catch((err) => this.setState({ error: "Erro ao carregar dados." }))
      .finally(() => this.setState({ loading: false }));
  }

  renderContent() {
    const { usuario, loading, error } = this.state;

    if (loading) {
      return <div className="text-center mt-5">Carregando...</div>;
    }
    if (error) {
      return <div className="text-center mt-5 text-danger">{error}</div>;
    }
    if (!usuario) {
      return (
        <div className="text-center mt-5 text-danger">
          Usuário não encontrado.
        </div>
      );
    }

    // Renderiza os campos
    return (
      <div className="container mt-5">
        <h2>Dados da Conta</h2>
        <div className="card">
          <div className="card-body">
            <p>
              <strong>Nome:</strong> {usuario.nome}
            </p>
            <p>
              <strong>Data:</strong>{" "}
              {new Date(usuario.data).toLocaleDateString()}
            </p>
            <p>
              <strong>Endereço:</strong>{" "}
              {`${usuario.rua}, ${usuario.numero} - ${usuario.bairro}, ${usuario.cidade}/${usuario.estado} (CEP: ${usuario.cep})`}
            </p>
            {usuario.complemento && (
              <p>
                <strong>Complemento:</strong> {usuario.complemento}
              </p>
            )}
            <p>
              <strong>Função:</strong> {usuario.funcao}
            </p>
            <p>
              <strong>E-mail:</strong> {usuario.email}
            </p>
          </div>
        </div>
      </div>
    );
  }
}

// “Enrola” a ProfilePage no HOC para fornecer this.props.params
export default withRouter(ProfilePage);
