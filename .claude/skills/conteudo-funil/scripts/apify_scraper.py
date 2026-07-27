#!/usr/bin/env python3
"""
apify_scraper.py - Chama a API REST do Apify direto (sem MCP).

Esta skill usa o Apify pela API REST, não por MCP. O único pré-requisito é
o APIFY_API_TOKEN no .env (ou no ambiente). Sem MCP, sem restart, sem
"Failed to connect".

Filosofia (igual aos outros coletores da Aula 01): degrada graciosamente.
Sem dependências externas (só a stdlib). Sem token, não quebra: imprime o
roteiro manual e sai.

Como funciona: usa o endpoint run-sync-get-dataset-items, que roda um Actor
do Apify e já devolve os itens do dataset numa única chamada.
  POST https://api.apify.com/v2/actors/{actor}/run-sync-get-dataset-items

O token segue no header Authorization. Use --max-total-charge-usd para
limitar o custo total da execução.

Uso:
    python3 apify_scraper.py instagram-hashtag "autoestima50mais" --limit 30
    python3 apify_scraper.py tiktok-hashtag "menopausa" --limit 30
    python3 apify_scraper.py instagram-profile "https://www.instagram.com/perfil/" --limit 30
    python3 apify_scraper.py tiktok-profile "@perfil" --limit 30
    python3 apify_scraper.py x-tweets "marketing digital lang:pt" --x-mode search --limit 30
    python3 apify_scraper.py x-followers "@perfil" --relation followers --limit 30
    python3 apify_scraper.py run apify~instagram-scraper --input '{"search":"x"}'

Saída: JSON dos itens (lista) no stdout. O agente lê e analisa.

Lembrete: a frase/legenda do post entra como o autor escreveu (verbatim).
"""

import argparse
import json
import os
import ssl
import sys
import urllib.error
import urllib.parse
import urllib.request
from decimal import Decimal, InvalidOperation
from typing import Optional

from apify_x import (
    ACTOR_X_FOLLOWERS,
    ACTOR_X_TWEETS,
    X_RELATIONS,
    X_TWEET_MODES,
    montar_payload_x_followers,
    montar_payload_x_tweets,
)

API = "https://api.apify.com/v2"
RUN_TIMEOUT_SECONDS = 280

# Actors usados (id na URL usa ~ no lugar de /)
ACTOR_INSTAGRAM = "apify~instagram-scraper"
ACTOR_INSTAGRAM_POSTS = "apify~instagram-post-scraper"
ACTOR_TIKTOK = "clockworks~free-tiktok-scraper"


def inteiro_positivo(valor: str) -> int:
    """Converte um argumento em inteiro estritamente positivo."""
    try:
        numero = int(valor)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("use um número inteiro") from exc
    if numero <= 0:
        raise argparse.ArgumentTypeError("use um número maior que zero")
    return numero


def decimal_positivo(valor: str) -> Decimal:
    """Converte um argumento em limite monetário estritamente positivo."""
    try:
        numero = Decimal(valor)
    except InvalidOperation as exc:
        raise argparse.ArgumentTypeError("use um valor decimal") from exc
    if not numero.is_finite() or numero <= 0:
        raise argparse.ArgumentTypeError("use um valor maior que zero")
    return numero


def ssl_context():
    """Usa certifi quando disponível e sempre mantém a validação TLS."""
    try:
        import certifi  # type: ignore

        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()


def ler_token() -> str:
    # aceita qualquer um dos dois nomes (APIFY_API_TOKEN é o oficial do Apify;
    # APIFY_API_KEY é o que a /comecar grava em algumas versões — ambos valem)
    for nome in ("APIFY_API_TOKEN", "APIFY_API_KEY"):
        token = os.environ.get(nome, "").strip()
        if token:
            return token
    # tenta ler do .env na raiz (procura subindo até achar)
    aqui = os.getcwd()
    for _ in range(6):
        env = os.path.join(aqui, ".env")
        if os.path.isfile(env):
            with open(env, encoding="utf-8") as f:
                for linha in f:
                    for nome in ("APIFY_API_TOKEN=", "APIFY_API_KEY="):
                        if linha.strip().startswith(nome):
                            return linha.split("=", 1)[1].strip()
        pai = os.path.dirname(aqui)
        if pai == aqui:
            break
        aqui = pai
    return ""


