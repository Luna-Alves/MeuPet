import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";

const validationSchema = Yup.object({
  nome: Yup.string().required("Obrigatório"),
  data: Yup.date().required("Obrigatório"),
  rua: Yup.string().required("Obrigatório"),
  bairro: Yup.string().required("Obrigatório"),
  numero: Yup.string().required("Obrigatório"),
  cep: Yup.string().required("Obrigatório"),
  cidade: Yup.string().required("Obrigatório"),
  estado: Yup.string().required("Obrigatório"),
  complemento: Yup.string(),
  funcao: Yup.string().oneOf(["tutor", "ong"]).required("Obrigatório"),
  email: Yup.string().email("Email inválido").required("Obrigatório"),
  senha: Yup.string().min(6, "Mínimo de 6 caracteres").required("Obrigatório"),
});

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
      onSubmit={async (values, { setSubmitting, resetForm }) => {
        try {
          const resp = await axios.post("/api/usuario", values);
          const id = resp?.data?.id;
          alert("Cadastro realizado com sucesso!");
          resetForm();
          if (id) {
            localStorage.setItem("userId", id);
            window.location.href = `/usuario/${id}`;
          }
        } catch (err) {
          console.error("POST /api/usuario falhou:", {
            msg: err.message,
            status: err.response?.status,
            data: err.response?.data,
          });
          const apiMsg = err.response?.data?.errors
            ? JSON.stringify(err.response.data.errors)
            : "Erro no cadastro";
          alert(apiMsg);
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting }) => (
        <Form>
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
              <Field name="data" type="date" className="form-control" />
              <div className="text-danger">
                <ErrorMessage name="data" />
              </div>
            </div>
            <div className="col-md-4">
              <label htmlFor="rua" className="form-label">
                Rua
              </label>
              <Field name="rua" className="form-control" />
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
              <Field name="numero" className="form-control" />
              <div className="text-danger">
                <ErrorMessage name="numero" />
              </div>
            </div>
            <div className="col-md-4">
              <label htmlFor="cep" className="form-label">
                CEP
              </label>
              <Field name="cep" className="form-control" />
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
              <Field name="estado" className="form-control" />
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
