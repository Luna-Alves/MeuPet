# backend/resources/auth_resource.py
from flask import request   # <-- remova o jsonify daqui
from flask_restful import Resource
from werkzeug.security import check_password_hash
import re, dns.resolver, dns.exception

from helpers.database import db
from models.usuario import Usuario
from resources.auth_utils import gerar_token

_resolver = dns.resolver.Resolver(configure=True)
_resolver.timeout = _resolver.lifetime = 2.0

def has_mx(domain: str) -> bool:
    try:
        ans = _resolver.resolve(domain, 'MX')
        return len(ans) > 0
    except (dns.exception.DNSException, OSError):
        return False

class AuthLoginResource(Resource):
    def post(self):
        data = request.get_json(force=True)
        email = (data.get('email') or '').strip().lower()
        senha = data.get('senha')

        if not email or not senha:
            return {"errors": {"_": ["Email e senha são obrigatórios."]}}, 400
        if '@' not in email:
            return {"errors": {"email": ["Email inválido."]}}, 400
        if not has_mx(email.split('@', 1)[1]):
            return {"errors": {"email": ["O domínio não recebe e-mails (sem MX)."]}}, 400

        u = Usuario.query.filter_by(email=email).first()
        if not u:
            return {"errors": {"email": ["Usuário não existente."]}}, 404
        if not check_password_hash(u.senha, senha):
            return {"errors": {"senha": ["Senha incorreta."]}}, 401

        token = gerar_token(u)
        # ✅ retorne um dict (e status opcional)
        return {"token": token, "id": u.id, "nome": u.nome, "email": u.email}, 200
