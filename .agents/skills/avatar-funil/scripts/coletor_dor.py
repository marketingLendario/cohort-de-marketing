#!/usr/bin/env python3
"""
coletor_dor.py — Coletor das fontes públicas onde a dor do cliente vive.

A pesquisa de dor segue o protocolo de triangulação: uma fonte mente, duas
sugerem, três confirmam. Por isso este coletor cobre três frentes:

- reviews     : dor de quem já comprou (Reclame Aqui, Google, Capterra, B2B Stack, lojas de app)
- comunidades : dor discutida entre pares, sem produto (Facebook, Reddit, Discord)
- redes       : dor dita em voz alta (Twitter/X, LinkedIn, TikTok, YouTube, Instagram)

Filosofia (igual ao molde do Espião do Concorrente): degrada graciosamente.
Sem dependências externas. O script NÃO raspa páginas sozinho. Ele monta a
URL pública certa de cada fonte e devolve o roteiro de coleta.

No modo rede, quem vai atrás do conteúdo é o agente, com WebSearch e WebFetch
usando as URLs que este script imprime. No modo offline, o usuário abre as
URLs, copia os trechos e cola de volta no chat. A análise é a mesma.

Uso:
    python coletor_dor.py reviews "escritórios de contabilidade"
    python coletor_dor.py comunidades "clínicas odontológicas"
    python coletor_dor.py redes "agências de marketing"
    python coletor_dor.py todas "NICHO OU PRODUTO"   # imprime tudo de uma vez

Lembre-se de capturar a frase LITERAL do cliente (verbatim), sem reescrever.
"""

import argparse
import urllib.parse


def q(termo: str) -> str:
    return urllib.parse.quote_plus(termo)


def urls_reviews(nicho: str) -> dict:
    return {
        "reclame_aqui": f"https://www.google.com/search?q={q(nicho + ' reclame aqui')}",
        "google_reviews": f"https://www.google.com/search?q={q(nicho + ' avaliações problema reclamação')}",
        "capterra": f"https://www.google.com/search?q={q('site:capterra.com.br ' + nicho)}",
        "b2b_stack": f"https://www.google.com/search?q={q('site:b2bstack.com.br ' + nicho)}",
        "apps": f"https://www.google.com/search?q={q(nicho + ' app review 1 estrela problema')}",
    }


def urls_comunidades(nicho: str) -> dict:
    return {
        "facebook_grupos": f"https://www.google.com/search?q={q('grupo facebook ' + nicho + ' problema desabafo')}",
        "reddit": f"https://www.google.com/search?q={q('site:reddit.com ' + nicho + ' problema')}",
        "discord_foruns": f"https://www.google.com/search?q={q(nicho + ' forum discord comunidade reclama')}",
    }


def urls_redes(nicho: str) -> dict:
    alvo = q(nicho)
    return {
        "twitter_x": f"https://www.google.com/search?q={q('site:twitter.com ' + nicho + ' problema cansei')}",
        "linkedin": f"https://www.google.com/search?q={q('site:linkedin.com/posts ' + nicho + ' desafio dor')}",
        "tiktok": f"https://www.google.com/search?q={q('tiktok ' + nicho + ' problema desabafo')}",
        "youtube_comentarios": f"https://www.youtube.com/results?search_query={alvo}",
    }


def bloco(titulo: str):
    print("=" * 64)
    print(titulo)
    print("=" * 64)


def roteiro_reviews(nicho: str):
    bloco("REVIEWS — dor de quem já comprou (público)")
    print()
    for nome, url in urls_reviews(nicho).items():
        print(f"   [{nome}] {url}")
    print("\nColete: a reclamação recorrente é a promessa que o mercado não cumpre.")
    print("Capture a frase literal (verbatim), o custo citado (R$ ou horas) e a fonte.")
    print("No modo rede, use WebSearch/WebFetch nessas URLs.\n")


def roteiro_comunidades(nicho: str):
    bloco("COMUNIDADES — dor discutida entre pares (público)")
    print()
    for nome, url in urls_comunidades(nicho).items():
        print(f"   [{nome}] {url}")
    print("\nAqui mora o vácuo: o que aparece em comunidade mas NÃO em review é")
    print("dor sem solução comprável. Capture verbatim e a fonte de cada trecho.\n")


def roteiro_redes(nicho: str):
    bloco("REDES SOCIAIS — dor dita em voz alta (público)")
    print()
    for nome, url in urls_redes(nicho).items():
        print(f"   [{nome}] {url}")
    print("\nProcure desabafo, pergunta repetida, reclamação pública.")
    print("Capture a frase literal, sem corrigir nem suavizar.\n")


def rodape():
    print("Lembrete de método: triangule. Uma fonte mente, duas sugerem, três")
    print("confirmam. Mínimo 20 trechos de pelo menos 2 fontes para afirmar padrão.")
    print("A frase do cliente entra como ele escreveu. Verbatim é a matéria-prima.\n")


def main():
    parser = argparse.ArgumentParser(
        description="Coletor das fontes públicas onde a dor do cliente vive."
    )
    parser.add_argument(
        "fonte",
        choices=["reviews", "comunidades", "redes", "todas"],
        help="Qual frente coletar.",
    )
    parser.add_argument("nicho", help="Nicho, produto ou público a pesquisar.")
    args = parser.parse_args()

    if args.fonte == "reviews":
        roteiro_reviews(args.nicho)
    elif args.fonte == "comunidades":
        roteiro_comunidades(args.nicho)
    elif args.fonte == "redes":
        roteiro_redes(args.nicho)
    elif args.fonte == "todas":
        roteiro_reviews(args.nicho)
        roteiro_comunidades(args.nicho)
        roteiro_redes(args.nicho)

    rodape()


if __name__ == "__main__":
    main()
