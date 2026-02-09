# PR2_AUTH_SUPABASE_APPLE.md
> PR2 = real auth for iOS-first launch: **Sign in with Apple (native) → Supabase Auth session → backend JWT verification**.
> Assumes PR1 endpoints exist and were smoke-tested with a mock user.

---

## 1) PR2 goals (definition of done)

### You are done with PR2 when:
- iOS can sign in with Apple and obtain a Supabase session via `signInWithIdToken`. :contentReference[oaicite:0]{index=0}
- Your API rejects requests without a valid `Authorization: Bearer <access_token>`.
- Backend verifies JWT signature + exp + issuer, sets `req.userId = claims.sub`. :contentReference[oaicite:1]{index=1}
- `POST /v1/me/bootstrap` works with real tokens and creates the correct user + default lists.

---

## 2) Key constraints to respect (avoid future pain)

- **Native-only Apple sign-in does NOT require Apple “secret key rotation”** (that’s for web/OAuth flow). :contentReference[oaicite:2]{index=2}
- Apple **does not include full name in the identity token**; you only get the name on the first native authorization and must store it yourself. :contentReference[oaicite:3]{index=3}

---

## 3) Supabase dashboard setup (Auth)

### 3.1 Enable Apple provider
- Supabase project → **Authentication → Providers → Apple**
- Enable Apple provider (native iOS path)
- Make sure your **Bundle ID** is registered/allowed in the provider settings as required by Supabase for Apple. :contentReference[oaicite:4]{index=4}

### 3.2 Make sure you’re using JWT signing keys (JWKS)
Backend verification uses Supabase’s JWKS endpoint:
`https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json` :contentReference[oaicite:5]{index=5}

---

## 4) Apple Developer setup (iOS native)

- In Apple Developer / Xcode:
  - Enable **Sign in with Apple** capability for your App ID.
  - Ensure entitlements are present in the Xcode target.

(Apple’s native flow uses AuthenticationServices.) :contentReference[oaicite:6]{index=6}

---

## 5) iOS implementation (SwiftUI)

### 5.1 Flow summary
1) Use `ASAuthorizationAppleIDProvider` to request auth (with nonce).
2) Extract `identityToken` (JWT string).
3) Call Supabase Swift:
   `supabase.auth.signInWithIdToken(credentials: OpenIDConnectCredentials(provider: .apple, idToken: ..., nonce: ...))` :contentReference[oaicite:7]{index=7}
4) Store session (Supabase handles refresh).
5) Call your backend with:
   `Authorization: Bearer <session.accessToken>`

### 5.2 Minimal code sketch (nonce + signInWithIdToken)
> This is intentionally “just enough” to wire PR2. You can wrap it in your MVVM later.

