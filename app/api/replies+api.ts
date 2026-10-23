// Proxy through Expo so a phone never has to connect to its own loopback address.
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const matchId = Number(new URL(request.url).searchParams.get("matchId"));
  if (!Number.isSafeInteger(matchId) || matchId <= 0) {
    return Response.json({ error: "Invalid matchId" }, { status: 400 });
  }
  try {
    const response = await fetch(`http://127.0.0.1:4317/replies?matchId=${matchId}`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) throw new Error("Mock chat server request failed");
    return Response.json(await response.json(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Start npm run mock-chat to receive test replies." }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
