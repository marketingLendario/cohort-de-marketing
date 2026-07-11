#!/usr/bin/env python3
"""
meta_ad_library.py — Coletor de anúncios públicos da Meta Ad Library.

A Meta Ad Library (https://www.facebook.com/ads/library) é pública por lei:
qualquer pessoa pode ver os anúncios ativos de qualquer página, sem login.

Este script faz duas coisas, em ordem de preferência:

1. Se houver um token de acesso da Graph API em META_AD_LIBRARY_TOKEN,
   consulta o endpoint oficial /ads_archive e devolve os anúncios em texto.
   (Token gratuito: https://www.facebook.com/ads/library/api/ — exige conta
   Meta verificada. Só necessário para puxada automática.)

2. Se não houver token (caso comum), o script NÃO falha: ele monta a URL
   pública da Ad Library para o termo buscado e instrui o usuário a abrir,
   copiar os textos dos anúncios e colar de volta no chat (modo offline).
   A skill analisa o material colado com o mesmo motor.

Esta é a fonte de anúncios pagos da Meta. Para Google Ads, TikTok Ads,
social orgânico e site, use o coletor genérico em coletor_web.py.

Uso:
    python meta_ad_library.py "Nome do Concorrente" --pais BR
    python meta_ad_library.py "@perfil" --pais BR --limite 25

Degrada graciosamente: sem rede, sem token e sem dependências externas,
ainda entrega a URL pública e o roteiro de coleta manual.
"""

import argparse
import json
import os
import sys
import urllib.parse
import urllib.request


AD_LIBRARY_WEB = "https://www.facebook.com/ads/library/"
GRAPH_API = "https://graph.facebook.com/v21.0/ads_archive"


def montar_url_publica(termo: str, pais: str) -> str:
    """URL da Ad Library web que qualquer um abre no navegador, sem login."""
    params = {
        "active_status": "active",
        "ad_type": "all",
        "country": pais,
        "q": termo,
        "search_type": "keyword_unordered",
        "media_type": "all",
    }
    return AD_LIBRARY_WEB + "?" + urllib.parse.urlencode(params)


def tentar_api(termo: str, pais: str, limite: int, token: str):
    """Tenta a Graph API oficial. Retorna lista de anúncios ou None se falhar."""
    params = {
        "access_token": token,
        "search_terms": termo,
        "ad_reached_countries": json.dumps([pais]),
        "ad_active_status": "ACTIVE",
        "fields": "ad_creative_bodies,ad_creative_link_titles,"
        "ad_creative_link_descriptions,page_name,ad_delivery_start_time",
        "limit": str(limite),
    }
    url = GRAPH_API + "?" + urllib.parse.urlencode(params)
    try:
        with urllib.request.urlopen(url, timeout=20) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        return data.get("data", [])
    except Exception as e:  # rede caiu, token inválido, rate limit, etc.
        print(f"[aviso] API indisponível ({e}). Caindo para modo manual.\n",
              file=sys.stderr)
        return None


def imprimir_anuncios(anuncios: list):
    if not anuncios:
        print("Nenhum anúncio ativo retornado pela API para esse termo.")
        print("Tente o modo manual (URL pública abaixo) ou outro termo.\n")
        return
    print(f"== {len(anuncios)} anúncios ativos encontrados ==\n")
    for i, ad in enumerate(anuncios, 1):
        pagina = ad.get("page_name", "(página não informada)")
        inicio = ad.get("ad_delivery_start_time", "")
        corpos = ad.get("ad_creative_bodies", []) or []
        titulos = ad.get("ad_creative_link_titles", []) or []
        print(f"--- Anúncio {i} | {pagina} | início: {inicio} ---")
        for c in corpos:
            print(c.strip())
        for t in titulos:
            print(f"[título do link] {t.strip()}")
        print()


def roteiro_manual(termo: str, url: str):
    print("=" * 64)
    print("MODO MANUAL (sem token de API — funciona pra qualquer pessoa)")
    print("=" * 64)
    print("\n1. Abra esta URL no navegador (é pública, não precisa login):\n")
    print(f"   {url}\n")
    print("2. Copie o TEXTO dos anúncios que aparecerem (quanto mais, melhor).")
    print("3. Cole os textos de volta aqui no chat.")
    print("4. A skill analisa o que você colar e monta o dossiê.\n")
    print(f"Alvo buscado: {termo}\n")


def main():
    parser = argparse.ArgumentParser(
        description="Coletor da Meta Ad Library (pública)."
    )
    parser.add_argument("termo", help="Nome, @ ou termo do concorrente.")
    parser.add_argument("--pais", default="BR", help="Código do país (default BR).")
    parser.add_argument("--limite", type=int, default=25, help="Máx. anúncios via API.")
    args = parser.parse_args()

    termo = args.termo.lstrip("@").strip()
    url = montar_url_publica(termo, args.pais)
    token = os.environ.get("META_AD_LIBRARY_TOKEN", "").strip()

    if token:
        anuncios = tentar_api(termo, args.pais, args.limite, token)
        if anuncios is not None:
            imprimir_anuncios(anuncios)
            print(f"URL pública (conferência visual): {url}\n")
            return

    # Sem token ou API falhou: degrada para o modo manual.
    roteiro_manual(termo, url)


if __name__ == "__main__":
    main()
