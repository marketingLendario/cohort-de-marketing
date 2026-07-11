#!/usr/bin/env python3
"""
coletor_web.py — Coletor genérico multi-fonte da presença pública.

Complementa o meta_ad_library.py. Enquanto aquele cobre os anúncios pagos
da Meta, este monta as URLs públicas e os roteiros de coleta das demais
fontes que o Espião do Concorrente varre:

- google-ads : Google Ads Transparency Center (anúncios Search/Display/YouTube)
- tiktok-ads : TikTok Ads Library / Creative Center
- social     : perfil orgânico (Instagram, YouTube, TikTok, LinkedIn)
- site       : site, landing page, blog, página de oferta
- reputacao  : busca no Google, reviews, Reclame Aqui, menções

Filosofia (igual ao meta_ad_library.py): degrada graciosamente. Sem
dependências externas. O script NÃO raspa páginas sozinho. Ele monta a URL
pública certa de cada fonte e devolve o roteiro de coleta.

No modo rede, quem vai atrás do conteúdo é o agente, com as ferramentas
do Claude (WebSearch e WebFetch) usando as URLs que este script imprime.
No modo offline, o usuário abre as URLs, copia e cola o material.

Uso:
    python coletor_web.py google-ads "Nome do Concorrente"
    python coletor_web.py tiktok-ads "Nome do Concorrente"
    python coletor_web.py social "@perfil" --rede instagram
    python coletor_web.py site "https://concorrente.com"
    python coletor_web.py reputacao "Nome do Concorrente"
    python coletor_web.py todas "Nome do Concorrente"   # imprime tudo de uma vez
"""

import argparse
import sys
import urllib.parse


def q(termo: str) -> str:
    return urllib.parse.quote_plus(termo)


def url_google_ads(termo: str) -> str:
    # Centro de Transparência de Anúncios do Google (anunciante público).
    return f"https://adstransparency.google.com/?region=BR&query={q(termo)}"


def url_tiktok_ads(termo: str) -> str:
    # Biblioteca de anúncios / Creative Center do TikTok.
    return f"https://library.tiktok.com/ads?region=BR&query={q(termo)}"


def urls_social(alvo: str, rede: str) -> dict:
    alvo_limpo = alvo.lstrip("@").strip()
    redes = {
        "instagram": f"https://www.instagram.com/{alvo_limpo}/",
        "youtube": f"https://www.youtube.com/results?search_query={q(alvo)}",
        "tiktok": f"https://www.tiktok.com/@{alvo_limpo}",
        "linkedin": f"https://www.linkedin.com/search/results/companies/?keywords={q(alvo)}",
    }
    if rede == "todas":
        return redes
    if rede in redes:
        return {rede: redes[rede]}
    return redes


def urls_reputacao(termo: str) -> dict:
    return {
        "google": f"https://www.google.com/search?q={q(termo)}",
        "reviews": f"https://www.google.com/search?q={q(termo + ' reviews opinião')}",
        "reclame_aqui": f"https://www.google.com/search?q={q(termo + ' reclame aqui')}",
        "mencoes": f"https://www.google.com/search?q={q(termo + ' depoimento alunos resultado')}",
    }


def bloco(titulo: str):
    print("=" * 64)
    print(titulo)
    print("=" * 64)


def roteiro_google_ads(termo: str):
    bloco("ANÚNCIOS PAGOS — GOOGLE ADS TRANSPARENCY (público)")
    print("\n1. Abra (não precisa login):\n")
    print(f"   {url_google_ads(termo)}\n")
    print("2. Identifique o anunciante e abra os anúncios ativos.")
    print("3. Copie título, descrição e o link de destino de cada anúncio.")
    print("4. No modo rede, o agente pode usar WebFetch nessa URL.\n")


def roteiro_tiktok_ads(termo: str):
    bloco("ANÚNCIOS PAGOS — TIKTOK ADS LIBRARY (público)")
    print("\n1. Abra (não precisa login):\n")
    print(f"   {url_tiktok_ads(termo)}\n")
    print("2. Filtre por Brasil e pelo anunciante.")
    print("3. Anote hook, formato e CTA de cada anúncio.\n")


def roteiro_social(alvo: str, rede: str):
    bloco("ORGÂNICO / SOCIAL (perfil público)")
    print()
    for nome, url in urls_social(alvo, rede).items():
        print(f"   [{nome}] {url}")
    print("\nColete: bio, formato dominante, tom, títulos de vídeo (YouTube),")
    print("e a primeira linha dos posts/Reels (são os hooks dele).")
    print("No modo rede, o agente usa WebFetch em cada URL.\n")


def roteiro_site(url_site: str):
    bloco("PROPRIEDADES PRÓPRIAS (site, landing, blog, oferta)")
    print(f"\n   {url_site}\n")
    print("Colete: headline do site, proposta de valor, estrutura da landing,")
    print("temas do blog, e na página de checkout o preço, garantia, escassez")
    print("e bônus. No modo rede, use WebFetch na URL e nas páginas internas.\n")


def roteiro_reputacao(termo: str):
    bloco("REPUTAÇÃO E MENÇÕES (o que dizem dele)")
    print()
    for nome, url in urls_reputacao(termo).items():
        print(f"   [{nome}] {url}")
    print("\nNo modo rede, o agente usa WebSearch nessas buscas. Reclamação")
    print("recorrente no Reclame Aqui é a promessa que ele não cumpre: brecha.\n")


def main():
    parser = argparse.ArgumentParser(
        description="Coletor genérico multi-fonte da presença pública."
    )
    parser.add_argument(
        "fonte",
        choices=["google-ads", "tiktok-ads", "social", "site", "reputacao", "todas"],
        help="Qual fonte coletar.",
    )
    parser.add_argument("alvo", help="Nome, @ ou URL do concorrente.")
    parser.add_argument(
        "--rede",
        default="todas",
        choices=["instagram", "youtube", "tiktok", "linkedin", "todas"],
        help="Para fonte=social: qual rede (default todas).",
    )
    args = parser.parse_args()

    if args.fonte == "google-ads":
        roteiro_google_ads(args.alvo)
    elif args.fonte == "tiktok-ads":
        roteiro_tiktok_ads(args.alvo)
    elif args.fonte == "social":
        roteiro_social(args.alvo, args.rede)
    elif args.fonte == "site":
        roteiro_site(args.alvo)
    elif args.fonte == "reputacao":
        roteiro_reputacao(args.alvo)
    elif args.fonte == "todas":
        roteiro_google_ads(args.alvo)
        roteiro_tiktok_ads(args.alvo)
        roteiro_social(args.alvo, "todas")
        roteiro_site(args.alvo)
        roteiro_reputacao(args.alvo)
        print("Lembrete: os anúncios da Meta saem pelo meta_ad_library.py.\n")


if __name__ == "__main__":
    main()
