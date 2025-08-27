import React from "react";
import { Modal, Button } from "react-bootstrap";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import api from "../services/api";

const todayStr = new Date().toISOString().split("T")[0];

// Helpers (strings 'YYYY-MM-DD' comparam lexicograficamente)
const isDateISO = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || "");
const dateLTE = (a, b) => !a || !b || a <= b;
const dateGTE = (a, b) => !a || !b || a >= b;
const dateGT = (a, b) => !a || !b || a > b;

// Schema de edição: nome/aplicacao não participam (são bloqueados no UI)
const makeEditSchema = (aplicacaoISO) =>
  Yup.object({
    fabricante: Yup.string().trim().required("Obrigatório"),
    fabricacao: Yup.string()
      .required("Obrigatório")
      .test("iso", "Data inválida", isDateISO)
      .test("<=today", "Não pode ser no futuro", (v) => dateLTE(v, todayStr)),
    vencimento: Yup.string()
      .required("Obrigatório")
      .test("iso", "Data inválida", isDateISO)
      .test(
        ">=fabricacao",
        "Vencimento deve ser após fabricação",
        function (v) {
          return dateGTE(v, this.parent.fabricacao);
        }
      )
      .test(">=aplicacao", "Vencimento deve ser após aplicação", (v) =>
        dateGTE(v, aplicacaoISO)
      ),
    lote: Yup.string().trim().required("Obrigatório"),
    dose_tamanho: Yup.string()
      .trim()
      .required("Obrigatório")
      .matches(
        /^\d+([.,]\d+)?(\s*(mL|ml))?$/,
        "Informe quantidade, ex.: 0,5 mL"
      ),
    revacinacao: Yup.string()
      .required("Obrigatório")
      .test("iso", "Data inválida", isDateISO)
      .test(">aplicacao", "Revacinação deve ser após a aplicação", (v) =>
        dateGT(v, aplicacaoISO)
      ),
    observacoes: Yup.string().trim().nullable(),
  });

export default function VaccineEditModal({
  show,
  onClose,
  onSaved,
  petId,
  vaccine,
}) {
  if (!vaccine) return null;

  const initialValues = {
    // imutáveis no UI (exibidos, mas desabilitados no edit)
    nome: vaccine.nome || "",
    aplicacao: vaccine.aplicacao || "",

    // editáveis
    fabricante: vaccine.fabricante || "",
    fabricacao: vaccine.fabricacao || "",
    vencimento: vaccine.vencimento || "",
    lote: vaccine.lote || "",
    dose_tamanho: vaccine.dose_tamanho || "",
    revacinacao: vaccine.revacinacao || "",
    observacoes: vaccine.observacoes || "",
  };

  const validationSchema = makeEditSchema(vaccine.aplicacao || "");

  return (
    <Modal show={show} onHide={onClose} centered>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        enableReinitialize
        onSubmit={async (values, { setSubmitting, setFieldError }) => {
          try {
            // monta payload só com campos permitidos
            const payload = {
              fabricante: values.fabricante,
              fabricacao: values.fabricacao,
              vencimento: values.vencimento,
              lote: values.lote,
              dose_tamanho: values.dose_tamanho,
              revacinacao: values.revacinacao,
              observacoes: values.observacoes,
            };

            const resp = await api.put(
              `/pets/${petId}/vacinas/${vaccine.id}`,
              payload
            );
            onSaved?.(resp.data);
            onClose?.();
          } catch (err) {
            const errors = err.response?.data?.errors;
            if (errors) {
              Object.entries(errors).forEach(([field, msgs]) => {
                const msg = Array.isArray(msgs) ? msgs[0] : String(msgs);
                setFieldError(field, msg);
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
              <Modal.Title>Editar vacina</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Nome da Vacina</label>
                  <Field name="nome" disabled className="form-control" />
                  <div className="text-muted small">
                    Este campo não pode ser alterado.
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Data de aplicação</label>
                  <Field
                    name="aplicacao"
                    type="date"
                    disabled
                    className="form-control"
                  />
                  <div className="text-muted small">
                    Este campo não pode ser alterado.
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
                    className="form-control"
                    placeholder="Ex.: 0,5 mL"
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
                {isSubmitting ? "Salvando..." : "Salvar alterações"}
              </Button>
            </Modal.Footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
