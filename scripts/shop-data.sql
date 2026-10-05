DELETE FROM shop_items WHERE type = 'frame';

INSERT INTO shop_items (name, description, image_class, price, type) VALUES
  ('金色边框', '经典金色头像框', '#FFD700', 100, 'frame'),
  ('蓝色科技', '科技蓝炫光边框', '#2563EB', 200, 'frame'),
  ('紫色星空', '深邃紫星空框', '#7C3AED', 300, 'frame'),
  ('钻石皇冠', '尊贵钻石框', '#06B6D4', 500, 'frame'),
  ('极光限定', '稀有极光渐变', '#EC4899', 1000, 'frame'),
  ('理性主义者', '持续参与辩论达成', 'title-rational', 300, 'title'),
  ('最佳辩手', '获得大量点赞', 'title-debater', 500, 'title'),
  ('观点猎人', '发表观点达人', 'title-hunter', 200, 'title'),
  ('立场转换师', '多次改变立场', 'title-switcher', 400, 'title'),
  ('说服大师', '观点被评为最佳论据', 'title-persuader', 800, 'title');

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title TEXT;
