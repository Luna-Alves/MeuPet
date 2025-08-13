import React from "react";
import { Link } from "react-router-dom";
import BasePage from "./BasePage";
import api from "../services/api";
import PetCreateModal from "../components/PetCreateModal";

export default class PetPage extends BasePage {
  state = {
    showModal: false,
    pets: [],
    loading: false,
  };

  componentDidMount() {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    if (token && userId) this.fetchPets();
  }

  async fetchPets() {
    try {
      this.setState({ loading: true });
      const resp = await api.get("/pets");
      this.setState({ pets: resp.data });
    } catch (e) {
      console.error("GET /api/pets falhou", e.response?.data || e.message);
    } finally {
      this.setState({ loading: false });
    }
  }

  renderContent() {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const { showModal, pets, loading } = this.state;

    if (!token || !userId) {
      return (
        <div className="container">
          <div className="alert alert-info p-4">
            <p className="mb-3">
              <strong>Você ainda não possui uma conta?</strong>
              <br />
              Clique aqui para se cadastrar ou faça Login.
            </p>
            <div className="d-flex gap-2">
              <Link to="/registration" className="btn btn-success">
                Cadastrar
              </Link>
              <Link to="/login" className="btn btn-outline-primary">
                Login
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="mb-0">Meus pets</h2>
          <button
            className="btn btn-primary"
            onClick={() => this.setState({ showModal: true })}
          >
            Cadastrar novo pet
          </button>
        </div>

        {loading && <div className="text-muted">Carregando...</div>}

        {!loading && pets.length === 0 && (
          <div className="alert alert-secondary">
            Você ainda não cadastrou nenhum pet.
          </div>
        )}

        {!loading && pets.length > 0 && (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
            {pets.map((p) => {
              const nome = p.nome;
              const especie = p.especie;
              const raca = p.raca;
              const porte = p.porte;
              const peso = Number(p.peso);
              const pelagem = p.cor_pelagem;
              const idadeApx = p.idade_aproximada;
              const outras = p.outras_caracteristicas;
              let dataStr = "";
              try {
                if (p.data)
                  dataStr = new Date(p.data).toLocaleDateString("pt-BR");
              } catch {}

              return (
                <div className="col" key={p.id}>
                  <div className="card h-100 shadow-sm">
                    <div className="card-body">
                      <h5 className="card-title mb-1">{nome}</h5>
                      <div className="text-muted small mb-2">
                        {especie} • {raca}
                      </div>

                      <ul className="list-unstyled mb-0 small">
                        {dataStr && (
                          <li>
                            <strong>Nasc./Chegada:</strong> {dataStr}
                          </li>
                        )}
                        <li>
                          <strong>Porte:</strong> {porte}
                        </li>
                        <li>
                          <strong>Peso:</strong>{" "}
                          {isNaN(peso)
                            ? "-"
                            : peso.toLocaleString("pt-BR", {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 2,
                              })}{" "}
                          kg
                        </li>
                        <li>
                          <strong>Pelagem:</strong> {pelagem}
                        </li>
                        {idadeApx && (
                          <li>
                            <strong>Idade apx.:</strong> {idadeApx}
                          </li>
                        )}
                        {outras && (
                          <li>
                            <strong>Outras características:</strong> {outras}
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <PetCreateModal
          show={showModal}
          onClose={() => this.setState({ showModal: false })}
          onSaved={() => {
            this.setState({ showModal: false }, () => this.fetchPets());
          }}
        />
      </div>
    );
  }
}
