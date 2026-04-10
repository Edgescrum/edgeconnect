import { messagingApi } from "@line/bot-sdk";
import { log, logError } from "@/lib/log";

const client = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
});

interface SenderOverride {
  name: string;
  iconUrl?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function pushFlexMessage(
  lineUserId: string,
  altText: string,
  contents: Record<string, unknown>,
  sender?: SenderOverride
) {
  // sender override: アイコンURLがHTTPSの場合のみ適用
  const senderObj =
    sender?.name && sender?.iconUrl && sender.iconUrl.startsWith("https://")
      ? { name: sender.name.slice(0, 20), iconUrl: sender.iconUrl }
      : undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildMessage = (withSender: boolean): any => ({
    type: "flex",
    altText,
    contents,
    ...(withSender && senderObj ? { sender: senderObj } : {}),
  });

  try {
    log("line", "pushFlexMessage", { to: lineUserId, altText, hasSender: !!senderObj });
    await client.pushMessage({
      to: lineUserId,
      messages: [buildMessage(!!senderObj)],
    });
    log("line", "pushFlexMessage success");
  } catch (e) {
    // sender付きで失敗した場合、senderなしでリトライ
    if (senderObj) {
      logError("line", "pushFlexMessage failed with sender, retrying without", e instanceof Error ? e.message : e);
      try {
        await client.pushMessage({
          to: lineUserId,
          messages: [buildMessage(false)],
        });
        log("line", "pushFlexMessage success (without sender)");
        return;
      } catch (e2) {
        logError("line", "pushFlexMessage retry also failed", e2 instanceof Error ? e2.message : e2);
        return;
      }
    }
    logError("line", "pushFlexMessage failed", e instanceof Error ? e.message : e);
  }
}
