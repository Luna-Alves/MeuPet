import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import api from "../services/api";

const onlyLetters = /^[\p{L}\s]+$/u;
const today = new Date();
const todayStr = new Date().toISOString().split("T")[0];

const validationSchema = Yup.object({
  nome: Yup.string()
    .trim()
    .matches(onlyLetters, "Use apenas letras e espaços")
    .required("Campo obrigatório"),

  data: Yup.date()
    .max(today, "Não pode ser no futuro")
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
  email: Yup.string().email("Email inválido").required("Campo obrigatório"),
  senha: Yup.string()
    .min(6, "Mínimo de 6 caracteres")
    .required("Campo obrigatório"),
});

const formatCEP = (value) => {
  const digits = (value || "").replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

export default function RegistrationForm() {
  return (
    <Formik
      initialValues={{
        nome: "",
        data: "",
        rua: "",
        bairro: "",
        numero: "",
        cep: "",
        cidade: "",
        estado: "",
        complemento: "",
        funcao: "",
        email: "",
        senha: "",
      }}
      validationSchema={validationSchema}
      onSubmit={async (
        values,
        { setSubmitting, resetForm, setFieldError, setStatus }
      ) => {
        try {
          setStatus(undefined);
          values.estado = (values.estado || "").trim().toUpperCase();
          values.cep = (values.cep || "").replace(/\D/g, "");
          values.numero = (values.numero || "").replace(/\D/g, "");
          values.funcao = (values.funcao || "").toLowerCase();
          values.email = (values.email || "").trim().toLowerCase();

          const resp = await api.post("/usuario", values); // baseURL '/api'
          const { id, token } = resp.data;
          // guarda sessão
          localStorage.setItem("token", token);
          localStorage.setItem("userId", id);
          // feedback e redireciona
          alert("Responsável cadastrado com sucesso!");
          resetForm();
          window.location.href = `/usuario/${id}`;
        } catch (err) {
          console.error(
            "POST /api/usuario falhou:",
            err.response?.data || err.message
          );
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
                "email",
                "senha",
              ];
              if (known.includes(field)) setFieldError(field, msg);
              else setStatus(msg);
            });
          } else {
            setStatus("Não foi possível concluir o cadastro. Tente novamente.");
          }
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting, status }) => (
        <Form>
          {status && (
            <div className="alert alert-danger mb-3" role="alert">
              {status}
            </div>
          )}
          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="nome" className="form-label">
                Nome
              </label>
              <Field name="nome" className="form-control" />
              <div className="text-danger">
                <ErrorMessage name="nome" />
              </div>
            </div>
            <div className="col-md-6">
              <label htmlFor="data" className="form-label">
                Data de nascimento/fundação
              </label>
              <Field
                name="data"
                type="date"
                className="form-control"
                max={todayStr}
              />
              <div className="text-danger">
                <ErrorMessage name="data" />
              </div>
            </div>
            <div className="col-md-4">
              <label htmlFor="rua" className="form-label">
                Rua
              </label>
              <Field
                name="rua"
                className="form-control"
                pattern="[A-Za-zÀ-ÖØ-öø-ÿ\s]+"
                title="Use apenas letras e espaços"
              />
              <div className="text-danger">
                <ErrorMessage name="rua" />
              </div>
            </div>
            <div className="col-md-4">
              <label htmlFor="bairro" className="form-label">
                Bairro
              </label>
              <Field name="bairro" className="form-control" />
              <div className="text-danger">
                <ErrorMessage name="bairro" />
              </div>
            </div>
            <div className="col-md-4">
              <label htmlFor="numero" className="form-label">
                Número
              </label>
              <Field name="numero">
                {({ field, form }) => (
                  <input
                    {...field}
                    id="numero"
                    className="form-control"
                    inputMode="numeric"
                    pattern="\d*"
                    onInput={(e) => {
                      e.target.value = e.target.value.replace(/\D/g, "");
                      form.setFieldValue("numero", e.target.value);
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
              <label htmlFor="cep" className="form-label">
                CEP
              </label>
              <Field name="cep">
                {({ field, form }) => (
                  <input
                    {...field}
                    id="cep"
                    className="form-control"
                    inputMode="numeric"
                    maxLength={9}
                    onChange={(e) => {
                      form.setFieldValue("cep", formatCEP(e.target.value));
                    }}
                    placeholder="00000-000"
                  />
                )}
              </Field>
              <div className="text-danger">
                <ErrorMessage name="cep" />
              </div>
            </div>
            <div className="col-md-4">
              <label htmlFor="cidade" className="form-label">
                Cidade
              </label>
              <Field name="cidade" className="form-control" />
              <div className="text-danger">
                <ErrorMessage name="cidade" />
              </div>
            </div>
            <div className="col-md-4">
              <label htmlFor="estado" className="form-label">
                Estado
              </label>
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
              <label htmlFor="complemento" className="form-label">
                Complemento
              </label>
              <Field name="complemento" className="form-control" />
            </div>
            <div className="col-md-6">
              <label htmlFor="funcao" className="form-label">
                Função
              </label>
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
              <label htmlFor="email" className="form-label">
                E-mail
              </label>
              <Field name="email" type="email" className="form-control" />
              <div className="text-danger">
                <ErrorMessage name="email" />
              </div>
            </div>
            <div className="col-md-6">
              <label htmlFor="senha" className="form-label">
                Senha
              </label>
              <Field name="senha" type="password" className="form-control" />
              <div className="text-danger">
                <ErrorMessage name="senha" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary mt-3"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Enviando..." : "Cadastrar"}
          </button>
        </Form>
      )}
    </Formik>
  );
}
