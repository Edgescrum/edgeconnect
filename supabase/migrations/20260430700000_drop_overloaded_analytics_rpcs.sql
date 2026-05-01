-- fix: PostgreSQL関数オーバーロードによるセグメントフィルター不具合の修正
--
-- 問題: 分析RPCの旧シグネチャ（p_segment なし）と新シグネチャ（p_segment あり）が
-- 別々の関数としてDBに共存しており、Supabase PostgREST がセグメント付きRPC呼び出し時に
-- 関数解決で曖昧性エラーまたは旧版を呼び出す可能性があった。
-- これにより、セグメントフィルター切り替え時にKPIカードの値が変化しなかった。
--
-- 解決: 旧シグネチャをDROPし、p_segment DEFAULT NULL 付きの新シグネチャのみに統一する。
-- p_segment を省略した呼び出しは DEFAULT NULL により全体データを返す（後方互換性あり）。

---------------------------------------------------------------
-- 1. get_monthly_stats: 旧 (bigint, integer) をDROP
---------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_monthly_stats(bigint, integer);

---------------------------------------------------------------
-- 2. get_avg_booking_interval: 旧 (bigint) をDROP
---------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_avg_booking_interval(bigint);

---------------------------------------------------------------
-- 3. get_monthly_avg_interval: 旧 (bigint, integer) をDROP
---------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_monthly_avg_interval(bigint, integer);

---------------------------------------------------------------
-- 4. get_popular_menus: 旧 (bigint) をDROP
---------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_popular_menus(bigint);

---------------------------------------------------------------
-- 5. get_booking_heatmap: 旧 (bigint) をDROP
---------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_booking_heatmap(bigint);
