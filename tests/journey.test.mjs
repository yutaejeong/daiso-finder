import assert from "node:assert/strict";
import { test } from "node:test";
import {
  JOURNEY_STEPS,
  classifyChannel,
  journeyStepIndex,
  referrerHost,
} from "@/lib/journey";

const SITE = "www.daiso-finder.kr";

test("funnel steps are numbered from 1 in order", () => {
  assert.equal(journeyStepIndex("landing"), 1);
  assert.equal(journeyStepIndex("branch_view"), 4);
  assert.equal(
    journeyStepIndex(JOURNEY_STEPS[JOURNEY_STEPS.length - 1]),
    JOURNEY_STEPS.length,
  );
  // 알 수 없는 단계는 퍼널 밖이므로 0.
  assert.equal(journeyStepIndex("something_else"), 0);
});

test("funnel step names are unique", () => {
  assert.equal(new Set(JOURNEY_STEPS).size, JOURNEY_STEPS.length);
});

test("referrer host drops the www prefix and survives junk", () => {
  assert.equal(referrerHost("https://www.google.com/search?q=x"), "google.com");
  assert.equal(referrerHost(""), "");
  assert.equal(referrerHost("not a url"), "");
});

test("no referrer means a direct visit", () => {
  assert.equal(
    classifyChannel({ referrer: "", currentHost: SITE }),
    "direct",
  );
});

test("our own pages are not an acquisition channel", () => {
  assert.equal(
    classifyChannel({
      referrer: "https://www.daiso-finder.kr/branch/1234",
      currentHost: SITE,
    }),
    "internal",
  );
});

test("search engines, social, and the rest are separated", () => {
  const channelOf = (referrer) =>
    classifyChannel({ referrer, currentHost: SITE });

  assert.equal(channelOf("https://search.naver.com/search.naver?query=다이소"), "organic_search");
  assert.equal(channelOf("https://www.google.co.kr/"), "organic_search");
  // 블로그·카페는 네이버 도메인이지만 검색 유입이 아니다.
  assert.equal(channelOf("https://blog.naver.com/someone/123"), "social");
  assert.equal(channelOf("https://m.blog.naver.com/someone/123"), "social");
  assert.equal(channelOf("https://www.instagram.com/"), "social");
  assert.equal(channelOf("https://example.com/post"), "referral");
});

test("AI assistants are split out from search engines", () => {
  const channelOf = (referrer) =>
    classifyChannel({ referrer, currentHost: SITE });

  assert.equal(channelOf("https://chatgpt.com/"), "ai_assistant");
  assert.equal(channelOf("https://claude.ai/chat/abc"), "ai_assistant");
  // 구글 도메인을 쓰지만 검색이 아니라 어시스턴트 유입이다.
  assert.equal(channelOf("https://gemini.google.com/app"), "ai_assistant");
});

test("utm parameters win over the referrer", () => {
  assert.equal(
    classifyChannel({
      referrer: "https://www.google.com/",
      currentHost: SITE,
      utmSource: "newsletter",
      utmMedium: "email",
    }),
    "email",
  );
  // medium 없이 source 만 붙은 링크도 캠페인 유입으로 본다.
  assert.equal(
    classifyChannel({
      referrer: "",
      currentHost: SITE,
      utmSource: "poster",
    }),
    "campaign",
  );
});
