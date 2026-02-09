#!/usr/bin/env bash
# Smoke test all 18 endpoints
# Usage: bash smoke-test.sh

set -e
BASE="http://localhost:4000"
UUID="11111111-1111-1111-1111-111111111111"
AUTH="Authorization: Bearer $UUID"
CT="Content-Type: application/json"
PASS=0
FAIL=0
TOTAL=0

check() {
  local label="$1" expected_status="$2" actual_status="$3" body="$4"
  TOTAL=$((TOTAL + 1))
  if [ "$actual_status" = "$expected_status" ]; then
    echo "✅  $label  (HTTP $actual_status)"
    PASS=$((PASS + 1))
  else
    echo "❌  $label  (expected $expected_status, got $actual_status)"
    echo "    Body: $body"
    FAIL=$((FAIL + 1))
  fi
}

echo "========================================"
echo "  SMOKE TESTS — PR1 Backend"
echo "========================================"
echo ""

# ── 1. Health check ──
echo "── Health ──"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/health")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /health" "200" "$STATUS" "$BODY"

# ── 2. Auth — no token ──
echo ""
echo "── Auth (no token) ──"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/v1/lists")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /v1/lists (no auth → 401)" "401" "$STATUS" "$BODY"

# ── 3. POST /v1/me/bootstrap ──
echo ""
echo "── Bootstrap ──"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/v1/me/bootstrap" -H "$AUTH" -H "$CT" -d '{}')
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "POST /v1/me/bootstrap (create user)" "200" "$STATUS" "$BODY"

# Call again — idempotent
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/v1/me/bootstrap" -H "$AUTH" -H "$CT" -d '{}')
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "POST /v1/me/bootstrap (idempotent)" "200" "$STATUS" "$BODY"

# Extract default list IDs
WANT_LIST_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['default_lists']['want'])" 2>/dev/null || echo "")
BEEN_LIST_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['default_lists']['been'])" 2>/dev/null || echo "")
echo "    Want to Try list: $WANT_LIST_ID"
echo "    Been list:        $BEEN_LIST_ID"

# ── 4. POST /v1/places/upsert ──
echo ""
echo "── Places ──"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/v1/places/upsert" -H "$AUTH" -H "$CT" -d '{
  "name": "Café Central",
  "city": "Madrid",
  "lat": 40.4168,
  "lng": -3.7038,
  "address_line1": "Plaza del Ángel 10",
  "country": "Spain",
  "source": { "source_type": "manual", "source_id": "cafe-central-1" }
}')
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "POST /v1/places/upsert (create)" "201" "$STATUS" "$BODY"
PLACE_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['place_id'])" 2>/dev/null || echo "")
echo "    place_id: $PLACE_ID"

# Upsert same place (dedupe)
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/v1/places/upsert" -H "$AUTH" -H "$CT" -d '{
  "name": "Café Central",
  "city": "Madrid",
  "lat": 40.4168,
  "lng": -3.7038
}')
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "POST /v1/places/upsert (dedupe → 200)" "200" "$STATUS" "$BODY"

# Upsert second place
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/v1/places/upsert" -H "$AUTH" -H "$CT" -d '{
  "name": "Mercado de San Miguel",
  "city": "Madrid",
  "lat": 40.4153,
  "lng": -3.7090
}')
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "POST /v1/places/upsert (2nd place)" "201" "$STATUS" "$BODY"
PLACE_ID_2=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['place_id'])" 2>/dev/null || echo "")

# Validation error
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/v1/places/upsert" -H "$AUTH" -H "$CT" -d '{"name":"","lat":999,"lng":0}')
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "POST /v1/places/upsert (validation → 400)" "400" "$STATUS" "$BODY"

# ── 5. GET /v1/places/search ──
RESP=$(curl -s -w "\n%{http_code}" "$BASE/v1/places/search?q=Caf%C3%A9" -H "$AUTH")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /v1/places/search" "200" "$STATUS" "$BODY"

RESP=$(curl -s -w "\n%{http_code}" "$BASE/v1/places/search?q=Caf%C3%A9&lat=40.4168&lng=-3.7038&radius_m=5000" -H "$AUTH")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /v1/places/search (with geo)" "200" "$STATUS" "$BODY"

# ── 6–10. Lists ──
echo ""
echo "── Lists ──"

# GET /v1/lists
RESP=$(curl -s -w "\n%{http_code}" "$BASE/v1/lists" -H "$AUTH")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /v1/lists" "200" "$STATUS" "$BODY"

# POST /v1/lists (create)
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/v1/lists" -H "$AUTH" -H "$CT" -d '{"title":"Test List","description":"A test","visibility":"unlisted"}')
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "POST /v1/lists (create)" "201" "$STATUS" "$BODY"
NEW_LIST_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "")
echo "    new list: $NEW_LIST_ID"

# GET /v1/lists/:id
RESP=$(curl -s -w "\n%{http_code}" "$BASE/v1/lists/$WANT_LIST_ID" -H "$AUTH")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /v1/lists/:id" "200" "$STATUS" "$BODY"

