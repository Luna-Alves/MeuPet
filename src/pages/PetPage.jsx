import React from "react";
import { Link } from "react-router-dom";
import BasePage from "./BasePage";
import api from "../services/api";
import PetCreateModal from "../components/PetCreateModal";
import vaccineIcon from "../assets/saudePet.svg";

const formatBR = (iso) => {
  if (!iso) return null;
  const [y, m, d] = String(iso).split("-").map(Number);
  if (!y || !m || !d) return null;
  const dd = String(d).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${dd}/${mm}/${y}`;
};

const ageFrom = (iso) => {
  if (!iso) return null;
  const [y, m, d] = String(iso).split("-").map(Number);
  const dob = new Date(y, m - 1, d);
  if (isNaN(dob)) return null;
  const today = new Date();
  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  if (today.getDate() < d) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0) return null;
  if (years >= 2)
    return months ? `${years} anos e ${months} mês(es)` : `${years} anos`;
  if (years === 1) return months ? `1 ano e ${months} mês(es)` : `1 ano`;
  return `${months} mês(es)`;
};

export default class PetPage extends BasePage {
  state = {
    showModal: false,
    pets: [],
    loading: false,
    successMsg: "",
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
    const { showModal, pets, loading, successMsg } = this.state;

    const sortedPets = [...pets].sort((a, b) =>
      (a.nome || "").localeCompare(b.nome || "", "pt-BR", {
        sensitivity: "base",
      })
    );

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
        {successMsg && (
          <div
            className="alert alert-success alert-dismissible fade show"
            role="alert"
          >
            {successMsg}
            <button
              type="button"
              className="btn-close"
              onClick={() => this.setState({ successMsg: "" })}
              aria-label="Close"
            />
          </div>
        )}

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

        {!loading && sortedPets.length === 0 && (
          <div className="alert alert-secondary">
            Você ainda não cadastrou nenhum pet.
          </div>
        )}

        {!loading && sortedPets.length > 0 && (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
            {sortedPets.map((p) => {
              const nome = p.nome;
              const especie = p.especie;
              const raca = p.raca;
              const porte = p.porte;
              const peso = Number(p.peso);
              const pelagem = p.cor_pelagem;
              const idadeApx = p.idade_aproximada;
              const outras = p.outras_caracteristicas;

              const nascISO = p.data_nascimento || null;
              const chegISO = p.data_chegada || null;
              const nascBR = nascISO ? formatBR(nascISO) : null;
              const chegBR = chegISO ? formatBR(chegISO) : null;

              const idadeAuto = nascISO ? ageFrom(nascISO) : null;
              const idadeDisplay = nascISO
                ? idadeAuto
                : chegISO && idadeApx
                ? idadeApx
                : null;

              return (
                <div className="col" key={p.id}>
                  <div className="card h-100 shadow-sm">
                    <div className="card-body">
                      <h5 className="card-title mb-1">{nome}</h5>
                      <div className="text-muted small mb-2 d-flex align-items-center gap-2">
                        <span>
                          {especie} • {raca}
                        </span>
                        <Link
                          to={`/pet/${p.id}/saude`}
                          title="Saúde do pet"
                          className="ms-auto"
                        >
                          <img
                            src={vaccineIcon}
                            alt="Saúde do pet"
                            style={{ width: 24, height: 24 }}
                          />
                        </Link>
                      </div>

                      <ul className="list-unstyled mb-0 small">
                        {nascBR && (
                          <li>
                            <strong>Data de nascimento:</strong> {nascBR}
                          </li>
                        )}
                        {chegBR && (
                          <li>
                            <strong>Data de chegada:</strong> {chegBR}
                          </li>
                        )}
                        {idadeDisplay && (
                          <li>
                            <strong>Idade:</strong> {idadeDisplay}
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
            this.setState(
              { showModal: false, successMsg: "Animal cadastrado com sucesso" },
              () => {
                this.fetchPets();
                setTimeout(() => this.setState({ successMsg: "" }), 3000);
              }
            );
          }}
        />
      </div>
    );
  }
}
