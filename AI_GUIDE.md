# AI opener API guide

This guide explains how to test the AI-generated dating-app opener endpoint.

## 1. Start the Expo app

From the project folder, run:

```bash
npx expo start
```

Use the port shown by Expo in the terminal. The examples below assume the app is
running on port `8081`.

## 2. Send a request with Postman

Create a new `POST` request to:

```text
http://localhost:8081/api/opener
```

In Postman:

1. Open the **Body** tab.
2. Select **raw**.
3. Select **JSON** from the format dropdown.
4. Paste a request body such as:

```json
{
  "name": "Maya",
  "bio": "Coffee first. Record shop after?",
  "interests": ["music", "vinyl"]
}
```

The endpoint uses these three fields as profile information when generating an
opener:

- `name`: The person's name.
- `bio`: A short biography.
- `interests`: A list of interests. The fallback response uses the first
  interest when one is available.

The request should have a `Content-Type` of `application/json`. Postman usually
sets this automatically when **JSON** is selected.

## 3. Successful AI response

When the OpenRouter request succeeds, the endpoint returns:

```json
{
  "opener": "Maya, what do you enjoy most about music?",
  "source": "ai"
}
```

The configured OpenRouter model is controlled by the project's environment
settings. The model name may change, so it should not be assumed to be a
specific model.

## 4. Fallback responses

The endpoint returns a fallback response if the API key is missing, the
OpenRouter request fails, the AI returns an empty response, or the request body
is invalid.

If the request has no name, bio, or interests:

```json
{
  "opener": "Hi! What's something you're excited about lately?",
  "source": "fallback"
}
```

If a name is provided but no bio or interests are provided, the name is included
in the greeting:

```json
{
  "opener": "Hi Maya! What's something you're excited about lately?",
  "source": "fallback"
}
```

If the request includes an interest, the first interest is used:

```json
{
  "opener": "Hi Maya! What do you enjoy most about music?",
  "source": "fallback"
}
```

If there is no interest but a bio is provided:

```json
{
  "opener": "Hi Maya! I'd love to hear more about what you shared in your bio.",
  "source": "fallback"
}
```

The fallback logic is implemented in the `fallback` function in
[`app/api/opener+api.ts`](./app/api/opener+api.ts). The request handling and AI
call are implemented in the `POST` function in the same file.
