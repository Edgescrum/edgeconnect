-- ============================================================
-- Sprint 6: SV-6 テンプレート設問シードデータ（9カテゴリ分）
-- ============================================================

INSERT INTO public.survey_template_questions (category, question_text, sort_order) VALUES
-- beauty-hair（美容・ヘアサロン）
('beauty-hair', 'ヘアスタイルの持ちはいかがでしたか？', 1),
('beauty-hair', 'カウンセリングは十分でしたか？', 2),
('beauty-hair', '店内の雰囲気はいかがでしたか？', 3),
('beauty-hair', '待ち時間は適切でしたか？', 4),
('beauty-hair', '次回も同じ担当者を希望しますか？', 5),

-- nail-eyelash（ネイル・まつエク）
('nail-eyelash', 'デザインの仕上がりはイメージ通りでしたか？', 1),
('nail-eyelash', '施術時間は適切でしたか？', 2),
('nail-eyelash', '持ちの良さはいかがでしたか？', 3),
('nail-eyelash', 'サンプルやカタログは参考になりましたか？', 4),
('nail-eyelash', '衛生管理は安心できましたか？', 5),

-- esthetic-relaxation（エステ・リラクゼーション）
('esthetic-relaxation', '施術後のリラックス感はいかがでしたか？', 1),
('esthetic-relaxation', '施術の圧加減は適切でしたか？', 2),
('esthetic-relaxation', '施術前の説明は十分でしたか？', 3),
('esthetic-relaxation', 'アフターケアのアドバイスは参考になりましたか？', 4),
('esthetic-relaxation', '空間の清潔感はいかがでしたか？', 5),

-- seitai-massage（整体・マッサージ）
('seitai-massage', '痛みや不調の改善は感じられましたか？', 1),
('seitai-massage', '施術前のヒアリングは十分でしたか？', 2),
('seitai-massage', '施術中の力加減は適切でしたか？', 3),
('seitai-massage', 'セルフケアのアドバイスは参考になりましたか？', 4),
('seitai-massage', '次回の通院間隔の説明は納得できましたか？', 5),

-- fitness-yoga（フィットネス・ヨガ）
('fitness-yoga', 'トレーニングの強度は適切でしたか？', 1),
('fitness-yoga', 'フォームの指導は丁寧でしたか？', 2),
('fitness-yoga', '設備や器具の状態はいかがでしたか？', 3),
('fitness-yoga', 'モチベーションを維持できるサポートでしたか？', 4),
('fitness-yoga', '目標に対する進捗を感じられますか？', 5),

-- coaching-counseling（コーチング・カウンセリング）
('coaching-counseling', 'セッション後に気づきや学びがありましたか？', 1),
('coaching-counseling', '安心して話せる雰囲気でしたか？', 2),
('coaching-counseling', '具体的なアクションプランは得られましたか？', 3),
('coaching-counseling', 'セッションの時間配分は適切でしたか？', 4),
('coaching-counseling', '次回のセッションに期待していますか？', 5),

-- education-lesson（教育・レッスン）
('education-lesson', '学びの内容は理解しやすかったですか？', 1),
('education-lesson', '教材や資料は充実していましたか？', 2),
('education-lesson', 'レッスンのペースは適切でしたか？', 3),
('education-lesson', '質問しやすい雰囲気でしたか？', 4),
('education-lesson', '上達を実感できましたか？', 5),

-- photo-video（写真・映像）
('photo-video', '撮影のポーズ指導はいかがでしたか？', 1),
('photo-video', '納品までのスピードは適切でしたか？', 2),
('photo-video', '撮影場所の雰囲気はいかがでしたか？', 3),
('photo-video', '写真・映像のクオリティは期待通りでしたか？', 4),
('photo-video', 'リラックスして撮影に臨めましたか？', 5),

-- other（その他）
('other', 'サービスの説明は十分でしたか？', 1),
('other', '予約の取りやすさはいかがでしたか？', 2),
('other', '次回も利用したいと思いますか？', 3),
('other', '他の人にもおすすめしたいですか？', 4),
('other', '改善してほしい点はありますか？', 5)

ON CONFLICT DO NOTHING;
