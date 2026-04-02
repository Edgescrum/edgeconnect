import { messagingApi } from "@line/bot-sdk";

const client = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function pushFlexMessage(
  lineUserId: string,
  altText: string,
  contents: Record<string, unknown>
) {
  try {
    await client.pushMessage({
      to: lineUserId,
      messages: [
        {
          type: "flex",
          altText,
          contents,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      ],
    });
  } catch (e) {
    console.error("LINE push failed:", e);
  }
}
