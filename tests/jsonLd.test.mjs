import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSiteJsonLd } from "@/lib/jsonLd";

const BASE = "https://daiso-finder.kr";
const jsonLd = buildSiteJsonLd(BASE);

function node(type) {
  return jsonLd["@graph"].find((entry) => entry["@type"] === type);
}

test("is a valid schema.org graph with unique ids", () => {
  assert.equal(jsonLd["@context"], "https://schema.org");
  const ids = jsonLd["@graph"].map((entry) => entry["@id"]);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => id.startsWith(BASE)));
});

test("Organization carries both contactPoint and a postal address", () => {
  const organization = node("Organization");
  assert.ok(organization, "no Organization node");
  assert.equal(organization.url, BASE);
  assert.match(organization.email, /@/);

  assert.equal(organization.address["@type"], "PostalAddress");
  assert.equal(organization.address.addressCountry, "KR");
  assert.ok(organization.address.addressRegion);

  assert.ok(Array.isArray(organization.contactPoint));
  assert.ok(organization.contactPoint.length > 0);
  for (const contact of organization.contactPoint) {
    assert.equal(contact["@type"], "ContactPoint");
    assert.ok(contact.contactType);
    assert.match(contact.email, /@/);
  }

  assert.ok(organization.sameAs.length > 0);
});

test("WebApplication declares url, category and a free offer", () => {
  const webApp = node("WebApplication");
  assert.equal(webApp.url, BASE);
  assert.ok(webApp.name);
  assert.ok(webApp.description);
  assert.equal(webApp.applicationCategory, "ShoppingApplication");
  assert.equal(webApp.offers.price, "0");
  assert.equal(webApp.offers.priceCurrency, "KRW");
  assert.equal(webApp.isAccessibleForFree, true);
  assert.equal(webApp.publisher["@id"], `${BASE}/#organization`);
});

test("WebSite exposes a SearchAction pointing at the public API", () => {
  const website = node("WebSite");
  assert.equal(website.url, BASE);
  assert.equal(website.potentialAction["@type"], "SearchAction");
  assert.match(
    website.potentialAction.target.urlTemplate,
    /\{search_term_string\}$/,
  );
  assert.equal(
    website.potentialAction["query-input"],
    "required name=search_term_string",
  );
});

test("honours a base URL that carries a trailing slash", () => {
  const trailing = buildSiteJsonLd("https://daiso-finder.kr/");
  assert.equal(
    trailing["@graph"].find((entry) => entry["@type"] === "Organization")[
      "@id"
    ],
    `${BASE}/#organization`,
  );
});
