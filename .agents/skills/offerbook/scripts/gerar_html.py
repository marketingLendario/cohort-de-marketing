#!/usr/bin/env python3
"""
gerar_html.py — Gera HTML visual do offerbook a partir do MD, com TOC sticky lateral.

Le offerbook-{slug}.md, parsa as secoes (H1/H2/H3), e gera offerbook-{slug}.html
usando templates/offerbook.html com:
- TOC sticky lateral (acompanha scroll, destaca secao ativa)
- Conteudo principal com formatacao Markdown -> HTML
- Responsivo (mobile collapsa TOC)
- Brand neutro padrao (ou DESIGN.md se .cohort-brand-choice = design-md)

Uso:
    python gerar_html.py offerbook-cohort-marketing.md
    python gerar_html.py offerbook-cohort-marketing.md --output meu.html
    python gerar_html.py offerbook-cohort-marketing.md --template /path/offerbook.html

Dependencia minima: python3 (sem libs externas - parsa markdown manualmente).
Opcionalmente usa python-markdown se instalado (melhor qualidade).
"""

import argparse
import html
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path


def encontrar_template(template_arg=None):
    if template_arg:
        p = Path(template_arg).expanduser().resolve()
        if p.exists():
            return p
        print(f"ERRO: template informado nao existe: {p}")
        sys.exit(1)

    script_dir = Path(__file__).resolve().parent
    candidatos = [
        script_dir.parent / "templates" / "offerbook.html",
        script_dir / "offerbook.html",
        Path.home() / ".claude/skills/offerbook/templates/offerbook.html",
    ]
    for c in candidatos:
        if c.exists():
            return c
    print("ERRO: offerbook.html nao encontrado nos caminhos:")
    for c in candidatos:
        print(f"  - {c}")
    print("\nPasse o caminho com --template /seu/caminho/offerbook.html")
    sys.exit(1)


def slugify(texto):
    """Converte 'Bloco 1 — Materiais' em 'bloco-1-materiais' (id de ancora)."""
    import unicodedata
    nfkd = unicodedata.normalize("NFKD", texto)
    sem_acento = "".join(c for c in nfkd if not unicodedata.combining(c))
    slug = re.sub(r"[^\w\s-]", "", sem_acento.lower())
    slug = re.sub(r"[\s_-]+", "-", slug).strip("-")
    return slug or "secao"


def parse_inline(texto):
    """Converte markdown inline (negrito, italico, codigo, link) em HTML."""
    # Escapar HTML primeiro pra nao quebrar tags do usuario
    # mas preservar nossas substituicoes depois
    texto = html.escape(texto, quote=False)

    # Codigo inline: `texto`
    texto = re.sub(r"`([^`]+?)`", r"<code>\1</code>", texto)
    # Negrito: **texto** ou __texto__
    texto = re.sub(r"\*\*([^*]+?)\*\*", r"<strong>\1</strong>", texto)
    texto = re.sub(r"__([^_]+?)__", r"<strong>\1</strong>", texto)
    # Italico: *texto* ou _texto_  (evita **)
    texto = re.sub(r"(?<!\*)\*([^*\n]+?)\*(?!\*)", r"<em>\1</em>", texto)
    texto = re.sub(r"(?<!_)_([^_\n]+?)_(?!_)", r"<em>\1</em>", texto)
    # Link: [texto](url)
    texto = re.sub(
        r"\[([^\]]+?)\]\(([^)]+?)\)",
        r'<a href="\2">\1</a>',
        texto,
    )
    return texto


