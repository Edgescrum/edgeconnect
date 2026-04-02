export interface LineProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

// LINE アクセストークンを検証し、プロフィールを取得する
export async function verifyLineAccessToken(
  accessToken: string
): Promise<LineProfile> {
  // トークン検証
  const verifyRes = await fetch(
    `https://api.line.me/oauth2/v2.1/verify?access_token=${accessToken}`
  );
  if (!verifyRes.ok) {
    throw new Error("Invalid LINE access token");
  }

  // プロフィール取得
  const profileRes = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profileRes.ok) {
    throw new Error("Failed to get LINE profile");
  }

  const profile = await profileRes.json();
  return {
    userId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl,
  };
}
