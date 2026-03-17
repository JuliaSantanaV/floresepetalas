"""
Flores & Pétalas — Backend Python com Flask
Servidor para gerenciar pedidos, catálogo e contato
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import json
import os

app = Flask(__name__)
CORS(app)

# ─── DADOS EM MEMÓRIA (simula banco de dados) ───────────────────────────────

PRODUTOS = [
    {"id": 1, "nome": "Buquê Rosas Vermelhas",  "categoria": "buque",  "preco": 149, "tag": "Mais Vendido", "estoque": 20},
    {"id": 2, "nome": "Arranjo Primavera",       "categoria": "arranjo","preco": 189, "tag": "Novidade",    "estoque": 15},
    {"id": 3, "nome": "Orquídea Phalaenopsis",   "categoria": "planta", "preco": 129, "tag": None,          "estoque": 8},
    {"id": 4, "nome": "Buquê Tulipas Rosa",      "categoria": "buque",  "preco": 219, "tag": None,          "estoque": 12},
    {"id": 5, "nome": "Arranjo Girassóis",       "categoria": "arranjo","preco": 99,  "tag": "Promoção",    "estoque": 18},
    {"id": 6, "nome": "Kit Suculentas",          "categoria": "planta", "preco": 79,  "tag": None,          "estoque": 25},
]

PEDIDOS = []
CONTATOS = []

pedido_counter = [1]

# ─── FUNÇÕES UTILITÁRIAS ────────────────────────────────────────────────────

def salvar_log(tipo, dados):
    """Salva log em arquivo JSON"""
    arquivo = f"logs_{tipo}.json"
    registros = []
    if os.path.exists(arquivo):
        with open(arquivo, "r", encoding="utf-8") as f:
            try:
                registros = json.load(f)
            except:
                registros = []
    registros.append(dados)
    with open(arquivo, "w", encoding="utf-8") as f:
        json.dump(registros, f, ensure_ascii=False, indent=2)


def resposta(sucesso, mensagem, dados=None, status=200):
    """Formata resposta padrão da API"""
    payload = {"sucesso": sucesso, "mensagem": mensagem}
    if dados is not None:
        payload["dados"] = dados
    return jsonify(payload), status


# ─── ROTAS: PRODUTOS ────────────────────────────────────────────────────────

@app.route("/api/produtos", methods=["GET"])
def listar_produtos():
    """Retorna todos os produtos, com filtro opcional por categoria"""
    categoria = request.args.get("categoria", "todos")
    if categoria == "todos":
        resultado = PRODUTOS
    else:
        resultado = [p for p in PRODUTOS if p["categoria"] == categoria]
    return resposta(True, f"{len(resultado)} produto(s) encontrado(s)", resultado)


@app.route("/api/produtos/<int:produto_id>", methods=["GET"])
def detalhe_produto(produto_id):
    """Retorna detalhes de um produto específico"""
    produto = next((p for p in PRODUTOS if p["id"] == produto_id), None)
    if not produto:
        return resposta(False, "Produto não encontrado", status=404)
    return resposta(True, "Produto encontrado", produto)


# ─── ROTAS: PEDIDOS ─────────────────────────────────────────────────────────

@app.route("/api/pedidos", methods=["POST"])
def criar_pedido():
    """Cria novo pedido"""
    dados = request.get_json()
    if not dados:
        return resposta(False, "Dados inválidos", status=400)

    # Validação básica
    campos_obrigatorios = ["nome", "whatsapp", "itens"]
    for campo in campos_obrigatorios:
        if campo not in dados or not dados[campo]:
            return resposta(False, f"Campo obrigatório: {campo}", status=400)

    # Verificar estoque e calcular total
    total = 0
    itens_processados = []
    for item in dados["itens"]:
        produto = next((p for p in PRODUTOS if p["id"] == item.get("produto_id")), None)
        if not produto:
            return resposta(False, f"Produto ID {item.get('produto_id')} não existe", status=400)
        qtd = item.get("quantidade", 1)
        if produto["estoque"] < qtd:
            return resposta(False, f"Estoque insuficiente: {produto['nome']}", status=400)
        subtotal = produto["preco"] * qtd
        total += subtotal
        itens_processados.append({
            "produto_id": produto["id"],
            "nome": produto["nome"],
            "quantidade": qtd,
            "preco_unitario": produto["preco"],
            "subtotal": subtotal
        })
        # Reduz estoque
        produto["estoque"] -= qtd

    pedido = {
        "id": f"FP{str(pedido_counter[0]).zfill(4)}",
        "nome": dados["nome"],
        "whatsapp": dados["whatsapp"],
        "email": dados.get("email", ""),
        "endereco": dados.get("endereco", ""),
        "itens": itens_processados,
        "total": total,
        "observacoes": dados.get("observacoes", ""),
        "status": "pendente",
        "criado_em": datetime.now().isoformat()
    }

    PEDIDOS.append(pedido)
    pedido_counter[0] += 1
    salvar_log("pedidos", pedido)

    return resposta(True, "Pedido criado com sucesso!", pedido, 201)


@app.route("/api/pedidos", methods=["GET"])
def listar_pedidos():
    """Lista todos os pedidos"""
    return resposta(True, f"{len(PEDIDOS)} pedido(s)", PEDIDOS)


@app.route("/api/pedidos/<string:pedido_id>", methods=["GET"])
def buscar_pedido(pedido_id):
    """Busca pedido por ID"""
    pedido = next((p for p in PEDIDOS if p["id"] == pedido_id.upper()), None)
    if not pedido:
        return resposta(False, "Pedido não encontrado", status=404)
    return resposta(True, "Pedido encontrado", pedido)


@app.route("/api/pedidos/<string:pedido_id>/status", methods=["PATCH"])
def atualizar_status(pedido_id):
    """Atualiza status do pedido"""
    pedido = next((p for p in PEDIDOS if p["id"] == pedido_id.upper()), None)
    if not pedido:
        return resposta(False, "Pedido não encontrado", status=404)

    dados = request.get_json()
    novo_status = dados.get("status")
    status_validos = ["pendente", "confirmado", "em_preparo", "saiu_para_entrega", "entregue", "cancelado"]
    if novo_status not in status_validos:
        return resposta(False, f"Status inválido. Use: {status_validos}", status=400)

    pedido["status"] = novo_status
    pedido["atualizado_em"] = datetime.now().isoformat()
    return resposta(True, "Status atualizado", pedido)


# ─── ROTAS: CONTATO ─────────────────────────────────────────────────────────

@app.route("/api/contato", methods=["POST"])
def receber_contato():
    """Recebe mensagem do formulário de contato"""
    dados = request.get_json()
    if not dados:
        return resposta(False, "Dados inválidos", status=400)

    if not dados.get("nome") or not dados.get("mensagem"):
        return resposta(False, "Nome e mensagem são obrigatórios", status=400)

    contato = {
        "id": len(CONTATOS) + 1,
        "nome": dados["nome"],
        "whatsapp": dados.get("whatsapp", ""),
        "email": dados.get("email", ""),
        "tipo_pedido": dados.get("tipo_pedido", ""),
        "mensagem": dados["mensagem"],
        "recebido_em": datetime.now().isoformat(),
        "respondido": False
    }

    CONTATOS.append(contato)
    salvar_log("contatos", contato)

    return resposta(True, "Mensagem recebida! Entraremos em contato em breve. 🌸", contato, 201)


@app.route("/api/contato", methods=["GET"])
def listar_contatos():
    """Lista mensagens de contato"""
    return resposta(True, f"{len(CONTATOS)} mensagem(ns)", CONTATOS)


# ─── ROTA: ESTATÍSTICAS ─────────────────────────────────────────────────────

@app.route("/api/stats", methods=["GET"])
def estatisticas():
    """Retorna estatísticas básicas da loja"""
    total_pedidos = len(PEDIDOS)
    faturamento = sum(p["total"] for p in PEDIDOS)
    pedidos_entregues = len([p for p in PEDIDOS if p["status"] == "entregue"])
    top_produto = None

    if PEDIDOS:
        contagem = {}
        for pedido in PEDIDOS:
            for item in pedido["itens"]:
                nome = item["nome"]
                contagem[nome] = contagem.get(nome, 0) + item["quantidade"]
        top_produto = max(contagem, key=contagem.get) if contagem else None

    stats = {
        "total_pedidos": total_pedidos,
        "faturamento_total": faturamento,
        "pedidos_entregues": pedidos_entregues,
        "mensagens_contato": len(CONTATOS),
        "produtos_catalogo": len(PRODUTOS),
        "produto_mais_vendido": top_produto,
        "gerado_em": datetime.now().isoformat()
    }
    return resposta(True, "Estatísticas", stats)


# ─── ROTA PRINCIPAL ─────────────────────────────────────────────────────────

@app.route("/")
def index():
    return jsonify({
        "api": "Flores & Pétalas",
        "versao": "1.0.0",
        "rotas": {
            "GET  /api/produtos": "Lista produtos (filtro: ?categoria=buque|arranjo|planta)",
            "GET  /api/produtos/:id": "Detalhe do produto",
            "POST /api/pedidos": "Criar pedido",
            "GET  /api/pedidos": "Listar pedidos",
            "GET  /api/pedidos/:id": "Buscar pedido",
            "PATCH /api/pedidos/:id/status": "Atualizar status",
            "POST /api/contato": "Enviar mensagem",
            "GET  /api/contato": "Listar mensagens",
            "GET  /api/stats": "Estatísticas",
        }
    })


# ─── INICIALIZAÇÃO ──────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("🌸 Flores & Pétalas — Servidor iniciado!")
    print("📍 Acesse: http://localhost:5000")
    print("📋 Documentação: http://localhost:5000/")
    app.run(debug=True, host="0.0.0.0", port=5000)
