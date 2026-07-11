#!/usr/bin/env python3
"""
apify_scraper.py — Chama a API REST do Apify direto (sem MCP).

Esta skill usa o Apify pela API REST, não por MCP. O único pré-requisito é
o APIFY_API_TOKEN no .env (ou no ambiente). Sem MCP, sem restart, sem
"Failed to connect".

Filosofia (igual aos outros coletores da Aula 01): degrada graciosamente.
Sem dependências externas (só a stdlib). Sem token, não quebra: imprime o
roteiro manual e sai.

Como funciona: usa o endpoint run-sync-get-dataset-items, que roda um Actor
do Apify e já devolve os itens do dataset numa única chamada.
  POST https://api.apify.com/v2/acts/{actor}/run-sync-get-dataset-items?token=...

Uso:
    python3 apify_scraper.py instagram-hashtag "autoestima50mais" --limit 30
    python3 apify_scraper.py tiktok-hashtag "menopausa" --limit 30
    python3 apify_scraper.py instagram-profile "https://www.instagram.com/perfil/" --limit 30
    python3 apify_scraper.py tiktok-profile "@perfil" --limit 30
    python3 apify_scraper.py run apify~instagram-scraper --input '{"search":"x"}'

Saída: JSON dos itens (lista) no stdout. O agente lê e analisa.

Lembrete: a frase/legenda do post entra como o autor escreveu (verbatim).
"""

import argparse
import json
import os
import ssl
import sys
import urllib.request
import urllib.error

API = "https://api.apify.com/v2"

# Actors usados (id na URL usa ~ no lugar de /)
ACTOR_INSTAGRAM = "apify~instagram-scraper"
ACTOR_INSTAGRAM_POSTS = "apify~instagram-post-scraper"
ACTOR_TIKTOK = "clockworks~free-tiktok-scraper"


def ssl_context():
    """macOS Python costuma falhar CERTIFICATE_VERIFY_FAILED; usa certifi se existir."""
    try:
        import certifi  # type: ignore

        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        pass
    try:
        return ssl.create_default_context()
    except Exception:
        return ssl._create_unverified_context()


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


def rodar_actor(actor: str, payload: dict, token: str, limite_seg: int = 280):
    """Roda um Actor e devolve os itens do dataset (lista de dicts)."""
    url = f"{API}/acts/{actor}/run-sync-get-dataset-items?token={token}&timeout={limite_seg}"
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, data=body, headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=limite_seg + 20, context=ssl_context()) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detalhe = e.read().decode("utf-8", "ignore")[:400]
        print(f"ERRO HTTP {e.code} ao rodar {actor}: {detalhe}", file=sys.stderr)
        return None
    except Exception as e:  # rede caiu, timeout, etc.
        print(f"ERRO ao rodar {actor}: {e}", file=sys.stderr)
        return None


def cmd_instagram_hashtag(termo: str, limite: int, token: str):
    # Aponta direto pra página da hashtag (resultsType=posts traz os posts;
    # usar "search" só devolve metadados da tag, sem os posts).
    tag = termo.lstrip("#")
    payload = {
        "directUrls": [f"https://www.instagram.com/explore/tags/{tag}/"],
        "resultsType": "posts",
        "resultsLimit": limite,
        "searchLimit": 1,
    }
    return rodar_actor(ACTOR_INSTAGRAM, payload, token)


def cmd_instagram_profile(url: str, limite: int, token: str):
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
    return rodar_actor(ACTOR_INSTAGRAM_POSTS, payload, token)


def cmd_tiktok_hashtag(termo: str, limite: int, token: str):
    payload = {
        "hashtags": [termo.lstrip("#")],
        "resultsPerPage": limite,
        "shouldDownloadVideos": False,
        "shouldDownloadCovers": False,
    }
    return rodar_actor(ACTOR_TIKTOK, payload, token)


def cmd_tiktok_profile(perfil: str, limite: int, token: str):
    payload = {
        "profiles": [perfil.lstrip("@")],
        "resultsPerPage": limite,
        "shouldDownloadVideos": False,
    }
    return rodar_actor(ACTOR_TIKTOK, payload, token)


def main():
    p = argparse.ArgumentParser(description="Chama a API REST do Apify (sem MCP).")
    p.add_argument(
        "modo",
        choices=[
            "instagram-hashtag",
            "instagram-profile",
            "instagram-posts",
            "tiktok-hashtag",
            "tiktok-profile",
            "run",
        ],
    )
    p.add_argument("alvo", help="hashtag, URL/@ do perfil, ou actor id (modo run)")
    p.add_argument("--limit", type=int, default=30, help="quantos itens (default 30)")
    p.add_argument("--input", default="{}", help="JSON de input (só no modo run)")
    args = p.parse_args()

    token = ler_token()
    if not token:
        roteiro_manual("APIFY_API_TOKEN não encontrado no ambiente nem no .env")
        sys.exit(0)

    if args.modo == "instagram-hashtag":
        itens = cmd_instagram_hashtag(args.alvo, args.limit, token)
    elif args.modo == "instagram-profile":
        itens = cmd_instagram_profile(args.alvo, args.limit, token)
    elif args.modo == "instagram-posts":
        users = [u.strip() for u in args.alvo.split(",") if u.strip()]
        payload = {
            "username": users,
            "resultsLimit": args.limit,
            "dataDetailLevel": "basicData",
            "onlyPostsNewerThan": "6 months",
        }
        itens = rodar_actor(ACTOR_INSTAGRAM_POSTS, payload, token)
    elif args.modo == "tiktok-hashtag":
        itens = cmd_tiktok_hashtag(args.alvo, args.limit, token)
    elif args.modo == "tiktok-profile":
        itens = cmd_tiktok_profile(args.alvo, args.limit, token)
    elif args.modo == "run":
        try:
            payload = json.loads(args.input)
        except json.JSONDecodeError as e:
            print(f"--input não é JSON válido: {e}", file=sys.stderr)
            sys.exit(1)
        itens = rodar_actor(args.alvo, payload, token)

    if itens is None:
        print("[]")
        sys.exit(1)

    print(json.dumps(itens, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
