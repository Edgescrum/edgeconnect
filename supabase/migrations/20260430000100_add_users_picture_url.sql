-- users テーブルに LINE プロフィール画像 URL を保存するカラムを追加
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS picture_url text;

-- upsert_user_from_line に picture_url パラメータを追加
CREATE OR REPLACE FUNCTION public.upsert_user_from_line(
  p_line_user_id text,
  p_display_name text,
  p_role text DEFAULT 'customer',
  p_auth_uid uuid DEFAULT NULL,
  p_picture_url text DEFAULT NULL
)
RETURNS users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
  v_user public.users;
begin
  if p_line_user_id is null or p_line_user_id = '' then
    raise exception 'line_user_id is required';
  end if;

  if p_role not in ('provider', 'customer') then
    raise exception 'role must be provider or customer';
  end if;

  insert into public.users (line_user_id, display_name, role, auth_uid, picture_url)
  values (p_line_user_id, p_display_name, p_role, p_auth_uid, p_picture_url)
  on conflict (line_user_id) do update
    set display_name = excluded.display_name,
        auth_uid = coalesce(excluded.auth_uid, users.auth_uid),
        picture_url = coalesce(excluded.picture_url, users.picture_url)
  returning * into v_user;

  return v_user;
end;
$$;
