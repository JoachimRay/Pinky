First start the Expo app `npx expo start`

To call open router ai, you need POSTMAN and make a POST request to:

`http://localhost:8081/api/opener`

in Body -> raw: paste this format (You can change the values):

{
"name": "Maya",
"bio": "Coffee first. Record shop after?",
"interests": ["music", "vinyl"]
}

Since these three values are the ones being passed to the model to make an opener message. Refer to `opener+api.ts` line 56.

Usually it will return a fallback response

{
"opener": "Hi! What's something you're excited about lately?",
"source": "fallback"
}

since the OpenRouter AI model (Gemma-4) is free and the tokens are shared between all developers who use the free API.