def roteiro_manual(motivo: str):
    print("=" * 64)
    print("MODO MANUAL (sem token Apify — a skill não raspa sozinha)")
    print("=" * 64)
    print(f"\nMotivo: {motivo}\n")
    print("Configure o token uma vez:")
    print("  1. Crie a conta grátis: https://console.apify.com/sign-up")
    print("  2. Settings -> Integrations -> API tokens -> copie o Personal API token")
    print("  3. Cole no .env na raiz: APIFY_API_TOKEN=apify_api_...")
    print("\nDepois rode este script de novo. Sem token, colete manualmente")
    print("abrindo as hashtags/perfis no navegador e colando os textos no chat.\n")


def rodar_actor(
    actor: str,
    payload: dict,
    token: str,
    max_items: Optional[int] = None,
    max_total_charge_usd: Optional[Decimal] = None,
):
    """Roda um Actor e devolve os itens do dataset (lista de dicts)."""
    parametros = {"timeout": RUN_TIMEOUT_SECONDS}
    if max_items is not None:
        parametros["maxItems"] = max_items
        parametros["limit"] = max_items
    if max_total_charge_usd is not None:
        parametros["maxTotalChargeUsd"] = str(max_total_charge_usd)
    actor_seguro = urllib.parse.quote(actor, safe="~")
    query = urllib.parse.urlencode(parametros)
    url = f"{API}/actors/{actor_seguro}/run-sync-get-dataset-items?{query}"
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "Accept": "application/json",
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(
            req,
            timeout=RUN_TIMEOUT_SECONDS + 20,
            context=ssl_context(),
        ) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detalhe = e.read().decode("utf-8", "ignore")[:400]
        print(f"ERRO HTTP {e.code} ao rodar {actor}: {detalhe}", file=sys.stderr)
        return None
    except Exception as e:  # rede caiu, timeout, etc.
        print(f"ERRO ao rodar {actor}: {e}", file=sys.stderr)
        return None


def cmd_instagram_hashtag(
    termo: str,
    limite: int,
    token: str,
    max_total_charge_usd: Optional[Decimal] = None,
):
    # Aponta direto pra página da hashtag (resultsType=posts traz os posts;
    # usar "search" só devolve metadados da tag, sem os posts).
    tag = termo.lstrip("#")
    payload = {
        "directUrls": [f"https://www.instagram.com/explore/tags/{tag}/"],
        "resultsType": "posts",
        "resultsLimit": limite,
        "searchLimit": 1,
    }
    return rodar_actor(
        ACTOR_INSTAGRAM,
        payload,
        token,
        max_items=limite,
        max_total_charge_usd=max_total_charge_usd,
    )


def cmd_instagram_profile(
    url: str,
    limite: int,
    token: str,
    max_total_charge_usd: Optional[Decimal] = None,
):
    """Perfil/posts: instagram-post-scraper (username[]) — instagram-scraper retorna not_found."""
    alvo = url.strip().rstrip("/")
    if "instagram.com" in alvo:
        user = alvo.split("instagram.com/")[-1].split("/")[0].lstrip("@")
    else:
        user = alvo.lstrip("@")
    payload = {
        "username": [user],
        "resultsLimit": limite,
        "dataDetailLevel": "basicData",
        "onlyPostsNewerThan": "6 months",
    }
    return rodar_actor(
        ACTOR_INSTAGRAM_POSTS,
        payload,
        token,
        max_items=limite,
        max_total_charge_usd=max_total_charge_usd,
    )


def cmd_tiktok_hashtag(
    termo: str,
    limite: int,
    token: str,
    max_total_charge_usd: Optional[Decimal] = None,
):
    payload = {
        "hashtags": [termo.lstrip("#")],
        "resultsPerPage": limite,
        "shouldDownloadVideos": False,
        "shouldDownloadCovers": False,
    }
    return rodar_actor(
        ACTOR_TIKTOK,
        payload,
        token,
        max_items=limite,
        max_total_charge_usd=max_total_charge_usd,
    )


def cmd_tiktok_profile(
    perfil: str,
    limite: int,
    token: str,
    max_total_charge_usd: Optional[Decimal] = None,
):
    payload = {
        "profiles": [perfil.lstrip("@")],
        "resultsPerPage": limite,
        "shouldDownloadVideos": False,
    }
    return rodar_actor(
        ACTOR_TIKTOK,
        payload,
        token,
        max_items=limite,
        max_total_charge_usd=max_total_charge_usd,
    )