def parsear_md_simples(md_text):
    """
    Parsa markdown manualmente (sem dependencia externa).
    Devolve dict: {titulo, conteudo_html, toc_estrutura}.

    toc_estrutura = lista de blocos:
        [
          {
            'nivel': 1,  # 1=H1 (raro), 2=H2 (bloco principal)
            'titulo': 'Materiais',
            'id': 'materiais',
            'h3': [
              {'titulo': 'Links Social Media', 'id': 'links-social-media'},
              ...
            ]
          },
          ...
        ]
    """
    linhas = md_text.split("\n")
    titulo_doc = ""
    conteudo_html = []
    toc = []
    bloco_atual = None

    i = 0
    em_lista = None  # None | 'ul' | 'ol'
    em_codigo = False
    bloco_cita = False

    def fechar_lista():
        nonlocal em_lista
        if em_lista:
            conteudo_html.append(f"</{em_lista}>")
            em_lista = None

    def fechar_cita():
        nonlocal bloco_cita
        if bloco_cita:
            conteudo_html.append("</blockquote>")
            bloco_cita = False

    while i < len(linhas):
        linha = linhas[i]
        linha_lstrip = linha.lstrip()

        # CODIGO FENCED ```
        if linha_lstrip.startswith("```"):
            fechar_lista()
            fechar_cita()
            if em_codigo:
                conteudo_html.append("</code></pre>")
                em_codigo = False
            else:
                conteudo_html.append("<pre><code>")
                em_codigo = True
            i += 1
            continue

        if em_codigo:
            conteudo_html.append(html.escape(linha))
            i += 1
            continue

        # H1 (so o primeiro vira titulo do doc, o resto vira H2)
        m_h1 = re.match(r"^#\s+(.+?)$", linha)
        if m_h1:
            fechar_lista()
            fechar_cita()
            if not titulo_doc:
                titulo_doc = m_h1.group(1).strip()
            else:
                # H1 extra: trata como bloco principal
                tit = m_h1.group(1).strip()
                slug = slugify(tit)
                conteudo_html.append(f'<h2 id="{slug}">{parse_inline(tit)}</h2>')
                bloco_atual = {"nivel": 2, "titulo": tit, "id": slug, "h3": []}
                toc.append(bloco_atual)
            i += 1
            continue

        # H2 = bloco principal (Materiais, Posicionamento, Avatar, etc)
        m_h2 = re.match(r"^##\s+(.+?)$", linha)
        if m_h2:
            fechar_lista()
            fechar_cita()
            tit = m_h2.group(1).strip()
            slug = slugify(tit)
            conteudo_html.append(f'<h2 id="{slug}">{parse_inline(tit)}</h2>')
            bloco_atual = {"nivel": 2, "titulo": tit, "id": slug, "h3": []}
            toc.append(bloco_atual)
            i += 1
            continue

        # H3 = subitem
        m_h3 = re.match(r"^###\s+(.+?)$", linha)
        if m_h3:
            fechar_lista()
            fechar_cita()
            tit = m_h3.group(1).strip()
            slug = slugify(tit)
            conteudo_html.append(f'<h3 id="{slug}">{parse_inline(tit)}</h3>')
            if bloco_atual:
                bloco_atual["h3"].append({"titulo": tit, "id": slug})
            i += 1
            continue

        # H4 = subsubitem (nao entra no TOC, so virou HTML)
        m_h4 = re.match(r"^####\s+(.+?)$", linha)
        if m_h4:
            fechar_lista()
            fechar_cita()
            conteudo_html.append(f"<h4>{parse_inline(m_h4.group(1).strip())}</h4>")
            i += 1
            continue

        # HR
        if re.match(r"^---+$", linha.strip()):
            fechar_lista()
            fechar_cita()
            conteudo_html.append("<hr>")
            i += 1
            continue

        # BLOCKQUOTE >
        if linha.startswith(">"):
            fechar_lista()
            if not bloco_cita:
                conteudo_html.append("<blockquote>")
                bloco_cita = True
            conteudo = linha.lstrip("> ").rstrip()
            if conteudo:
                conteudo_html.append(f"<p>{parse_inline(conteudo)}</p>")
            i += 1
            continue
        else:
            fechar_cita()

        # LISTA - ou *
        m_ul = re.match(r"^\s*[-*]\s+(.+?)$", linha)
        if m_ul:
            if em_lista != "ul":
                fechar_lista()
                conteudo_html.append("<ul>")
                em_lista = "ul"
            conteudo_html.append(f"<li>{parse_inline(m_ul.group(1).strip())}</li>")
            i += 1
            continue

        # LISTA NUMERADA 1.
        m_ol = re.match(r"^\s*\d+\.\s+(.+?)$", linha)
        if m_ol:
            if em_lista != "ol":
                fechar_lista()
                conteudo_html.append("<ol>")
                em_lista = "ol"
            conteudo_html.append(f"<li>{parse_inline(m_ol.group(1).strip())}</li>")
            i += 1
            continue

        # TABELA (linha com |)
        if "|" in linha and (i + 1 < len(linhas)) and re.match(r"^[\s|:\-]+$", linhas[i+1]):
            fechar_lista()
            # Parsa cabecalho
            header_cells = [c.strip() for c in linha.strip("|").split("|")]
            conteudo_html.append("<table><thead><tr>")
            for cell in header_cells:
                conteudo_html.append(f"<th>{parse_inline(cell)}</th>")
            conteudo_html.append("</tr></thead><tbody>")
            i += 2  # pula header e separador
            while i < len(linhas) and "|" in linhas[i] and linhas[i].strip():
                row_cells = [c.strip() for c in linhas[i].strip("|").split("|")]
                conteudo_html.append("<tr>")
                for cell in row_cells:
                    conteudo_html.append(f"<td>{parse_inline(cell)}</td>")
                conteudo_html.append("</tr>")
                i += 1
            conteudo_html.append("</tbody></table>")
            continue

        # LINHA EM BRANCO
        if not linha.strip():
            fechar_lista()
            i += 1
            continue

        # PARAGRAFO NORMAL
        fechar_lista()
        # Junta linhas consecutivas de paragrafo
        paragrafo = [linha]
        j = i + 1
        while j < len(linhas) and linhas[j].strip() and not re.match(
            r"^(#{1,6}\s|>|\s*[-*]\s|\s*\d+\.\s|```|---)", linhas[j]
        ):
            paragrafo.append(linhas[j])
            j += 1
        texto_para = " ".join(p.strip() for p in paragrafo)
        conteudo_html.append(f"<p>{parse_inline(texto_para)}</p>")
        i = j
        continue

    fechar_lista()
    fechar_cita()
    if em_codigo:
        conteudo_html.append("</code></pre>")

    return {
        "titulo": titulo_doc,
        "conteudo_html": "\n".join(conteudo_html),
        "toc_estrutura": toc,
    }


