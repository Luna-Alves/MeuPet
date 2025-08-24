from functools import wraps
from flask import request, jsonify, current_app, g
import jwt

def gerar_token(usuario) -> str:
    payload = {"sub": usuario.id, "email": usuario.email}
    token = jwt.encode(payload, current_app.config['JWT_SECRET'], algorithm='HS256')
    return token

def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return jsonify({"errors": {"_": ["Não autorizado"]}}), 401
        token = auth.split(' ', 1)[1]
        try:
            payload = jwt.decode(token, current_app.config['JWT_SECRET'], algorithms=['HS256'])
            g.current_user_id = int(payload['sub'])
        except jwt.ExpiredSignatureError:
            return jsonify({"errors": {"_": ["Sessão expirada."]}}), 401
        except Exception:
            return jsonify({"errors": {"_": ["Token inválido"]}}), 401
        return fn(*args, **kwargs)
    return wrapper
