import React from "react";
import { Modal, Button } from "react-bootstrap";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import api from "../services/api";

const todayStr = new Date().toISOString().split("T")[0];
const onlyLetters = /^[\p{L}\s-]+$/u;

const schema = Yup.object({
  nome: Yup.string().trim().required("Campo obrigatório"),
  data: Yup.date()
    .max(new Date(), "Não pode ser no futuro")
    .required("Campo obrigatório"),
  especie: Yup.string().trim().required("Campo obrigatório"),
  porte: Yup.string().trim().required("Campo obrigatório"),
  peso: Yup.string()
    .matches(/^\d+[.,]\d+$/, "Use casas decimais, ex.: 7,5")
    .required("Campo obrigatório"),
  raca: Yup.string().trim().required("Campo obrigatório"),
  cor_pelagem: Yup.string()
    .trim()
    .matches(onlyLetters, "Use apenas letras (sem números)")
    .required("Campo obrigatório"),
  idade_aproximada: Yup.string()
    .matches(/^\d*$/, "Apenas números inteiros")
    .nullable(),
  outras_caracteristicas: Yup.string().trim(),
});

export default function PetCreateModal({ show, onClose, onSaved }) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Formik
        initialValues={{
          nome: "",
          data: "",
          especie: "",
          porte: "",
          peso: "",
          raca: "",
          cor_pelagem: "",
          idade_aproximada: "",
          outras_caracteristicas: "",
        }}
        validationSchema={schema}
        onSubmit={async (values, { setSubmitting, setFieldError }) => {
          try {
            const payload = { ...values };
            if (typeof payload.peso === "string")
              payload.peso = payload.peso.replace(",", ".");

            const resp = await api.post("/pets", payload);
            onSaved?.(resp.data);
            onClose?.();
          } catch (err) {
            console.error(
              "POST /api/pets falhou:",
              err.response?.data || err.message
            );
            const errors = err.response?.data?.errors;
            if (errors) {
              Object.entries(errors).forEach(([field, msgs]) => {
                const msg = Array.isArray(msgs) ? msgs[0] : String(msgs);
                if (
                  [
                    "nome",
                    "data",
                    "especie",
                    "porte",
                    "peso",
                    "raca",
                    "cor_pelagem",
                    "idade_aproximada",
                    "outras_caracteristicas",
                  ].includes(field)
                ) {
                  setFieldError(field, msg);
                } else {
                  alert(msg);
                }
              });
            } else {
              alert("Não foi possível salvar o pet.");
            }
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <Modal.Header closeButton>
              <Modal.Title>Cadastrar novo pet</Modal.Title>
            </Modal.Header>
            <Modal.Body>
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
                    Data de nascimento/chegada
                  </label>
                  <Field
                    name="data"
                    type="date"
                    max={todayStr}
                    className="form-control"
                  />
                  <div className="text-danger">
                    <ErrorMessage name="data" />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Espécie</label>
                  <Field as="select" name="especie" className="form-select">
                    <option value="">Selecione…</option>
                    <option value="cachorro">Cachorro</option>
                    <option value="gato">Gato</option>
                    <option value="outro">Outro</option>
                  </Field>
                  <div className="text-danger">
                    <ErrorMessage name="especie" />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Porte</label>
                  <Field as="select" name="porte" className="form-select">
                    <option value="">Selecione…</option>
                    <option value="pequeno">Pequeno</option>
                    <option value="medio">Médio</option>
                    <option value="grande">Grande</option>
                  </Field>
                  <div className="text-danger">
                    <ErrorMessage name="porte" />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Peso (kg)</label>
                  <Field name="peso">
                    {({ field, form }) => (
                      <input
                        {...field}
                        className="form-control"
                        inputMode="decimal"
                        placeholder="Ex.: 7,5"
                        onInput={(e) => {
                          e.target.value = e.target.value.replace(
                            /[^\d.,]/g,
                            ""
                          );
                          form.setFieldValue("peso", e.target.value);
                        }}
                      />
                    )}
                  </Field>
                  <div className="text-danger">
                    <ErrorMessage name="peso" />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Raça</label>
                  <Field name="raca" className="form-control" />
                  <div className="text-danger">
                    <ErrorMessage name="raca" />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Cor da pelagem</label>
                  <Field name="cor_pelagem">
                    {({ field, form }) => (
                      <input
                        {...field}
                        className="form-control"
                        placeholder="Ex.: Caramelo, Branco e preto"
                        onInput={(e) => {
                          e.target.value = e.target.value.replace(/\d/g, "");
                          form.setFieldValue("cor_pelagem", e.target.value);
                        }}
                      />
                    )}
                  </Field>
                  <div className="text-danger">
                    <ErrorMessage name="cor_pelagem" />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Idade aproximada</label>
                  <Field name="idade_aproximada">
                    {({ field, form }) => (
                      <input
                        {...field}
                        className="form-control"
                        inputMode="numeric"
                        placeholder="Ex.: 2"
                        onInput={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          form.setFieldValue("idade_aproximada", val);
                        }}
                      />
                    )}
                  </Field>
                  <div className="text-danger">
                    <ErrorMessage name="idade_aproximada" />
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label">
                    Outras características físicas
                  </label>
                  <Field
                    as="textarea"
                    name="outras_caracteristicas"
                    rows="3"
                    className="form-control"
                  />
                  <div className="text-danger">
                    <ErrorMessage name="outras_caracteristicas" />
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