def gerar_toc_html(toc_estrutura):
    """
    Gera o HTML do TOC sticky lateral.

    Agrupa por nivel 2 (blocos principais).
    Se ha mais de 4 blocos, agrupa em sub-labels "Bloco 1", "Bloco 2"...
    """
    if not toc_estrutura:
        return "<p>(sem secoes)</p>"

    html_partes = ['<ul>']

    for idx, bloco in enumerate(toc_estrutura, start=1):
        # Detecta se titulo ja comeca com "Bloco N" ou similar
        tit = bloco["titulo"]
        # Label opcional (se aluno quiser agrupar)
        # Por padrao so lista linear

        html_partes.append(f'<li><a href="#{bloco["id"]}">{html.escape(tit)}</a>')

        if bloco.get("h3"):
            html_partes.append("<ul>")
            for sub in bloco["h3"]:
                html_partes.append(
                    f'<li><a href="#{sub["id"]}">{html.escape(sub["titulo"])}</a></li>'
                )
            html_partes.append("</ul>")

        html_partes.append("</li>")

    html_partes.append("</ul>")
    return "\n".join(html_partes)


def detectar_brand_choice(cwd):
    """Le .cohort-brand-choice do cwd. Devolve 'neutro' (default) ou 'design-md'."""
    arquivo = cwd / ".cohort-brand-choice"
    if arquivo.exists():
        escolha = arquivo.read_text(encoding="utf-8").strip()
        if escolha in ("neutro", "design-md"):
            return escolha
    return "neutro"


