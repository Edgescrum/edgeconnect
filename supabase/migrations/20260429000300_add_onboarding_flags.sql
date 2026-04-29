-- provider_settings にオンボーディング追跡用フラグを追加
ALTER TABLE public.provider_settings
  ADD COLUMN profile_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN schedule_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN qrcode_viewed boolean NOT NULL DEFAULT false;