```swift
import AuthenticationServices
import CryptoKit
import Supabase

final class AppleAuthCoordinator: NSObject, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
  private let supabase: SupabaseClient
  private var currentNonce: String?

  init(supabase: SupabaseClient) {
    self.supabase = supabase
  }

  func start() {
    let nonce = Self.randomNonce()
    currentNonce = nonce

    let request = ASAuthorizationAppleIDProvider().createRequest()
    request.requestedScopes = [.fullName, .email]
    request.nonce = Self.sha256(nonce)

    let controller = ASAuthorizationController(authorizationRequests: [request])
    controller.delegate = self
    controller.presentationContextProvider = self
    controller.performRequests()
  }

  func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
    guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
          let nonce = currentNonce,
          let identityTokenData = credential.identityToken,
          let identityToken = String(data: identityTokenData, encoding: .utf8)
    else { return }

    Task {
      // Sign in to Supabase using native Apple ID token
      let session = try await supabase.auth.signInWithIdToken(
        credentials: OpenIDConnectCredentials(
          provider: .apple,
          idToken: identityToken,
          nonce: nonce
        )
      )

      // Capture full name ONLY if present (first sign-in); store it yourself. :contentReference[oaicite:8]{index=8}
      if let fullName = credential.fullName {
        let given = fullName.givenName ?? ""
        let family = fullName.familyName ?? ""
        let displayName = ([given, family].joined(separator: " ")).trimmingCharacters(in: .whitespaces)

        // Option A: pass to your backend bootstrap to store in app_users.display_name
        // Option B: store in Supabase user_metadata via updateUser (if you want)
        // (Pick ONE; for your architecture, backend bootstrap is usually cleaner.)
      }

      // Now call your backend with session.accessToken as Bearer token
      // Authorization: Bearer session.accessToken
    }
  }

  func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
    // handle error
  }

  func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
    UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first { $0.isKeyWindow } ?? ASPresentationAnchor()
  }

  // MARK: - Nonce helpers
  static func randomNonce(length: Int = 32) -> String {
    precondition(length > 0)
    let charset = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
    var result = ""
    var remainingLength = length

    while remainingLength > 0 {
      var randoms = [UInt8](repeating: 0, count: 16)
      let status = SecRandomCopyBytes(kSecRandomDefault, randoms.count, &randoms)
      if status != errSecSuccess { fatalError("Unable to generate nonce") }

      randoms.forEach { random in
        if remainingLength == 0 { return }
        if random < charset.count {
          result.append(charset[Int(random)])
          remainingLength -= 1
        }
      }
    }
    return result
  }

  static func sha256(_ input: String) -> String {
    let data = Data(input.utf8)
    let hashed = SHA256.hash(data: data)
    return hashed.compactMap { String(format: "%02x", $0) }.joined()
  }
}
6) Backend implementation (JWT verification middleware)
6.1 What to verify (minimum)
On every request to /v1/*:

verify signature using JWKS (/.well-known/jwks.json) 

verify exp not expired 

verify iss matches your Supabase project issuer 

set req.userId = claims.sub (user UUID) 

Supabase’s JWT claims reference provides validation guidelines (issuer/audience/exp/signature). 

6.2 Node/TS example (Express + jose)
import type { Request, Response, NextFunction } from "express"
import { createRemoteJWKSet, jwtVerify } from "jose"

const SUPABASE_URL = process.env.SUPABASE_URL! // e.g. https://<project-ref>.supabase.co
const JWKS = createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`))
const ISSUER = `${SUPABASE_URL}/auth/v1`

declare global {
  namespace Express {
    interface Request { userId?: string }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = req.header("authorization")
    if (!auth?.startsWith("Bearer ")) {
      return res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "Missing bearer token", details: {} } })
    }

    const token = auth.slice("Bearer ".length)

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: ISSUER,
      // Supabase authenticated user tokens typically use aud "authenticated"
      // If your project differs, adjust accordingly.
      audience: "authenticated",
    })

    const sub = payload.sub
    if (!sub) {
      return res.status(401).json({ error: { code: "INVALID_TOKEN", message: "Token missing sub", details: {} } })
    }

    req.userId = sub
    return next()
  } catch (e: any) {
    return res.status(401).json({ error: { code: "INVALID_TOKEN", message: "Token verification failed", details: { reason: e?.message } } })
  }
}
JWKS endpoint location and sub meaning are documented by Supabase. 

7) Update your existing PR1 endpoints (minimal changes)
7.1 Replace mock auth
Remove “mock user id” middleware

Apply requireAuth to all /v1/* routes

Leave /public/* unauthenticated

7.2 Bootstrap enhancement (recommended)
Allow iOS to provide display name once:

POST /v1/me/bootstrap accepts optional body:

display_name?: string

handle?: string

home_city?: string

home_country?: string

If app_users.display_name is null/empty and display_name is provided:

store it (truncate + sanitize)
This aligns with Apple name being available only on first sign-in. 

8) PR2 smoke test (real token)
8.1 iOS
Run Apple sign-in

Print/log:

Supabase session exists

access token length > 0

8.2 API
Call:

POST /v1/me/bootstrap with Bearer access token

GET /v1/lists

POST /v1/places/upsert

POST /v1/lists/:id/items

If any fail:

check issuer (iss) mismatch

check audience (aud) mismatch

check you’re using the access token (not the Apple identity token)

9) PR2 checklist (copy into your tracker)
Supabase
 Enable Apple provider (native)

 Confirm JWKS endpoint reachable

Apple
 Sign in with Apple capability enabled in Xcode + App ID

iOS
 Implement nonce-based Apple auth

 Exchange Apple id token for Supabase session via signInWithIdToken 

 Send Supabase access token to your backend as Bearer token

 Capture full name on first sign-in and persist (bootstrap payload) 

Backend
 Implement JWT verification via JWKS 

 Replace mock middleware

 Apply auth middleware to /v1/*

 Keep /public/* open

 Smoke test all core endpoints

