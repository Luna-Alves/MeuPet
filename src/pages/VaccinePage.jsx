import React from "react";
import BasePage from "./BasePage";
import { useParams } from "react-router-dom";
import api from "../services/api";
import VaccineCreateModal from "../components/VaccineCreateModal";

function VaccinePageWrapper() {
  const { petId } = useParams();
  return <VaccinePage petId={petId} />;
}

const formatBR = (iso) => {
  if (!iso) return "-";
  const [y, m, d] = String(iso).split("-").map(Number);
  if (!y || !m || !d) return "-";
  const dd = String(d).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${dd}/${mm}/${y}`;
};

const cmpISOdesc = (a, b) => {
  const A = a?.aplicacao || "";
  const B = b?.aplicacao || "";
  if (!A && !B) return 0;
  if (!A) return 1;
  if (!B) return -1;
  return A < B ? 1 : A > B ? -1 : 0;
};

export class VaccinePage extends BasePage {
  state = {
    loading: false,
    vaccines: [],
    showModal: false,
    successMsg: "",
    petInfo: null,
  };

  async componentDidMount() {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    if (!token || !userId) {
      window.location.href = "/login";
      return;
    }
    await this.fetchVaccines();
    await this.fetchPetInfo();
  }

  async fetchVaccines() {
    const { petId } = this.props;
    try {
      this.setState({ loading: true });
      const resp = await api.get(`/pets/${petId}/vacinas`);
      this.setState({ vaccines: resp.data });
    } catch (e) {
      console.error(
        "GET /api/pets/:id/vacinas falhou",
        e.response?.data || e.message
      );
    } finally {
      this.setState({ loading: false });
    }
  }

  async fetchPetInfo() {
    const { petId } = this.props;
    try {
      const resp = await api.get(`/pets/${petId}`);
      this.setState({ petInfo: resp.data });
    } catch {}
  }

  renderContent() {
    const { vaccines, loading, showModal, successMsg, petInfo } = this.state;

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
          <h2 className="mb-0">
            Histórico de Vacina {petInfo?.nome ? `• ${petInfo.nome}` : ""}
          </h2>
          <button
            className="btn btn-primary"
            onClick={() => this.setState({ showModal: true })}
          >
            Cadastrar vacina
          </button>
        </div>

        {loading && <div className="text-muted">Carregando...</div>}

        {!loading && vaccines.length === 0 && (
          <div className="alert alert-secondary d-flex flex-column gap-2">
            <div>Este pet ainda não possui Registros de Vacina</div>
          </div>
        )}

        {!loading && vaccines.length > 0 && (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
            {[...vaccines].sort(cmpISOdesc).map((v) => {
              const aplicacao = formatBR(v.aplicacao);
              const proxima = formatBR(v.revacinacao);
              const venc = formatBR(v.vencimento);

              return (
                <div className="col" key={v.id}>
                  <div className="card h-100 shadow-sm">
                    <div className="card-body">
                      <h5 className="card-title mb-1">{v.nome}</h5>

                      <ul className="list-unstyled mb-0 small mt-2">
                        <li>
                          <strong>Aplicação:</strong> {aplicacao}
                        </li>
                        <li>
                          <strong>Próxima dose:</strong> {proxima}
                        </li>
                        <li>
                          <strong>Vencimento:</strong> {venc}
                        </li>
                        <li>
                          <strong>Fabricante:</strong> {v.fabricante || "-"}
                        </li>
                        <li>
                          <strong>Lote:</strong> {v.lote || "-"}
                        </li>
                        <li>
                          <strong>Dose:</strong> {v.dose_tamanho || "-"}
                        </li>
                        {v.observacoes && (
                          <li>
                            <strong>Observações:</strong> {v.observacoes}
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

        <VaccineCreateModal
          show={showModal}
          petId={this.props.petId}
          onClose={() => this.setState({ showModal: false })}
          onSaved={() => {
            this.setState(
              { showModal: false, successMsg: "Vacina cadastrada com sucesso" },
              () => {
                this.fetchVaccines();
                setTimeout(() => this.setState({ successMsg: "" }), 3000);
              }
            );
          }}
        />
      </div>
    );
  }
}

export default VaccinePageWrapper;