MODOS = (
    "instagram-hashtag",
    "instagram-profile",
    "instagram-posts",
    "tiktok-hashtag",
    "tiktok-profile",
    "x-tweets",
    "x-followers",
    "run",
)


def criar_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Chama a API REST do Apify (sem MCP).")
    parser.add_argument("modo", choices=MODOS)
    parser.add_argument("alvo", help="hashtag, URL/@ do perfil, ou actor id (modo run)")
    parser.add_argument(
        "--limit",
        type=inteiro_positivo,
        default=30,
        help="limite global de itens (default 30)",
    )
    parser.add_argument(
        "--max-total-charge-usd",
        type=decimal_positivo,
        help="teto monetário da execução no Apify",
    )
    adicionar_opcoes_x(parser)
    parser.add_argument("--input", default="{}", help="JSON de input (só no modo run)")
    return parser


def adicionar_opcoes_x(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--x-mode",
        choices=X_TWEET_MODES,
        default="search",
        help="rota do X Tweet Scraper (default search)",
    )
    parser.add_argument(
        "--relation",
        choices=X_RELATIONS,
        default="followers",
        help="relação do X Follower Scraper (default followers)",
    )
    parser.add_argument(
        "--max-items-per-target",
        type=inteiro_positivo,
        help="limite por alvo nos modos do X compatíveis",
    )
    parser.add_argument(
        "--overlap",
        action="store_true",
        help="mescla perfis repetidos entre alvos no modo x-followers",
    )


def rodar_payload(actor: str, payload: dict, args, token: str):
    return rodar_actor(
        actor,
        payload,
        token,
        max_items=args.limit,
        max_total_charge_usd=args.max_total_charge_usd,
    )


def executar_instagram_posts(args, token: str):
    users = [item.strip() for item in args.alvo.split(",") if item.strip()]
    payload = {
        "username": users,
        "resultsLimit": args.limit,
        "dataDetailLevel": "basicData",
        "onlyPostsNewerThan": "6 months",
    }
    return rodar_payload(ACTOR_INSTAGRAM_POSTS, payload, args, token)


def executar_x_tweets(args, token: str, parser: argparse.ArgumentParser):
    try:
        payload = montar_payload_x_tweets(
            args.alvo,
            args.x_mode,
            args.limit,
            args.max_items_per_target,
        )
    except ValueError as exc:
        parser.error(str(exc))
    return rodar_payload(ACTOR_X_TWEETS, payload, args, token)


def executar_x_followers(args, token: str, parser: argparse.ArgumentParser):
    try:
        payload = montar_payload_x_followers(
            args.alvo,
            args.relation,
            args.limit,
            args.max_items_per_target,
            args.overlap,
        )
    except ValueError as exc:
        parser.error(str(exc))
    return rodar_payload(ACTOR_X_FOLLOWERS, payload, args, token)


def executar_generico(args, token: str, parser: argparse.ArgumentParser):
    try:
        payload = json.loads(args.input)
    except json.JSONDecodeError as exc:
        parser.error(f"--input não é JSON válido: {exc}")
    if not isinstance(payload, dict):
        parser.error("--input precisa ser um objeto JSON")
    return rodar_payload(args.alvo, payload, args, token)


def executar_modo(args, token: str, parser: argparse.ArgumentParser):
    comandos_simples = {
        "instagram-hashtag": cmd_instagram_hashtag,
        "instagram-profile": cmd_instagram_profile,
        "tiktok-hashtag": cmd_tiktok_hashtag,
        "tiktok-profile": cmd_tiktok_profile,
    }
    if args.modo in comandos_simples:
        return comandos_simples[args.modo](
            args.alvo,
            args.limit,
            token,
            args.max_total_charge_usd,
        )
    if args.modo == "instagram-posts":
        return executar_instagram_posts(args, token)
    if args.modo == "x-tweets":
        return executar_x_tweets(args, token, parser)
    if args.modo == "x-followers":
        return executar_x_followers(args, token, parser)
    return executar_generico(args, token, parser)


def main():
    parser = criar_parser()
    args = parser.parse_args()

    token = ler_token()
    if not token:
        roteiro_manual("APIFY_API_TOKEN não encontrado no ambiente nem no .env")
        sys.exit(0)

    itens = executar_modo(args, token, parser)
    if itens is None:
        print("[]")
        sys.exit(1)
    print(json.dumps(itens, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
