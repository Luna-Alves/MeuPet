import React from "react";
import BasePage from "./BasePage";
import { withRouter } from "../hoc/withRouter";
import api from "../services/api";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { Modal, Button } from "react-bootstrap";
import * as Yup from "yup";

const onlyLetters = /^[\p{L}\s]+$/u;
const today = new Date();
const eighteenYearsAgo = new Date(
  today.getFullYear() - 18,
  today.getMonth(),
  today.getDate()
);

const pad = (n) => String(n).padStart(2, "0");
const toISODateLocal = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const eighteenYearsAgoStr = toISODateLocal(eighteenYearsAgo);

const toInputDate = (s) => (s ? String(s).split("T")[0] : "");

const editSchema = Yup.object({
  nome: Yup.string()
    .trim()
    .matches(onlyLetters, "Use apenas letras e espaços")
    .required("Campo obrigatório"),
  data: Yup.date()
    .typeError("Data inválida.")
    .max(eighteenYearsAgo, "Você precisa ter 18 anos ou mais.")
    .required("Campo obrigatório"),
  rua: Yup.string()
    .trim()
    .matches(onlyLetters, "Use apenas letras e espaços")
    .required("Campo obrigatório"),
  bairro: Yup.string()
    .trim()
    .matches(onlyLetters, "Use apenas letras e espaços")
    .required("Campo obrigatório"),
  cidade: Yup.string()
    .trim()
    .matches(onlyLetters, "Use apenas letras e espaços")
    .required("Campo obrigatório"),
  estado: Yup.string()
    .trim()
    .matches(/^[A-Za-z]{2}$/, "Use a sigla de 2 letras (ex.: SP)")
    .required("Campo obrigatório"),
  numero: Yup.string()
    .matches(/^\d+$/, "Apenas números")
    .required("Campo obrigatório"),
  cep: Yup.string()
    .matches(/^\d{5}-?\d{3}$/, "CEP inválido (use 00000-000)")
    .required("Campo obrigatório"),
  complemento: Yup.string(),
  funcao: Yup.string()
    .transform((v) => (v ? v.toLowerCase() : v))
    .oneOf(["tutor", "ong"], "Selecione uma função válida")
    .required("Campo obrigatório"),
  // E-mail é apenas exibido (desabilitado)
  senha: Yup.string().min(6, "Mínimo de 6 caracteres").nullable(),
});

class ProfilePage extends BasePage {
  state = {
    usuario: null,
    loading: true,
    error: null,
    showEdit: false,
    deleting: false,
    successMsg: "",
  };

  async componentDidMount() {
    const { id } = this.props.params;
    try {
      const resp = await api.get(`/usuario/${id}`);
      this.setState({ usuario: resp.data, error: null });
    } catch (err) {
      this.setState({ error: "Erro ao carregar dados." });
    } finally {
      this.setState({ loading: false });
    }
  }

  async deleteAccount() {
    if (
      !window.confirm(
        "Tem certeza que deseja excluir sua conta? Todos os pets e vacinas serão removidos. Esta ação é irreversível."
      )
    ) {
      return;
    }
    this.setState({ deleting: true });
    const { id } = this.props.params;
    try {
      await api.delete(`/usuario/${id}`);
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      window.location.href = "/registration";
    } catch (err) {
      alert(
        err.response?.data?.errors?._?.[0] ||
          "Falha ao excluir a conta. Tente novamente."
      );
      this.setState({ deleting: false });
    }
  }

