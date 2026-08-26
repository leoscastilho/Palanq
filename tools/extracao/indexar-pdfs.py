"""Extrai o texto dos 12 planos de governo, página a página, para data/_paginas.json.

Único ponto do projeto com dependência externa (pypdf) e o único que lê os PDFs.
A saída é versionada, então o build em Node continua com zero dependências.

    python3 -m venv .venv && .venv/bin/pip install pypdf
    .venv/bin/python tools/extracao/indexar-pdfs.py
"""
import re, os, glob, json
from pypdf import PdfReader

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SIG = {"FLAVIO":"C01","Caiado":"C02","Zema":"C03","Renan":"C04","lula":"C05","Cury":"C06",
       "Grassi":"C07","Clariana":"C08","Samara":"C09","Edmilson":"C10","Hertz":"C11","PCO":"C12"}

def cid(fn):
    for k, v in SIG.items():
        if k.lower() in fn.lower():
            return v
    raise SystemExit(f"PDF sem candidatura conhecida: {fn}")

def limpa(t):
    t = t.replace("\t", " ").replace(" ", " ")
    t = re.sub(r"-\n(?=[a-záéíóúâêôãõç])", "", t)   # hifenização de fim de linha
    return re.sub(r"\s+", " ", t).strip()

out = {}
for f in sorted(glob.glob(os.path.join(RAIZ, "source/propostas/*.pdf"))):
    r = PdfReader(f)
    pgs = []
    for p in r.pages:
        try:
            pgs.append(limpa(p.extract_text() or ""))
        except Exception:
            pgs.append("")
    out[cid(os.path.basename(f))] = {"arquivo": os.path.basename(f), "paginas": pgs}

destino = os.path.join(RAIZ, "data/_paginas.json")
json.dump(out, open(destino, "w", encoding="utf-8"), ensure_ascii=False)
print(f"{len(out)} planos indexados · " + " ".join(f"{k}:{len(v['paginas'])}p" for k, v in sorted(out.items())))
