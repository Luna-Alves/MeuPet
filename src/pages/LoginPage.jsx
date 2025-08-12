import React from "react";
import BasePage from "./BasePage";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import api from "../services/api";

const schema = Yup.object({
  email: Yup.string().email("Email inválido").required("Campo obrigatório"),
  senha: Yup.string().required("Campo obrigatório"),
});

export default class LoginPage extends BasePage {
  renderContent() {
    return (
      <div className="container mt-5" style={{ maxWidth: 480 }}>
        <h2>Entrar</h2>
        <Formik
          initialValues={{ email: "", senha: "" }}
          validationSchema={schema}
          onSubmit={async (
            values,
            { setSubmitting, setFieldError, setStatus }
          ) => {
            try {
              setStatus(undefined);
              const payload = {
                ...values,
                email: (values.email || "").trim().toLowerCase(),
              };
              const resp = await api.post("/auth/login", payload);
              const { token, id } = resp.data;
              localStorage.setItem("token", token);
              localStorage.setItem("userId", id);
              window.location.href = `/usuario/${id}`;
            } catch (err) {
              const errors = err.response?.data?.errors;
              if (errors?.email)
                setFieldError(
                  "email",
                  Array.isArray(errors.email)
                    ? errors.email[0]
                    : String(errors.email)
                );
              if (errors?.senha)
                setFieldError(
                  "senha",
                  Array.isArray(errors.senha)
                    ? errors.senha[0]
                    : String(errors.senha)
                );
              if (errors?._)
                setStatus(
                  Array.isArray(errors._) ? errors._[0] : String(errors._)
                );
              if (!errors) setStatus("Falha no login. Tente novamente.");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, status }) => (
            <Form className="mt-3">
              {status && (
                <div className="alert alert-danger mb-3">{status}</div>
              )}
              <div className="mb-3">
                <label className="form-label">E-mail</label>
                <Field name="email" type="email" className="form-control" />
                <div className="text-danger">
                  <ErrorMessage name="email" />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Senha</label>
                <Field name="senha" type="password" className="form-control" />
                <div className="text-danger">
                  <ErrorMessage name="senha" />
                </div>
              </div>

              <button
                className="btn btn-primary"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Entrando..." : "Entrar"}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    );
  }
}
