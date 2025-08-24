import React from "react";
import { Modal, Button } from "react-bootstrap";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import api from "../services/api";

const todayStr = new Date().toISOString().split("T")[0];

// Helpers de validação (comparam strings ISO "YYYY-MM-DD")
const isDateISO = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || "");
const dateLTE = (a, b) => !a || !b || a <= b;
const dateLT = (a, b) => !a || !b || a < b;
const dateGTE = (a, b) => !a || !b || a >= b;
const dateGT = (a, b) => !a || !b || a > b;

const schema = Yup.object({
  nome: Yup.string().trim().required("Obrigatório"),
  fabricante: Yup.string().trim().required("Obrigatório"),
  aplicacao: Yup.string()
    .required("Obrigatório")
    .test("iso", "Data inválida", isDateISO)
    .test("<=today", "Não pode ser no futuro", (v) => dateLTE(v, todayStr))
    .test(
      ">=fabricacao",
      "Aplicação não pode ser anterior à fabricação",
      function (v) {
        return dateGTE(v, this.parent.fabricacao);
      }
    ),
  fabricacao: Yup.string()
    .required("Obrigatório")
    .test("iso", "Data inválida", isDateISO)
    .test("<=today", "Não pode ser no futuro", (v) => dateLTE(v, todayStr)),
  vencimento: Yup.string()
    .required("Obrigatório")
    .test("iso", "Data inválida", isDateISO)
    .test(">=fabricacao", "Vencimento deve ser após fabricação", function (v) {
      return dateGTE(v, this.parent.fabricacao);
    })
    .test(">=aplicacao", "Vencimento deve ser após aplicação", function (v) {
      return dateGTE(v, this.parent.aplicacao);
    }),
  lote: Yup.string().trim().required("Obrigatório"),
  dose_tamanho: Yup.string()
    .trim()
    .required("Obrigatório")
    // aceita "0,5", "0.5", "0,5 mL", "1 ml", etc.
    .matches(/^\d+([.,]\d+)?(\s*(mL|ml))?$/, "Informe quantidade, ex.: 0,5 mL"),
  revacinacao: Yup.string()
    .required("Obrigatório")
    .test("iso", "Data inválida", isDateISO)
    .test(">aplicacao", "Revacinação deve ser após a aplicação", function (v) {
      return dateGT(v, this.parent.aplicacao);
    }),
  observacoes: Yup.string().trim().nullable(),
});

export default function VaccineCreateModal({ show, onClose, onSaved, petId }) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Formik
        initialValues={{
          nome: "",
          fabricante: "",
          aplicacao: "",
          fabricacao: "",
          vencimento: "",
          lote: "",
          dose_tamanho: "",
          revacinacao: "",
          observacoes: "",
        }}
        validationSchema={schema}
        onSubmit={async (values, { setSubmitting, setFieldError }) => {
          try {
            // normalizações simples
            const payload = { ...values };
            if (typeof payload.dose_tamanho === "string") {
              payload.dose_tamanho = payload.dose_tamanho.replace(
                /\s+ML$/i,
                " mL"
              );
            }

            const resp = await api.post(`/pets/${petId}/vacinas`, payload);
            onSaved?.(resp.data);
            onClose?.();
          } catch (err) {
            console.error(
              "POST /api/pets/:id/vacinas falhou:",
              err.response?.data || err.message
            );
            const errors = err.response?.data?.errors;
            if (errors) {
              Object.entries(errors).forEach(([field, msgs]) => {
                const msg = Array.isArray(msgs) ? msgs[0] : String(msgs);
                if (
                  [
                    "nome",
                    "fabricante",
                    "aplicacao",
                    "fabricacao",
                    "vencimento",
                    "lote",
                    "dose_tamanho",
                    "revacinacao",
                    "observacoes",
                  ].includes(field)
                ) {
                  setFieldError(field, msg);
                } else {
                  alert(msg);
                }
              });
            } else {
              alert("Não foi possível salvar a vacina.");
            }
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <Modal.Header closeButton>
              <Modal.Title>Cadastrar vacina</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Nome da Vacina</label>
                  <Field name="nome" className="form-control" />
                  <div className="text-danger">
                    <ErrorMessage name="nome" />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Fabricante</label>
                  <Field name="fabricante" className="form-control" />
                  <div className="text-danger">
                    <ErrorMessage name="fabricante" />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Data de aplicação</label>
                  <Field
                    name="aplicacao"
                    type="date"
                    max={todayStr}
                    className="form-control"
                  />
                  <div className="text-danger">
                    <ErrorMessage name="aplicacao" />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Data de Fabricação</label>
                  <Field
                    name="fabricacao"
                    type="date"
                    max={todayStr}
                    className="form-control"
                  />
                  <div className="text-danger">
                    <ErrorMessage name="fabricacao" />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Data de Vencimento</label>
                  <Field
                    name="vencimento"
                    type="date"
                    className="form-control"
                  />
                  <div className="text-danger">
                    <ErrorMessage name="vencimento" />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Lote</label>
                  <Field name="lote" className="form-control" />
                  <div className="text-danger">
                    <ErrorMessage name="lote" />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Tamanho da dose</label>
                  <Field
                    name="dose_tamanho"
                    placeholder="Ex.: 0,5 mL"
                    className="form-control"
                  />
                  <div className="text-danger">
                    <ErrorMessage name="dose_tamanho" />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Data de revacinação</label>
                  <Field
                    name="revacinacao"
                    type="date"
                    className="form-control"
                  />
                  <div className="text-danger">
                    <ErrorMessage name="revacinacao" />
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label">Observações</label>
                  <Field
                    as="textarea"
                    name="observacoes"
                    rows="3"
                    className="form-control"
                  />
                  <div className="text-danger">
                    <ErrorMessage name="observacoes" />
                  </div>
                </div>
              </div>
            </Modal.Body>

            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </Modal.Footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
