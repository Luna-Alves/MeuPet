// src/pages/PetPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import BasePage from "./BasePage";
import api from "../services/api";
import PetCreateModal from "../components/PetCreateModal";
import PetEditModal from "../components/PetEditModal";
import vaccineIcon from "../assets/saudePet.svg";

const humanize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
const humanizePorte = (p) => (p === "medio" ? "Médio" : humanize(p));
const pesoBR = (v) =>
  v == null || isNaN(Number(v))
    ? "-"
    : Number(v).toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
      });

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
    showEditModal: false,
    editingPet: null,
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

  openEditModal = (pet) => {
    this.setState({ showEditModal: true, editingPet: pet });
  };

  closeEditModal = () => {
    this.setState({ showEditModal: false, editingPet: null });
  };

  handleDelete = async (pet) => {
    if (
      !window.confirm(
        `Excluir o pet "${pet.nome}"? Esta ação removerá também as vacinas.`
      )
    ) {
      return;
    }
    try {
      await api.delete(`/pets/${pet.id}`);
      this.setState({ successMsg: "Pet excluído com sucesso." }, () => {
        this.fetchPets();
        setTimeout(() => this.setState({ successMsg: "" }), 3000);
      });
    } catch (e) {
      alert("Não foi possível excluir o pet.");
      console.error(
        "DELETE /api/pets/:id falhou",
        e.response?.data || e.message
      );
    }
  };

  renderContent() {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const { showModal, showEditModal, editingPet, pets, loading, successMsg } =
      this.state;

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
              const nasc = p.data_nascimento
                ? formatBR(p.data_nascimento)
                : null;
              const cheg = p.data_chegada ? formatBR(p.data_chegada) : null;
              const idade = p.data_nascimento
                ? ageFrom(p.data_nascimento)
                : p.data_chegada && p.idade_aproximada
                ? p.idade_aproximada
                : null;

              return (
                <div className="col" key={p.id}>
                  <div className="card h-100 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex align-items-start justify-content-between">
                        <div>
                          <h5 className="card-title mb-1">{p.nome}</h5>
                          <div className="text-muted small mb-2">
                            {p.especie} • {p.raca}
                            <Link
                              to={`/pet/${p.id}/saude`}
                              title="Saúde do pet"
                              className="ms-2 align-middle d-inline-block"
                            >
                              <img
                                src={vaccineIcon}
                                alt="Saúde do pet"
                                style={{ width: 20, height: 20 }}
                              />
                            </Link>
                          </div>
                        </div>
                      </div>

                      <ul className="list-unstyled mb-0 small">
                        {nasc && (
                          <li>
                            <strong>Data de nascimento:</strong> {nasc}
                            {idade && (
                              <>
                                {" "}
                                &nbsp;•&nbsp;<strong>Idade:</strong> {idade}
                              </>
                            )}
                          </li>
                        )}
                        {!nasc && cheg && (
                          <li>
                            <strong>Data de chegada:</strong> {cheg}
                            {idade && (
                              <>
                                {" "}
                                &nbsp;•&nbsp;<strong>Idade:</strong> {idade}
                              </>
                            )}
                          </li>
                        )}
                        <li>
                          <strong>Porte:</strong> {humanizePorte(p.porte)}
                        </li>
                        <li>
                          <strong>Peso:</strong> {pesoBR(p.peso)} kg
                        </li>
                        <li>
                          <strong>Pelagem:</strong> {p.cor_pelagem}
                        </li>
                        {p.outras_caracteristicas && (
                          <li>
                            <strong>Outras características:</strong>{" "}
                            {p.outras_caracteristicas}
                          </li>
                        )}
                      </ul>

                      <div className="d-flex gap-2 mt-3">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => this.openEditModal(p)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => this.handleDelete(p)}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de criação */}
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

        {/* Modal de edição */}
        <PetEditModal
          show={showEditModal}
          pet={editingPet}
          onClose={this.closeEditModal}
          onSaved={() => {
            this.setState(
              { successMsg: "Dados do pet atualizados com sucesso." },
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
