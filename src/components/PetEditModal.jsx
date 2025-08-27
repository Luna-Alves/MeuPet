// src/components/PetEditModal.jsx
import React from "react";
import { Modal, Button } from "react-bootstrap";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import api from "../services/api";

const todayStr = new Date().toISOString().split("T")[0];
const onlyLetters = /^[\p{L}\s-]+$/u;

const schema = Yup.object({
  // nome e data_nascimento existem no form, mas não serão enviados (disabled)
  data_chegada: Yup.date()
    .transform((val, orig) => (orig === "" || orig === undefined ? null : val))
    .nullable()
    .typeError("Data inválida")
    .max(new Date(), "Não pode ser no futuro")
    .test(
      "chegada-gte-nasc",
      "Data de chegada não pode ser anterior à data de nascimento",
      function (value) {
        const nasc = this.parent?.data_nascimento;
        if (!value || !nasc) return true;
        return value >= nasc;
      }
    ),
  especie: Yup.string().trim().required("Campo obrigatório"),
  porte: Yup.string().trim().required("Campo obrigatório"),
  peso: Yup.string()
    .matches(/^\d+[.,]?\d*$/, "Use número, ex.: 7,5")
    .required("Campo obrigatório"),
  raca: Yup.string().trim().required("Campo obrigatório"),
  cor_pelagem: Yup.string()
    .trim()
    .matches(onlyLetters, "Use apenas letras (sem números)")
    .required("Campo obrigatório"),
  idade_aproximada: Yup.string().trim().max(50).nullable(),
  outras_caracteristicas: Yup.string().trim().nullable(),
});

const formatISO = (val) => {
  if (!val) return "";
  // aceita Date ou string já em ISO
  if (val instanceof Date && !isNaN(val)) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${val.getFullYear()}-${pad(val.getMonth() + 1)}-${pad(
      val.getDate()
    )}`;
  }
  // se já veio "YYYY-MM-DDTHH..." corta
  return String(val).split("T")[0];
};

export default function PetEditModal({ show, onClose, onSaved, pet }) {
  if (!pet) return null;

  const initialValues = {
    nome: pet.nome || "",
    data_nascimento: formatISO(pet.data_nascimento) || "",
    data_chegada: formatISO(pet.data_chegada) || "",
    especie: pet.especie || "",
    porte: pet.porte || "",
    peso: pet.peso != null ? String(pet.peso).replace(".", ",") : "",
    raca: pet.raca || "",
    cor_pelagem: pet.cor_pelagem || "",
    idade_aproximada: pet.idade_aproximada || "",
    outras_caracteristicas: pet.outras_caracteristicas || "",
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Formik
        enableReinitialize
        initialValues={initialValues}
        validationSchema={schema}
        onSubmit={async (values, { setSubmitting, setFieldError }) => {
          try {
            // monta payload sem nome e data_nascimento (não podem ser alterados)
            const {
              nome, // eslint-disable-line
              data_nascimento, // eslint-disable-line
              ...rest
            } = values;

            const payload = { ...rest };

            // normalizações
            if (typeof payload.peso === "string") {
              payload.peso = payload.peso.replace(",", ".");
            }

            // remove strings vazias
            Object.keys(payload).forEach((k) => {
              if (payload[k] === "") delete payload[k];
            });

            const resp = await api.put(`/pets/${pet.id}`, payload);
            onSaved?.(resp.data);
            onClose?.();
          } catch (err) {
            const errors = err.response?.data?.errors;
            if (errors) {
              Object.entries(errors).forEach(([field, msgs]) => {
                const msg = Array.isArray(msgs) ? msgs[0] : String(msgs);
                const known = [
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
              alert("Não foi possível salvar as alterações.");
            }
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <Modal.Header closeButton>
              <Modal.Title>Editar pet</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Nome</label>
                  <Field name="nome">
                    {({ field }) => (
                      <input {...field} className="form-control" disabled />
                    )}
                  </Field>
                  <div className="form-text">
                    Não é possível alterar o nome.
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Data de nascimento</label>
                  <Field name="data_nascimento">
                    {({ field }) => (
                      <input
                        {...field}
                        type="date"
                        className="form-control"
                        disabled
                      />
                    )}
                  </Field>
                  <div className="form-text">
                    Não é possível alterar a data de nascimento.
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Data de chegada</label>
                  <Field
                    name="data_chegada"
                    type="date"
                    max={todayStr}
                    className="form-control"
                  />
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
                  <Field name="cor_pelagem" className="form-control" />
                  <div className="text-danger">
                    <ErrorMessage name="cor_pelagem" />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Idade aproximada</label>
                  <Field name="idade_aproximada" className="form-control" />
                  <div className="text-danger">
                    <ErrorMessage name="idade_aproximada" />
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label">Outras características</label>
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
                {isSubmitting ? "Salvando..." : "Salvar alterações"}
              </Button>
            </Modal.Footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
