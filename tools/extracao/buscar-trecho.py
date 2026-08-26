"""Busca frases citáveis. Uso: cite.py "<regex>" [C01,C05] [maxfrases]"""
import re, json, sys, os, unicodedata
RAIZ=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
D=json.load(open(os.path.join(RAIZ,"data/_paginas.json"),encoding="utf-8"))
def nrm(s):
    s=unicodedata.normalize("NFD",s.lower())
    return "".join(c for c in s if unicodedata.category(c)!="Mn")
rx=re.compile(sys.argv[1])
only=sys.argv[2].split(",") if len(sys.argv)>2 and sys.argv[2]!="-" else None
MAX=int(sys.argv[3]) if len(sys.argv)>3 else 3
for c in sorted(D):
    if only and c not in only: continue
    achou=0
    for i,pg in enumerate(D[c]["paginas"]):
        if not pg: continue
        # divide em sentenças/bullets
        for s in re.split(r"(?<=[.;!?])\s+|\s•\s|\s▪\s|\s●\s", pg):
            s=s.strip()
            if not (30 < len(s) < 460): continue
            if rx.search(nrm(s)):
                if achou==0: print(f"\n███ {c}")
                print(f"  [p.{i+1}] {s}")
                achou+=1
                if achou>=MAX: break
        if achou>=MAX: break
