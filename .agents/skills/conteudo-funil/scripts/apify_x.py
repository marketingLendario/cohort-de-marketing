"""Contratos de input dos Actors do X usados pelo coletor Apify."""

import re
from typing import Optional
from urllib.parse import urlparse

ACTOR_X_TWEETS = "xquik~x-tweet-scraper"
ACTOR_X_FOLLOWERS = "xquik~x-follower-scraper"

X_TWEET_MODES = (
    "legacy",
    "tweet",
    "tweets",
    "search",
    "profileTweets",
    "profileReplies",
    "profileMedia",
    "profileLikes",
    "listTweets",
    "article",
    "replies",
    "quotes",
    "thread",
    "retweeters",
    "favoriters",
)
X_RELATIONS = (
    "followers",
    "following",
    "verified_followers",
    "list_members",
    "list_followers",
    "community_members",
)
_X_HOSTS = {
    "mobile.twitter.com",
    "twitter.com",
    "www.twitter.com",
    "www.x.com",
    "x.com",
}

_PROFILE_MODES = {
    "profileTweets",
    "profileReplies",
    "profileMedia",
    "profileLikes",
}
_TWEET_ID_FIELDS = {
    "article": "articleTweetIds",
    "replies": "replyTweetIds",
    "quotes": "quoteTweetIds",
    "thread": "threadTweetIds",
    "retweeters": "retweeterTweetIds",
    "favoriters": "favoriterTweetIds",
}


def _separar_alvos(alvo: str) -> list[str]:
    return [item.strip() for item in alvo.split(",") if item.strip()]


def _eh_url(alvo: str) -> bool:
    return "://" in alvo


def _validar_url_x(alvo: str) -> str:
    url = urlparse(alvo)
    if url.scheme != "https":
        raise ValueError(f"URL do X precisa usar HTTPS: {alvo}")
    if (url.hostname or "").lower() not in _X_HOSTS:
        raise ValueError(f"URL fora dos domínios esperados do X: {alvo}")
    return alvo


def _extrair_tweet_id(alvo: str) -> str:
    if alvo.isdigit():
        return alvo
    if _eh_url(alvo):
        _validar_url_x(alvo)
    encontrado = re.search(r"/status/(\d+)", alvo)
    if encontrado:
        return encontrado.group(1)
    raise ValueError(f"alvo sem ID de post reconhecível: {alvo}")


def _exigir_alvos(alvo: str) -> list[str]:
    alvos = _separar_alvos(alvo)
    if not alvos:
        raise ValueError("informe pelo menos um alvo")
    return alvos


def _separar_urls_e_valores(alvos: list[str]) -> tuple[list[str], list[str]]:
    urls = [_validar_url_x(item) for item in alvos if _eh_url(item)]
    valores = [item for item in alvos if not _eh_url(item)]
    return urls, valores


def _validar_ids_numericos(ids: list[str], tipo: str) -> None:
    if ids and not all(item.isdigit() for item in ids):
        raise ValueError(f"IDs de {tipo} precisam ser numéricos")


def _adicionar_busca(payload: dict, alvo: str) -> None:
    if not alvo.strip():
        raise ValueError("informe uma busca")
    payload["twitterContent"] = alvo


def _adicionar_perfis(payload: dict, alvo: str) -> None:
    urls, handles = _separar_urls_e_valores(_exigir_alvos(alvo))
    if urls:
        payload["profileUrls"] = urls
    if handles:
        payload["twitterHandles"] = [item.lstrip("@") for item in handles]


def _adicionar_listas(payload: dict, alvo: str) -> None:
    urls, ids = _separar_urls_e_valores(_exigir_alvos(alvo))
    _validar_ids_numericos(ids, "lista")
    if urls:
        payload["startUrls"] = urls
    if ids:
        payload["listIds"] = ids


def _adicionar_posts(payload: dict, alvo: str) -> None:
    urls, ids = _separar_urls_e_valores(_exigir_alvos(alvo))
    _validar_ids_numericos(ids, "post")
    if urls:
        payload["tweetUrls"] = urls
    if ids:
        payload["tweetIds"] = ids


def _adicionar_ids_de_post(payload: dict, alvo: str, campo: str) -> None:
    alvos = _exigir_alvos(alvo)
    payload[campo] = [_extrair_tweet_id(item) for item in alvos]


def _adicionar_legacy(payload: dict, alvo: str) -> None:
    alvos = _exigir_alvos(alvo)
    urls, valores = _separar_urls_e_valores(alvos)
    if urls:
        payload["startUrls"] = urls
    if valores and all(item.isdigit() for item in valores):
        payload["tweetIds"] = valores
    elif valores and all(" " not in item for item in valores):
        payload["twitterHandles"] = [item.lstrip("@") for item in valores]
    elif valores:
        payload["twitterContent"] = alvo


_MODE_BUILDERS = {
    "legacy": _adicionar_legacy,
    "search": _adicionar_busca,
    "tweet": _adicionar_posts,
    "tweets": _adicionar_posts,
    "listTweets": _adicionar_listas,
    **{modo: _adicionar_perfis for modo in _PROFILE_MODES},
}


def montar_payload_x_tweets(
    alvo: str,
    modo: str,
    limite: int,
    limite_por_alvo: Optional[int] = None,
) -> dict:
    """Monta inputs nativos do Xquik X Tweet Scraper."""
    if modo not in X_TWEET_MODES:
        raise ValueError(f"modo do X não suportado: {modo}")

    payload = {
        "mode": modo,
        "maxItems": limite,
        "outputVariant": "rich",
        "fieldStyle": "camelCase",
        "outputPreset": "flat",
        "includeUnavailableFields": True,
    }
    campo_id = _TWEET_ID_FIELDS.get(modo)
    if campo_id:
        _adicionar_ids_de_post(payload, alvo, campo_id)
    else:
        _MODE_BUILDERS[modo](payload, alvo)
    if modo == "search":
        payload["includeSearchTerms"] = True
    if limite_por_alvo is not None:
        payload["maxItemsPerTarget"] = limite_por_alvo
    return payload


def montar_payload_x_followers(
    alvo: str,
    relacao: str,
    limite: int,
    limite_por_alvo: Optional[int],
    sobreposicao: bool,
) -> dict:
    """Monta inputs nativos do Xquik X Follower Scraper."""
    if relacao not in X_RELATIONS:
        raise ValueError(f"relação do X não suportada: {relacao}")

    alvos = _separar_alvos(alvo)
    if not alvos:
        raise ValueError("informe pelo menos um alvo")

    payload = {
        "relation": relacao,
        "maxItems": limite,
        "outputMode": "full",
        "includeTargetMetadata": True,
        "includeUnavailableUsers": True,
    }
    urls = [_validar_url_x(item) for item in alvos if _eh_url(item)]
    ids = [item for item in alvos if not _eh_url(item)]
    if urls:
        payload["startUrls"] = urls
    if relacao in ("list_members", "list_followers", "community_members"):
        if ids and not all(item.isdigit() for item in ids):
            raise ValueError("IDs de lista ou comunidade precisam ser numéricos")
        if ids:
            campo = "communityIds" if relacao == "community_members" else "listIds"
            payload[campo] = ids
    elif ids:
        payload["twitterHandles"] = [item.lstrip("@") for item in ids]

    if limite_por_alvo is not None:
        payload["maxItemsPerTarget"] = limite_por_alvo
    if sobreposicao:
        payload["overlapMode"] = True
    return payload
