# backend/resources/auth_resource.py
from flask import request
from flask_restful import Resource
from werkzeug.security import check_password_hash
import dns.resolver, dns.exception

from helpers.logging import logger
from models.usuario import Usuario
from resources.auth_utils import gerar_token

_resolver = dns.resolver.Resolver(configure=True)
_resolver.timeout = _resolver.lifetime = 2.0

def has_mx(domain: str) -> bool:
    # em dev você pode curto-circuitar para True se quiser
    from os import environ
    if environ.get("APP_ENV") == "dev":
        return True
    try:
        ans = _resolver.resolve(domain, 'MX')
        return len(ans) > 0
    except (dns.exception.DNSException, OSError):
        return False

class AuthLoginResource(Resource):
    def post(self):
        data = request.get_json(force=True) or {}
        email = (data.get('email') or '').strip().lower()
        senha = data.get('senha')
        if senha is None:
            senha = data.get('password')  # fallback

        if not email or senha in (None, ''):
            return {"errors": {"_": ["Email e senha são obrigatórios."]}}, 400
        if '@' not in email:
            return {"errors": {"email": ["Email inválido."]}}, 400
        if not has_mx(email.split('@', 1)[1]):
            return {"errors": {"email": ["O domínio do e-mail não existe ou não recebe e-mails (sem MX)."]}}, 400

        u = Usuario.query.filter_by(email=email).first()
        if not u:
            return {"errors": {"email": ["Usuário não existente."]}}, 404

        try:
            ok = check_password_hash(u.senha, str(senha))
        except Exception as e:
            logger.exception("Falha no check_password_hash para user_id=%s", u.id)
            return {"errors": {"_": ["Falha ao validar credenciais."]}}, 500

        if not ok:
            logger.info("Login falhou: senha incorreta para user_id=%s", u.id)
            return {"errors": {"senha": ["Senha incorreta."]}}, 401

        token = gerar_token(u)
        return {"token": token, "id": u.id, "nome": u.nome, "email": u.email}, 200
