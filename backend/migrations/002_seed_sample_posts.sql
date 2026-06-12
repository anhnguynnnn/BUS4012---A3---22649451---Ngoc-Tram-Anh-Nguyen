-- Phase 6B: Seed sample posts with realistic fashion metadata
-- Uses Unsplash fashion images as image_url values.
-- The Supabase Storage "post" bucket is private with signed URLs,
-- so public CDN images are used for seed data reliability.

INSERT INTO posts (
  creator_name, image_url, description, style_tags, fit_tags, gender_style,
  occasion_tags, size_range, height_range, body_friendly_label,
  match_label_primary, match_label_secondary, view_count, save_count, share_count
) VALUES

-- 1: Minimal / Clean
('Aisha Minimal', 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600', 'Clean lines and neutral tones for everyday ease.', ARRAY['minimal', 'clean'], ARRAY['relaxed fit'], ARRAY['womenswear'], ARRAY['casual', 'office'], ARRAY['S', 'M', 'L'], '165-170cm', 'Petite-friendly relaxed fit', 'Matches your minimal preference', 'Relaxed silhouette for everyday comfort', 42, 12, 3),

-- 2: Streetwear
('Kai Street', 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600', 'Oversized layers and bold graphic elements.', ARRAY['streetwear'], ARRAY['relaxed fit', 'loose fit'], ARRAY['menswear'], ARRAY['casual', 'streetwear'], ARRAY['M', 'L', 'XL'], '175-180cm', 'Relaxed streetwear for taller frames', 'Streetwear-inspired oversized fit', 'Graphic layering for everyday style', 89, 34, 8),

-- 3: Feminine / Soft
('Luna Rose', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600', 'Soft textures and feminine silhouettes.', ARRAY['feminine', 'soft'], ARRAY['highlight waist'], ARRAY['womenswear'], ARRAY['date night', 'brunch'], ARRAY['XS', 'S', 'M'], '160-165cm', 'Petite-friendly waist-defining fit', 'Feminine silhouette that defines the waist', 'Soft textures perfect for brunch', 67, 28, 5),

-- 4: Classic / Tailored
('James Classic', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600', 'Timeless tailoring with structured shoulders.', ARRAY['classic', 'tailored'], ARRAY['structured'], ARRAY['menswear'], ARRAY['office', 'formal'], ARRAY['M', 'L', 'XL'], '180-185cm', 'Structured fit for taller builds', 'Classic tailored structure', 'Office-ready structured shoulders', 55, 19, 4),

-- 5: Trend-driven
('Mia Trend', 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600', 'Seasonal trend pieces mixed with wardrobe basics.', ARRAY['trend-driven'], ARRAY['balance proportions'], ARRAY['womenswear'], ARRAY['casual', 'weekend'], ARRAY['S', 'M', 'L'], '170-175cm', 'Balanced proportions for mid-height', 'Trend-driven seasonal picks', 'Balanced proportions for weekend wear', 103, 45, 12),

-- 6: Minimal Office
('Suki Clean', 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600', 'Effortless office-to-evening minimal look.', ARRAY['minimal', 'clean'], ARRAY['structured'], ARRAY['womenswear'], ARRAY['office', 'evening'], ARRAY['S', 'M'], '160-165cm', 'Structured minimal for petite frames', 'Office-to-evening minimal aesthetic', 'Clean structure for professional settings', 72, 31, 6),

-- 7: Streetwear Feminine
('Zara Urban', 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600', 'Streetwear meets feminine energy.', ARRAY['streetwear', 'feminine'], ARRAY['relaxed fit'], ARRAY['womenswear'], ARRAY['casual', 'streetwear'], ARRAY['S', 'M', 'L'], '165-170cm', 'Relaxed feminine streetwear', 'Streetwear with feminine edge', 'Urban casual with soft undertones', 91, 38, 9),

-- 8: Classic Casual
('Oliver Smart', 'https://images.unsplash.com/photo-1480455624313-e29b44bbafbde?w=600', 'Smart casual done right with layered textures.', ARRAY['classic'], ARRAY['balance proportions'], ARRAY['menswear'], ARRAY['casual', 'office'], ARRAY['M', 'L'], '175-180cm', 'Smart casual for average height', 'Smart casual with layered textures', 'Balanced proportions for everyday wear', 48, 16, 3),

-- 9: Feminine Formal
('Elena Grace', 'https://images.unsplash.com/photo-1502716119720-b23a1e3b5b52?w=600', 'Elegant formal wear with flowing fabrics.', ARRAY['feminine', 'soft'], ARRAY['highlight waist'], ARRAY['womenswear'], ARRAY['formal', 'date night'], ARRAY['XS', 'S', 'M'], '170-175cm', 'Flowing formal for mid-height', 'Elegant flowing formal silhouette', 'Waist-defining formal elegance', 84, 35, 7),

-- 10: Trend Streetwear
('Deon Hype', 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=600', 'Bold trend-forward streetwear layers.', ARRAY['trend-driven', 'streetwear'], ARRAY['loose fit'], ARRAY['menswear'], ARRAY['streetwear', 'casual'], ARRAY['L', 'XL'], '180-185cm', 'Loose fit for taller builds', 'Trend-forward streetwear layers', 'Bold oversized streetwear statement', 115, 52, 15),

-- 11: Clean Office
('Nina Office', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600', 'Crisp office wear with modern minimalism.', ARRAY['clean', 'minimal'], ARRAY['structured'], ARRAY['womenswear'], ARRAY['office'], ARRAY['S', 'M', 'L'], '170-175cm', 'Modern minimal office fit', 'Crisp modern minimalism for work', 'Structured office-ready look', 63, 22, 4),

-- 12: Classic Evening
('Marcus Evening', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600', 'Refined evening look with classic tailoring.', ARRAY['classic', 'tailored'], ARRAY['structured'], ARRAY['menswear'], ARRAY['evening', 'formal'], ARRAY['M', 'L', 'XL'], '175-180cm', 'Classic evening structured fit', 'Refined evening tailoring', 'Formal structured elegance', 57, 20, 5),

-- 13: Soft Casual
('Freya Soft', 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600', 'Soft textures for relaxed weekend dressing.', ARRAY['feminine', 'soft'], ARRAY['relaxed fit', 'more coverage'], ARRAY['womenswear'], ARRAY['casual', 'weekend'], ARRAY['M', 'L', 'XL'], '170-175cm', 'Relaxed soft casual with coverage', 'Soft textures for weekend comfort', 'Relaxed fit with feminine softness', 44, 15, 2),

-- 14: Streetwear Classic
('Tom Hybrid', 'https://images.unsplash.com/photo-1504198322253-cfa87a0ff25f?w=600', 'Classic meets street in hybrid styling.', ARRAY['streetwear', 'classic'], ARRAY['balance proportions'], ARRAY['gender-neutral'], ARRAY['casual', 'office'], ARRAY['S', 'M', 'L', 'XL'], '175-180cm', 'Gender-neutral balanced fit', 'Classic-street hybrid styling', 'Gender-neutral versatile look', 76, 29, 6),

-- 15: Minimal Weekend
('Yuki Weekend', 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600', 'Effortless weekend minimalism.', ARRAY['minimal'], ARRAY['relaxed fit'], ARRAY['womenswear'], ARRAY['casual', 'weekend'], ARRAY['S', 'M'], '160-165cm', 'Petite-friendly weekend minimal', 'Effortless weekend minimalism', 'Relaxed minimal for lazy days', 38, 11, 2),

-- 16: Tailored Power
('Ava Power', 'https://images.unsplash.com/photo-1581044777550-4cfa60707998?w=600', 'Power dressing with tailored precision.', ARRAY['classic', 'tailored'], ARRAY['structured'], ARRAY['womenswear'], ARRAY['office', 'formal'], ARRAY['S', 'M', 'L'], '170-175cm', 'Power tailored for mid-height', 'Power dressing with tailored precision', 'Structured professional confidence', 92, 40, 10),

-- 17: Trend Casual
('Leo Casual', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600', 'Casual trend pieces for everyday rotation.', ARRAY['trend-driven'], ARRAY['relaxed fit'], ARRAY['menswear'], ARRAY['casual', 'weekend'], ARRAY['M', 'L', 'XL'], '175-180cm', 'Casual trend for average height', 'Trend-forward casual rotation', 'Relaxed everyday trend pieces', 61, 24, 5),

-- 18: Feminine Minimal
('Clara Less', 'https://images.unsplash.com/photo-1495385794356-15371f348c31?w=600', 'Less is more — feminine minimalism.', ARRAY['feminine', 'minimal'], ARRAY['highlight waist'], ARRAY['womenswear'], ARRAY['casual', 'office'], ARRAY['XS', 'S', 'M'], '160-165cm', 'Feminine minimal for petite frames', 'Feminine minimalism at its best', 'Waist-defining clean lines', 53, 18, 3),

-- 19: Streetwear Evening
('Kofi Night', 'https://images.unsplash.com/photo-1507680434567-5739c80be1ac?w=600', 'Streetwear elevated for evening occasions.', ARRAY['streetwear'], ARRAY['structured'], ARRAY['menswear'], ARRAY['evening', 'streetwear'], ARRAY['M', 'L', 'XL'], '180-185cm', 'Elevated streetwear for taller frames', 'Streetwear elevated for night', 'Structured evening streetwear', 70, 26, 7),

-- 20: Clean Weekend
('Rin Breeze', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600', 'Clean and breezy weekend essentials.', ARRAY['clean'], ARRAY['relaxed fit'], ARRAY['womenswear'], ARRAY['casual', 'weekend'], ARRAY['S', 'M', 'L'], '165-170cm', 'Breezy weekend essentials', 'Clean breezy weekend aesthetic', 'Relaxed weekend comfort', 47, 14, 3),

-- 21: Classic Weekend
('Ethan Weekend', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600', 'Relaxed weekend style with classic foundations.', ARRAY['classic'], ARRAY['relaxed fit'], ARRAY['menswear'], ARRAY['casual', 'weekend'], ARRAY['M', 'L'], '175-180cm', 'Classic weekend relaxed fit', 'Classic foundations for weekends', 'Relaxed masculine weekend style', 40, 13, 2),

-- 22: Trend Feminine
('Stella Trend', 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600', 'Feminine trends spotted on the street.', ARRAY['trend-driven', 'feminine'], ARRAY['highlight waist', 'balance proportions'], ARRAY['womenswear'], ARRAY['brunch', 'casual'], ARRAY['S', 'M'], '165-170cm', 'Trend-driven feminine fit', 'Street-spotted feminine trends', 'Feminine trend highlights', 88, 37, 8),

-- 23: Soft Formal
('Maya Formal', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600', 'Soft formal dressing with gentle textures.', ARRAY['soft', 'feminine'], ARRAY['more coverage', 'balance proportions'], ARRAY['womenswear'], ARRAY['formal', 'evening'], ARRAY['M', 'L', 'XL'], '170-175cm', 'Soft formal with coverage', 'Gentle textures for formal events', 'Soft formal with balanced proportions', 52, 17, 4),

-- 24: Streetwear Classic 2
('Jae Urban', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600', 'Urban classic with a streetwear twist.', ARRAY['streetwear', 'classic'], ARRAY['structured', 'relaxed fit'], ARRAY['gender-neutral'], ARRAY['casual', 'streetwear'], ARRAY['S', 'M', 'L', 'XL'], '170-175cm', 'Gender-neutral urban classic', 'Urban classic with street edge', 'Structured-relaxed hybrid fit', 65, 23, 5),

-- 25: Minimal Evening
('Lena Night', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600', 'Minimal evening wear that speaks volumes.', ARRAY['minimal', 'clean'], ARRAY['highlight waist'], ARRAY['womenswear'], ARRAY['evening', 'date night'], ARRAY['XS', 'S', 'M'], '165-170cm', 'Minimal evening for petite frames', 'Minimal evening elegance', 'Clean lines for evening sophistication', 79, 33, 7);