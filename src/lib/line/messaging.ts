import { messagingApi } from "@line/bot-sdk";
import { log, logError } from "@/lib/log";

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
    log("line", "pushFlexMessage", { to: lineUserId, altText });
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
    log("line", "pushFlexMessage success");
  } catch (e) {
    logError("line", "pushFlexMessage failed", e);
  }
}