  renderContent() {
    const { usuario, loading, error, showEdit, deleting, successMsg } =
      this.state;

    if (loading) return <div className="text-center mt-5">Carregando...</div>;
    if (error)
      return <div className="text-center mt-5 text-danger">{error}</div>;
    if (!usuario)
      return (
        <div className="text-center mt-5 text-danger">
          Usuário não encontrado.
        </div>
      );

    return (
      <div className="container mt-4" style={{ maxWidth: 900 }}>
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
          <h2 className="mb-0">Dados da Conta</h2>
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-danger"
              disabled={deleting}
              onClick={() => this.deleteAccount()}
            >
              {deleting ? "Excluindo..." : "Excluir conta"}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => this.setState({ showEdit: true })}
            >
              Editar
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <p>
              <strong>Nome:</strong> {usuario.nome}
            </p>
            <p>
              <strong>Data de nascimento/fundação:</strong>{" "}
              {usuario.data
                ? new Date(`${usuario.data}T00:00:00`).toLocaleDateString(
                    "pt-BR"
                  )
                : "-"}
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

        {/* Modal de edição com react-bootstrap */}
        <Modal
          show={showEdit}
          onHide={() => this.setState({ showEdit: false })}
          centered
          size="lg"
          backdrop="static"
        >
          <Formik
            enableReinitialize
            initialValues={{
              nome: usuario.nome || "",
              data: toInputDate(usuario.data),
              rua: usuario.rua || "",
              bairro: usuario.bairro || "",
              numero: usuario.numero || "",
              cep: usuario.cep || "",
              cidade: usuario.cidade || "",
              estado: usuario.estado || "",
              complemento: usuario.complemento || "",
              funcao: usuario.funcao || "",
              email: usuario.email || "", // desabilitado
              senha: "", // opcional
            }}
            validationSchema={editSchema}
            onSubmit={async (
              values,
              { setSubmitting, setFieldError, setStatus }
            ) => {
              const { id } = this.props.params;
              try {
                setStatus(undefined);

                // não enviar e-mail
                const { email, ...payload } = values;

                // normalizações
                payload.estado = (payload.estado || "").trim().toUpperCase();
                payload.cep = (payload.cep || "").replace(/\D/g, "");
                payload.numero = (payload.numero || "").replace(/\D/g, "");
                payload.funcao = (payload.funcao || "").toLowerCase();
                if (!payload.senha) delete payload.senha;

                const resp = await api.put(`/usuario/${id}`, payload);
                this.setState({
                  usuario: resp.data,
                  showEdit: false,
                  successMsg: "Dados atualizados com sucesso!",
                });
                setTimeout(() => this.setState({ successMsg: "" }), 3000);
              } catch (err) {
                const errors = err.response?.data?.errors;
                if (errors) {
                  Object.entries(errors).forEach(([field, msgs]) => {
                    const msg = Array.isArray(msgs) ? msgs[0] : String(msgs);
                    const known = [
                      "nome",
                      "data",
                      "rua",
                      "bairro",
                      "numero",
                      "cep",
                      "cidade",
                      "estado",
                      "complemento",
                      "funcao",
                      "senha",
                    ];
                    if (known.includes(field)) setFieldError(field, msg);
                    else setStatus(msg);
                  });
                } else {
                  setStatus("Não foi possível salvar as alterações.");
                }
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting, status, setFieldValue }) => (
              <Form>
                <Modal.Header closeButton>
                  <Modal.Title>Editar dados da conta</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  {status && (
                    <div className="alert alert-danger mb-3">{status}</div>
                  )}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Nome</label>
                      <Field name="nome" className="form-control" />
                      <div className="text-danger">
                        <ErrorMessage name="nome" />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Data de nascimento/fundação
                      </label>
                      <Field
                        name="data"
                        type="date"
                        className="form-control"
                        max={eighteenYearsAgoStr}
                      />
                      <div className="text-danger">
                        <ErrorMessage name="data" />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">Rua</label>
                      <Field name="rua" className="form-control" />
                      <div className="text-danger">
                        <ErrorMessage name="rua" />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">Bairro</label>
                      <Field name="bairro" className="form-control" />
                      <div className="text-danger">
                        <ErrorMessage name="bairro" />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">Número</label>
                      <Field name="numero">
                        {({ field }) => (
                          <input
                            {...field}
                            className="form-control"
                            inputMode="numeric"
                            pattern="\d*"
                            onInput={(e) => {
                              e.target.value = e.target.value.replace(
                                /\D/g,
                                ""
                              );
                              setFieldValue("numero", e.target.value);
                            }}
                            placeholder="Ex.: 123"
                          />
                        )}
                      </Field>
                      <div className="text-danger">
                        <ErrorMessage name="numero" />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">CEP</label>
                      <Field name="cep" className="form-control" />
                      <div className="text-danger">
                        <ErrorMessage name="cep" />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">Cidade</label>
                      <Field name="cidade" className="form-control" />
                      <div className="text-danger">
                        <ErrorMessage name="cidade" />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label">Estado</label>
                      <Field
                        name="estado"
                        className="form-control text-uppercase"
                        maxLength={2}
                      />
                      <div className="text-danger">
                        <ErrorMessage name="estado" />
                      </div>
                    </div>

                    <div className="col-12">
                      <label className="form-label">Complemento</label>
                      <Field name="complemento" className="form-control" />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Função</label>
                      <Field as="select" name="funcao" className="form-select">
                        <option value="" disabled>
                          Selecione…
                        </option>
                        <option value="tutor">Tutor</option>
                        <option value="ong">ONG</option>
                      </Field>
                      <div className="text-danger">
                        <ErrorMessage name="funcao" />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        E-mail (não editável)
                      </label>
                      <input
                        value={usuario.email || ""}
                        type="email"
                        className="form-control"
                        disabled
                        readOnly
                      />
                      <div className="form-text">
                        Para alterar o e-mail, crie uma nova conta.
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        Nova senha (opcional)
                      </label>
                      <Field
                        name="senha"
                        type="password"
                        className="form-control"
                        placeholder="Deixe em branco para manter a atual"
                      />
                      <div className="text-danger">
                        <ErrorMessage name="senha" />
                      </div>
                    </div>
                  </div>
                </Modal.Body>
                <Modal.Footer>
                  <Button
                    variant="secondary"
                    onClick={() => this.setState({ showEdit: false })}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Salvando..." : "Salvar alterações"}
                  </Button>
                </Modal.Footer>
              </Form>
            )}
          </Formik>
        </Modal>
      </div>
    );
  }
}

export default withRouter(ProfilePage);
