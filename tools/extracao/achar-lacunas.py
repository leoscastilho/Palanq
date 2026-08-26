"""Onde uma candidatura está calada num eixo divisivo, mas o plano dela fala do assunto.

Cada silêncio no corpus tem duas causas possíveis: o plano não se posiciona, ou a
extração não achou. Só a segunda é defeito — e este script separa as duas, rodando o
padrão de busca de cada eixo contra o plano de quem está calado nele.

Um acerto aqui NÃO é uma postura: é um lugar para um humano ir ler e decidir.

    python3 tools/extracao/achar-lacunas.py [eixo]
"""
import re, json, os, sys, unicodedata

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
D = json.load(open(os.path.join(RAIZ, "data/_paginas.json"), encoding="utf-8"))
corpus = json.load(open(os.path.join(RAIZ, "data/corpus.json"), encoding="utf-8"))
# Padrões de ASSUNTO, não de postura. O padrão que localiza a postura já falhou uma
# vez — reusá-lo aqui repetiria exatamente o mesmo ponto cego.
spec = json.load(open(os.path.join(RAIZ, "tools/extracao/topicos-divisivos.json"), encoding="utf-8"))

def nrm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return "".join(c for c in s if unicodedata.category(c) != "Mn")

nome = {c["id"]: c["nome"] for c in corpus["candidatos"]}
tem = {c["id"]: {p["eixo"] for p in c["posicoes"]} for c in corpus["candidatos"]}
alvo = sys.argv[1] if len(sys.argv) > 1 else None

total = 0
for eixo, S in spec.items():
    if alvo and eixo != alvo:
        continue
    if eixo.startswith("_"):
        continue
    rx = re.compile(S)
    calados = [cid for cid in sorted(D) if eixo not in tem.get(cid, set())]
    achados = []
    for cid in calados:
        for i, pg in enumerate(D[cid]["paginas"]):
            m = rx.search(nrm(pg))
            if m:
                trecho = re.sub(r"\s+", " ", pg[max(0, m.start() - 90): m.start() + 210]).strip()
                achados.append((cid, i + 1, trecho))
                break
    if not achados:
        continue
    print(f"\n{'=' * 96}\n### {corpus['eixos'][eixo]['label']}  ({eixo})")
    for cid, pg, t in achados:
        total += 1
        print(f"  ▸ {nome[cid]} — p.{pg}\n    {t}")
print(f"\n{total} lacuna(s) para revisão humana.")