# PATCH /v1/lists/:id
RESP=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE/v1/lists/$NEW_LIST_ID" -H "$AUTH" -H "$CT" -d '{"title":"Updated Title","visibility":"public"}')
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "PATCH /v1/lists/:id" "200" "$STATUS" "$BODY"

# POST /v1/lists/:id/items (save place to list)
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/v1/lists/$WANT_LIST_ID/items" -H "$AUTH" -H "$CT" -d "{\"place_id\":\"$PLACE_ID\",\"status\":\"want\",\"tags\":[\"coffee\",\"jazz\"]}")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "POST /v1/lists/:id/items (save place)" "201" "$STATUS" "$BODY"
LIST_ITEM_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['list_item_id'])" 2>/dev/null || echo "")
echo "    list_item_id: $LIST_ITEM_ID"

# Save 2nd place
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/v1/lists/$WANT_LIST_ID/items" -H "$AUTH" -H "$CT" -d "{\"place_id\":\"$PLACE_ID_2\",\"status\":\"want\"}")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "POST /v1/lists/:id/items (2nd place)" "201" "$STATUS" "$BODY"

# GET list detail with items + tags
RESP=$(curl -s -w "\n%{http_code}" "$BASE/v1/lists/$WANT_LIST_ID" -H "$AUTH")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /v1/lists/:id (with items+tags)" "200" "$STATUS" "$BODY"
echo "    Detail: $(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"items={len(d.get('items',[]))}\")")"

# ── 11–12. List Items ──
echo ""
echo "── List Items ──"

# PATCH /v1/list-items/:id
RESP=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE/v1/list-items/$LIST_ITEM_ID" -H "$AUTH" -H "$CT" -d '{"status":"been","rating":5,"note":"Amazing jazz!"}')
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "PATCH /v1/list-items/:id (been+rating)" "200" "$STATUS" "$BODY"

# PATCH with invalid rating
RESP=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE/v1/list-items/$LIST_ITEM_ID" -H "$AUTH" -H "$CT" -d '{"rating":10}')
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "PATCH /v1/list-items/:id (bad rating → 400)" "400" "$STATUS" "$BODY"

# ── 13–16. Imports ──
echo ""
echo "── Imports ──"

# POST /v1/imports
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/v1/imports" -H "$AUTH" -H "$CT" -d '{"source":"instagram_url","source_url":"https://instagram.com/p/abc123"}')
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "POST /v1/imports (create)" "201" "$STATUS" "$BODY"
IMPORT_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['import_id'])" 2>/dev/null || echo "")
echo "    import_id: $IMPORT_ID"

# GET /v1/imports/:id
RESP=$(curl -s -w "\n%{http_code}" "$BASE/v1/imports/$IMPORT_ID" -H "$AUTH")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /v1/imports/:id" "200" "$STATUS" "$BODY"

# POST /v1/imports/:id/ocr
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/v1/imports/$IMPORT_ID/ocr" -H "$AUTH" -H "$CT" -d '{"ocr_text":"Café Central\nPlaza del Ángel\nMadrid"}')
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "POST /v1/imports/:id/ocr" "200" "$STATUS" "$BODY"

# POST /v1/imports/:id/resolve
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/v1/imports/$IMPORT_ID/resolve" -H "$AUTH" -H "$CT" -d "{\"place_id\":\"$PLACE_ID\",\"save_to_list_id\":\"$WANT_LIST_ID\"}")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "POST /v1/imports/:id/resolve" "200" "$STATUS" "$BODY"

# Invalid source
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/v1/imports" -H "$AUTH" -H "$CT" -d '{"source":"invalid"}')
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "POST /v1/imports (bad source → 400)" "400" "$STATUS" "$BODY"

# ── 17–18. Public ──
echo ""
echo "── Public ──"

# GET /public/featured
RESP=$(curl -s -w "\n%{http_code}" "$BASE/public/featured")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /public/featured" "200" "$STATUS" "$BODY"

# GET /public/lists/:handle/:slug (nonexistent → 404)
RESP=$(curl -s -w "\n%{http_code}" "$BASE/public/lists/nobody/nonexistent")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "GET /public/lists/:handle/:slug (404)" "404" "$STATUS" "$BODY"

# ── Cleanup: DELETE ──
echo ""
echo "── Cleanup (DELETE endpoints) ──"

# DELETE /v1/list-items/:id
RESP=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE/v1/list-items/$LIST_ITEM_ID" -H "$AUTH")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "DELETE /v1/list-items/:id" "200" "$STATUS" "$BODY"

# DELETE again (should 404)
RESP=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE/v1/list-items/$LIST_ITEM_ID" -H "$AUTH")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "DELETE /v1/list-items/:id (again → 404)" "404" "$STATUS" "$BODY"

# DELETE /v1/lists/:id
RESP=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE/v1/lists/$NEW_LIST_ID" -H "$AUTH")
STATUS=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
check "DELETE /v1/lists/:id" "200" "$STATUS" "$BODY"

echo ""
echo "========================================"
echo "  RESULTS: $PASS passed, $FAIL failed, $TOTAL total"
echo "========================================"

exit $FAIL
