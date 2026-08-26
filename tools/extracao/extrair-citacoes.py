"""Extrai a melhor citação por (eixo, candidato) segundo o spec e emite JSON + revisão legível.
Spec: { eixo: {label, peso, dominio, pergunta, rx, favor:{cid:rx?}, contra:{cid:rx?}, notas} }"""
import re, json, sys, os, unicodedata
RAIZ=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
D=json.load(open(os.path.join(RAIZ,"data/_paginas.json"),encoding="utf-8"))
def nrm(s):
    s=unicodedata.normalize("NFD",s.lower())
    return "".join(c for c in s if unicodedata.category(c)!="Mn")
def frases(c):
    out=[]
    for i,pg in enumerate(D[c]["paginas"]):
        if not pg: continue
        for s in re.split(r"(?<=[.;!?])\s+|\s•\s|\s▪\s|\s●\s|\s➢\s|\s—\s", pg):
            s=re.sub(r"\s+"," ",s).strip()
            s=re.sub(r"^\d+\s+","",s)
            # cabeçalhos de rodapé/página que grudam no início da frase
            s=re.sub(r"^(PROGRAMA DE GOVERNO|LIVRO AMARELO - MISSÃO 2026|PSTU ELEIÇÕES 2026 \\| COM OS TRABALHADORES CONTRA O SISTEMA|ROMEU ZEMA \\||PLANO IMPLACÁVEL ● ROMEU ZEMA \\|)\s*\d*\s*","",s)
            # o PDF da UP renderiza cada linha duas vezes: colapsa repetições imediatas
            for _ in range(3):
                s=re.sub(r"([\wÀ-ÿ][^.;!?]{15,}?)\s*\1", r"\1", s)
            s=re.sub(r"\s+"," ",s).strip()
            if 25 < len(s) < 700: out.append((i+1,s))
    return out
CACHE={c:frases(c) for c in D}
spec=json.load(open(sys.argv[1],encoding="utf-8"))
saida={}; faltas=[]
for eixo,S in spec.items():
    saida[eixo]={k:v for k,v in S.items() if k not in ("rx","favor","contra")}
    saida[eixo]["posturas"]={}
    for postura in ("favor","contra"):
        for cid, over in (S.get(postura) or {}).items():
            rx=re.compile(over if over else S["rx"])
            best=None
            for pg,s in CACHE[cid]:
                n=nrm(s)
                if not rx.search(n): continue
                # prefere frase com mais matches, comprimento próximo de 190, e que não seja índice
                if re.match(r"^[\d\s.·]+$", s) or s.count("...")>2: continue
                score=(len(rx.findall(n))*3) - abs(len(s)-230)/120
                if best is None or score>best[0]: best=(score,pg,s)
            if best is None:
                faltas.append(f"{eixo}/{cid}/{postura}")
                continue
            saida[eixo]["posturas"][cid]={"postura":postura,"pagina":best[1],"texto":best[2]}
json.dump(saida, open(sys.argv[2],"w",encoding="utf-8"), ensure_ascii=False, indent=1)
for eixo,S in saida.items():
    print(f"\n{'='*98}\n### {eixo} · peso {S.get('peso')} · {S.get('label')}")
    nf=sum(1 for p in S["posturas"].values() if p["postura"]=="favor")
    nc=len(S["posturas"])-nf
    print(f"    {nf} favor × {nc} contra → separações {nf*nc} · ganho {nf*nc*S.get('peso',1)}")
    for cid,p in sorted(S["posturas"].items()):
        print(f"  [{p['postura'][:3].upper()}] {cid} p.{p['pagina']}: {p['texto'][:230]}")
if faltas: print(f"\n!!! SEM CITAÇÃO ({len(faltas)}): " + ", ".join(faltas))
