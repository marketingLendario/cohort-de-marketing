from __future__ import annotations

import json
import sys
import unittest
import urllib.parse
from decimal import Decimal
from pathlib import Path
from unittest import mock


SCRIPT_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import apify_scraper  # noqa: E402


class FakeResponse:
    def __enter__(self) -> "FakeResponse":
        return self

    def __exit__(self, *_args: object) -> None:
        return None

    def read(self) -> bytes:
        return b'[{"ok": true}]'


class ApifyScraperTests(unittest.TestCase):
    def test_run_uses_bearer_auth_and_cost_caps(self) -> None:
        with mock.patch.object(apify_scraper, "ssl_context", return_value=None):
            with mock.patch.object(
                apify_scraper.urllib.request,
                "urlopen",
                return_value=FakeResponse(),
            ) as urlopen:
                result = apify_scraper.rodar_actor(
                    "xquik~x-tweet-scraper",
                    {"mode": "search"},
                    "secret-token",
                    max_items=12,
                    max_total_charge_usd=Decimal("1.25"),
                )

        request = urlopen.call_args.args[0]
        query = urllib.parse.parse_qs(urllib.parse.urlparse(request.full_url).query)
        self.assertEqual(result, [{"ok": True}])
        self.assertEqual(request.get_header("Authorization"), "Bearer secret-token")
        self.assertNotIn("secret-token", request.full_url)
        self.assertNotIn("token", query)
        self.assertEqual(
            urllib.parse.urlparse(request.full_url).path,
            "/v2/actors/xquik~x-tweet-scraper/run-sync-get-dataset-items",
        )
        self.assertEqual(query["timeout"], ["280"])
        self.assertEqual(query["maxItems"], ["12"])
        self.assertEqual(query["limit"], ["12"])
        self.assertEqual(query["maxTotalChargeUsd"], ["1.25"])
        self.assertEqual(json.loads(request.data), {"mode": "search"})

    def test_tweet_payload_exposes_every_actor_mode(self) -> None:
        cases = {
            "legacy": ("@xquik", "twitterHandles"),
            "tweet": ("123", "tweetIds"),
            "tweets": ("https://x.com/xquik/status/123", "tweetUrls"),
            "search": ("marketing digital lang:pt", "twitterContent"),
            "profileTweets": ("@xquik", "twitterHandles"),
            "profileReplies": ("@xquik", "twitterHandles"),
            "profileMedia": ("@xquik", "twitterHandles"),
            "profileLikes": ("@xquik", "twitterHandles"),
            "listTweets": ("123", "listIds"),
            "article": ("123", "articleTweetIds"),
            "replies": ("123", "replyTweetIds"),
            "quotes": ("123", "quoteTweetIds"),
            "thread": ("123", "threadTweetIds"),
            "retweeters": ("123", "retweeterTweetIds"),
            "favoriters": ("123", "favoriterTweetIds"),
        }

        self.assertEqual(set(cases), set(apify_scraper.X_TWEET_MODES))
        for mode, (target, expected_field) in cases.items():
            with self.subTest(mode=mode):
                payload = apify_scraper.montar_payload_x_tweets(target, mode, 25)
                self.assertIn(expected_field, payload)
                self.assertEqual(payload["mode"], mode)
                self.assertEqual(payload["maxItems"], 25)
                self.assertEqual(payload["outputVariant"], "rich")
                self.assertEqual(payload["fieldStyle"], "camelCase")
                self.assertEqual(payload["outputPreset"], "flat")

    def test_follower_payload_exposes_every_relation(self) -> None:
        cases = {
            "followers": ("@um,@dois", "twitterHandles"),
            "following": ("@um,@dois", "twitterHandles"),
            "verified_followers": ("@um,@dois", "twitterHandles"),
            "list_members": ("123,456", "listIds"),
            "list_followers": ("123,456", "listIds"),
            "community_members": ("123,456", "communityIds"),
        }

        self.assertEqual(set(cases), set(apify_scraper.X_RELATIONS))
        for relation, (target, expected_field) in cases.items():
            with self.subTest(relation=relation):
                payload = apify_scraper.montar_payload_x_followers(
                    target,
                    relation,
                    100,
                    50,
                    True,
                )
                self.assertIn(expected_field, payload)
                self.assertEqual(payload["relation"], relation)
                self.assertEqual(payload["maxItems"], 100)
                self.assertEqual(payload["maxItemsPerTarget"], 50)
                self.assertEqual(payload["outputMode"], "full")
                self.assertTrue(payload["includeTargetMetadata"])
                self.assertTrue(payload["overlapMode"])

    def test_profile_urls_preserve_relation_path(self) -> None:
        payload = apify_scraper.montar_payload_x_followers(
            "https://x.com/xquik/following",
            "followers",
            10,
            None,
            False,
        )
        self.assertEqual(
            payload["startUrls"],
            ["https://x.com/xquik/following"],
        )
        self.assertNotIn("maxItemsPerTarget", payload)
        self.assertNotIn("overlapMode", payload)

    def test_tweet_target_forms_and_validation(self) -> None:
        profile = apify_scraper.montar_payload_x_tweets(
            "https://x.com/xquik",
            "profileTweets",
            10,
            5,
        )
        list_url = apify_scraper.montar_payload_x_tweets(
            "https://x.com/i/lists/123",
            "listTweets",
            10,
        )
        legacy = apify_scraper.montar_payload_x_tweets(
            "https://x.com/xquik,123",
            "legacy",
            10,
        )
        legacy_search = apify_scraper.montar_payload_x_tweets(
            "marketing digital",
            "legacy",
            10,
        )
        thread = apify_scraper.montar_payload_x_tweets(
            "https://x.com/xquik/status/123",
            "thread",
            10,
        )
        legacy_url = apify_scraper.montar_payload_x_tweets(
            "https://x.com/xquik",
            "legacy",
            10,
        )
        self.assertEqual(profile["profileUrls"], ["https://x.com/xquik"])
        self.assertEqual(profile["maxItemsPerTarget"], 5)
        self.assertEqual(list_url["startUrls"], ["https://x.com/i/lists/123"])
        self.assertEqual(legacy["startUrls"], ["https://x.com/xquik"])
        self.assertEqual(legacy["tweetIds"], ["123"])
        self.assertEqual(legacy_search["twitterContent"], "marketing digital")
        self.assertEqual(thread["threadTweetIds"], ["123"])
        self.assertEqual(legacy_url["startUrls"], ["https://x.com/xquik"])

        invalid_cases = (
            ("termo", "invalid"),
            ("", "search"),
            ("", "profileTweets"),
            ("lista", "listTweets"),
            ("post", "tweet"),
        )
        for target, mode in invalid_cases:
            with self.subTest(mode=mode):
                with self.assertRaises(ValueError):
                    apify_scraper.montar_payload_x_tweets(target, mode, 10)

    def test_follower_target_validation(self) -> None:
        list_url = apify_scraper.montar_payload_x_followers(
            "https://x.com/i/lists/123/members",
            "list_members",
            10,
            None,
            False,
        )
        self.assertEqual(
            list_url["startUrls"],
            ["https://x.com/i/lists/123/members"],
        )

        invalid_cases = (
            ("@xquik", "invalid"),
            ("", "followers"),
            ("lista", "list_members"),
            ("comunidade", "community_members"),
        )
        for target, relation in invalid_cases:
            with self.subTest(relation=relation):
                with self.assertRaises(ValueError):
                    apify_scraper.montar_payload_x_followers(
                        target,
                        relation,
                        10,
                        None,
                        False,
                    )

    def test_rejects_invalid_limits_and_post_targets(self) -> None:
        for value in ("0", "-1", "abc"):
            with self.subTest(limit=value):
                with self.assertRaises(apify_scraper.argparse.ArgumentTypeError):
                    apify_scraper.inteiro_positivo(value)
        for value in ("0", "-1", "NaN", "Infinity"):
            with self.subTest(charge=value):
                with self.assertRaises(apify_scraper.argparse.ArgumentTypeError):
                    apify_scraper.decimal_positivo(value)
        with self.assertRaisesRegex(ValueError, "ID de post"):
            apify_scraper.montar_payload_x_tweets(
                "https://x.com/xquik",
                "thread",
                10,
            )


if __name__ == "__main__":
    unittest.main()