def aplicar_design_md(template_html, cwd):
    """
    Se brand-choice = design-md, le DESIGN.md e substitui tokens CSS no template.
    Por enquanto e um passthrough simples (extracao avancada de tokens fica para depois).
    """
    design_path = cwd / "DESIGN.md"
    if not design_path.exists():
        return template_html

    # Implementacao basica: procura por hex colors no DESIGN.md
    design_text = design_path.read_text(encoding="utf-8")
    cores_hex = re.findall(r"#[0-9A-Fa-f]{6}", design_text)
    if cores_hex:
        # Substitui --primary pela primeira cor encontrada (heuristica)
        primary = cores_hex[0]
        template_html = re.sub(
            r"(--primary:\s*)#[0-9A-Fa-f]{6};",
            f"\\1{primary};",
            template_html,
            count=1,
        )

    return template_html


def main():
    parser = argparse.ArgumentParser(
        description="Gera HTML visual do offerbook a partir do MD (com TOC sticky lateral)."
    )
    parser.add_argument("md_file", help="Arquivo MD do offerbook")
    parser.add_argument("--output", help="Caminho do HTML de saida (default: mesmo nome com .html)")
    parser.add_argument("--template", help="Caminho do template offerbook.html")
    args = parser.parse_args()

    md_path = Path(args.md_file).expanduser().resolve()
    output_path = (
        Path(args.output).expanduser().resolve()
        if args.output
        else md_path.with_suffix(".html")
    )

    if not md_path.exists():
        print(f"ERRO: arquivo MD nao encontrado: {md_path}")
        sys.exit(1)

    print(f"MD: {md_path}")
    print(f"Output: {output_path}")

    template_path = encontrar_template(args.template)
    print(f"Template: {template_path}")

    cwd = Path.cwd()
    brand = detectar_brand_choice(cwd)
    print(f"Brand: {brand}\n")

    md_text = md_path.read_text(encoding="utf-8")
    parsed = parsear_md_simples(md_text)

    titulo = parsed["titulo"] or md_path.stem
    # Tira "Offerbook —" do titulo se houver
    titulo_curto = re.sub(r"^offerbook\s*[-–—]\s*", "", titulo, flags=re.IGNORECASE)

    toc_html = gerar_toc_html(parsed["toc_estrutura"])
    print(f"Titulo: {titulo}")
    print(f"Secoes encontradas: {len(parsed['toc_estrutura'])}")

    # Carrega template e substitui
    template_html = template_path.read_text(encoding="utf-8")

    # Aplica brand
    if brand == "design-md":
        template_html = aplicar_design_md(template_html, cwd)

    # Marca: vazio se neutro, ou nome do design-md
    marca = ""
    if brand == "design-md":
        design = cwd / "DESIGN.md"
        if design.exists():
            primeiro_titulo = re.search(r"^#\s+(.+?)$", design.read_text(encoding="utf-8"), re.MULTILINE)
            if primeiro_titulo:
                marca = primeiro_titulo.group(1).strip()

    data_str = datetime.now().strftime("%d de %B de %Y")
    # Tradução de meses para português
    meses_pt = {
        "January": "janeiro", "February": "fevereiro", "March": "março",
        "April": "abril", "May": "maio", "June": "junho",
        "July": "julho", "August": "agosto", "September": "setembro",
        "October": "outubro", "November": "novembro", "December": "dezembro",
    }
    for en, pt in meses_pt.items():
        data_str = data_str.replace(en, pt)

    final = template_html.replace("{{TITULO}}", html.escape(titulo))
    final = final.replace("{{TITULO_CURTO}}", html.escape(titulo_curto))
    final = final.replace("{{META}}", html.escape(f"{len(parsed['toc_estrutura'])} seções · gerado em {data_str}"))
    final = final.replace("{{TOC}}", toc_html)
    final = final.replace("{{CONTEUDO}}", parsed["conteudo_html"])
    final = final.replace("{{MARCA}}", html.escape(marca))
    final = final.replace("{{DATA}}", html.escape(data_str))

    output_path.write_text(final, encoding="utf-8")

    print(f"\n✅ HTML gerado: {output_path}")
    print(f"\nAbra com: open '{output_path}'")


if __name__ == "__main__":
    main()
