async function callUpdateVideos(env: Env): Promise<Response> {
  return fetch("https://daily-gwei-links.vercel.app/api/updateVideos", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.AUTHN_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await callUpdateVideos(env);

        if (response.ok) {
          console.log(`Update succeeded on attempt ${attempt}`);
          return;
        }

        console.error(`Attempt ${attempt} failed: ${response.status} ${response.statusText}`);
      } catch (error) {
        console.error(`Attempt ${attempt} error:`, error);
      }

      // Wait before retry (exponential backoff: 5s, 10s, 20s)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 5000 * Math.pow(2, attempt - 1)));
      }
    }

    console.error("All retry attempts failed");
  },
} satisfies ExportedHandler<Env>;

interface Env {
  AUTHN_API_KEY: string;
}
