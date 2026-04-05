/** Build `https://twitter.com/intent/tweet` with encoded `text` and `url`. */
export function twitterIntentTweetUrl(text: string, url: string): string {
  const q = new URLSearchParams();
  q.set("text", text);
  q.set("url", url);
  return `https://twitter.com/intent/tweet?${q.toString()}`;
}
