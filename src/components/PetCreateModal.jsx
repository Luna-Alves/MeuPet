import React from "react";
import { Modal, Button } from "react-bootstrap";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import api from "../services/api";

const todayStr = new Date().toISOString().split("T")[0];
const onlyLetters = /^[\p{L}\s-]+$/u;
const humanize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
const humanizePorte = (p) => (p === "medio" ? "Médio" : humanize(p));
const pesoBR = (v) => (v == null ? "" : String(v).replace(".", ","));

const formatBR = (iso) => {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  const dd = String(d).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${dd}/${mm}/${y}`;
};

const ageFrom = (iso) => {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
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

const schema = Yup.object({
  nome: Yup.string().trim().required("Campo obrigatório"),
  data_nascimento: Yup.date()
    .transform((val, orig) => (orig === "" || orig === undefined ? null : val))
    .nullable()
    .typeError("Data inválida")
    .max(new Date(), "Não pode ser no futuro"),
  data_chegada: Yup.date()
    .transform((val, orig) => (orig === "" || orig === undefined ? null : val))
    .nullable()
    .typeError("Data inválida")
    .max(new Date(), "Não pode ser no futuro")
    .test(
      "chegada-gte-nasc",
      "Chegada não pode ser antes do nascimento",
      function (value) {
        const nasc = this.parent?.data_nascimento;
        if (!value || !nasc) return true;
        return value >= nasc;
      }
    ),
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
  idade_aproximada: Yup.string().trim().max(50).nullable(),
  outras_caracteristicas: Yup.string().trim(),
}).test(
  "one-of-dates",
  "Informe data de nascimento ou data de chegada.",
  (val) => !!(val?.data_nascimento || val?.data_chegada)
);

export default function PetCreateModal({ show, onClose, onSaved }) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Formik
        initialValues={{
          nome: "",
          data_nascimento: "",
          data_chegada: "",
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
            if (typeof payload.peso === "string") {
              payload.peso = payload.peso.replace(",", ".");
            }
            Object.keys(payload).forEach((k) => {
              if (payload[k] === "") delete payload[k];
            });
            const resp = await api.post("/pets", payload);
            onSaved?.(resp.data);
            onClose?.();
          } catch (err) {
            const errors = err.response?.data?.errors;
            if (errors) {
              Object.entries(errors).forEach(([field, msgs]) => {
                const msg = Array.isArray(msgs) ? msgs[0] : String(msgs);
                const known = [
                  "nome",
                  "data_nascimento",
                  "data_chegada",
                  "especie",
                  "porte",
                  "peso",
                  "raca",
                  "cor_pelagem",
                  "idade_aproximada",
                  "outras_caracteristicas",
                ];
                if (known.includes(field)) setFieldError(field, msg);
                else alert(msg);
              });
            } else {
              alert("Não foi possível salvar o pet.");
            }
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting, values }) => {
          const idadeCalc = ageFrom(values.data_nascimento);
          const idadeDisplay = values.data_nascimento
            ? idadeCalc
            : values.data_chegada && values.idade_aproximada
            ? values.idade_aproximada
            : null;

          const nascBR =
            formatBR(values.data_nascimento) ??
            (values.data_nascimento || null);
          const chegBR =
            formatBR(values.data_chegada) ?? (values.data_chegada || null);

          return (
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
                    <label className="form-label">Data de nascimento</label>
                    <Field name="data_nascimento">
                      {({ field, form }) => (
                        <input
                          {...field}
                          type="date"
                          max={todayStr}
                          className="form-control"
                          onChange={(e) =>
                            form.setFieldValue(
                              "data_nascimento",
                              e.target.value || ""
                            )
                          }
                        />
                      )}
                    </Field>
                    <div className="text-danger">
                      <ErrorMessage name="data_nascimento" />
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Data de chegada</label>
                    <Field name="data_chegada">
                      {({ field, form }) => (
                        <input
                          {...field}
                          type="date"
                          max={todayStr}
                          className="form-control"
                          onChange={(e) =>
                            form.setFieldValue(
                              "data_chegada",
                              e.target.value || ""
                            )
                          }
                        />
                      )}
                    </Field>
                    <div className="text-danger">
                      <ErrorMessage name="data_chegada" />
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
                      {({ field }) => (
                        <input
                          {...field}
                          className="form-control"
                          placeholder="Ex.: 1 ano e 3 meses"
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
          );
        }}
      </Formik>
    </Modal>
  );
}
